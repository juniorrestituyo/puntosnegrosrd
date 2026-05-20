'use client';

import { useState } from 'react';
import { z } from 'zod';

import { CATEGORIES, type CategoryKey } from '@/lib/constants';
import { processImage } from '@/lib/image-process';
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
  photo_url: z.string().url().optional(),
});

interface ReportFormProps {
  lat: number;
  lng: number;
  submitting?: boolean;
  serverError?: string | null;
  onSubmit: (input: PointInput) => void;
  onCancel: () => void;
}

export default function ReportForm({
  lat,
  lng,
  submitting = false,
  serverError = null,
  onSubmit,
  onCancel,
}: ReportFormProps) {
  const [category, setCategory] = useState<CategoryKey>('infraestructural');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const subcategoryOptions = CATEGORIES[category].subcategories;
  const displayedError = serverError ?? localError;
  const busy = submitting || photoUploading;

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setPhotoUploading(true);
    setPhotoUrl(null);
    setPhotoPreview(null);

    try {
      // Procesar client-side: redimensiona y elimina EXIF
      const processed = await processImage(file);
      const previewUrl = URL.createObjectURL(processed.blob);
      setPhotoPreview(previewUrl);

      // Subir al servidor
      const formData = new FormData();
      formData.append('file', processed.blob, 'photo.jpg');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!json.ok) {
        setPhotoError(json.error?.message ?? 'No se pudo subir la foto');
        setPhotoPreview(null);
        URL.revokeObjectURL(previewUrl);
        return;
      }
      setPhotoUrl(json.data.url as string);
    } catch (err) {
      console.error('Photo upload fallo:', err);
      setPhotoError(
        err instanceof Error ? err.message : 'Error al procesar la imagen'
      );
      setPhotoPreview(null);
    } finally {
      setPhotoUploading(false);
    }
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoUrl(null);
    setPhotoError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    const payload = {
      lat,
      lng,
      category,
      subcategory: subcategory || undefined,
      description,
      photo_url: photoUrl ?? undefined,
    };

    const result = reportSchema.safeParse(payload);

    if (!result.success) {
      setLocalError(result.error.issues[0]?.message ?? 'Error de validacion');
      return;
    }

    onSubmit(result.data as PointInput);
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md max-h-[95vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
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
            disabled={busy}
            aria-label="Cerrar"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
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
              disabled={busy}
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none disabled:opacity-60"
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
              disabled={busy}
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none disabled:opacity-60"
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
              disabled={busy}
              rows={3}
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none disabled:opacity-60"
              placeholder="Bache profundo en la curva, peligroso especialmente de noche..."
              required
              minLength={10}
              maxLength={1000}
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {description.length}/1000
            </p>
          </label>

          <div>
            <span className="text-sm font-medium text-slate-700">
              Foto (opcional)
            </span>
            {!photoUrl && !photoUploading && (
              <label
                htmlFor="photo-input"
                className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 hover:border-brand-accent hover:bg-red-50/30"
              >
                Toca para tomar o seleccionar
                <span className="mt-1 text-xs text-slate-400">
                  JPEG/PNG hasta 3 MB. La metadata EXIF se elimina antes de subir.
                </span>
              </label>
            )}
            <input
              id="photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelect}
              disabled={busy}
              className="hidden"
            />

            {photoUploading && (
              <div className="mt-2 rounded border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm text-slate-600">
                Procesando y subiendo imagen...
              </div>
            )}

            {photoPreview && photoUrl && (
              <div className="mt-2 flex items-center gap-3 rounded border border-slate-200 bg-white p-2">
                <img
                  src={photoPreview}
                  alt="Vista previa"
                  className="h-20 w-20 rounded object-cover"
                />
                <div className="flex-1 text-xs text-slate-600">
                  <p className="font-medium text-green-700">
                    ✓ Foto lista para enviar
                  </p>
                  <p className="mt-1">
                    Metadata EXIF removida. Solo se publicara junto al
                    reporte.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearPhoto}
                  disabled={busy}
                  className="text-xs text-slate-500 hover:text-red-700"
                >
                  Quitar
                </button>
              </div>
            )}

            {photoError && (
              <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {photoError}
              </p>
            )}
          </div>
        </div>

        {displayedError && (
          <div
            role="alert"
            className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {displayedError}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {submitting ? 'Enviando...' : 'Reportar'}
          </button>
        </div>
      </form>
    </div>
  );
}
