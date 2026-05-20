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
git clone https://github.com/w0rkm4n/puntosnegrosrd.git
cd puntosnegrosrd
```

(Si prefieres otro directorio, cámbialo. Aquí asumo `$HOME\Documents\puntosnegrosrd`.)

## Paso 2 — Copiar los archivos iniciales al repo

PowerShell desde la carpeta del repo:
```powershell
$src = "$HOME\Downloads\ideas\codigo-inicial"
Copy-Item -Recurse -Force "$src\*" .
```

Verifica que tienes esta estructura:
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
│   └── 001_initial.sql
├── public/
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

## Paso 3 — Aplicar la migración SQL en Supabase

1. Entra a https://supabase.com/dashboard/project/rvonfrijjmzigiywjply
2. **Database → Extensions** → buscar `postgis` → habilitar. Buscar `pgcrypto` → habilitar.
3. **SQL Editor → New query**
4. Copiar y pegar TODO el contenido de `migrations/001_initial.sql`
5. Click **RUN**
6. Verificar en **Table Editor** que están las tablas: `points`, `confirmations`, `status_history`.

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

## Paso 6 — Primer commit

```powershell
git add .
git commit -m "feat: bootstrap inicial Next.js + Supabase + esquema datos"
git push
```

## Paso 7 — Deploy en Vercel (3 minutos)

1. Ir a https://vercel.com → Sign Up con GitHub
2. **New Project** → Import `w0rkm4n/puntosnegrosrd`
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

## Próximo paso (Día 2 — hoy)

Mapa Leaflet con tap-to-report. Lo haremos cuando confirmes que los pasos 1-7 corrieron sin errores.
