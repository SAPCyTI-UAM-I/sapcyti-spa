# Índice arquitectónico

Si cambias X, empieza aquí. Enlaces, no copias.

## Arranque

1. [`AGENTS.md`](../../AGENTS.md) (L0)
2. Si UI: `.cursor/conventions.md` **solo §0**
3. Procedimiento en [`.agents/skills/`](../../.agents/skills/)
4. Componente cercano + `*.spec.ts`
5. `src/app/core/api/api-endpoints.ts` si toca HTTP

Mapa físico: [`repository-map.md`](./repository-map.md).

## Si cambio X → empieza aquí

| Si cambio… | Empieza en | Luego |
|------------|------------|-------|
| Texto visible / claves i18n | `src/assets/i18n/es.json` + `en.json` | skill `i18n-claves` → `pnpm run i18n:sync` |
| URL HTTP / contrato API | `src/app/core/api/api-endpoints.ts` | repo `*-http.repository.ts` del feature |
| Flag mock vs HTTP | `src/environments/environment*.ts` | `core/api/data-layer.providers.ts` + `design/MOCK_GUIDE.md` |
| Guard / roles de ruta | `core/auth/rbac.policy.ts` | `*.routes.ts` del feature + `app.routes.ts` |
| Interceptor / sesión | `core/http/` + `core/auth/` | no features |
| Error de API en UI | `core/errors/` | componente que muestra el error |
| Tokens de color/tipo | `core/theme/design-tokens.ts` + `src/styles.css` | `design/DESIGN_SYSTEM.md` solo si hace falta |
| Listado catálogo (alumno/profesor/UEA) | `features/academic-catalog/` | golden: `professor-list/`; bases `catalog-*.base.ts` |
| Pantalla UEA | **`academic-catalog`** (no offering) | rutas `ueas` en `academic-catalog.routes.ts` |
| Inicio inscripción / horarios | `features/academic-offering/components/enrollment-start/` | — |
| Inscripción asesor/PDF/estado | `features/enrollment/` | stub placeholder — no inventar dominio |
| Presentaciones | `features/presentations/` | stub placeholder |
| Sondeo | `features/enrollment-survey/` | repos + components del feature |
| Plan anual | `features/annual-planning/` | — |
| Plan trimestral | `features/trimestral-planning/` | fixtures en `testing/` |
| Login / reset password | `features/auth/` | repos en `core/auth/repositories/` |
| Cambio de contraseña | `features/account/` | — |
| Modelo compartido | `src/app/models/` | barrel `models/index.ts` |
| Componente UI genérico | `shared/components/` | solo si no hay PrimeNG |
| Regla ESLint cross-feature | `eslint-rules/no-cross-feature-imports.mjs` | `eslint.config.mjs` |
| CI / scripts | `.github/workflows/` + `package.json` | — |

## Notas locales (L1)

| Área | Archivo | Por qué existe |
|------|---------|----------------|
| Core | [`docs/agent-context/core.md`](../agent-context/core.md) | Endpoints, mocks DI, auth |
| Catálogo | [`docs/agent-context/academic-catalog.md`](../agent-context/academic-catalog.md) | UEAs aquí; bases de listado |

No hay AGENTS por cada feature: el resto sigue el patrón estándar del L0.

## Fuentes de verdad

| Tema | Canónico |
|------|----------|
| Bootstrap agente | `AGENTS.md` |
| TL;DR UI | `.cursor/conventions.md` §0 |
| Endpoints | `API_ENDPOINTS` |
| Mocks por dominio | `environment.mocks` + `DATA_LAYER_PROVIDERS` |
| i18n | `es.json` / `en.json` + `scripts/i18n-check.mjs` |
| Rutas | `app.routes.ts` + `features/*/…routes.ts` |
| Design tokens | `design-tokens.ts` + `@theme` en `styles.css` |

## No cargar por defecto

- `.cursor/conventions.md` completo
- `conventions.md` raíz (salvo onboarding humano)
- Todos los features
- `design/` entero en bugs no visuales
- `node_modules/`, `dist/`, `coverage/`
