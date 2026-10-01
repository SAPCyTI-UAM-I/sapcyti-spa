# Auditoría de contexto (sapcyti-spa)

Estado inicial medido en rama `chore/agents-md`. Objetivo: mínimo contexto suficiente para un agente.

## Problemas

### P0 — Manual largo como entrada por defecto

| Campo | Detalle |
|-------|---------|
| **Problem** | `.cursor/conventions.md` (~785 líneas / ~36 KB) se trata como guía completa; un agente la carga entera. |
| **Evidence** | `wc` del archivo; secciones 1–17; AGENTS.md ya pide solo §0 para UI. |
| **Impact** | Ruido, reglas fuera de alcance, tokens altos antes de tocar código. |
| **Token impact** | Very large |
| **Maintenance** | Alta si se duplica el contenido en AGENTS. |
| **Solution** | AGENTS.md = L0. Enlace solo a `.cursor/conventions.md` §0. Índice arquitectónico + procedimientos cortos. |
| **Priority** | P0 |

### P0 — Dos `conventions.md` distintos

| Campo | Detalle |
|-------|---------|
| **Problem** | `conventions.md` (raíz, ~414 líneas) ≠ `.cursor/conventions.md` (~785). Riesgo de leer el incorrecto. |
| **Evidence** | `diff -q` los marca distintos; README apunta a raíz §17; AGENTS a `.cursor` §0. |
| **Impact** | Instrucciones contradictorias o incompletas. |
| **Token impact** | Large si se leen ambos. |
| **Maintenance** | Media (dos fuentes). |
| **Solution** | Canónico para agentes: `.cursor/conventions.md` §0. Raíz = onboarding humano; no copiar a AGENTS. |
| **Priority** | P0 |

### P1 — Sin mapa de navegación L1/L2

| Campo | Detalle |
|-------|---------|
| **Problem** | No hay índice “si cambio X, empieza aquí” ni procedimientos tipados. |
| **Evidence** | Solo AGENTS.md + conventions + design/; sin `docs/architecture/` ni skills. |
| **Impact** | Exploración amplia de features enteras. |
| **Token impact** | Large |
| **Maintenance** | Baja si el mapa es corto. |
| **Solution** | `docs/architecture/index.md` + skills en `.agents/skills/`. |
| **Priority** | P1 |

### P1 — Ownership confuso (UEA / offering / enrollment)

| Campo | Detalle |
|-------|---------|
| **Problem** | UEAs viven en `academic-catalog`; `academic-offering` solo tiene `enrollment-start`; `enrollment` y `presentations` son placeholders. |
| **Evidence** | Rutas y carpetas reales bajo `src/app/features/`. |
| **Impact** | Agente busca pantallas UEA en offering o implementa enrollment real donde hay stub. |
| **Token impact** | Medium |
| **Maintenance** | Baja (nota local). |
| **Solution** | Nota en `docs/agent-context/academic-catalog.md` + filas en el mapa. |
| **Priority** | P1 |

### P2 — Wiring mock/HTTP en `core` importa features

| Campo | Detalle |
|-------|---------|
| **Problem** | `core/api/data-layer.providers.ts` registra repos de features; excepción al “no feature→feature”. |
| **Evidence** | Imports desde `features/*/repositories` en ese archivo. |
| **Impact** | Agente duplica providers en el feature o pone `if (useMock)` en UI. |
| **Token impact** | Medium |
| **Maintenance** | Baja. |
| **Solution** | `docs/agent-context/core.md` + procedimiento registrar-endpoint/mock. |
| **Priority** | P2 |

### P2 — Ejemplo dorado no verificado en docs nuevas

| Campo | Detalle |
|-------|---------|
| **Problem** | Repetir un golden path inventado. |
| **Evidence** | Existe `professor-list.component.{ts,html,spec.ts}` (~2.7–5.2 KB). |
| **Impact** | Copia de patrón incorrecto. |
| **Token impact** | Tiny si se apunta; large si se lee otro feature al azar. |
| **Maintenance** | Nula. |
| **Solution** | Mantener el path verificado en AGENTS.md. |
| **Priority** | P2 |

### P3 — Artefactos de build como “código”

| Campo | Detalle |
|-------|---------|
| **Problem** | `node_modules/`, `dist/`, `coverage/`, `test-results/` saturan búsqueda. |
| **Evidence** | Directorios presentes en el repo de trabajo. |
| **Impact** | Hits irrelevantes. |
| **Token impact** | Very large si se indexan. |
| **Maintenance** | Nula. |
| **Solution** | Ignorar salvo depurar toolchains; documentar en context-model. |
| **Priority** | P3 |

### P3 — `design/` completo en tareas de bug pequeño

| Campo | Detalle |
|-------|---------|
| **Problem** | `DESIGN_SYSTEM.md` + mockups HTML/PNG no hacen falta para un bug de listado. |
| **Evidence** | `design/` ~391 líneas md + subárboles de mockup. |
| **Impact** | Tokens sin cambio de código. |
| **Token impact** | Large |
| **Maintenance** | Baja. |
| **Solution** | Cargar solo si la tarea es visual/design system. |
| **Priority** | P3 |

## Resumen de prioridades

| Pri | Acción |
|-----|--------|
| P0 | AGENTS L0; no pegar conventions; canónico `.cursor` §0 |
| P1 | Índice + mapa + skills; aclarar ownership |
| P2 | Nota `core/`; golden path verificado |
| P3 | Ruido build; design bajo demanda |
