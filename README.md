# PuntosNegrosRD

Plataforma ciudadana abierta para reportar puntos de riesgo vial en la República Dominicana.

**Iniciativa ciudadana independiente.** Complemento del trabajo del Instituto Nacional de Tránsito y Transporte Terrestre (INTRANT). Adopta la taxonomía oficial de los cuatro factores causales (humano, vehicular, infraestructural, climático).

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + PostGIS + Storage)
- Leaflet + OpenStreetMap
- Zod (validación)

## Datos abiertos

Todos los reportes se publican bajo licencia **Creative Commons Atribución 4.0 (CC-BY 4.0)**.

Endpoints (cuando estén disponibles):
- `GET /api/export.csv`
- `GET /api/export.geojson`

## Setup

Ver [SETUP.md](./SETUP.md).

## Privacidad

- Sin login obligatorio para reportar
- Sin tracking de terceros
- IPs hasheadas con salt para rate-limit, nunca almacenadas en claro
- Metadata EXIF eliminada de fotos antes de almacenar

## Licencia

Código bajo licencia MIT. Datos bajo CC-BY 4.0.
