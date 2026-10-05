---
name: explorar-codigo
description: Explorar el SPA con el mínimo de archivos antes de editar.
---

# Explorar código

## When

No sabes dónde está el símbolo o el ownership es dudoso.

## Goal

Llegar a pocos archivos editables sin cargar manuals enteros.

## Steps

1. **Map** — `docs/architecture/index.md` (tabla “Si cambio X”) + `repository-map.md` si hace falta.
2. **Search** — busca el símbolo/ruta/clave i18n con ripgrep; excluye `node_modules`, `dist`, `coverage`.
3. **Symbol** — abre definición (componente, repo, model).
4. **References** — quién importa el símbolo (ruta, template, spec).
5. **Contract** — si hay HTTP: `API_ENDPOINTS` + model en `models/`; no inventes DTO.
6. **Implementation** — componente/repo/util real.
7. **Tests** — `*.spec.ts` hermano; fixtures del feature si existen.

## Areas

Índice → feature local AGENTS si existe → `core/` o `features/{f}/`.

## Verification

Puedes nombrar: archivo a editar, spec a correr, qué **no** cargarás.

## Common mistakes

- Empezar por conventions completo o por todos los features.
- Tratar placeholders (`enrollment`) como dominio implementado.
- Buscar UEAs fuera de `academic-catalog`.
