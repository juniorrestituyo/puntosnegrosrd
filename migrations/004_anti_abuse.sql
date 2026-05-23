-- ============================================================
-- PuntosNegrosRD — migracion 004: anti-abuso comunitario
-- ============================================================
-- Dos cambios coordinados:
--
-- 1) UMBRAL ESCALADO de resoluciones comunitarias:
--    Antes: 3 votos cierran cualquier punto.
--    Ahora: max(5, ceil(confirmations * 0.5)).
--    Un reporte con 30 testigos necesita 15 votos para cerrarse,
--    no 3. Hace caro gamear con pocas IPs colusionadas contra
--    reportes legitimos ya establecidos.
--
-- 2) FLAGS DE CONTENIDO comunitarios:
--    Reemplaza el panel admin que ocultaba spam/contenido inapropiado.
--    Mismo patron que confirmations/resolutions: una IP solo puede
--    flaguear un punto una vez (unique constraint). Al llegar a 5
--    flags, el punto se hace is_visible = false automaticamente.
--    Permite moderacion descentralizada sin admin.
--
-- Trade-off conocido (decision del owner): el umbral escalado solo
-- es debil para reportes frescos (0-9 confirmaciones → threshold = 5).
-- Si en produccion se observa abuso en puntos nuevos, agregar
-- reversibilidad (confirmacion post-cierre reabre), edad minima del
-- punto antes de poder votar resolver, o rate-limit por IP.
-- ============================================================

-- ============================================================
-- 1) Actualizar handle_resolution_insert con threshold escalado
-- ============================================================

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
  -- Conteo de resoluciones (incluye la recien insertada por ser
  -- AFTER INSERT).
  select count(*)::int into v_resolution_count
  from public.resolutions
  where point_id = new.point_id;

  -- Conteo de confirmaciones — base para escalar el umbral.
  select count(*)::int into v_confirmation_count
  from public.confirmations
  where point_id = new.point_id;

  -- Umbral escalado: max(5, ceil(confirmations * 0.5)).
  -- 0 confirms → 5 votos.    10 confirms → 5 votos.
  -- 20 confirms → 10 votos.  50 confirms → 25 votos.
  v_threshold := greatest(5, ceil(v_confirmation_count * 0.5)::int);

  select status into v_current_status
  from public.points
  where id = new.point_id;

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

-- Trigger ya existe desde 002 — solo replazamos la funcion. No es
-- necesario recrearlo, pero por seguridad nos aseguramos que apunte
-- a la version actual de la funcion.
drop trigger if exists resolutions_auto_flip on public.resolutions;
create trigger resolutions_auto_flip
after insert on public.resolutions
for each row execute function public.handle_resolution_insert();

-- ============================================================
-- 2) Tabla content_flags — moderacion comunitaria de contenido
-- ============================================================
-- Una IP puede flaguear un punto una sola vez. Reason es libre pero
-- limitada en el endpoint (enum spam/ofensivo/duplicado/falso/otro).
-- Al llegar a 5 flags unicos, el punto se hace invisible.
-- ============================================================

create table if not exists public.content_flags (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.points(id) on delete cascade,
  ip_hash text not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (point_id, ip_hash)
);

create index if not exists content_flags_point_id_idx on public.content_flags (point_id);

-- RLS: NO hay SELECT publico. Las razones de los flags son privadas
-- (un usuario malicioso no necesita ver "5 personas dijeron spam,
-- 4 para cerrarlo") y el owner las consulta directamente via
-- Supabase SQL Editor cuando necesita revisar. Las inserciones llegan
-- via server con service_role.
alter table public.content_flags enable row level security;

-- Sin policy de select = solo service_role lee.

-- ============================================================
-- Trigger: auto-hide al alcanzar 5 flags
-- ============================================================
-- Cuando se inserta un flag, contamos los totales. Si crusa 5 Y el
-- punto sigue visible, lo ocultamos. Una vez oculto el trigger es
-- idempotente — sigue ejecutandose pero el WHERE is_visible = true
-- evita reescrituras.
-- ============================================================

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
  from public.content_flags
  where point_id = new.point_id;

  if v_count >= v_threshold then
    update public.points
    set is_visible = false
    where id = new.point_id and is_visible = true;
  end if;

  return new;
end;
$$;

drop trigger if exists content_flags_auto_hide on public.content_flags;
create trigger content_flags_auto_hide
after insert on public.content_flags
for each row execute function public.handle_content_flag_insert();
