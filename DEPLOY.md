# Deploy a Vercel — paso a paso

**Tiempo estimado:** 10-15 minutos.
**Pre-requisito:** repo en GitHub (ya hecho: w0rkm4n/puntosnegrosrd).

---

## Paso 1 — Crear cuenta en Vercel

1. Ir a https://vercel.com
2. Click **"Sign Up"** (esquina superior derecha)
3. Elegir **"Continue with GitHub"** — autentica con tu cuenta `w0rkm4n`
4. Autoriza el acceso de Vercel a tus repos
5. En el plan, elige **Hobby** (gratis, sin tarjeta)

---

## Paso 2 — Importar el repo

1. En el dashboard de Vercel, click **"Add New..." → "Project"**
2. En la lista de repos de GitHub busca `puntosnegrosrd`
3. Si no aparece: click **"Adjust GitHub App Permissions"** y dale acceso al repo
4. Click **"Import"** en `puntosnegrosrd`

Vercel detecta automáticamente que es un proyecto Next.js. No necesitas tocar:
- **Framework Preset:** Next.js (auto)
- **Root Directory:** ./
- **Build Command:** `next build` (auto)
- **Output Directory:** `.next` (auto)
- **Install Command:** `npm install` (auto)

---

## Paso 3 — Configurar Environment Variables

Esto es lo crítico. Abre la sección **"Environment Variables"** (justo antes del botón Deploy).

Agrega estas 6 variables. **Genera valores nuevos para producción** (distintos de tu `.env.local` por higiene de seguridad — si tu máquina se compromete, prod sigue a salvo):

| Variable | Valor | De dónde sale |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rvonfrijjmzigiywjply.supabase.co` | Tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (la copias) | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | (la copias) | Supabase → Settings → API → service_role (Reveal) ⚠️ secreta |
| `IP_HASH_SALT` | (string aleatorio nuevo, 32+ chars) | Generas con `-join ((1..48) \| ForEach-Object { [char]((48..122) \| Get-Random) })` en PowerShell |
| `ADMIN_SECRET` | (otro string aleatorio nuevo) | Lo mismo, distinto del anterior |
| `NEXT_PUBLIC_SITE_URL` | `https://puntosnegrosrd.vercel.app` | Asume el subdominio default. Si cambias después, lo ajustas. |

**Por cada variable:**
- Nombre exacto (case-sensitive)
- Valor sin comillas
- Marca las 3 environments: Production, Preview, Development (puedes dejarlo en todos)

---

## Paso 4 — Deploy

Click **"Deploy"**.

Vercel va a:
1. Clonar tu repo
2. Correr `npm install` (sin `--ignore-scripts` por default — en producción Vercel ya corre en sandbox aislado, no es problema)
3. Correr `next build`
4. Servir el resultado

Tarda 1-3 minutos. Verás logs en vivo. Si falla, los logs dicen exactamente qué.

Cuando termine, te muestra:
- ✓ "Congratulations!"
- URL pública: `https://puntosnegrosrd.vercel.app` (o el subdominio que Vercel te asignó si ya estaba tomado)
- Captura de cómo se ve el sitio

---

## Paso 5 — Probar el deploy

Abre la URL en tu navegador. Cosas a verificar en orden:

1. **Carga la home con el mapa** — sí o no
2. **Click hamburger → navegación funciona** — verifica las 4 páginas
3. **Tap "+" en el mapa → menú aparece** — verifica que abre
4. **"Usar mi ubicación"** desde desktop (con permiso) — debe ubicarte
5. **"Locate me"** (el otro botón) — debe mostrar tu blue dot
6. **Reportar un punto de prueba** con foto — verifica que persista
7. **Descargar CSV** desde `/datos-abiertos` — debe bajar el archivo
8. **Acceder a `/admin?key=...`** — wait, accedes solo poniendo `/admin` y luego ingresando el secret en el formulario

---

## Paso 6 — Actualizar `NEXT_PUBLIC_SITE_URL` con la URL real

Si el subdominio asignado no fue `puntosnegrosrd.vercel.app` (puede ser algo como `puntosnegrosrd-abc123.vercel.app`):

1. En el dashboard del proyecto Vercel, **Settings → Environment Variables**
2. Edita `NEXT_PUBLIC_SITE_URL` con la URL exacta de producción
3. **Deployments → tu último deploy → ⋯ → Redeploy**

Sin esto, los links generados por "Compartir con autoridad" apuntarán al subdominio incorrecto.

---

## Paso 7 — Probar GPS desde el teléfono

Ahora que el sitio corre en HTTPS:

1. En tu teléfono, abre `https://puntosnegrosrd.vercel.app` (o tu URL real)
2. Toca el FAB rojo `+` → "Usar mi ubicación"
3. El navegador del teléfono te pide permiso de ubicación
4. Acepta → debería abrir el modal con tus coordenadas reales
5. Reporta algo de prueba
6. Toca el botón de locate (target) → blue dot debe aparecer

Si la geolocation falla:
- Verifica que el sitio esté en HTTPS (debe tener candado en la barra)
- Revisa permisos del navegador para ese sitio (ícono del candado → Permisos → Ubicación)

---

## Después del deploy — flujo de desarrollo

**Cada `git push origin main` redeploya automáticamente.**

Workflow normal:
```powershell
# Hago cambios locales
npm run dev   # pruebo en localhost
git add -A
git -c user.name="..." -c user.email="..." commit -m "..."
git push      # Vercel detecta y redeploya en ~2 min
```

Vercel manda email cuando termina cada deploy (success o failure). También aparece en el dashboard.

---

## Logs y debugging

Si algo falla en producción:
1. Dashboard del proyecto → **Logs** o **Deployments → [tu deploy] → Functions**
2. Filtra por la ruta que falló (ej. `/api/points`)
3. Vas a ver los `console.error` que dejamos en cada route

Para errores de build (TypeScript, etc.):
- **Deployments → [el deploy fallido] → Build Logs**

---

## Dominio custom (opcional, para después del concurso)

Si quieres `puntosnegrosrd.com.do` o similar:
1. Compra el dominio (RD$ ~1500/año para `.com.do`)
2. En Vercel → Settings → Domains → "Add"
3. Vercel te da DNS records que pones en tu registrar
4. HTTPS automático en 24h

Para el concurso, `puntosnegrosrd.vercel.app` es suficiente y no se ve nada mal.

---

## Lo que NO necesitas hacer

- Configurar HTTPS — automático
- Configurar SSL cert — automático
- Configurar Node version — Vercel usa la última LTS
- Setear el puerto — automático
- Reverse proxy — Vercel maneja todo
- CDN — incluido
- Vercel Analytics — opcional, gratis básico

---

## Lista de verificación final antes de seguir

- [ ] Deploy exitoso (sin errores en build logs)
- [ ] La URL pública carga sin errores en consola del navegador
- [ ] Reportar un punto desde la web pública funciona
- [ ] El punto persiste al recargar (Supabase está conectado bien)
- [ ] La foto sube si está habilitado el bucket
- [ ] El CSV se descarga
- [ ] El admin loguea con tu nuevo ADMIN_SECRET
- [ ] GPS funciona desde teléfono real
