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
features/*  ✗  features/*   (prohibido — pendiente ESLint en Fase 6 de mejoras-spa)
shell/*     →  core/*, shared/*, models/*
shared/*    →  core/* (mínimo), models/* (evitar si posible)
core/*      →  models/* únicamente entre capas de app
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

- Librería: `@ngx-translate/core` + loader HTTP.
- Archivos: `src/assets/i18n/es.json`, `en.json`.
- Idioma por defecto: `es`.
- En templates: `{{ 'CLAVE.SUBCLAVE' | translate }}` o `translate` pipe en atributos PrimeNG.
- **Prohibido** texto visible hardcodeado en `.ts` / `.html` (excepto datos de usuario/API).
- Labels de selects/catálogos: claves i18n en `catalog-filter.options.ts` (`labelKey: I18nKey`), no strings sueltos.
- **Paridad es↔en:** `pnpm run i18n:check` (también en `pnpm run lint`). Falla si `es.json` y `en.json` no tienen el mismo conjunto de claves.
- **Sincronizar JSON + tipos:** `pnpm run i18n:sync` ordena ambos JSON y regenera `src/app/core/i18n/i18n-keys.generated.ts` (`I18nKey`, `I18N_KEYS`). Commitear el archivo generado.
- Script: `scripts/i18n-check.mjs` (`--sort`, `--types`).

Estructura de claves habitual:

```
COMMON.{ACTIONS,STATES,VALIDATION,ERRORS}
AUTH.{LOGIN,FORGOT_PASSWORD,RESET_PASSWORD}.*
ACADEMIC_CATALOG.{STUDENTS,PROFESSORS,FILTERS,ERRORS}.*
ACCOUNT.PASSWORD.*
SHELL.MENU.*
```

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
- Fase 6: barrels `index.ts`, ESLint anti feature→feature.
- Fase 7: consolidar specs duplicadas en Docs.

---

## 15. Checklist rápido para PR / feature nueva

- [ ] ¿Existe util/base/shared que ya haga esto? (sección 12)
- [ ] ¿Endpoint añadido solo en `api-endpoints.ts`?
- [ ] ¿Repository + mock si hay datos remotos?
- [ ] ¿Flag en `environment.mocks` si aplica?
- [ ] ¿`FieldErrorComponent` en formularios?
- [ ] ¿Claves i18n en es **y** en?
- [ ] ¿`OnPush` + signals + `takeUntilDestroyed`?
- [ ] ¿Roles en `rbac.policy.ts` y ruta?
- [ ] ¿`data-testid` en flujos e2e críticos?
- [ ] ¿`pnpm run lint && pnpm test && ng build` verdes?

---

## 16. Referencia rápida de archivos canónicos

```
core/api/api-endpoints.ts              # URLs API
core/api/data-layer.providers.ts       # Registro de repositorios
core/mocks/mock.config.ts              # Sistema de flags mock
core/mocks/provide-mock-or-http.ts     # Factory Repository
core/auth/rbac.policy.ts               # Permisos por ruta
core/auth/auth.service.ts              # Sesión JWT
core/http/utils/parse-api-error.util.ts
core/theme/design-tokens.ts            # Paleta
src/styles.css                         # Tokens Tailwind @theme
src/assets/i18n/{es,en}.json           # Traducciones
core/i18n/i18n-keys.generated.ts       # Tipo I18nKey (pnpm run i18n:sync)
scripts/i18n-check.mjs                 # Paridad es↔en; --sort --types
shared/utils/field-error.util.ts       # Validación de campos
shared/components/field-error/         # UI de errores
features/academic-catalog/components/catalog-list.base.ts
features/academic-catalog/components/catalog-registration.base.ts
features/academic-catalog/utils/catalog-filter.options.ts
features/academic-catalog/mocks/catalog-mock.util.ts
testing/auth-test.util.ts              # Setup tests HTTP auth
```

---

*Última actualización: refleja el estado post-Fases 0–4 del refactor `mejoras-spa.md` (junio 2026).*
