# Academic catalog

Qué es distinto aquí: concentra alumnos, profesores **y UEAs**. Las bases abstractas de listado/alta viven en la raíz del feature.

## Boundaries

- UEAs: componentes y repos bajo este feature (`components/uea-*`, `repositories/uea*`).
- Bases: `catalog-list.base.ts`, `catalog-registration.base.ts` (+ specs). Extiende; no dupliques paginación/filtros.

## Navigation

| Tarea | Empieza en |
|-------|------------|
| Listado profesor | `components/professor-list/` (ejemplo dorado del repo) |
| Nueva pantalla catálogo | Copia el componente hermano más cercano + su `*.spec.ts` |
| Rutas | `academic-catalog.routes.ts` |
| HTTP | `repositories/*-http.repository.ts` → `API_ENDPOINTS` |

## Constraints

- Sin imports desde otros features.
- Datos demo en `mocks/` (borrables en bloque).
- Endpoints vía `API_ENDPOINTS`; ignora `academic-catalog.endpoints.ts` (deprecated).

## Verify

```bash
pnpm exec ng test --no-watch --include=src/app/features/academic-catalog/components/<pantalla>/<pantalla>.component.spec.ts
```
