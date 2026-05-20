/**
 * Formato uniforme de respuestas JSON para todas las API routes.
 *
 * Exito:  { ok: true,  data: T }
 * Error:  { ok: false, error: { code: string; message: string } }
 */

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = {
  ok: false;
  error: { code: string; message: string };
};

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json({ ok: true, data } satisfies ApiOk<T>, init);
}

export function err(
  code: string,
  message: string,
  status = 400
): Response {
  return Response.json(
    { ok: false, error: { code, message } } satisfies ApiErr,
    { status }
  );
}
