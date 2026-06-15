# SAPCyTI SPA — Convenciones y guía de implementación

> Documento vivo para desarrolladores y agentes. Resume **cómo está construido el código hoy** y **dónde buscar** antes de duplicar lógica.
> Complementa las specs en `Docs/sdd/specs/` y el backlog de refactor en [`mejoras-spa.md`](./mejoras-spa.md).

---

## 1. Principios generales

| Principio | Aplicación en este repo |
|-----------|-------------------------|
| **Comportamiento primero** | El código actual es la fuente de verdad; las specs guían, no contradicen sin reportar. |
| **Mocks-first, API-ready** | Desarrollo local con `environment.mocks`; alternar a API real es solo cambiar flags, no componentes. |
| **Bajo acoplamiento** | Features no importan otras features. Solo `{core, shared, models}`. |
| **Alta cohesión** | Lógica de dominio en servicios/repositorios/utils; UI en componentes; presentación reutilizable en `shared/`. |
| **DRY con criterio** | Extraer solo cuando hay duplicación real (bases de listado, validación, mocks). Evitar abstracciones prematuras. |
| **Sin strings visibles** | Textos de UI vía i18n (`assets/i18n/{es,en}.json`). |
| **TypeScript estricto** | `strict: true`, plantillas estrictas, sin `any`. |

---

## 2. Estructura de carpetas

```
src/app/
├── core/           # Infraestructura transversal (auth, http, mocks, theme, api)
├── shared/         # Componentes y utilidades reutilizables sin lógica de negocio
├── features/       # Módulos de negocio lazy-loaded (auth, academic-catalog, account…)
├── models/         # Tipos e interfaces de dominio compartidos
├── shell/          # Layout autenticado (sidebar, topbar, menú por rol)
├── testing/        # Utilidades solo para tests (p. ej. auth-test.util.ts)
├── app.routes.ts   # Rutas raíz
└── app.config.ts   # Providers globales
```

### Regla de dependencias

```
features/*  →  core/*, shared/*, models/*
features/*  ✗  features/*   (prohibido — regla ESLint sapcyti/no-cross-feature-imports)
shell/*     →  core/*, shared/*, models/*
shared/*    →  core/* (mínimo), models/* (evitar si posible)
core/*      →  models/*; excepción: `core/api/data-layer.providers.ts` registra repositorios de features
```

### Dónde poner código nuevo

| Necesidad | Ubicación |
|-----------|-----------|
| Nuevo feature | `features/{nombre}/` con `{nombre}.routes.ts`, componentes, servicios |
| Tipo compartido entre features | `models/{entidad}.model.ts` |
| Componente UI genérico | `shared/components/{nombre}/` |
| Utilidad transversal | `core/{área}/utils/` o `shared/utils/` |
| Endpoint HTTP | `core/api/api-endpoints.ts` (canónico) |
| Mock de API | `features/{feature}/mocks/` o `core/auth/mock/` |
| Política de roles | `core/auth/rbac.policy.ts` |
| Deuda técnica conocida | [`TECH_DEBT.md`](./TECH_DEBT.md) |

> Barrels, ESLint anti feature→feature, TS estricto y guardas de APIs del navegador: **sección 17**.

---

## 3. Angular — patrones obligatorios

### Componentes

- **Standalone** siempre (`imports: [...]` en el decorador).
- **`ChangeDetectionStrategy.OnPush`** en todos los componentes.
- **Signals** para estado local: `signal`, `computed`; evitar mutar estado imperativo.
- **Sin suscripciones sueltas**: usar `takeUntilDestroyed(destroyRef)` o `async` pipe.
- **Formularios**: `NonNullableFormBuilder`, reactive forms tipados, `Validators` de Angular.

### Inyección

- `inject()` en lugar de constructor injection (estilo actual del repo).
- Servicios de feature: `providedIn: 'root'` como fachada; repositorios vía `DATA_LAYER_PROVIDERS`.

### Host de páginas enrutadas

Las pantallas dentro del shell usan el host compartido para evitar overflow en flex:

```typescript
import { ROUTED_PAGE_HOST } from '../../shared/layout/routed-page-host';

@Component({
  host: ROUTED_PAGE_HOST, // display:block; width:100%; min-width:0;
})
```

Archivo: `shared/layout/routed-page-host.ts`.

---

## 4. Capa de datos — Repository + mocks

### Patrón Repository (post-refactor Fase 1)

Cada feature con datos remotos sigue este contrato:

1. **Interfaz + token** — p. ej. `StudentRepository` + `STUDENT_REPOSITORY`.
2. **Implementación HTTP** — `{Entity}HttpRepository` (llamadas `HttpClient`, `withCredentials: true`).
3. **Implementación mock** — `{Entity}MockRepository` (delega en mock store o funciones puras).
4. **Selección por DI** — factory en `provideMockOrHttpRepository()` leyendo `injectMockEnabled(feature)`.
5. **Servicio fachada** — p. ej. `StudentService` inyecta el token y delega; **sin `if (useMock)`**.

```
Component → StudentService → STUDENT_REPOSITORY → Http | Mock
```

**Registro global:** `core/api/data-layer.providers.ts` + spread en `app.config.ts`.

**Helper de factory:** `core/mocks/provide-mock-or-http.ts`.

### Endpoints centralizados

Todas las URLs de API viven en:

```
core/api/api-endpoints.ts   ← canónico
```

Los archivos `*.endpoints.ts` por feature son **re-exports deprecados** por compatibilidad. Al añadir rutas nuevas, solo tocar `api-endpoints.ts`.

### Configuración de mocks

| Archivo | Rol |
|---------|-----|
| `environments/environment.ts` | Flags `mocks.{auth, passwordRecovery, students, professors, passwordChange}` |
| `core/mocks/mock.config.ts` | `APP_MOCK_CONFIG`, `provideAppMockConfig()`, `injectMockEnabled()` |
| `app.config.ts` | `provideAppMockConfig(environment.mocks)` + `DATA_LAYER_PROVIDERS` |

**Contrato de mocks de catálogo académico:**

- Errores 409: `EMAIL_ALREADY_EXISTS`, `ENROLLMENT_ALREADY_EXISTS`, `EMPLOYEE_NUMBER_ALREADY_EXISTS`
- Error 404: `GRADUATE_PROGRAM_NOT_FOUND`
- Password generado (solo mock): `Tmp{userId}#Sap26`
- Stores separados: `StudentMockStore`, `ProfessorMockStore` + helpers en `catalog-mock.util.ts`

**Auth mock:** usuarios en `core/auth/mock/auth.mock.ts` (`AUTH_MOCK_USERS`); token reset válido: `MOCK_VALID_RESET_TOKEN`.

### Añadir un nuevo feature con datos

1. Definir interfaz + token en `features/{f}/repositories/`.
2. Crear `*-http.repository.ts` y `*-mock.repository.ts`.
3. Añadir entrada en `DATA_LAYER_PROVIDERS` con flag en `AppMockConfig` y `environment.mocks`.
4. Crear servicio fachada que inyecte el token.
5. Mock store en `features/{f}/mocks/` si la lógica mock es no trivial.

---

## 5. HTTP e interceptores

Orden en `app.config.ts`: `jwtInterceptor` → `tenantInterceptor` → `httpErrorInterceptor`.

| Interceptor | Responsabilidad |
|-------------|-----------------|
| `jwtInterceptor` | Añade `Authorization: Bearer` excepto en rutas de sesión (`auth.endpoints.ts`) |
| `tenantInterceptor` | Header `X-Graduate-Id` desde `TenantService` |
| `httpErrorInterceptor` | 401 → silent refresh + retry; 403 → `/access-denied` |

**Siempre** `withCredentials: true` en llamadas de autenticación y datos sensibles.

**Utilidad de errores API:** `core/http/utils/parse-api-error.util.ts`
- `getApiErrorCode(error)` — lee `error.code` o `error.error` del body
- `getHttpStatus(error)`

Mapear errores de dominio en utils por feature (ej. `catalog-error.util.ts`, `reset-password-error.util.ts`), no en el template.

---

## 6. Autenticación y autorización

| Pieza | Ubicación |
|-------|-----------|
| Estado de sesión | `core/auth/auth.service.ts` (`AuthStateService`) |
| Login / logout / refresh | `AuthApiRepository` (mock o HTTP) |
| Recuperación de contraseña | `PasswordRecoveryRepository` |
| Guards | `core/auth/guards/auth.guard.ts`, `guest-auth.guard.ts` |
| Permisos por ruta | `core/auth/rbac.policy.ts` → `ROUTE_PERMISSIONS` |
| Menú por rol | `shell/shell-menu.config.ts` |
| JWT decode | `core/auth/utils/jwt.util.ts` |
| Cooldown anti brute-force | `core/auth/utils/login-cooldown.ts` |

**Rutas:** `data: { roles: ROUTE_PERMISSIONS.xxx }` en `app.routes.ts` o `*.routes.ts` del feature.

**Auth pública** (sin shell): prefijo `/auth/*`, lazy en `features/auth/auth.routes.ts`, protegida con `guestAuthGuard`.

---

## 7. Rutas y lazy loading

```
/                    → ShellComponent (autenticado)
  /dashboard         → features/dashboard/
  /academic-catalog  → features/academic-catalog/
  /account           → features/account/
  /auth/*            → features/auth/ (fuera del shell)
```

- Cada feature exporta `{FEATURE}_ROUTES` desde su `*.routes.ts`.
- Componentes cargados con `loadComponent` / `loadChildren` (dynamic import).
- Redirects y `pathMatch: 'full'` explícitos.
- `returnUrl` sanitizado: `core/auth/utils/sanitize-return-url.util.ts`.

---

## 8. Formularios y validación

### Regla única de errores de campo

**Siempre** usar `app-field-error` + util compartido:

```
shared/components/field-error/field-error.component.ts
shared/utils/field-error.util.ts
```

| Función | Uso |
|---------|-----|
| `shouldShowFieldError(control, submitted)` | Mostrar error si `submitted \|\| dirty \|\| touched` |
| `isFieldInvalid(control, submitted, forceInvalid?)` | Clase `p-invalid` en inputs PrimeNG |
| `minLengthRemaining(control)` | Contador de caracteres restantes |

**Input opcional** `minLengthRemainingKey` en `FieldErrorComponent` para mensajes con `{remaining}` (reset-password).

### Formularios con contraseñas pareadas

- Validador de grupo: `core/auth/utils/passwords-match.validator.ts` → error `PASSWORDS_MISMATCH`.
- Feedback reactivo (mismatch en tiempo real): `createPairedPasswordFormFeedback()` en `paired-password-form-feedback.ts`.
- Solo tras submit: `createSubmittedPasswordsMismatch()`.

### Bases reutilizables (academic-catalog)

| Base | Archivo | Qué centraliza |
|------|---------|----------------|
| Listado paginado | `components/catalog-list.base.ts` | `items`, `loading`, `page`, filtros, `load()` |
| Registro wizard | `components/catalog-registration.base.ts` | `step`, submit, diálogo password, navegación |
| Opciones de filtro | `utils/catalog-filter.options.ts` | `programTypes`, `statuses`, `parseActiveFilter()` |

**Extender con `@Directive()`** las bases que usan `inject()` — requisito del compilador Angular.

---

## 9. Manejo de errores en UI

| Capa | Patrón |
|------|--------|
| **Validación de campo** | `FieldErrorComponent` + claves `COMMON.VALIDATION.*` |
| **Error de formulario / negocio** | `signal<ErrorType \| null>` + `p-message` con claves i18n del feature |
| **Error HTTP global** | Interceptores (401/403); el componente maneja el resto en `subscribe({ error })` |
| **Mapeo error → clave** | Utils puros por dominio (`mapCatalogError`, `mapResetPasswordError`) |

**No** duplicar lógica de parseo de `HttpErrorResponse`; usar `parse-api-error.util.ts`.

**Errores de servidor genéricos:** `COMMON.ERRORS.SERVER_ERROR`.

---

## 10. Internacionalización (i18n)

### Stack y archivos

| Recurso | Ubicación |
|---------|-----------|
| Traducciones | `src/assets/i18n/es.json`, `en.json` |
| Tipo de claves | `src/app/core/i18n/i18n-keys.generated.ts` (`I18nKey`, `I18N_KEYS`) |
| Script de paridad | `scripts/i18n-check.mjs` |
| Opciones de selects compartidas | `features/academic-catalog/utils/catalog-filter.options.ts` |

- Librería: `@ngx-translate/core` + loader HTTP.
- Idioma por defecto: `es`.
- **Prohibido** texto visible hardcodeado en `.ts` / `.html` (excepto datos de usuario/API y códigos de idioma `ES`/`EN` en el selector de idioma).

### Convención de nombres de claves

- Formato: `DOMINIO.SECCION.SUBSECCION` en **MAYÚSCULAS** con puntos (sin espacios).
- Agrupar por feature o área transversal; reutilizar prefijos existentes antes de inventar uno nuevo.
- Los valores en JSON son **solo cadenas finales** (hojas del árbol). No anidar texto traducible dentro de otra clave.

Estructura habitual:

```
COMMON.{ACTIONS,STATES,VALIDATION,ERRORS}
AUTH.{LOGIN,FORGOT_PASSWORD,RESET_PASSWORD}.*
ACADEMIC_CATALOG.{STUDENTS,PROFESSORS,FILTERS,ERRORS,FIELDS,COLUMNS}.*
ACCOUNT.PASSWORD.*
SHELL.{MENU,SECTIONS}.*
DASHBOARD.CARDS.*
```

**Buenas prácticas de diseño de claves**

| Hacer | Evitar |
|-------|--------|
| Claves estables orientadas al significado (`COMMON.ACTIONS.SAVE`) | Claves acopladas al layout (`BUTTON_TOP_RIGHT`) |
| Reutilizar `COMMON.*` para acciones/estados genéricos | Duplicar "Guardar", "Cancelar", etc. por feature |
| Misma clave en `es.json` y `en.json` con el mismo path | Traducir solo un idioma y dejar el otro pendiente |
| Errores de negocio bajo `{FEATURE}.ERRORS.{codigo}` | Mensajes de error literales en servicios o componentes |

### Flujo al añadir o cambiar traducciones

1. Añade la clave en **`es.json` y `en.json`** con el mismo path y estructura anidada.
2. Ejecuta **`pnpm run i18n:sync`** (ordena JSON + regenera `i18n-keys.generated.ts`).
3. Usa la clave en template o tipa con `I18nKey` en TypeScript.
4. Verifica con **`pnpm run lint`** (incluye `i18n:check`) o, solo paridad, **`pnpm run i18n:check`**.

Comandos:

```bash
pnpm run i18n:check   # falla si es.json y en.json no tienen el mismo conjunto de claves
pnpm run i18n:sync    # --sort + --types: normaliza JSON y regenera tipos
```

**Importante:** commitear `i18n-keys.generated.ts` junto con los JSON. No editar el archivo generado a mano.

### Uso en plantillas HTML

Preferir el pipe `translate` en el template (no construir strings en el componente):

```html
<h1>{{ 'ACADEMIC_CATALOG.STUDENTS.LIST.TITLE' | translate }}</h1>

<p-button [label]="'COMMON.ACTIONS.SAVE' | translate" />

<input [placeholder]="'ACADEMIC_CATALOG.STUDENTS.LIST.SEARCH' | translate" />
```

Para mensajes con parámetros, usar el objeto del segundo argumento del pipe según la API de `@ngx-translate`.

### Uso en TypeScript

**Opciones de select / catálogo:** almacenar `labelKey: I18nKey`, no el texto traducido. El template resuelve con `| translate`.

```typescript
import type { I18nKey } from '../../../core/i18n/i18n-keys.generated';

export interface CatalogSelectOption<T extends string = string> {
  readonly labelKey: I18nKey;
  readonly value: T;
}

export const CATALOG_STATUS_FILTER_OPTIONS: CatalogSelectOption[] = [
  { labelKey: 'ACADEMIC_CATALOG.FILTERS.ALL', value: '' },
  { labelKey: 'ACADEMIC_CATALOG.STATUS.ACTIVE', value: 'true' },
];
```

**PrimeNG `p-select`:** no usar `optionLabel` con texto fijo; plantillas `#item` / `#selectedItem`:

```html
<p-select [options]="statuses" optionValue="value">
  <ng-template #selectedItem let-option>{{ option?.labelKey | translate }}</ng-template>
  <ng-template #item let-option>{{ option.labelKey | translate }}</ng-template>
</p-select>
```

**Configuración estática (menú, dashboard):** propiedad `labelKey` con literal de clave; el componente hijo aplica `translate` (p. ej. `StatCardComponent`, `ShellSidebarLinkComponent`).

**Traducción en runtime (excepcional):** solo cuando la API de un tercero exige `string` ya resuelto (p. ej. menú PrimeNG que no acepta plantilla). Usar `TranslateService.instant('CLAVE')` en el componente, no concatenar textos.

```typescript
// shell.component.ts — caso justificado
label: this.translate.instant(link.labelKey) as string,
```

### Errores y validación

- Mensajes de campo: claves bajo `COMMON.VALIDATION.*` o del feature; mostrar con `FieldErrorComponent`.
- Errores de API/negocio: mapear códigos a claves i18n (`ACADEMIC_CATALOG.ERRORS.duplicate_email`), no devolver texto del mock al usuario sin traducir.
- Errores genéricos de servidor: `COMMON.ERRORS.SERVER_ERROR`.

### Verificación automática

- `i18n:check` está integrado en **`pnpm run lint`**; el CI/local debe fallar ante desbalance es↔en.
- El script lista claves **solo en es** o **solo en en** para corregir rápido.
- Tras renombrar o borrar claves, ejecutar `i18n:sync` y corregir referencias que TypeScript marque al cambiar `I18nKey`.

### Qué no hacer

| Anti-patrón | Alternativa |
|-------------|-------------|
| `label: 'Activo'` en arrays TS | `labelKey: 'ACADEMIC_CATALOG.STATUS.ACTIVE'` |
| Clave solo en un JSON | Añadir en ambos y correr `i18n:sync` |
| Editar `i18n-keys.generated.ts` manualmente | Regenerar con `pnpm run i18n:sync` |
| Texto visible en `.ts` para UI | Clave i18n + pipe o `instant()` puntual |
| Inventar claves sin comprobar paridad | `pnpm run i18n:check` antes del commit |

### Excepciones aceptadas

- Códigos de idioma **`ES` / `EN`** en `language-switcher` (no son copy de producto).
- Datos dinámicos de API (nombres de usuario, títulos de programa, etc.).

---

## 11. Sistema de diseño — Tailwind + PrimeNG

### Fuente de verdad de colores

```
core/theme/design-tokens.ts    ← paleta PRIMARY, SECONDARY, SURFACE, SEMANTIC
core/theme/sapcyti-preset.ts   ← preset PrimeNG derivado de design-tokens
src/styles.css                 ← @theme Tailwind (sincronizado manualmente con design-tokens)
```

**Al cambiar un color:** editar `design-tokens.ts` y el bloque `@theme` en `styles.css`.

### Tokens Tailwind usados en el código

| Categoría | Ejemplos de clases |
|-----------|-------------------|
| **Color marca** | `text-primary`, `bg-primary-container`, `text-on-surface` |
| **Superficie** | `bg-surface`, `bg-surface-subtle`, `border-outline` |
| **Semánticos** | `text-error`, `bg-error-container`, `border-error-border` |
| **Tipografía** | `text-h1`, `text-h2`, `text-body-md`, `text-caption`, `font-label-md` |
| **Espaciado** | `gap-sm`, `p-md`, `px-margin`, `py-lg` (escala xs→xxl) |
| **Radio** | `rounded-lg`, `rounded-xl` |

### PrimeNG — componentes preferidos

| Uso | Componente PrimeNG |
|-----|-------------------|
| Botones | `p-button` (`severity`, `variant="outlined"`, `fluid` en móvil) |
| Campos texto | `pInputText` directive en `<input>` |
| Contraseña | `p-password` (`[toggleMask]`, `[feedback]="false"`, `fluid`) |
| Select / filtros | `p-select` con templates `#item` / `#selectedItem` + pipe `translate` |
| Mensajes | `p-message` (`severity`: error, warn, success) |
| Checkbox | `p-checkbox` `[binary]="true"` |
| Iconos | `primeicons` (`pi pi-*`) |

**Theming:** `providePrimeNG({ theme: { preset: SapcytiPreset } })` en `app.config.ts`. No sobrescribir colores PrimeNG con CSS ad hoc salvo casos puntuales.

### Layouts compartidos

| Componente | Cuándo usarlo |
|------------|---------------|
| `AuthPageLayoutComponent` | Pantallas `/auth/*` (centrado, max-width 420px) |
| `AuthFooterComponent` | Pie de páginas de auth |
| `TemporaryPasswordDialogComponent` | Password temporal tras alta de usuario |
| `StatCardComponent` | Tarjetas de dashboard |
| `AccessDeniedComponent` | Ruta `/access-denied` |
| `FeaturePlaceholderComponent` | Features aún no implementados |

### Responsive

- Enfoque **mobile-first** con breakpoints Tailwind (`sm:`, `md:`).
- Tablas de catálogo: `block` en móvil, `md:table` en desktop; labels de columna con `md:hidden` en celdas.
- Grids de formulario: `grid md:grid-cols-2`.
- Shell: drawer móvil (`shell-mobile-drawer.component.ts`) + sidebar desktop.
- Auth: `min-h-dvh`, padding `px-margin`, card `max-w-[420px]`.

**No** poner clases Tailwind en archivos de datos/config TS (pendiente limpiar en `dashboard-home.config.ts` — Fase 5).

---

## 12. Factorización y patrones DRY

### Ya implementados (no reimplementar)

| Patrón | Ubicación |
|--------|-----------|
| Repository mock/HTTP | `provide-mock-or-http.ts`, `data-layer.providers.ts` |
| Listado paginado | `CatalogListBase` |
| Registro multi-step | `CatalogRegistrationBase` |
| Mock store por entidad | `student-mock.store.ts`, `professor-mock.store.ts`, `catalog-mock.util.ts` |
| Errores de campo | `field-error.util.ts`, `FieldErrorComponent` |
| Cooldown login | `login-cooldown.ts` |
| Password mismatch UX | `paired-password-form-feedback.ts` |
| Logout + redirect | `logout-navigation.util.ts` |

### Antipatrones a evitar

- `if (this.useMock)` dentro de servicios o componentes.
- URLs de API como strings sueltos en servicios.
- Copiar paginación/filtros en cada list component.
- `showFieldError()` / `fieldInvalid()` ad-hoc por componente.
- Importar un feature desde otro feature.
- `setInterval` embebido en componentes sin util testeable.
- Suscripciones sin teardown.

---

## 13. Tests

### Unitarios (Vitest + Angular TestBed)

```bash
pnpm test          # ng test (Vitest)
pnpm run lint      # ESLint + Prettier
ng build           # build de producción
```

**Convenciones:**

- Archivo junto al código: `*.spec.ts`.
- HTTP: `provideHttpClient()` + `provideHttpClientTesting()` + `HttpTestingController`.
- Mocks de features: `provideAppMockConfig({ students: true })` + `...DATA_LAYER_PROVIDERS`.
- Auth HTTP: `testing/auth-test.util.ts` → `configureAuthHttpTesting()`, `AUTH_TEST_ENDPOINTS`.
- Traducciones en componentes: `TranslateModule.forRoot()` en imports del test.
- Spies: `vi.fn()`, `vi.spyOn()` (Vitest).
- Probar comportamiento, no implementación interna; actualizar tests si cambia estructura, no borrarlos.

**Utilidades con spec propio:** preferir tests directos en `*.util.spec.ts` (ej. `login-cooldown.spec.ts`, `field-error.util.spec.ts`).

### E2E (Playwright)

```bash
pnpm run e2e
```

- Specs en `e2e/`.
- `data-testid` en flujos críticos: `create-student`, `wizard-next`, `confirm-student`, `generated-password`, etc.
- Selectores preferidos: `getByTestId` > `getByRole` > `locator('[formcontrolname]')`.
- Textos bilingües en assertions: regex `/Alumnos|Students/`.
- Requiere app con mocks de auth habilitados (`coordinator@uam.mx` / `password`).

---

## 14. Calidad y deuda técnica

| Recurso | Contenido |
|---------|-----------|
| [`TECH_DEBT.md`](./TECH_DEBT.md) | IDs trazables (TD-001…), baseline lint/test/build |
| [`mejoras-spa.md`](./mejoras-spa.md) | Plan de refactor por fases (0–7) |
| `Docs/sdd/specs/` | Contrato funcional por SPEC (fuente para implementar) |

**Pendiente documentado:**

- Fase 5: sacar Tailwind de configs TS.
- Fase 7: consolidar specs duplicadas en Docs.

---

## 15. Checklist rápido para PR / feature nueva

- [ ] ¿Existe util/base/shared que ya haga esto? (sección 12)
- [ ] ¿Endpoint añadido solo en `api-endpoints.ts`?
- [ ] ¿Repository + mock si hay datos remotos?
- [ ] ¿Flag en `environment.mocks` si aplica?
- [ ] ¿`FieldErrorComponent` en formularios?
- [ ] ¿Claves i18n en es **y** en? ¿Ejecutado `pnpm run i18n:sync` si hubo cambios en JSON?
- [ ] ¿Imports vía barrels (`models`, `shared/components`, `core/auth/utils`) cuando aplique?
- [ ] ¿Sin imports feature→feature? (si mock compartido → token en `core/mocks/`)
- [ ] ¿Guardas en `localStorage` / `clipboard` / `route.snapshot.data` si se tocan?
- [ ] ¿`OnPush` + signals + `takeUntilDestroyed`?
- [ ] ¿Roles en `rbac.policy.ts` y ruta?
- [ ] ¿`data-testid` en flujos e2e críticos?
- [ ] ¿`pnpm run lint && pnpm test && ng build` verdes?

---

## 16. Referencia rápida de archivos canónicos

```
core/api/api-endpoints.ts              # URLs API
core/api/data-layer.providers.ts       # Registro de repositorios + tokens mock compartidos
core/mocks/mock.config.ts              # Sistema de flags mock
core/mocks/mock-user-registry.ts       # Tokens MockUserRegistry (evita feature→feature)
core/mocks/provide-mock-or-http.ts     # Factory Repository
eslint-rules/no-cross-feature-imports.mjs
core/auth/rbac.policy.ts               # Permisos por ruta
core/auth/utils/index.ts               # Barrel utilidades auth
core/auth/auth.service.ts              # Sesión JWT
core/http/utils/parse-api-error.util.ts
core/theme/design-tokens.ts            # Paleta
src/styles.css                         # Tokens Tailwind @theme
models/index.ts                        # Barrel tipos de dominio
src/assets/i18n/{es,en}.json           # Traducciones
core/i18n/i18n-keys.generated.ts       # Tipo I18nKey (pnpm run i18n:sync)
scripts/i18n-check.mjs                 # Paridad es↔en; --sort --types
shared/components/index.ts             # Barrel componentes UI
shared/utils/field-error.util.ts       # Validación de campos
shared/utils/clipboard.util.ts         # Copia segura al portapapeles
shared/utils/feature-placeholder-route.util.ts
shared/components/field-error/         # UI de errores
features/academic-catalog/components/catalog-list.base.ts
features/academic-catalog/components/catalog-registration.base.ts
features/academic-catalog/utils/catalog-filter.options.ts
features/academic-catalog/mocks/catalog-mock.util.ts
testing/auth-test.util.ts              # Setup tests HTTP auth
```

---

## 17. Estructura, barrels y prevención de acoplamiento

### Límite arquitectónico

```
features/*  →  core/*, shared/*, models/*
features/*  ✗  features/*   (enforced por ESLint)
shell/*     →  core/*, shared/*, models/*
core/*      →  models/*; excepción: data-layer.providers.ts registra repos de features
```

Un feature **no conoce** la implementación interna de otro. Si dos features necesitan el mismo dato en mocks, el contrato vive en `core/` y la implementación se registra en DI — no con imports cruzados.

### Barrels (`index.ts`)

Puntos de entrada para reducir ruido de imports **sin crear ciclos**:

| Barrel | Exporta | Ejemplo de import |
|--------|---------|-------------------|
| `models/index.ts` | Tipos e interfaces de dominio | `import { RoleType, PageResponse } from '../../../models'` |
| `shared/components/index.ts` | Componentes standalone | `import { FieldErrorComponent, StatCardComponent } from '../../../shared/components'` |
| `core/auth/utils/index.ts` | Utilidades de auth | `import { createLoginCooldown, sanitizeReturnUrl } from '../../../core/auth/utils'` |

**Cuándo usar**

- Varios símbolos del mismo área en un archivo.
- Tipos de dominio compartidos entre features vía `models/`.
- Componentes shared reutilizados en formularios, shell o dashboard.

**Cuándo NO barrelizar**

| Evitar | Motivo |
|--------|--------|
| `features/{x}/index.ts` que reexporta todo el feature | Acoplamiento y ciclos de dependencia |
| Barrels de repositorios o servicios de feature | La DI ya centraliza en `data-layer.providers.ts` |
| Reexportar specs o mocks en barrels públicos | Ruido y riesgo de importar test code en prod |

Al añadir un export nuevo al barrel, **no** hace falta script: solo exportar el símbolo en el `index.ts` correspondiente.

### ESLint — `sapcyti/no-cross-feature-imports`

- **Archivo:** `eslint-rules/no-cross-feature-imports.mjs`
- **Config:** `eslint.config.mjs` — activa solo en `src/app/features/**/*.ts`
- **Comportamiento:** resuelve imports relativos y bloquea si el path destino cae en otro feature (p. ej. `account` importando `academic-catalog/mocks/...`).

**Permitido**

- Imports dentro del mismo feature (`../services/student.service`)
- Imports a `core/`, `shared/`, `models/`, `shell/`
- `core/api/data-layer.providers.ts` importando repositorios de features (composición en raíz)

**Bloqueado**

```typescript
// ❌ En features/account/...
import { StudentMockStore } from '../../academic-catalog/mocks/student-mock.store';
```

**Alternativa correcta — token en core**

```typescript
// core/mocks/mock-user-registry.ts
export interface MockUserRegistry { hasUser(userId: number): boolean; }
export const MOCK_STUDENT_USER_REGISTRY = new InjectionToken<MockUserRegistry>(...);

// core/api/data-layer.providers.ts
{ provide: MOCK_STUDENT_USER_REGISTRY, useExisting: StudentMockStore },

// features/account/repositories/password-change-mock.repository.ts
private readonly studentRegistry = inject(MOCK_STUDENT_USER_REGISTRY);
```

Verificación: `pnpm run lint` o `ng lint` (falla en CI si hay cruce).

### TypeScript estricto

| Flag | Ubicación | Efecto |
|------|-----------|--------|
| `strict: true` | `tsconfig.json` | Null checks, strict templates, etc. |
| `noUncheckedIndexedAccess: true` | `tsconfig.json` | `arr[i]` y `obj[key]` son `T \| undefined` |

**Patrones recomendados**

```typescript
// Acceso por índice — validar antes de usar
const payload = parts[1];
if (!payload) throw new Error('Invalid JWT format');

// Form controls por nombre — guarda explícita
const control = form.controls['confirmPassword'];
if (!control) throw new Error('confirmPassword control is required');
```

**Prohibido:** `any` salvo casos excepcionales documentados (hoy el repo no usa `any` en código de producción).

### APIs del navegador

Entornos restringidos (privacidad, SSR, iframes) pueden bloquear storage o clipboard. **Nunca** asumir que existen.

| API | Utilidad / referencia | Patrón |
|-----|----------------------|--------|
| `localStorage` | `auth.service.ts`, `language-switcher`, `request-language.util.ts` | `try/catch`; persistencia best-effort |
| `navigator.clipboard` | `shared/utils/clipboard.util.ts` | Comprobar `navigator.clipboard?.writeText`; devolver `boolean` |
| `route.snapshot.data` | `shared/utils/feature-placeholder-route.util.ts` | Validar `typeof === 'string'`; fallback con claves `I18nKey` |

```typescript
// Copiar al portapapeles — usar util, no navigator directo en componentes
import { copyTextToClipboard } from '../../utils/clipboard.util';

void copyTextToClipboard(text).then((copied) => {
  if (copied) this.copiedChange.emit(true);
});
```

### Qué no hacer

| Anti-patrón | Alternativa |
|-------------|-------------|
| Importar mock/store de otro feature | Token en `core/mocks/` + registro en `data-layer.providers.ts` |
| `import { X } from '../../../models/student.model'` | `import { X } from '../../../models'` |
| `localStorage.getItem` sin `try/catch` | Envolver o reutilizar patrón de `auth.service.ts` |
| `navigator.clipboard.writeText` directo en componente | `copyTextToClipboard()` |
| `route.snapshot.data['key'] as string` sin validar | `readFeaturePlaceholderRouteData()` o guarda equivalente |
| Desactivar la regla ESLint para “un import rápido” | Refactorizar el contrato a `core/` |

---

*Última actualización: refleja el estado post-Fases 0–6 del refactor `mejoras-spa.md` (junio 2026).*
