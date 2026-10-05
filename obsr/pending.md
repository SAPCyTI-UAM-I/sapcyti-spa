# Pendientes — observaciones SPA

## Manejo de errores: migración parcial

El SPA adoptó de forma **incremental** el patrón dominio → i18n:

```
HttpErrorResponse → mapXxxError() → clave → domainError / domainErrorI18nKey → translate
```

**Implementado hoy** (`src/app/core/errors/` + mappers por feature):

| Área | Mapper | UI |
|------|--------|-----|
| Catálogo (registro alumno/profesor) | `mapCatalogError` | pipe `domainError` |
| Programa académico (vista/edición) | `mapStudentProgramError` | pipe `domainError` |
| Cambio de contraseña | `mapPasswordChangeError` | pipe `domainError` |
| Lista de alumnos (toast programa) | `mapStudentProgramListError` | `domainErrorI18nKey` en TS |

**Sin migrar (intencional por ahora):**

- **Login / forgot-password** — errores opacos por seguridad; sin `message` de negocio que mapear.
- **Reset-password** — usa `mapResetPasswordError` en TS, pero el template mantiene ramas UX (severidad, enlaces) y claves i18n fuera del contrato `ERRORS.*`.
- **Listas (carga de tabla)** — mensaje estático `ACADEMIC_CATALOG.STATES.LOAD_ERROR`.

No es deuda bloqueante: el pipe aplica donde hay respuesta API → clave de dominio → texto traducido.

---

## Especificación pendiente (SPA + API)

Falta una **SPEC conjunta** en Docs que fije el contrato end-to-end de errores, alineada con SPEC-007 y el `GlobalExceptionHandler` del API.

Temas mínimos a cerrar:

1. Forma canónica del cuerpo (`error`, `message`, casos sin `message` — p. ej. 404 Spring).
2. Catálogo estable de códigos y mensajes en inglés (`BACKEND_MESSAGES` en SPA debe reflejarlo).
3. Reglas de discriminación cuando el código es genérico (`CONFLICT`, `NOT_FOUND`, `VALIDATION_ERROR`).
4. Qué expone el front (explícito en dominio) vs qué permanece opaco (401/403, credenciales).
5. Endpoints aún no implementados en API pero consumidos por el SPA (p. ej. programas del alumno).

Hasta esa spec, el SPA asume el contrato actual del API Java y tolera respuestas incompletas de forma defensiva.
