-- ============================================================
-- PuntosNegrosRD — schema.sql
-- ============================================================
-- Snapshot consolidado del estado FINAL de la base de datos.
-- Pensado para crear un Supabase NUEVO (greenfield) en una sola
-- corrida. Integra todo lo que historicamente fue migraciones
-- 001-005 en su forma final y coherente.
--
-- USO:
--   Greenfield (Supabase nuevo): correr este archivo completo en
--     el SQL Editor. Idempotente: se puede correr varias veces sin
--     romper nada.
--   Production existente (con 001-004 ya aplicado): aplicar el
--     delta en db/pending/ (si existe) y luego este archivo si
--     quieres reconciliar — es idempotente.
--
-- PRE-REQUISITOS en Supabase Dashboard:
--   Database -> Extensions -> postgis (enable)
--   Database -> Extensions -> pgcrypto (enable, usualmente ya activo)
--
-- LAS REGLAS DE NEGOCIO que NO viven aqui (intencional):
--   - Minimo de 10 chars en description cuando esta presente (con o
--     sin foto): zod + /api/points/route.ts. SQL solo enforce "al
--     menos uno presente" + upper bound suave de 2000 chars.
--   - Umbral de auto-ocultacion (5 flags): hardcoded en
--     handle_content_flag_insert. Si se necesita ajustar, editar
--     aqui + redeploy.
--   - Umbral escalado de auto-resolucion: greatest(5, ceil(confirms*0.5)).
-- ============================================================

-- ============================================================
-- 1. Extensiones
-- ============================================================
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ============================================================
-- 2. Enums
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'point_category') then
    create type public.point_category as enum (
      'humano',
      'vehicular',
      'infraestructural',
      'climatico'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'point_status') then
    create type public.point_status as enum (
      'nuevo',
      'corroborado',
      'notificado',
      'en_atencion',
      'resuelto'
    );
  end if;
end$$;

-- ============================================================
-- 3. Tablas
-- ============================================================
-- points: tabla principal del reporte ciudadano.
-- El CHECK points_has_evidence garantiza que cada fila tiene al menos
-- foto o descripcion (no se permite reporte vacio de evidencia).
-- description quedo nullable post migracion 005.
create table if not exists public.points (
  id uuid primary key default gen_random_uuid(),
  lat double precision not null check (lat between 17.5 and 20.5),
  lng double precision not null check (lng between -72.1 and -68.0),
  location geography(point, 4326)
    generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored,
  category public.point_category not null,
  subcategory text,
  description text,
  status public.point_status not null default 'nuevo',
  photo_url text,
  province text,
  municipality text,
  is_visible boolean not null default true,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint points_has_evidence check (
    (photo_url is not null or description is not null)
    and (description is null or char_length(description) <= 2000)
  )
);

create index if not exists points_location_idx on public.points using gist (location);
create index if not exists points_status_idx on public.points (status);
create index if not exists points_category_idx on public.points (category);
create index if not exists points_created_at_idx on public.points (created_at desc);
create index if not exists points_visible_idx on public.points (is_visible) where is_visible = true;
create index if not exists points_ip_hash_idx on public.points (ip_hash);

-- confirmations: votos "yo tambien lo veo". Unique (point_id, ip_hash)
-- impide que la misma IP confirme un punto mas de una vez.
create table if not exists public.confirmations (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.points(id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  unique (point_id, ip_hash)
);
create index if not exists confirmations_point_id_idx on public.confirmations (point_id);

-- resolutions: votos "yo veo que ya esta resuelto". Misma logica de
-- unique constraint. Trigger handle_resolution_insert flippea points
-- a status='resuelto' al alcanzar el umbral escalado.
create table if not exists public.resolutions (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.points(id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  unique (point_id, ip_hash)
);
create index if not exists resolutions_point_id_idx on public.resolutions (point_id);

-- status_history: trazabilidad de cambios de estado del punto.
-- changed_by puede ser 'auto-community', 'owner-manual', etc.
create table if not exists public.status_history (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.points(id) on delete cascade,
  old_status public.point_status,
  new_status public.point_status not null,
  note text,
  changed_by text,
  created_at timestamptz not null default now()
);
create index if not exists status_history_point_id_idx on public.status_history (point_id);

-- content_flags: reportes comunitarios de spam/contenido inapropiado.
-- Privacy by design: NO hay SELECT publica de esta tabla. El trigger
-- handle_content_flag_insert oculta el punto al alcanzar 5 flags
-- unicos por IP.
create table if not exists public.content_flags (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.points(id) on delete cascade,
  ip_hash text not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (point_id, ip_hash)
);
create index if not exists content_flags_point_id_idx on public.content_flags (point_id);

-- ============================================================
-- 4. Vista publica (lo que consume el frontend)
-- ============================================================
-- points_with_stats: filtra is_visible=true y agrega los contadores
-- de confirmations + resolutions calculados on-the-fly.
-- security_invoker=on para que la vista herede el RLS del invocador.
create or replace view public.points_with_stats
with (security_invoker = on) as
select
  p.id,
  p.lat,
  p.lng,
  p.category,
  p.subcategory,
  p.description,
  p.status,
  p.photo_url,
  p.province,
  p.municipality,
  p.created_at,
  p.updated_at,
  (select count(*) from public.confirmations c where c.point_id = p.id)::int as confirmation_count,
  (select count(*) from public.resolutions r where r.point_id = p.id)::int as resolution_count
from public.points p
where p.is_visible = true;

-- ============================================================
-- 5. Funciones
-- ============================================================
-- set_updated_at: bumpear updated_at en cada UPDATE de points.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- count_recent_reports_by_ip: helper para rate-limit. Se invoca
-- desde el server via la anon connection con execute permission.
create or replace function public.count_recent_reports_by_ip(
  p_ip_hash text,
  p_minutes int default 60
)
returns int
language sql
security definer
as $$
  select count(*)::int
  from public.points
  where ip_hash = p_ip_hash
    and created_at > now() - (p_minutes || ' minutes')::interval;
$$;
revoke all on function public.count_recent_reports_by_ip(text, int) from public;
grant execute on function public.count_recent_reports_by_ip(text, int) to anon, authenticated, service_role;

-- handle_resolution_insert: trigger AFTER INSERT en resolutions que
-- auto-flippea points.status a 'resuelto' cuando el conteo de votos
-- cruza el umbral escalado.
--
-- Umbral = greatest(5, ceil(confirmations * 0.5)).
-- Significa: minimo 5 votos siempre, y para reportes con muchos
-- testigos (>= 10 confirmaciones), el umbral sube proporcional
-- para encarecer la colusion contra reportes establecidos.
create or replace function public.handle_resolution_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  v_resolution_count int;
  v_confirmation_count int;
  v_current_status public.point_status;
  v_threshold int;
begin
  select count(*)::int into v_resolution_count
  from public.resolutions where point_id = new.point_id;

  select count(*)::int into v_confirmation_count
  from public.confirmations where point_id = new.point_id;

  v_threshold := greatest(5, ceil(v_confirmation_count * 0.5)::int);

  select status into v_current_status
  from public.points where id = new.point_id;

  if v_resolution_count >= v_threshold and v_current_status <> 'resuelto' then
    update public.points
    set status = 'resuelto'
    where id = new.point_id;

    insert into public.status_history (
      point_id, old_status, new_status, note, changed_by
    )
    values (
      new.point_id,
      v_current_status,
      'resuelto',
      'Auto-resuelto: ' || v_resolution_count || ' votos de resolucion'
        || ' (umbral: ' || v_threshold
        || ', confirmaciones: ' || v_confirmation_count || ')',
      'auto-community'
    );
  end if;

  return new;
end;
$$;

-- handle_content_flag_insert: trigger AFTER INSERT en content_flags
-- que oculta automaticamente el punto al cruzar 5 flags unicos.
create or replace function public.handle_content_flag_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  v_count int;
  v_threshold constant int := 5;
begin
  select count(*)::int into v_count
  from public.content_flags where point_id = new.point_id;

  if v_count >= v_threshold then
    update public.points
    set is_visible = false
    where id = new.point_id and is_visible = true;
  end if;

  return new;
end;
$$;

-- ============================================================
-- 6. Triggers
-- ============================================================
drop trigger if exists points_set_updated_at on public.points;
create trigger points_set_updated_at
before update on public.points
for each row execute function public.set_updated_at();

drop trigger if exists resolutions_auto_flip on public.resolutions;
create trigger resolutions_auto_flip
after insert on public.resolutions
for each row execute function public.handle_resolution_insert();

drop trigger if exists content_flags_auto_hide on public.content_flags;
create trigger content_flags_auto_hide
after insert on public.content_flags
for each row execute function public.handle_content_flag_insert();

-- ============================================================
-- 7. Row Level Security
-- ============================================================
-- Politica general:
--   - anon role: SOLO puede SELECT en tablas publicas (points
--     visibles, confirmations, status_history, resolutions).
--   - INSERTs/UPDATEs van siempre via API routes con service_role
--     (rate-limit, hash de IP, validaciones de negocio).
--   - content_flags: NO hay policy de SELECT publica — las razones
--     de flag son privadas. Solo el owner via Supabase Dashboard.
alter table public.points enable row level security;
alter table public.confirmations enable row level security;
alter table public.status_history enable row level security;
alter table public.resolutions enable row level security;
alter table public.content_flags enable row level security;

drop policy if exists "public can view visible points" on public.points;
create policy "public can view visible points"
  on public.points for select
  using (is_visible = true);

drop policy if exists "public can view confirmations" on public.confirmations;
create policy "public can view confirmations"
  on public.confirmations for select
  using (true);

drop policy if exists "public can view status history" on public.status_history;
create policy "public can view status history"
  on public.status_history for select
  using (true);

drop policy if exists "public can view resolutions" on public.resolutions;
create policy "public can view resolutions"
  on public.resolutions for select
  using (true);

-- content_flags: intencionalmente SIN policy de SELECT publica.

-- ============================================================
-- 8. Realtime (Supabase WebSocket)
-- ============================================================
-- Agrega las tablas mutables a la publication supabase_realtime para
-- que el frontend reciba INSERT/UPDATE en vivo sin polling.
-- Realtime respeta RLS — anon solo recibe eventos sobre filas que
-- sus policies de SELECT le permiten ver.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'points'
  ) then
    alter publication supabase_realtime add table public.points;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'confirmations'
  ) then
    alter publication supabase_realtime add table public.confirmations;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'resolutions'
  ) then
    alter publication supabase_realtime add table public.resolutions;
  end if;
end$$;
