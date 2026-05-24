-- ============================================================
-- PuntosNegrosRD — migracion 005: foto o descripcion (al menos uno)
-- ============================================================
-- Cambia la regla de "description obligatoria con minimo 10 chars" a
-- "al menos uno de (photo_url, description) presente". El objetivo:
-- bajar la barrera de reporte cuando el ciudadano tiene foto pero no
-- puede escribir, o viceversa.
--
-- Las reglas de CALIDAD del MVP (descripcion 10+ chars cuando NO hay
-- foto, max 280 chars siempre) viven en zod + server (no en SQL) para
-- poder ajustarlas sin nueva migracion.
--
-- BACKWARD-COMPATIBLE: toda fila existente tiene description NOT NULL,
-- por lo tanto pasa automaticamente el nuevo CHECK. El upper bound de
-- 2000 chars en SQL es defensa contra abuso/inserts directos — toda
-- fila existente tiene max 1000 chars (constraint anterior), asi que
-- ninguna excede el nuevo limite.
-- ============================================================

-- 1) Permitir description NULL. Las filas existentes ya tienen valor;
-- esto solo permite futuros inserts con NULL.
alter table public.points alter column description drop not null;

-- 2) Drop el CHECK antiguo. El nombre auto-generado por Postgres puede
-- variar; lo buscamos por su definicion en pg_constraint.
do $$
declare
  v_check_name text;
begin
  select conname into v_check_name
  from pg_constraint
  where conrelid = 'public.points'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%description%between%10%';
  if v_check_name is not null then
    execute format('alter table public.points drop constraint %I', v_check_name);
  end if;
end$$;

-- 3) Nuevo CHECK: al menos un campo de evidencia + upper bound suave
-- como red de seguridad contra inserts directos abusivos.
alter table public.points
  add constraint points_has_evidence
  check (
    (photo_url is not null or description is not null)
    and (description is null or char_length(description) <= 2000)
  );

-- ============================================================
-- Verificacion sugerida post-migracion (correr en SQL Editor):
-- ============================================================
-- select
--   count(*) filter (where photo_url is not null and description is not null) as ambos,
--   count(*) filter (where photo_url is not null and description is null) as solo_foto,
--   count(*) filter (where photo_url is null and description is not null) as solo_desc,
--   count(*) filter (where photo_url is null and description is null) as ninguno_invalido
-- from public.points;
-- ============================================================
