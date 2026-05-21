# PuntosNegrosRD — Setup paso a paso

**Antes de empezar:**
- Tener instalado Node.js 20+ (descarga: https://nodejs.org)
- Tener instalado Git
- Cuenta de Supabase activa (ya hecho)
- Cuenta de Vercel activa (la creas al final)

---

## Paso 1 — Clonar el repo localmente

PowerShell:
```powershell
cd $HOME\Documents
git clone https://github.com/juniorrestituyo/puntosnegrosrd.git
cd puntosnegrosrd
```

(Si prefieres otro directorio, cámbialo. Aquí asumo `$HOME\Documents\puntosnegrosrd`.)

## Paso 2 — Verificar estructura del repo

Después del `git clone` ya tienes todos los archivos del proyecto.
Verifica que coincide con esta estructura:
```
puntosnegrosrd/
├── .env.local.example
├── .gitignore
├── README.md
├── package.json
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── migrations/
│   ├── 001_initial.sql
│   └── 002_resolutions.sql
├── public/
│   ├── icon.png
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-192.png
│   ├── icon-maskable-512.png
│   ├── apple-touch-icon.png
│   ├── og-image.png
│   └── manifest.webmanifest
├── scripts/
│   └── generate-icons.mjs
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── components/
    └── lib/
        ├── constants.ts
        ├── types.ts
        └── supabase/
            ├── client.ts
            └── server.ts
```

## Paso 3 — Aplicar las migraciones SQL en Supabase

1. Entra a https://supabase.com/dashboard/project/rvonfrijjmzigiywjply
2. **Database → Extensions** → buscar `postgis` → habilitar. Buscar `pgcrypto` → habilitar.
3. **SQL Editor → New query**
4. Aplica las migraciones en orden numerico:
   - Copiar y pegar TODO el contenido de `migrations/001_initial.sql` → **RUN**
   - Nueva query → contenido de `migrations/002_resolutions.sql` → **RUN**
5. Verificar en **Table Editor** que están las tablas:
   - `points`, `confirmations`, `status_history` (de 001)
   - `resolutions` (de 002)
6. Verificar en **Database → Functions** que existe `handle_resolution_insert` (trigger de auto-cierre comunitario).

> **Si se agregan migraciones nuevas** (003, 004, etc.) en el futuro,
> aplicalas en orden numerico igual. Cada archivo es idempotente
> (usa `if not exists` / `create or replace`), asi que re-aplicar
> una migracion existente no rompe nada.

## Paso 3.5 — Crear el bucket de Storage para fotos

1. **Storage → New bucket** en el dashboard de Supabase.
2. Nombre: `point-photos`
3. Marcar como **público** (lectura pública). La escritura sigue siendo solo del servidor con service_role.
4. Restricciones opcionales recomendadas:
   - Allowed MIME types: `image/jpeg, image/png, image/webp`
   - Max file size: 5 MB
5. Si no se crea el bucket, el endpoint `/api/upload` devolverá 500 al subir foto, pero el resto de la app funciona normal.

## Paso 4 — Configurar variables de entorno

1. Copiar `.env.local.example` a `.env.local`:
   ```powershell
   Copy-Item .env.local.example .env.local
   ```

2. Abrir `.env.local` con tu editor y llenar los valores:
   - `NEXT_PUBLIC_SUPABASE_URL` → `https://rvonfrijjmzigiywjply.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → la encuentras en **Settings → API → anon public**
   - `SUPABASE_SERVICE_ROLE_KEY` → la encuentras en **Settings → API → service_role secret** ⚠️ **NUNCA la subas al repo**
   - `IP_HASH_SALT` → genera un string aleatorio:
     ```powershell
     -join ((1..32) | ForEach-Object { [char]((48..122) | Get-Random) })
     ```
   - `ADMIN_SECRET` → otro string aleatorio (igual que el de arriba pero distinto)
   - `NEXT_PUBLIC_SITE_URL` → `http://localhost:3000` por ahora

3. Verifica que `.env.local` está en `.gitignore` (ya lo está en el archivo que te paso).

## Paso 5 — Instalar dependencias y correr local

```powershell
npm install
npm run dev
```

Abre http://localhost:3000 — deberías ver la página placeholder con "PuntosNegrosRD".

## Paso 6 — Deploy en Vercel (3 minutos)

1. Ir a https://vercel.com → Sign Up con GitHub
2. **New Project** → Import `juniorrestituyo/puntosnegrosrd`
3. **Framework Preset:** Next.js (detección automática)
4. **Environment Variables** → agregar las mismas que tienes en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `IP_HASH_SALT`
   - `ADMIN_SECRET`
   - `NEXT_PUBLIC_SITE_URL` → ponlo en `https://puntosnegrosrd.vercel.app` (o tu subdominio)
5. **Deploy**
6. Cuando termine, te da la URL pública. Guárdala.

**Importante:** después del primer deploy, actualiza `NEXT_PUBLIC_SITE_URL` en Vercel con la URL real y haz un redeploy.

## Paso 7 — Regenerar iconos (opcional)

Solo si cambias el logo (`public/icon.png`). El proyecto incluye un script
que regenera todos los iconos derivados:

```powershell
npm run icons:generate
```

Esto genera, a partir de `public/icon.png`:

- `icon-192.png` / `icon-512.png` — fallback "any" (esquinas transparentes)
- `icon-maskable-192.png` / `icon-maskable-512.png` — Android adaptive
  icon (cuadrado negro full-bleed, logo al 80% en safe zone)
- `apple-touch-icon.png` — iOS (180x180, logo al 90%)
- `og-image.png` — link preview en WhatsApp/Telegram/redes (1200x630
  negro con logo centrado)

Si nunca cambias el logo, no necesitas correrlo — los archivos ya estan
en el repo.

## Cambios en el codigo

Para hacer cambios al sitio:

```powershell
# Antes de hacer cambios, asegurate de tener lo ultimo
git pull origin main

# Tras hacer cambios y verificar en npm run dev:
git add .
git commit -m "tu mensaje claro"
git push origin main
```

Vercel detecta el push y redeploy automatico en ~1-2 min.

**Para cambios en DB**: agregar archivo `migrations/00X_descripcion.sql`,
correrlo en Supabase SQL Editor, commitear el archivo. NO hay sistema
automatico de migraciones — es manual y por orden numerico.

**Para limpiar test data**: SQL Editor en Supabase:

```sql
-- Borrar TODOS los reportes (cuidado, irreversible)
delete from public.points;

-- Borrar solo los de tu IP de prueba
delete from public.points where ip_hash = '<tu-hash>';
```
