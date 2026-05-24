'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

import { CATEGORIES, type CategoryKey } from '@/lib/constants';
import { processImage } from '@/lib/image-process';
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  pointInputSchema,
} from '@/lib/point-schema';
import type { PointInput } from '@/lib/types';

const LocationPreview = dynamic(() => import('./LocationPreview'), {
  ssr: false,
  loading: () => (
    <div className="h-44 w-full animate-pulse bg-surface-raised" />
  ),
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
  // Marca true en el primer intento de submit. Habilita mostrar el
  // mensaje "Agrega foto o llena este campo" sin saturar el form
  // cuando el usuario recien lo abre. El mensaje "Minimo 10 chars"
  // si aparece en tiempo real porque solo se dispara cuando ya hay
  // chars escritos (intencion de input demostrada).
  const [submitAttempted, setSubmitAttempted] = useState(false);

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
    setSubmitAttempted(true);
    setLocalError(null);

    // description vacia → undefined antes de validar. Asi el refine
    // del schema evalua "no hay descripcion" en lugar de "descripcion
    // de 0 chars" (que falla con el mensaje del max).
    const trimmedDescription = description.trim();
    const payload = {
      lat,
      lng,
      category,
      subcategory: subcategory || undefined,
      description: trimmedDescription.length > 0 ? trimmedDescription : undefined,
      photo_url: photoUrl ?? undefined,
    };

    const result = pointInputSchema.safeParse(payload);

    if (!result.success) {
      setLocalError(result.error.issues[0]?.message ?? 'Error de validacion');
      return;
    }

    onSubmit(result.data as PointInput);
  }

  // Estado derivado de la UI. Regla: "si pones descripcion debe
  // tener al menos DESCRIPTION_MIN chars" — aplica con o sin foto.
  // Si no hay descripcion (vacia), debe haber foto.
  const hasPhoto = photoUrl !== null;
  const trimmedDescriptionLen = description.trim().length;
  const descriptionMeetsMin = trimmedDescriptionLen >= DESCRIPTION_MIN;
  const descriptionPlaceholder = hasPhoto
    ? 'Contexto o detalles adicionales (opcional)...'
    : 'Bache profundo en la curva, peligroso especialmente de noche...';
  const counterColorClass =
    trimmedDescriptionLen > 0 && !descriptionMeetsMin
      ? 'text-red-600'
      : 'text-fg-muted';

  // Dos errores inline distintos para el campo Detalles:
  //   - tooShortError: 1-9 chars escritos. Aplica con o sin foto.
  //     Tiempo real: aparece apenas hay chars y se mantiene hasta
  //     llegar al min.
  //   - emptyError: foto y descripcion vacias al intentar submit. NO
  //     se muestra al abrir el form. Aparece despues del primer click
  //     en Reportar y permanece mientras siga vacio.
  const tooShortError = trimmedDescriptionLen > 0 && !descriptionMeetsMin;
  const emptyError =
    submitAttempted && !hasPhoto && trimmedDescriptionLen === 0;

  return (
    <div
      className="fixed inset-0 z-[2000] flex flex-col bg-surface-base sm:items-center sm:justify-center sm:bg-black/40 sm:p-4 sm:backdrop-blur-sm"
      role="dialog"
      aria-label="Reportar punto de riesgo"
    >
      <form
        onSubmit={handleSubmit}
        className="relative flex h-full w-full flex-col bg-surface-base sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:overflow-hidden sm:rounded-2xl sm:bg-surface-card sm:shadow-float sm:ring-1 sm:ring-surface-border"
      >
        {/* Header sticky */}
        <header className="flex shrink-0 items-center justify-between border-b border-surface-border bg-surface-card px-4 py-3.5 sm:px-5">
          <h2 className="text-base font-bold tracking-tight text-fg sm:text-lg">
            Nuevo reporte
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Cerrar"
            className="-mr-1 flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-fg-muted hover:bg-surface-border hover:text-fg disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto bg-surface-base">
          {/* Ubicacion + preview */}
          <section className="bg-surface-card px-4 pt-4 pb-5 sm:px-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
              Ubicacion
            </h3>
            <p className="mt-1 font-mono text-sm text-fg">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
            <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-surface-border">
              <LocationPreview lat={lat} lng={lng} />
            </div>
          </section>

          {/* Foto (opcional). Movida arriba — antes vivia al final del
              form, despues de Detalles. Tener la opcion de foto justo
              despues de la Ubicacion comunica antes que es parte del
              "que pasa aqui visualmente", no un afterthought. */}
          <section className="mt-2 bg-surface-card px-4 pt-4 pb-5 sm:px-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
              Foto
            </h3>
            {!photoUrl && !photoUploading && (
              <label
                htmlFor="photo-input"
                className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-surface-border bg-surface-raised px-4 py-6 text-center text-sm text-fg-muted hover:border-brand hover:bg-brand-subtle"
              >
                Toca para tomar o seleccionar foto
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
                    Foto lista para enviar
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
          </section>

          <div className="mt-2 space-y-4 bg-surface-card px-4 py-5 sm:px-5">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                Categoria
              </span>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as CategoryKey);
                  setSubcategory('');
                }}
                disabled={busy}
                className="mt-1.5 block w-full rounded-lg border border-surface-border bg-surface-input px-3 py-2.5 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft disabled:opacity-60"
                required
              >
                {Object.entries(CATEGORIES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs leading-snug text-fg-muted">
                {CATEGORIES[category].description}
              </p>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                Subcategoria
              </span>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                disabled={busy}
                className="mt-1.5 block w-full rounded-lg border border-surface-border bg-surface-input px-3 py-2.5 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft disabled:opacity-60"
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
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                Detalles
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={busy}
                rows={3}
                className="mt-1.5 block w-full rounded-lg border border-surface-border bg-surface-input px-3 py-2.5 text-sm text-fg placeholder:text-fg-dim focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft disabled:opacity-60"
                placeholder={descriptionPlaceholder}
                // NO usamos required/minLength HTML5 — los navegadores
                // muestran un tooltip nativo en el idioma del sistema
                // (en ingles para muchos usuarios) que choca con nuestros
                // mensajes en rojo inline en espanol. La validacion real
                // ocurre en handleSubmit via pointInputSchema (zod).
                // maxLength sigue porque solo limita la escritura, no
                // dispara tooltip.
                maxLength={DESCRIPTION_MAX}
              />
              <p className={`mt-1 text-right text-xs ${counterColorClass}`}>
                {description.length}/{DESCRIPTION_MAX}
              </p>
              {tooShortError && (
                <p role="alert" className="mt-1 text-[11px] text-red-600">
                  Minimo {DESCRIPTION_MIN} caracteres.
                </p>
              )}
              {emptyError && (
                <p role="alert" className="mt-1 text-[11px] text-red-600">
                  Agrega una foto o llena este campo.
                </p>
              )}
            </label>

            {displayedError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {displayedError}
              </div>
            )}
          </div>
        </div>

        {/* Footer sticky con CTA */}
        <footer
          className="shrink-0 border-t border-surface-border bg-surface-card px-4 py-3 sm:px-5"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
          }}
        >
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-brand px-4 py-3.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-accent disabled:opacity-60"
          >
            {submitting ? 'Enviando reporte...' : 'Reportar'}
          </button>
          <p className="mt-2 text-center text-[11px] text-fg-muted">
            Tu reporte sera visible publicamente y anonimo.
          </p>
        </footer>
      </form>
    </div>
  );
}
