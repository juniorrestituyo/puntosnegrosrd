import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import PointDetail from '@/components/PointDetail';
import { CATEGORIES } from '@/lib/constants';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { Point, StatusHistoryEntry } from '@/lib/types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadPoint(
  id: string
): Promise<{ point: Point; history: StatusHistoryEntry[] } | null> {
  const supabase = createSupabaseAdminClient();
  const { data: point } = await supabase
    .from('points_with_stats')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!point) return null;

  const { data: history } = await supabase
    .from('status_history')
    .select('*')
    .eq('point_id', id)
    .order('created_at', { ascending: false });

  return { point: point as Point, history: (history ?? []) as StatusHistoryEntry[] };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: 'Punto no encontrado' };

  const loaded = await loadPoint(id);
  if (!loaded) return { title: 'Punto no encontrado' };

  const cat = CATEGORIES[loaded.point.category].label;
  const desc = loaded.point.description.slice(0, 140);
  return {
    title: `${cat} - PuntosNegrosRD`,
    description: desc,
  };
}

export default async function PuntoDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!UUID_RE.test(id)) notFound();

  const loaded = await loadPoint(id);
  if (!loaded) notFound();

  return <PointDetail point={loaded.point} history={loaded.history} />;
}
