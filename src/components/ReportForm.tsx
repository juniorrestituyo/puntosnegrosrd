'use client';

import { useState } from 'react';
import { z } from 'zod';

import {
  CATEGORIES,
  CATEGORY_EMOJI,
  SUBCATEGORY_EMOJI,
  type CategoryKey,
} from '@/lib/constants';
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
  const currentEmoji = subcategory
    ? (SUBCATEGORY_EMOJI[subcategory] ?? CATEGORY_EMOJI[category])
    : CATEGORY_EMOJI[category];

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setPhotoUploading(true);
    setPhotoUrl(null);
    setPhotoPreview(null);

    try {
      const processed = await processImage(file);
      const previewUrl = URL.createObjectURL(processed.blob);
      setPhotoPreview(previewUrl);

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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 p-2 backdrop-blur-sm sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-2xl bg-surface-card p-4 shadow-float ring-1 ring-surface-border sm:p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-subtle text-2xl"
              aria-hidden
            >
              {currentEmoji}
            </span>
            <div>
              <h2 className="text-base font-semibold text-fg">
                Reportar punto de riesgo
              </h2>
              <p className="mt-0.5 text-xs text-fg-muted">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-fg-muted hover:bg-surface-raised hover:text-fg disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-fg">
              Categoria (taxonomia INTRANT)
            </span>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as CategoryKey);
                setSubcategory('');
              }}
              disabled={busy}
              className="mt-1.5 block w-full rounded-lg border border-surface-border bg-surface-input px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft disabled:opacity-60"
              required
            >
              {Object.entries(CATEGORIES).map(([key, value]) => (
                <option key={key} value={key}>
                  {CATEGORY_EMOJI[key as CategoryKey]} {value.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-fg-muted">
              {CATEGORIES[category].description}
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-fg">Subcategoria</span>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              disabled={busy}
              className="mt-1.5 block w-full rounded-lg border border-surface-border bg-surface-input px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft disabled:opacity-60"
            >
              <option value="">(opcional)</option>
              {subcategoryOptions.map((sc) => (
                <option key={sc} value={sc}>
                  {SUBCATEGORY_EMOJI[sc] ? `${SUBCATEGORY_EMOJI[sc]} ${sc}` : sc}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-fg">
              Descripcion{' '}
              <span className="text-fg-muted">(10-1000 caracteres)</span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
              rows={3}
              className="mt-1.5 block w-full rounded-lg border border-surface-border bg-surface-input px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft disabled:opacity-60"
              placeholder="Bache profundo en la curva, peligroso especialmente de noche..."
              required
              minLength={10}
              maxLength={1000}
            />
            <p className="mt-1 text-right text-xs text-fg-muted">
              {description.length}/1000
            </p>
          </label>

          <div>
            <span className="text-sm font-medium text-fg">
              Foto (opcional)
            </span>
            {!photoUrl && !photoUploading && (
              <label
                htmlFor="photo-input"
                className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-surface-border bg-surface-raised px-4 py-6 text-center text-sm text-fg-muted hover:border-brand hover:bg-brand-subtle"
              >
                Toca para tomar o seleccionar 📷
                <span className="mt-1 text-xs text-fg-dim">
                  JPEG/PNG hasta 3 MB. EXIF removida antes de subir.
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
              <div className="mt-1.5 rounded-lg border border-surface-border bg-surface-raised px-3 py-3 text-center text-sm text-fg-muted">
                Procesando y subiendo imagen...
              </div>
            )}

            {photoPreview && photoUrl && (
              <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-surface-border bg-surface-raised p-2">
                <img
                  src={photoPreview}
                  alt="Vista previa"
                  className="h-20 w-20 rounded-md object-cover"
                />
                <div className="flex-1 text-xs">
                  <p className="font-medium text-emerald-600">
                    ✓ Foto lista para enviar
                  </p>
                  <p className="mt-1 text-fg-muted">EXIF removida.</p>
                </div>
                <button
                  type="button"
                  onClick={clearPhoto}
                  disabled={busy}
                  className="text-xs text-fg-muted hover:text-red-600"
                >
                  Quitar
                </button>
              </div>
            )}

            {photoError && (
              <p className="mt-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {photoError}
              </p>
            )}
          </div>
        </div>

        {displayedError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {displayedError}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-medium text-fg-muted hover:bg-surface-raised hover:text-fg disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-accent disabled:opacity-60"
          >
            {submitting ? 'Enviando...' : 'Reportar'}
          </button>
        </div>
      </form>
    </div>
  );
}
