-- ============================================================
-- PuntosNegrosRD — migración inicial
-- ============================================================
-- Antes de correr esta migración, asegúrate de habilitar
-- las siguientes extensiones desde el dashboard de Supabase:
--   Database → Extensions → postgis (ENABLE)
--   Database → Extensions → pgcrypto (ENABLE, ya viene activa)
-- ============================================================

-- Si por alguna razón las extensiones no están, este bloque las activa.
create extension if not exists "postgis";
create extension if not exists "pgcrypto";

-- ============================================================
-- Enums — taxonomía oficial INTRANT y estados de intervención
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
-- Tabla principal: points
-- ============================================================

create table if not exists public.points (
  id uuid primary key default gen_random_uuid(),
  lat double precision not null check (lat between 17.5 and 20.5),
  lng double precision not null check (lng between -72.1 and -68.0),
  location geography(point, 4326)
    generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored,
  category public.point_category not null,
  subcategory text,
  description text not null check (char_length(description) between 10 and 1000),
  status public.point_status not null default 'nuevo',
  photo_url text,
  province text,
  municipality text,
  is_visible boolean not null default true,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists points_location_idx on public.points using gist (location);
create index if not exists points_status_idx on public.points (status);
create index if not exists points_category_idx on public.points (category);
create index if not exists points_created_at_idx on public.points (created_at desc);
create index if not exists points_visible_idx on public.points (is_visible) where is_visible = true;
create index if not exists points_ip_hash_idx on public.points (ip_hash);

-- ============================================================
-- Tabla: confirmations (voto comunitario "yo también lo veo")
-- ============================================================

create table if not exists public.confirmations (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.points(id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  unique (point_id, ip_hash)
);

create index if not exists confirmations_point_id_idx on public.confirmations (point_id);

-- ============================================================
-- Tabla: status_history (trazabilidad de cambios de estado)
-- ============================================================

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

-- ============================================================
-- Trigger: updated_at automático
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists points_set_updated_at on public.points;
create trigger points_set_updated_at
before update on public.points
for each row execute function public.set_updated_at();

-- ============================================================
-- Vista pública: points_with_stats (lo que consume el frontend)
-- ============================================================

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
  (select count(*) from public.confirmations c where c.point_id = p.id)::int as confirmation_count
from public.points p
where p.is_visible = true;

-- ============================================================
-- Row Level Security
-- ============================================================
-- Política: el rol "anon" SOLO puede leer puntos visibles
-- y leer/insertar confirmaciones (con rate-limit en server).
-- TODAS las escrituras de puntos van por el server con service_role.
-- ============================================================

alter table public.points enable row level security;
alter table public.confirmations enable row level security;
alter table public.status_history enable row level security;

-- POINTS — lectura pública de visibles
drop policy if exists "public can view visible points" on public.points;
create policy "public can view visible points"
  on public.points for select
  using (is_visible = true);

-- CONFIRMATIONS — lectura pública
drop policy if exists "public can view confirmations" on public.confirmations;
create policy "public can view confirmations"
  on public.confirmations for select
  using (true);

-- STATUS HISTORY — lectura pública
drop policy if exists "public can view status history" on public.status_history;
create policy "public can view status history"
  on public.status_history for select
  using (true);

-- NOTA: no creamos políticas de INSERT/UPDATE/DELETE para anon.
-- Eso fuerza que las escrituras pasen por las API routes/server
-- actions de Next.js, autenticadas con SUPABASE_SERVICE_ROLE_KEY.
-- Así controlamos rate-limit, hash de IP y EXIF strip server-side.

-- ============================================================
-- Función helper: contar reportes recientes de una IP (rate-limit)
-- ============================================================

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
