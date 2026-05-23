# Operaciones de moderacion via Supabase SQL Editor

PuntosNegrosRD no tiene panel admin en la UI. La moderacion comunitaria
descentraliza la mayor parte:

- **Auto-resolucion**: 5+ votos comunitarios cierran un punto (umbral
  escalado con confirmaciones — ver `migrations/004_anti_abuse.sql`).
- **Auto-ocultacion de contenido**: 5+ flags de IPs distintas ocultan
  un punto sin intervencion humana.

Los casos que requieren intervencion del owner — fuera de banda de la
moderacion comunitaria — se hacen via el SQL Editor de Supabase
(Dashboard → SQL Editor). Esta es la lista de snippets utiles.

> **IMPORTANTE**: ejecutar siempre con el `service_role` (default del
> SQL Editor logueado como owner). Las policies de RLS bloquean estas
> operaciones desde cualquier cliente publico.

---

## Inspeccionar el estado

### Ver los ultimos 20 puntos reportados

```sql
select id, category, subcategory, status, is_visible, created_at,
       confirmation_count, resolution_count
from public.points_with_stats
order by created_at desc
limit 20;
```

(Incluye puntos ocultos en la vista? No — `points_with_stats` filtra
por `is_visible = true`. Para ver tambien los ocultos, usar la tabla
`points` directamente.)

### Ver puntos ocultos

```sql
select id, category, subcategory, description, created_at
from public.points
where is_visible = false
order by created_at desc
limit 50;
```

### Ver flags de contenido recientes (privado)

```sql
select cf.point_id, cf.reason, cf.created_at, p.description, p.is_visible
from public.content_flags cf
join public.points p on p.id = cf.point_id
order by cf.created_at desc
limit 50;
```

### Ver flags agrupados por punto

```sql
select point_id, count(*) as flags,
       array_agg(reason) as reasons
from public.content_flags
group by point_id
order by flags desc;
```

---

## Cambiar el estado de un punto

Util cuando el owner envia un correo a la autoridad y quiere documentar
en `status_history` que el reporte fue notificado.

### Marcar como "notificado" con nota

```sql
-- Reemplazar el ID y la nota.
with target as (
  select id, status from public.points where id = '00000000-0000-0000-0000-000000000000'
)
update public.points
set status = 'notificado'
where id = (select id from target);

insert into public.status_history (point_id, old_status, new_status, note, changed_by)
select id, status, 'notificado',
       'Correo enviado a INTRANT el ' || now()::date,
       'owner-manual'
from public.points
where id = '00000000-0000-0000-0000-000000000000';
```

### Marcar como "en_atencion"

```sql
update public.points
set status = 'en_atencion'
where id = '00000000-0000-0000-0000-000000000000';

insert into public.status_history (point_id, old_status, new_status, note, changed_by)
values (
  '00000000-0000-0000-0000-000000000000',
  'notificado',
  'en_atencion',
  'Cuadrilla del ayuntamiento confirmada en sitio',
  'owner-manual'
);
```

### Marcar como "resuelto" (override manual)

Override del trigger comunitario. Usar solo cuando hay evidencia
verificable directamente.

```sql
update public.points
set status = 'resuelto'
where id = '00000000-0000-0000-0000-000000000000';

insert into public.status_history (point_id, old_status, new_status, note, changed_by)
values (
  '00000000-0000-0000-0000-000000000000',
  'en_atencion',
  'resuelto',
  'Verificacion visual directa: bache tapado',
  'owner-manual'
);
```

### Reabrir un punto cerrado por comunidad

Si el trigger lo cerro por consenso pero el problema vuelve a aparecer
(o se sospecha colusion en el voto):

```sql
update public.points
set status = 'corroborado'
where id = '00000000-0000-0000-0000-000000000000' and status = 'resuelto';

insert into public.status_history (point_id, old_status, new_status, note, changed_by)
values (
  '00000000-0000-0000-0000-000000000000',
  'resuelto',
  'corroborado',
  'Reabierto manualmente: evidencia ciudadana de que el problema persiste',
  'owner-manual'
);

-- Opcional: limpiar los votos de resolucion previos para que no
-- vuelvan a disparar el trigger inmediatamente.
delete from public.resolutions
where point_id = '00000000-0000-0000-0000-000000000000';
```

---

## Moderacion de visibilidad

### Ocultar un punto manualmente

```sql
update public.points
set is_visible = false
where id = '00000000-0000-0000-0000-000000000000';
```

### Mostrar un punto que fue ocultado (revertir flag comunitario)

Si los flags comunitarios ocultaron un punto pero la decision fue
incorrecta (flags falsos por colusion):

```sql
update public.points
set is_visible = true
where id = '00000000-0000-0000-0000-000000000000';

-- Limpiar los flags para que no se vuelva a ocultar al recibir uno
-- nuevo (el trigger cuenta el total, incluyendo los previos).
delete from public.content_flags
where point_id = '00000000-0000-0000-0000-000000000000';
```

### Borrar un punto definitivamente

Solo en casos extremos (contenido ilegal, GDPR-like request, error
flagrante). El delete cascade borra confirmations, resolutions, flags
y status_history asociados.

```sql
delete from public.points
where id = '00000000-0000-0000-0000-000000000000';
```

---

## Auditoria de votos

### Quien voto en un punto (hashes de IP)

```sql
-- Confirmaciones de "yo lo veo".
select ip_hash, created_at
from public.confirmations
where point_id = '00000000-0000-0000-0000-000000000000'
order by created_at desc;

-- Votos de resolucion.
select ip_hash, created_at
from public.resolutions
where point_id = '00000000-0000-0000-0000-000000000000'
order by created_at desc;
```

### Detectar posible colusion (mismas IPs votando en muchos puntos juntas)

```sql
-- IPs que han votado resolucion en el mismo dia en muchos puntos.
-- Si una IP cierra >5 puntos en el mismo dia, sospechoso.
select ip_hash, date_trunc('day', created_at) as dia, count(*) as votos
from public.resolutions
group by ip_hash, date_trunc('day', created_at)
having count(*) > 5
order by votos desc;
```
