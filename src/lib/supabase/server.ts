import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase con privilegios de SERVICE ROLE.
 * NUNCA importar este modulo desde componentes 'use client' ni desde el navegador.
 * Solo desde Route Handlers, Server Actions o codigo de servidor.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Cliente Supabase publico para leer datos desde el servidor sin sesion.
 * Usa la clave anon. OK para lecturas publicas.
 */
export function createSupabaseServerPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
