'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

import type { Point, PointInput } from '@/lib/types';
import ReportForm from './ReportForm';

// Carga diferida sin SSR: Leaflet usa window y crashea durante el render
// en el servidor. Este wrapper lo carga solo despues de hidratacion.
const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <p className="text-sm text-slate-500">Cargando mapa...</p>
    </div>
  ),
});

export default function MapClient() {
  const [points, setPoints] = useState<Point[]>([]);
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(
    null
  );

  function handleMapClick(lat: number, lng: number) {
    setPicked({ lat, lng });
  }

  function handleSubmit(input: PointInput) {
    const now = new Date().toISOString();
    const newPoint: Point = {
      id: crypto.randomUUID(),
      lat: input.lat,
      lng: input.lng,
      category: input.category,
      subcategory: input.subcategory ?? null,
      description: input.description,
      status: 'nuevo',
      photo_url: null,
      province: input.province ?? null,
      municipality: input.municipality ?? null,
      created_at: now,
      updated_at: now,
      confirmation_count: 0,
    };
    setPoints((prev) => [...prev, newPoint]);
    setPicked(null);
  }

  return (
    <div className="relative h-full w-full">
      <Map points={points} onMapClick={handleMapClick} />

      {picked && (
        <ReportForm
          lat={picked.lat}
          lng={picked.lng}
          onSubmit={handleSubmit}
          onCancel={() => setPicked(null)}
        />
      )}

      <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] rounded bg-white/95 px-3 py-2 text-xs text-slate-700 shadow ring-1 ring-slate-200">
        {points.length === 0
          ? 'Haz click en cualquier punto del mapa para reportar.'
          : `${points.length} reporte${points.length === 1 ? '' : 's'} en esta sesion (aun no persisten).`}
      </div>
    </div>
  );
}
