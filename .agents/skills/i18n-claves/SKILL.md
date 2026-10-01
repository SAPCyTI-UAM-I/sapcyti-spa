---
name: i18n-claves
description: Añadir o renombrar claves de traducción es/en y sincronizar tipos/paridad.
---

# i18n claves

## When

Cualquier texto visible nuevo o renombrado.

## Goal

Misma clave en `es.json` y `en.json`; paridad verificada.

## Steps

1. Elige namespace existente del feature (`ACADEMIC_CATALOG.…`, `SHELL.…`, etc.).
2. Añade la clave en `src/assets/i18n/es.json` **y** `en.json`.
3. En plantilla: `{{ 'CLAVE' | translate }}`. En TS: `TranslateService` / pipes del repo.
4. Ejecuta `pnpm run i18n:sync` (ordena y regenera tipos si aplica).
5. No dejes literales en HTML/TS.

## Areas

`src/assets/i18n/`, componente/spec afectados. Convención de nombres: `.cursor/conventions.md` §10 solo si dudas del naming.

## Verification

```bash
pnpm run i18n:sync
pnpm run lint
```

(`lint` incluye `i18n:check`.)

## Common mistakes

- Solo editar `es.json`.
- Textos hardcodeados “temporales”.
- Inventar un segundo archivo de locale.
