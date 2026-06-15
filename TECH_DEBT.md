# Technical Debt — SAPCyTI SPA

> Track known technical debt to manage it intentionally. Update this file when introducing or resolving tech debt.

## Baseline (Fase 0 — 2026-06-15)

| Check | Result |
|-------|--------|
| `pnpm run lint` | ✅ Green |
| `pnpm test` | ✅ Green — 126 tests (33 files) |
| `ng build` | ✅ Green (bundle budget warning: 538 kB > 500 kB) |

## Refactor backlog (mejoras-spa.md)

| ID | Description | Priority | Rationale | Impact | Target Phase |
|----|-------------|----------|-----------|--------|--------------|
| TD-001 | Duplicación casi total en `academic-catalog` (list, service, registration student/professor) | High | DRY violation; cambios deben hacerse dos veces | Bugs por divergencia; mantenimiento costoso | ~~Fase 2~~ ✅ Resuelto 2026-06-15 |
| TD-002 | Patrón mock disperso (`if (useMock)` en cada servicio) | High | Dificulta alternar mock/API por feature | Cada nuevo endpoint repite el switch | ~~Fase 1~~ ✅ Resuelto 2026-06-15 |
| TD-003 | `AcademicCatalogMockStore` mezcla students + professors (SRP) | Medium | Una clase, dos entidades | Mock store difícil de extender | ~~Fase 2~~ ✅ Resuelto 2026-06-15 |
| TD-004 | Endpoints fragmentados sin barrels | Medium | URLs repartidas en `*.endpoints.ts` por feature | Riesgo de URLs inconsistentes | ~~Fase 1/6~~ ✅ URLs en `core/api/api-endpoints.ts`; barrels en `models/`, `shared/components/`, `core/auth/utils` |
| TD-005 | Paginación/filtros reimplementados en cada list component | Medium | Lógica copiada; no usa `p-paginator` | UI inconsistente potencial | ~~Fase 2~~ ✅ Base `CatalogListBase`; `p-paginator` diferido |
| TD-006 | Manejo de errores de validación inconsistente entre formularios | Medium | `FieldErrorComponent` no usado uniformemente | UX de errores variable | ~~Fase 3~~ ✅ Resuelto 2026-06-15 |
| TD-007 | i18n frágil (sin tipado ni verificación de paridad es/en) | Medium | Labels hardcodeados en arrays TS | Claves huérfanas o faltantes | ~~Fase 4~~ ✅ Resuelto 2026-06-15 |
| TD-008 | Presentación (Tailwind) en configs TS (`dashboard-home.config`) | Low | Datos mezclados con clases CSS | Config difícil de reutilizar | Fase 5 |
| TD-009 | `login` con `setInterval` imperativo embebido en componente | Low | Lógica no testeable aisladamente | Cooldown difícil de reutilizar | ~~Fase 3~~ ✅ Resuelto 2026-06-15 |
| TD-010 | Specs duplicadas SPEC-016A/017A/018A con contenido distinto (Docs/) | Medium | Dos archivos por spec, md5 distintos | Confusión sobre contrato canónico | Fase 7 (Docs) |

## Priority Levels

- **Critical** — Must resolve before next release
- **High** — Should resolve within current iteration
- **Medium** — Plan for next iteration
- **Low** — Resolve when convenient
