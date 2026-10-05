---
name: nueva-pantalla
description: Crear o extender una pantalla Angular en un feature existente del SPA.
---

# Nueva pantalla

## When

Añadir o clonar una pantalla en un feature que ya existe.

## Goal

Pantalla standalone OnPush con i18n, ruta lazy y spec, sin imports cross-feature.

## Steps

1. Lee `AGENTS.md` (L0). Si UI: `.cursor/conventions.md` **solo §0**.
2. Si tocas `core/` o `academic-catalog/`, lee `docs/agent-context/core.md` o `docs/agent-context/academic-catalog.md`.
3. Copia el componente **más cercano del mismo feature** (ts/html/spec). Catálogo: preferir `professor-list/`.
4. Registra la ruta en `features/{f}/*.routes.ts` (y RBAC en `core/auth/rbac.policy.ts` si hay rol nuevo).
5. Textos: claves en `es.json` y `en.json` → `pnpm run i18n:sync`.
6. Datos remotos: repo + token; cablea en `core/api/data-layer.providers.ts`; URLs en `API_ENDPOINTS`.
7. Sin `if (useMock)` en el componente. PrimeNG primero.

## Areas

`features/{f}/components/`, `*.routes.ts`, `models/`, `shared/` solo si falta UI genérica, `core/` para endpoints/RBAC/DI.

## Verification

```bash
pnpm exec ng test --no-watch --include=<ruta-del-spec>
pnpm run lint
```

Ejercita el flujo en el navegador si el cambio es visible.

## Common mistakes

- Leer conventions completo.
- Poner UEAs fuera de `academic-catalog`.
- Hardcodear strings o URLs.
- Importar otro feature.
- Suite completa de tests en cada iteración.
