# SAPCyTI SPA — Convenciones de código

> Guía de **control de calidad** y onboarding para desarrolladores y agentes. Define **cómo se trabaja en este repositorio**, **dónde va cada cosa** y **qué patrones son obligatorios**.
>
> Las decisiones de negocio y alcance de cada entrega viven en las specs (`Docs/sdd/specs/`), no en este documento.
>
> Referencia ampliada (agentes Cursor): [`.cursor/conventions.md`](.cursor/conventions.md)

---

## 1. Principios que guían el código

| Principio | Cómo se aplica aquí |
|-----------|---------------------|
| **SOLID — SRP** | Componentes = UI; servicios = fachada; repositorios = datos; utils = reglas puras. |
| **SOLID — OCP** | Mock/HTTP se intercambian por DI sin tocar componentes (`provideMockOrHttpRepository`). |
| **SOLID — DIP** | Componentes y servicios dependen de tokens (`ENTITY_REPOSITORY`), no de `HttpClient`. |
| **DRY con criterio** | Bases reutilizables, utils de error/validación, `api-endpoints.ts` único. No abstraer prematuramente. |
| **Clean code** | Nombres explícitos, funciones cortas, sin `any`, sin lógica de negocio en templates. |
| **Bajo acoplamiento** | Features no importan otras features (ESLint `sapcyti/no-cross-feature-imports`). |
| **Alta cohesión** | Todo lo de un dominio vive en `features/{dominio}/`. |
| **Spec-driven** | El contrato API/DTO viene de la spec aprobada; el SPA lo refleja en `models/`. |

### 1.1 Cómo nos movemos (prácticas concretas)

Reglas operativas que cualquier agente debe seguir en este SPA. Resumen: **reutiliza antes de crear, extrae solo cuando duele, no rompas comportamiento.**

**DRY — extraer con criterio (no por reflejo)**

- **Antes de escribir, busca**: ¿ya existe un componente en `shared/components/`, un util en `shared/utils/` o `features/{f}/utils/`, o un feature similar que resuelva esto? Reutilízalo.
- **Cuándo extraer** un patrón a algo compartido: cuando se **repite en ≥3 lugares** *y* es **estable**. Patrón de plantilla repetido → componente/directiva en `shared/`. Lógica o transformación repetida → función pura en `utils/`.
- **Una sola fuente de verdad**: URLs en `api-endpoints.ts`, colores en `design-tokens.ts` (+ `@theme`), tipos en `models/`, claves i18n en `es/en.json`. Nunca dupliques estos valores; impórtalos.
- **Cuándo NO extraer**: 2 usos triviales no justifican una abstracción. Si el componente compartido necesita 4–5 inputs para cubrir variantes, o un flag de modo para no cambiar comportamiento, probablemente es sobre-ingeniería: déjalo inline. La duplicación barata es más barata que la abstracción equivocada.

**Clean code — legible para el siguiente humano**

- El componente es **UI**: sin lógica de negocio en el template ni en el `.ts`. Las reglas (armado de payloads, validaciones, mapeos) viven en **funciones puras** de `utils/`.
- Nombres explícitos, funciones cortas, **sin `any`**. El código dice *qué* hace; los comentarios solo explican el *por qué* no obvio.
- **Borra lo muerto**: código sin usos, `@deprecated` sin consumidores, shims de re-export. No lo dejes "por si acaso".
- **Sistema de diseño, no valores crudos**: tokens semánticos (`gap-md`, `text-h2`, `bg-surface`), nunca `#fff`, `p-[12px]`, `text-sm` sueltos. Texto visible siempre i18n.

**SOLID — aplicado, no decorativo**

- **SRP**: si un componente acumula responsabilidades (formulario + cascadas + carga de datos + armado de varios payloads), extrae lo que no sea UI a utils/servicios.
- **OCP/DIP**: depende de **tokens** (`ENTITY_REPOSITORY`), no de implementaciones; mock/HTTP se intercambian por DI. Prohibido `if (useMock)` en componentes/servicios.
- Componentes **standalone, OnPush, signals, `inject()`**; suscripciones con `takeUntilDestroyed`.

**Mantenibilidad por humanos**

- **Cambios pequeños y verificables**. Antes de dar algo por terminado: `pnpm run lint && pnpm test && pnpm run build` en verde.
- **Lógica no trivial deja un test** (función pura testeable). Si no sabes cómo testearlo, probablemente está en el lugar equivocado (sácalo del componente).
- **Refactor = mismo comportamiento.** Una mejora que cambie comportamiento (UX, semántica, contrato) deja de ser refactor: confírmalo antes de hacerlo, no lo cueles.
- **No toques lo ajeno sin razón**: no reformatees ni "mejores" archivos fuera del alcance de tu cambio; mantén el diff acotado y revisable.
- **Respeta el contrato**: el DTO/los modelos vienen de la spec; no los modifiques desde el SPA para acomodar la UI.

---

## 2. Estructura del proyecto

```
sapcyti-spa/
├── conventions.md          ← este documento (raíz)
├── .cursor/conventions.md  ← guía extendida para agentes
├── design/                 ← notas de diseño complementarias
├── e2e/                    ← Playwright por fase o dominio
└── src/
    ├── app/
    │   ├── core/           # Infra transversal: auth, http, mocks, api, theme
    │   ├── shared/         # UI reutilizable sin lógica de negocio
    │   ├── features/       # Módulos lazy-loaded por dominio
    │   ├── models/         # Tipos TypeScript (espejo de DTOs backend)
    │   ├── shell/          # Layout autenticado (sidebar, menú por rol)
    │   ├── app.routes.ts
    │   └── app.config.ts   # Providers globales + interceptores
    ├── assets/i18n/        # es.json, en.json
    └── environments/       # apiBaseUrl, flags mocks
```

### Regla de dependencias

```
features/*  →  core/*, shared/*, models/*
features/*  ✗  features/*     (prohibido)
core/*      →  models/*
              excepción: core/api/data-layer.providers.ts registra repos de features
```

---

## 3. Dónde está cada cosa

| Necesito… | Ubicación |
|-----------|-----------|
| Pantalla / página | `features/{f}/components/{nombre}/` |
| Rutas del feature | `features/{f}/{f}.routes.ts` |
| Tipos / DTOs compartidos | `models/{entidad}.model.ts` + barrel `models/index.ts` |
| URLs de API | `core/api/api-endpoints.ts` (**única fuente**) |
| Interfaz + token de datos | `features/{f}/repositories/{entidad}.repository.ts` |
| Implementación HTTP | `features/{f}/repositories/{entidad}-http.repository.ts` |
| Implementación mock | `features/{f}/repositories/{entidad}-mock.repository.ts` |
| Store mock (estado en memoria) | `features/{f}/mocks/{entidad}-mock.store.ts` |
| Servicio fachada | `features/{f}/services/{entidad}.service.ts` |
| Validadores / mapeo errores | `features/{f}/utils/*.util.ts` + `*.spec.ts` |
| Componente UI genérico | `shared/components/` |
| Errores de campo | `shared/components/field-error/` + `shared/utils/field-error.util.ts` |
| Auth / guards / RBAC | `core/auth/` · `rbac.policy.ts` |
| Interceptores HTTP | `core/http/` (`jwt`, `tenant`, `http-error`) |
| Registro mock/HTTP | `core/api/data-layer.providers.ts` |
| Flags de mock | `core/mocks/mock.config.ts` + `environment*.ts` |
| i18n | `assets/i18n/{es,en}.json` → `pnpm run i18n:sync` |
| Tokens de diseño | `core/theme/design-tokens.ts` + `@theme` en `styles.css` |
| Menú por rol | `shell/shell-menu.config.ts` |

---

## 4. Capa de datos (patrón Repository)

Flujo obligatorio — **el componente nunca sabe si los datos son mock o HTTP**:

```
Component → Service → REPOSITORY_TOKEN → HttpRepository | MockRepository
```

### Pasos para añadir un dominio con datos remotos

1. **Modelo** — `models/{entidad}.model.ts` alineado con la spec / schema del backend.
2. **Token** — interfaz + `InjectionToken` en `repositories/{entidad}.repository.ts`.
3. **HTTP** — `{entidad}-http.repository.ts`: `HttpClient`, `withCredentials: true`, URLs desde `API_ENDPOINTS`.
4. **Mock** — `{entidad}-mock.repository.ts` delega en un mock store.
5. **Store** — `mocks/{entidad}-mock.store.ts`: seeds, validaciones, errores `HttpErrorResponse` como la API.
6. **Servicio** — `{entidad}.service.ts`: solo delega al token (métodos cortos, sin ramas mock).
7. **DI** — registrar en `data-layer.providers.ts` con `provideMockOrHttpRepository`.
8. **Flag** — añadir clave en `AppMockConfig` y `environment*.ts` (`true` en dev, `false` en prod).

### Ejemplo (servicio fachada)

```typescript
@Injectable({ providedIn: 'root' })
export class EntityService {
  private readonly repository = inject(ENTITY_REPOSITORY);

  getById(id: number) {
    return this.repository.getById(id);
  }
}
```

### Registro DI

```typescript
...provideMockOrHttpRepository(
  'entityFeature',      // clave en AppMockConfig
  ENTITY_REPOSITORY,
  EntityHttpRepository,
  EntityMockRepository,
),
```

**Prohibido:** `if (useMock)` en componentes o servicios. La factory en `provide-mock-or-http.ts` decide en tiempo de inyección.

---

## 5. Sistema de mocks

### Configuración

| Archivo | Rol |
|---------|-----|
| `core/mocks/mock.config.ts` | Tipo `AppMockConfig`, defaults, `injectMockEnabled()` |
| `environments/environment.ts` | Flags por dominio en desarrollo |
| `environments/environment.prod.ts` | **Siempre `false`** en producción |
| `app.config.ts` | `provideAppMockConfig(environment.mocks)` |

Cada dominio con datos remotos tiene su propia clave en `AppMockConfig`. Los flags son **independientes** (p. ej. catálogo en mock y auth contra API real).

> **Nota:** `design/MOCK_GUIDE.md` describe un patrón antiguo con ramas en servicios. El patrón vigente es **Repository + DI** (secciones 4 y 5).

### Anatomía de un mock de calidad

1. **Store** (`@Injectable({ providedIn: 'root' })`) — estado en memoria; seeds coherentes con el contrato API.
2. **Validaciones** — replicar las reglas del backend en el store cuando el mock debe comportarse como la API.
3. **Errores** — `HttpErrorResponse` con `{ error, message }` igual que `GlobalExceptionHandler`.
4. **Consistencia entre stores** — si una operación en un dominio crea datos en otro, los stores se coordinan por inyección (mismo feature).
5. **Helpers compartidos** — utilidades en `features/{f}/mocks/` (p. ej. paginación, conflictos, IDs).

### Errores API en SPA

- Util central: `core/errors/utils/parse-api-error.util.ts` (`getApiErrorCode`, `getApiErrorMessage`, `getHttpStatus`).
- Mapeo por dominio: `{entidad}-error.util.ts` en `utils/` del feature.
- Cuando varios 404 comparten el mismo código (`NOT_FOUND`), discriminar por **`message`** o contexto HTTP.

---

## 6. Angular — patrones de componentes

| Regla | Detalle |
|-------|---------|
| Standalone | `imports: [...]` en cada componente |
| OnPush | Siempre `changeDetection: ChangeDetectionStrategy.OnPush` |
| Signals | Estado local: `signal`, `computed`; loading/error/submitting |
| Suscripciones | `takeUntilDestroyed(destroyRef)` + `finalize` |
| Inyección | `inject()`, no constructor |
| Páginas enrutadas | `host: ROUTED_PAGE_HOST` (`shared/layout/routed-page-host.ts`) |
| Formularios | `NonNullableFormBuilder`, reactive, validadores en `utils/` o `Validators` |
| Errores de campo | `app-field-error` + `isFieldInvalid()` |

### Patrones de pantalla reutilizables

| Patrón | Ubicación típica | Usar para | No usar para |
|--------|------------------|-----------|--------------|
| `CatalogListBase` | `academic-catalog` | Listados paginados con filtros | Formularios de edición |
| `CatalogRegistrationBase` | `academic-catalog` | Wizard de **alta** (pasos + password temporal) | Edición de entidades |
| Formulario edit/save standalone | `account/password-change` | Pantallas de **edición** o acción puntual | Listados o wizards de alta |
| Vista + edición en rutas separadas | Varios features | Lectura en una ruta, edición en `/edit` | Mezclar modos en un solo componente sin necesidad |

Extender bases abstractas con `@Directive()` cuando usen `inject()` (requisito del compilador Angular).

---

## 7. Diseño y UI

### Stack

- **PrimeNG** (modo unstyled) + preset `SapcytiPreset`
- **Tailwind** con tokens semánticos — sin colores crudos (`#fff`, `bg-blue-500`)

### Layout habitual

```html
<section class="gap-lg flex flex-col">
  <div class="border-outline bg-surface p-lg rounded-xl border">
    <!-- contenido -->
  </div>
</section>
```

### Componentes PrimeNG por caso de uso

| Caso | Componente |
|------|------------|
| Botones / acciones | `p-button` |
| Select con opciones i18n | `app-i18n-select` (envuelve `p-select`; opciones `{ labelKey, value }` + `controlName`) |
| Select con label de datos / filtro | `p-select` (`optionLabel`, `[filter]`) — cuando el label NO es clave i18n |
| Selección múltiple | `p-multiselect` |
| Fechas | `<input type="date">` + ISO `YYYY-MM-DD` en el modelo |
| Etiquetas de estado | `p-tag` + util de severidad en `utils/` del feature |
| Error de formulario | `p-message severity="error"` |
| Éxito transitorio | `MessageService` + `<p-toast />` en root |
| Diálogos modales | `p-dialog` |
| Tablas de listado | `<table>` responsive (patrón actual del catálogo) |
| Estado carga/error/vacío | `app-load-state` (proyecta el contenido cargado vía `<ng-content>`) |

### Tipografía y color (tokens)

- Títulos: `text-h1`, `text-h2`, `text-h3`
- Texto: `text-body-md`, `text-caption`, `text-text-secondary`
- Superficies: `bg-surface`, `bg-surface-subtle`, `border-outline`
- Espaciado: `gap-md`, `p-lg`, `rounded-xl`

Cambios de color: editar `core/theme/design-tokens.ts` **y** el bloque `@theme` en `styles.css`.

---

## 8. Seguridad

| Capa | Implementación |
|------|----------------|
| Rutas | `authGuard` + `data: { roles: ROUTE_PERMISSIONS.xxx }` |
| Permisos | Definidos en `core/auth/rbac.policy.ts`; menú en `shell-menu.config.ts` |
| JWT | Memoria (no localStorage) · `jwtInterceptor` |
| Tenant | `X-Graduate-Id` vía `tenantInterceptor` |
| 401 | Refresh silencioso · `httpErrorInterceptor` |
| 403 | Redirect `/access-denied` |
| Credenciales | `withCredentials: true` en llamadas API sensibles |

El guard protege la navegación (UX); el backend (`@PreAuthorize`) es autoritativo.

---

## 9. Rutas y navegación

```
/  → Shell (autenticado)
  /{feature}/...     → lazy-loaded desde features/{feature}/{feature}.routes.ts
  /auth/*            → fuera del shell (guestAuthGuard)
```

Convenciones:

- Exportar `{FEATURE}_ROUTES` desde cada `*.routes.ts`.
- Cargar componentes con `loadComponent` / `loadChildren`.
- Rutas agrupadas **sin componente padre** cuando solo aportan breadcrumb o prefijo (patrón componentless).
- Breadcrumb: `data: { breadcrumb: 'I18N_KEY' }` — claves estáticas; ver `shell/breadcrumb.ts`.
- `returnUrl` sanitizado: `core/auth/utils/sanitize-return-url.util.ts`.

---

## 10. Internacionalización

1. Claves en **es.json y en.json** (misma estructura).
2. Formato: `DOMINIO.SECCION.CLAVE` (ej. `ACADEMIC_CATALOG.STUDENTS.LIST.TITLE`).
3. Reutilizar `COMMON.*` antes de duplicar.
4. Selects con opciones i18n: definir `labelKey: I18nKey` y usar `app-i18n-select` (no repetir las plantillas `| translate`).
5. Tras editar JSON: `pnpm run i18n:sync` (regenera `i18n-keys.generated.ts`).
6. `pnpm run lint` incluye paridad i18n (`i18n:check`).

**Prohibido:** texto visible hardcodeado en `.html` o `.ts` (salvo datos de usuario/API).

---

## 11. Manejo de errores (capas)

| Capa | Qué usar |
|------|----------|
| Campo inválido | `FieldErrorComponent` + `COMMON.VALIDATION.*` |
| Error de negocio / API | `signal<ErrorType \| null>` + `p-message` + clave i18n del feature |
| Mapeo API → clave | `mapXxxError()` en `utils/` (función pura, testeable) |
| HTTP global | Interceptores; el componente maneja el resto en `subscribe({ error })` |

No duplicar parseo de `HttpErrorResponse`; usar `parse-api-error.util.ts`.

---

## 12. Testing

| Tipo | Dónde | Patrón |
|------|-------|--------|
| Servicio HTTP | `{service}.spec.ts` | `provideHttpClientTesting`, `provideAppMockConfig({ feature: false })`, `DATA_LAYER_PROVIDERS` |
| Servicio mock | idem | `provideAppMockConfig({ feature: true })` |
| Util | `{util}.spec.ts` | Función pura, sin TestBed |
| Componente | `{component}.spec.ts` | Mock del **servicio** (no `DATA_LAYER_PROVIDERS`), `TranslateModule`, `provideRouter` |
| E2E | `e2e/*.spec.ts` | Login según rol, `data-testid`, aserciones bilingües (`/Guardar\|Save/`) |

Comandos de calidad (obligatorios antes de merge):

```bash
pnpm run lint    # ESLint + Prettier + i18n:check
pnpm test        # Vitest (unit)
pnpm run build   # Producción
```

---

## 13. Cómo trabajan los agentes en este repo

1. **Leer este documento** y, si hace falta detalle, [`.cursor/conventions.md`](.cursor/conventions.md).
2. **Cargar solo la spec aprobada** del trabajo (`Docs/sdd/specs/`) — ahí están alcance, contratos y criterios de aceptación.
3. **Buscar un feature similar** en `features/` antes de inventar patrones nuevos.
4. **Implementar** siguiendo las secciones 4–12; no tomar decisiones de negocio no escritas en la spec.
5. **Validar** con lint, test y build antes de dar por terminado.

La spec define el *qué*; este documento define el *cómo*.

---

## 14. Checklist — entrega de un feature

- [ ] Spec aprobada (🔵) en `Docs/sdd/specs/`
- [ ] Modelo en `models/` + export en `index.ts`
- [ ] Endpoints en `api-endpoints.ts`
- [ ] Repository (interface + HTTP + mock + store si aplica)
- [ ] Servicio fachada
- [ ] Flag en `mock.config` + `environment*` (si hay datos remotos)
- [ ] Registro en `data-layer.providers.ts`
- [ ] Componentes standalone OnPush + signals
- [ ] Rutas con `authGuard` + roles según spec
- [ ] i18n es/en + `i18n:sync`
- [ ] Utils de error/validación con tests
- [ ] `data-testid` en flujos críticos (E2E)
- [ ] `pnpm run lint && pnpm test && pnpm run build`

---

## 15. Documentos relacionados

| Documento | Contenido |
|-----------|-----------|
| [`.cursor/conventions.md`](.cursor/conventions.md) | Guía extendida (formularios, auth, ESLint, ejemplos HTML) |
| [`Docs/technologies/frontend.md`](../Docs/technologies/frontend.md) | Stack oficial |
| [`Docs/sdd/specs/`](../Docs/sdd/specs/) | Contratos y alcance por entrega |
| [`Docs/AGENTS.md`](../Docs/AGENTS.md) | Protocolo de carga de contexto (repo Docs) |

---

*Documento de convenciones del proyecto — no sustituye las specs ni registra decisiones por historia de usuario.*
