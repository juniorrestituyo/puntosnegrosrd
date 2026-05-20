'use client';

import { useState } from 'react';
import { z } from 'zod';

import { CATEGORIES, type CategoryKey } from '@/lib/constants';
import type { PointInput } from '@/lib/types';

const reportSchema = z.object({
  lat: z.number().min(17.5).max(20.5),
  lng: z.number().min(-72.1).max(-68.0),
  category: z.enum(['humano', 'vehicular', 'infraestructural', 'climatico']),
  subcategory: z.string().optional(),
  description: z
    .string()
    .min(10, 'Describe el riesgo con al menos 10 caracteres')
    .max(1000),
  province: z.string().optional(),
  municipality: z.string().optional(),
});

interface ReportFormProps {
  lat: number;
  lng: number;
  onSubmit: (input: PointInput) => void;
  onCancel: () => void;
}

export default function ReportForm({
  lat,
  lng,
  onSubmit,
  onCancel,
}: ReportFormProps) {
  const [category, setCategory] = useState<CategoryKey>('infraestructural');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const subcategoryOptions = CATEGORIES[category].subcategories;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = reportSchema.safeParse({
      lat,
      lng,
      category,
      subcategory: subcategory || undefined,
      description,
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Error de validacion');
      return;
    }

    onSubmit(result.data as PointInput);
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand">
              Reportar punto de riesgo
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            x
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Categoria (taxonomia INTRANT)
            </span>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as CategoryKey);
                setSubcategory('');
              }}
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
              required
            >
              {Object.entries(CATEGORIES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {CATEGORIES[category].description}
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Subcategoria
            </span>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
            >
              <option value="">(opcional)</option>
              {subcategoryOptions.map((sc) => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Descripcion{' '}
              <span className="text-slate-400">(10-1000 caracteres)</span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
              placeholder="Bache profundo en la curva, peligroso especialmente de noche..."
              required
              minLength={10}
              maxLength={1000}
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {description.length}/1000
            </p>
          </label>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Reportar
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Reportes temporales: viven solo en esta sesion. La persistencia en
          base de datos se activa en la siguiente iteracion (Dia 3).
        </p>
      </form>
    </div>
  );
}
