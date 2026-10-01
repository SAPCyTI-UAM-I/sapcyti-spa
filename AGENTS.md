# SAPCyTI SPA

## Purpose

SPA Angular 21 + TypeScript strict + PrimeNG + Tailwind. Gestor: **pnpm** (`packageManager` en `package.json`). Este archivo es L0: bootstrap del agente.

## Structure

- App: `src/app/` — `core/`, `shared/`, `models/`, `features/*`, `shell/`
- i18n: `src/assets/i18n/{es,en}.json`
- Mapa: `docs/architecture/repository-map.md`
- Índice “si cambio X”: `docs/architecture/index.md`
- Procedimientos: `.agents/skills/*/SKILL.md`

## Boundaries

- Sin imports feature→feature (ESLint `sapcyti/no-cross-feature-imports`). Solo `core/`, `shared/`, `models/`.
- Endpoints solo en `src/app/core/api/api-endpoints.ts` (`API_ENDPOINTS`).
- Sin `if (useMock)` en componentes; mock/HTTP por DI.
- No crees SPEC markdown aquí. No pegues `.cursor/conventions.md` en este archivo.

## Navigation

1. Lee este L0.
2. UI: abre **solo §0** de `.cursor/conventions.md` (no el archivo entero; no uses `conventions.md` raíz como sustituto).
3. Si tocas `core/` o `academic-catalog/`, lee la nota de área (fuera de `src`): `docs/agent-context/core.md` o `docs/agent-context/academic-catalog.md`.
4. Elige el skill en `.agents/skills/` (pantalla, i18n, endpoint, test, explorar).
5. Copia el componente más cercano del mismo feature + su `*.spec.ts`.
6. Ejemplo dorado verificado: `src/app/features/academic-catalog/components/professor-list/`.
7. HTTP → `API_ENDPOINTS`. Índices: `docs/architecture/index.md`.

## Index

| Necesito | Ir a |
|----------|------|
| Rutas app | `src/app/app.routes.ts` |
| Endpoints | `src/app/core/api/api-endpoints.ts` |
| Providers mock/HTTP | `src/app/core/api/data-layer.providers.ts` |
| Features | `src/app/features/` (ver mapa) |
| Contexto agente | `docs/agent-context/` |

## Verify

- Focalizado: `pnpm exec ng test --no-watch --include=<ruta-del-spec>`
- Tras i18n: `pnpm run i18n:sync`
- Lint: `pnpm run lint` (ESLint + Prettier + paridad i18n)
- CI (no en cada turno): `pnpm run test --no-watch --coverage` y `pnpm run build --configuration production`
- UI visible: ejercita el flujo en el navegador; la prueba versionada es el `*.spec.ts`

## Critical constraints

- PrimeNG primero; UI propia solo en `shared/components/` si no hay equivalente.
- Texto visible solo por i18n (`es` + `en`).
- Standalone, `OnPush`, estado con signals; formularios reactivos (`NonNullableFormBuilder`).
- UEAs viven en `academic-catalog`, no en `academic-offering`.
- `enrollment` y `presentations` son placeholders.

## Definition of done

- Cambio acotado al área correcta; sin literales i18n ni URLs hardcodeadas.
- Spec focalizado en verde; `i18n:sync` si tocaste claves; lint si el alcance lo exige.
- No cargaste conventions completo ni features ajenos.
