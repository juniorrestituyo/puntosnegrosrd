-- ============================================================
-- PuntosNegrosRD — migración 003: realtime para updates en vivo
-- ============================================================
-- Habilita Supabase Realtime sobre points, confirmations y
-- resolutions. Cualquier cliente conectado al WebSocket recibe
-- los eventos de INSERT/UPDATE sin necesidad de polling.
--
-- Realtime respeta RLS: el anon role solo recibe eventos sobre
-- filas que sus policies de SELECT le permiten leer. Las tres
-- tablas ya tienen "public can view" en SELECT, asi que el
-- broadcast funciona desde el navegador con la anon key.
--
-- Las INSERT/UPDATE siguen bloqueadas para anon — solo el
-- service_role (server-side, via API routes) puede mutar. Realtime
-- solo expone lo que ya es publicamente visible.
--
-- Idempotente: usa pg_publication_tables para chequear si la
-- tabla ya esta en la publicacion antes de agregarla. La
-- publicacion `supabase_realtime` existe por default en proyectos
-- Supabase, no se crea aqui.
-- ============================================================

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
