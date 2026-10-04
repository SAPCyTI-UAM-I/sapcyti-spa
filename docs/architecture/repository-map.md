# Mapa del repositorio

Vista mínima del SPA Angular. No inventar módulos fuera de esta lista.

## Raíz relevante

| Ruta | Rol |
|------|-----|
| `AGENTS.md` | L0 — entrada del agente |
| `.cursor/conventions.md` | Guía larga; agentes: solo §0 |
| `conventions.md` | Onboarding humano (distinto del de `.cursor`) |
| `package.json` | Scripts pnpm; Angular 21; Vitest |
| `src/app/` | Aplicación |
| `src/assets/i18n/` | `es.json` + `en.json` |
| `src/environments/` | `apiBaseUrl` + flags `mocks` |
| `design/` | Design system y mockups (bajo demanda) |
| `scripts/i18n-check.mjs` | Paridad/orden i18n |
| `eslint-rules/` | Incluye `no-cross-feature-imports` |
| `e2e/` | Playwright |
| `docs/architecture/` | Índice y mapa para agentes |
| `docs/agent-context/core.md` | Nota de área: `core/` |
| `docs/agent-context/academic-catalog.md` | Nota de área: catálogo y UEAs |
| `.agents/skills/` | Procedimientos L2 |

## `src/app/`

| Área | Contenido |
|------|-----------|
| `app.routes.ts` | Lazy load de features + shell |
| `app.config.ts` | Providers (i18n, mocks, data layer) |
| `core/` | Auth, HTTP, API endpoints, mocks DI, theme, errors |
| `shared/` | UI reutilizable, layout |
| `models/` | DTOs/tipos compartidos + barrel |
| `features/*` | Pantallas por dominio |
| `shell/` | Shell autenticado |
| `testing/` | Utilidades de test globales |

## Features (estado real)

| Feature | Qué hay |
|---------|---------|
| `academic-catalog` | Alumnos, profesores, UEAs, bases de listado/alta |
| `account` | Cambio de contraseña |
| `annual-planning` | Plan anual (lista/detalle/grid/wizard) |
| `auth` | Login y recuperación |
| `dashboard` | Home por rol |
| `enrollment` | Solo placeholder (aprobación asesor) |
| `enrollment-survey` | Sondeo (lista/form/detalle/respuesta) |
| `trimestral-planning` | Plan trimestral (+ `testing/` fixtures) |

## Ruido — no explorar por defecto

`node_modules/`, `dist/`, `coverage/`, `test-results/`, `.angular/`.
