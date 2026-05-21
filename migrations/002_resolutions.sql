-- ============================================================
-- PuntosNegrosRD — migración 002: resoluciones comunitarias
-- ============================================================
-- Espejo del patrón de `confirmations` pero para la otra dirección:
-- usuarios votan "yo veo que ya está resuelto". Cuando se acumulan
-- RESOLUTION_THRESHOLD votos únicos por IP, el status del punto
-- flippea automáticamente a 'resuelto' y queda registrado en
-- status_history como 'auto-community' (vs 'admin-mvp').
--
-- Esto descentraliza la moderación: la comunidad puede cerrar
-- reportes cuando el admin no está disponible o no llega.
--
-- Anti-abuso: misma IP solo puede votar una vez por punto (unique
-- constraint). El umbral (3) está alto enough para evitar gaming
-- trivial pero bajo enough para que sea alcanzable en zonas con
-- pocos usuarios.
-- ============================================================

-- ============================================================
-- Tabla: resolutions (voto comunitario "ya esta resuelto")
-- ============================================================

create table if not exists public.resolutions (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.points(id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  unique (point_id, ip_hash)
);

create index if not exists resolutions_point_id_idx on public.resolutions (point_id);

-- ============================================================
-- RLS — lectura publica, escrituras solo via server (service_role)
-- ============================================================

alter table public.resolutions enable row level security;

drop policy if exists "public can view resolutions" on public.resolutions;
create policy "public can view resolutions"
  on public.resolutions for select
  using (true);

-- ============================================================
-- Vista publica actualizada: incluye resolution_count
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
  (select count(*) from public.confirmations c where c.point_id = p.id)::int as confirmation_count,
  (select count(*) from public.resolutions r where r.point_id = p.id)::int as resolution_count
from public.points p
where p.is_visible = true;

-- ============================================================
-- Trigger: auto-flip a 'resuelto' al alcanzar umbral
-- ============================================================
-- Cuando se inserta una resolution, contamos las que existen para
-- ese point. Si el conteo cruza el umbral Y el punto no esta ya
-- resuelto, actualizamos status + insertamos status_history.
--
-- Usamos security definer para poder hacer el UPDATE en points (la
-- escritura desde anon esta bloqueada via RLS; el trigger corre con
-- privilegios del owner de la funcion).
-- ============================================================

create or replace function public.handle_resolution_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  v_count int;
  v_current_status public.point_status;
  v_threshold constant int := 3;
begin
  -- Contar resoluciones totales para este punto (incluye la recien
  -- insertada porque el trigger es AFTER INSERT).
  select count(*)::int into v_count
  from public.resolutions
  where point_id = new.point_id;

  -- Estado actual del punto.
  select status into v_current_status
  from public.points
  where id = new.point_id;

  -- Auto-flip solo si: umbral alcanzado AND no esta ya resuelto.
  if v_count >= v_threshold and v_current_status <> 'resuelto' then
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
      'Auto-resuelto: ' || v_count || ' confirmaciones de resolucion ciudadana',
      'auto-community'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists resolutions_auto_flip on public.resolutions;
create trigger resolutions_auto_flip
after insert on public.resolutions
for each row execute function public.handle_resolution_insert();
