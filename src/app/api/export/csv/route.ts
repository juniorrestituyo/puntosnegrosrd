import { createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/export/csv
 * Devuelve todos los puntos visibles como CSV bajo licencia CC-BY 4.0.
 */

const CSV_COLUMNS = [
  'id',
  'category',
  'subcategory',
  'description',
  'status',
  'lat',
  'lng',
  'confirmation_count',
  'resolution_count',
  'province',
  'municipality',
  'created_at',
  'updated_at',
] as const;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Si el valor contiene coma, comilla doble o salto de linea, lo encierra
  // entre comillas y duplica las comillas internas.
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('points_with_stats')
    .select(CSV_COLUMNS.join(','))
    .order('created_at', { ascending: false })
    .limit(10000);

  if (error) {
    console.error('CSV export failed:', error);
    return new Response('error: no se pudo generar el CSV', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const rows = ((data ?? []) as unknown) as Array<Record<string, unknown>>;
  const header = CSV_COLUMNS.join(',');
  const body = rows
    .map((row) => CSV_COLUMNS.map((c) => csvEscape(row[c])).join(','))
    .join('\n');

  const csv = `${header}\n${body}\n`;
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="puntosnegrosrd-${today}.csv"`,
      'Cache-Control': 'public, max-age=60, must-revalidate',
      // Datos publicados bajo Creative Commons Attribution 4.0
      'X-License': 'CC-BY-4.0',
      'X-Source': 'https://github.com/w0rkm4n/puntosnegrosrd',
    },
  });
}
