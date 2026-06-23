# Technical Debt — SAPCyTI SPA

> Track known technical debt to manage it intentionally. Update this file when introducing or resolving tech debt.

## Baseline (post refactor mejoras-spa — 2026-06-15)

| Check | Result |
|-------|--------|
| `pnpm run lint` | ✅ Green (ESLint + Prettier + i18n:check) |
| `pnpm test` | ✅ Green — 141 tests (36 files) |
| `ng build` | ✅ Green — initial ~546 kB (budget warning 600 kB desde Fase C `mejoras2.md`) |

### Bundle budget (initial)

Baseline post-refactor: **~546 kB** raw initial chunk (Angular 21 + PrimeNG 21 + Tailwind `@theme` + i18n). El umbral anterior de **500 kB** era heredado de plantilla Angular por defecto y generaba warning sin bloquear build. **`angular.json`**: `maximumWarning` subido a **600 kB** (margen ~10 % sobre baseline medido); `maximumError` permanece en **1 MB**. Lazy loading de features ya activo; reducción adicional requiere split PrimeNG por ruta (no trivial).


| Fase | Tema | Estado |
|------|------|--------|
| 0 | Línea base lint/test/build | ✅ |
| 1 | Repository pattern + `api-endpoints.ts` | ✅ |
| 2 | Bases catálogo académico + mock stores separados | ✅ |
| 3 | Formularios / `FieldErrorComponent` / cooldown | ✅ |
| 4 | i18n paridad + `I18nKey` + script | ✅ |
| 5 | Design system (Tailwind fuera de configs TS) | ✅ Resuelto 2026-06-15 (`mejoras2.md` Fase B) |
| 6 | Barrels + ESLint anti feature→feature + `noUncheckedIndexedAccess` | ✅ |
| 7 | Reporte specs duplicadas Docs/ | ✅ — [`phase7.md`](../Docs/implementation/phase7.md) + SPEC-016A/017A/018A ✅ Implemented |

## Refactor backlog (mejoras-spa.md)

| ID | Description | Priority | Rationale | Impact | Status |
|----|-------------|----------|-----------|--------|--------|
| TD-001 | Duplicación casi total en `academic-catalog` | High | DRY violation | Bugs por divergencia | ✅ Resuelto 2026-06-15 (Fase 2) |
| TD-002 | Patrón mock disperso (`if (useMock)` en servicios) | High | Dificulta alternar mock/API | Switch repetido por endpoint | ✅ Resuelto 2026-06-15 (Fase 1) |
| TD-003 | `AcademicCatalogMockStore` mezcla students + professors | Medium | SRP | Mock difícil de extender | ✅ Resuelto 2026-06-15 (Fase 2) |
| TD-004 | Endpoints fragmentados sin barrels | Medium | URLs dispersas | URLs inconsistentes | ✅ Resuelto 2026-06-15 (Fases 1/6) |
| TD-005 | Paginación/filtros reimplementados en cada list | Medium | Lógica copiada | UI inconsistente | ✅ Resuelto 2026-06-15 — `CatalogListBase` + `p-paginator` (Fase C `mejoras2.md`) |
| TD-006 | Errores de validación inconsistentes | Medium | `FieldErrorComponent` no uniforme | UX variable | ✅ Resuelto 2026-06-15 (Fase 3) |
| TD-007 | i18n frágil (sin tipado ni paridad es/en) | Medium | Labels hardcodeados | Claves huérfanas | ✅ Resuelto 2026-06-15 (Fase 4) |
| TD-008 | Presentación (Tailwind) en configs TS (`dashboard-home.config`) | Low | Datos + clases CSS mezclados | Config poco reutilizable | ✅ Resuelto 2026-06-15 (Fase B `mejoras2.md`) — `tone` en `StatCardComponent` |
| TD-009 | `login` con `setInterval` imperativo en componente | Low | Lógica no testeable | Cooldown no reutilizable | ✅ Resuelto 2026-06-15 (Fase 3) |
| TD-010 | Specs duplicadas SPEC-016A/017A/018A (Docs/) | Medium | Dos archivos/spec, md5 distintos | Confusión de contrato | ✅ Resuelto 2026-06-15 — [D-018](../Docs/implementation/decisions/D-018-iteration4-spa-spec-canonical.md); duplicados retirados |

### TD-010 — cerrado

Canónicos: `SPEC-*A_spa-*` en [`SPEC_INDEX.md`](../Docs/sdd/SPEC_INDEX.md). Estado SPA: [`phase7.md`](../Docs/implementation/phase7.md) (HU-15 / HU-21 / HU-28). Decisión: [D-018](../Docs/implementation/decisions/D-018-iteration4-spa-spec-canonical.md).

## Priority Levels

- **Critical** — Must resolve before next release
- **High** — Should resolve within current iteration
- **Medium** — Plan for next iteration
- **Low** — Resolve when convenient
