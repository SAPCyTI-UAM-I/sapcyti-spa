# Core

Qué es distinto aquí: infraestructura transversal. No pantallas de negocio.

## Boundaries

- Endpoints HTTP: solo `api/api-endpoints.ts` (`API_ENDPOINTS`).
- Elección mock/HTTP: `mocks/provide-mock-or-http.ts` + registro en `api/data-layer.providers.ts`.
- Auth/guards/RBAC: `auth/`. Repos de login/recuperación viven aquí, no en `features/auth` como HTTP layer.
- Errores API: `errors/`.
- Tema: `theme/design-tokens.ts` (junto con `src/styles.css`).

## Navigation

| Tarea | Archivo |
|-------|---------|
| Nueva URL | `api/api-endpoints.ts` |
| Registrar repo mock/http | `api/data-layer.providers.ts` |
| Flag de mock | `src/environments/environment.ts` |
| Roles de menú/ruta | `auth/rbac.policy.ts` |

## Constraints

- Este módulo **sí** importa repositories de features al cablear DI. No copies ese patrón en componentes.
- Prohibido `if (useMock)` en UI; el flag vive en environment + providers.
- No crees un segundo catálogo de URLs en features (los `*.endpoints.ts` legacy deben reexportar `API_ENDPOINTS` o eliminarse).

## Verify

- Cambio de endpoint: prueba el `*-http.repository` / spec del feature afectado.
- Cambio de mock wiring: arranque con el flag correspondiente en `environment.mocks`.
