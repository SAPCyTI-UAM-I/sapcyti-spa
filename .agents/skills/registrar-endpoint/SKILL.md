---
name: registrar-endpoint
description: Registrar URL HTTP canónica y cablear repositorio mock/HTTP.
---

# Registrar endpoint

## When

Nueva llamada HTTP o cambio de path/verb del API.

## Goal

Una URL en `API_ENDPOINTS`; componente sin URLs; mock/HTTP por DI.

## Steps

1. Añade la clave en `src/app/core/api/api-endpoints.ts` usando `environment.apiBaseUrl`.
2. Usa la clave en `features/{f}/repositories/*-http.repository.ts`.
3. Si el dominio es nuevo: interfaz + token + Http + Mock en el feature; flag en `environment.mocks`; entrada en `core/api/data-layer.providers.ts` con `provideMockOrHttpRepository`.
4. Tipos de request/response en `src/app/models/` si se comparten.
5. No crees `*.endpoints.ts` por feature (legacy: reexportar o evitar).

## Areas

`core/api/`, `core/mocks/`, `features/{f}/repositories/`, `features/{f}/mocks/`, `environments/`, `models/`. Guía mocks: `design/MOCK_GUIDE.md` solo al añadir dominio mock nuevo.

## Verification

```bash
pnpm exec ng test --no-watch --include=<ruta-spec-repo-o-componente>
```

Prueba con el flag mock true/false según el caso.

## Common mistakes

- URL literal en el componente.
- `if (environment.mocks…)` en UI.
- Registrar el provider solo en el feature y olvidar `DATA_LAYER_PROVIDERS`.
