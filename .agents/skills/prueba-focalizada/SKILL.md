---
name: prueba-focalizada
description: Ejecutar y escribir la prueba unitaria mínima con Vitest/Angular.
---

# Prueba focalizada

## When

Tras cambiar un componente, repo, util o pipe.

## Goal

Verificar solo el spec afectado; no la suite CI completa en cada turno.

## Steps

1. Localiza o crea `*.spec.ts` junto al archivo.
2. Copia el estilo del spec hermano (TestBed, spies de Router, repos mockeados). Catálogo: `professor-list.component.spec.ts`.
3. Ejecuta:

```bash
pnpm exec ng test --no-watch --include=<ruta-del-spec>
```

4. Antes de cerrar tarea transversal: `pnpm run lint`. Suite CI (`pnpm run test --no-watch --coverage`, build prod) solo al final o si el usuario lo pide.
5. E2E Playwright (`pnpm run e2e`) solo si el cambio es flujo punta a punta.

## Areas

Spec del símbolo; `src/app/testing/`; fixtures locales (p. ej. `trimestral-planning/testing/`).

## Verification

El comando `--include` en verde. Lint si tocaste i18n/format.

## Common mistakes

- Correr toda la suite en cada edit.
- Reescribir helpers de mock que ya existen en el feature.
- Afirmar textos hardcodeados en vez de claves i18n / testids.
