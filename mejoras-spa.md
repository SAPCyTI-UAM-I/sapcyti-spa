# Mejoras SPA — Refactor de limpieza y mantenibilidad (mocks-first)

> Briefing técnico + prompt de ejecución por fases para un LLM implementador.
> Objetivo: mejorar estructura, limpieza y mantenibilidad de `sapcyti-spa` **sin cambiar
> comportamiento observable** y **sin conectar el backend** (todo sigue con mocks vía
> `environment.mocks`, pero preparado para alternar a API real fácilmente).

---

## 1. Diagnóstico (estado real del código)

Hallazgos verificados leyendo el código (no suposiciones):

| #  | Hallazgo | Evidencia | Severidad |
|----|----------|-----------|-----------|
| 1  | **Duplicación casi total en `academic-catalog`** | `professor-list` ≡ `student-list` (diff idéntico tras renombrar, solo difiere el filtro `programType`). Igual entre `student.service`/`professor.service` y `student-registration`/`professor-registration`. | 🔴 Alta |
| 2  | **Patrón mock disperso e inconsistente** | 3 estilos: `mockLogin()` + `AUTH_MOCK_USERS`; `AcademicCatalogMockStore` inyectable; mocks ad-hoc en account. Cada método repite `if (this.useMock) return of(...)`. | 🔴 Alta (núcleo de "fácil cambio a API") |
| 3  | **`AcademicCatalogMockStore` mezcla students + professors** | 192 líneas, 2 entidades en una clase → viola SRP. | 🟠 Media |
| 4  | **Endpoints fragmentados, sin barrels** | cada feature tiene `*.endpoints.ts` leyendo `environment.apiBaseUrl`; `find -name index.ts` = 0 barrels. | 🟠 Media |
| 5  | **Paginación + filtros reimplementados** | `previousPage/nextPage/pageSize` y arrays `programTypes`/`statuses` copiados en cada list; no usa `p-paginator`. | 🟠 Media |
| 6  | **Manejo de errores de validación inconsistente** | `login` usa `showFieldError/fieldInvalid`; `student-registration` usa `fieldInvalid`; `reset-password` usa 4 `toSignal` + `computed`. Existe `FieldErrorComponent` pero no se usa uniformemente. | 🟠 Media |
| 7  | **i18n frágil** | 346 líneas es/en sin tipado ni verificación de paridad; labels de selects hardcodeados como strings en arrays TS. | 🟠 Media |
| 8  | **Presentación filtrada en config TS** | `dashboard-home.config.ts` mete clases Tailwind (`iconBgClass`…) en datos; `Record<string,...>` en vez de `RoleType`. | 🟡 Baja |
| 9  | **`TECH_DEBT.md` vacío**; login `setInterval` imperativo embebido en componente. | tabla con `—`. | 🟡 Baja |
| 10 | **Discrepancia documental**: SPEC-016A/017A/018A tienen **dos archivos cada uno** con contenido distinto (md5 distintos). | `Docs/sdd/specs/iteration-4/`. | 🟠 Media (reportar, no resolver en SPA) |

**Conclusión:** el backend está desconectado y se opera 100% con mocks vía `environment.mocks` +
`provideAppMockConfig` + `injectMockEnabled`. La infraestructura para alternar mock/API existe pero
está **aplicada de forma repetitiva dentro de cada servicio**. El refactor debe **centralizar ese
switch** sin tocar el contrato de `environment`.

---

## 2. Plan de fases (checklist)

- [x] **Fase 0** — Línea base y red de seguridad (lint/test/build verdes, baseline, reglas de no-regresión)
- [x] **Fase 1** — Capa de datos uniforme: abstracción Repository (HTTP impl + Mock impl) seleccionada por DI token; centralizar endpoints
- [x] **Fase 2** — Genéricos `academic-catalog`: base list (paginación/filtros) + base registration; separar mock store por entidad
- [ ] **Fase 3** — Formularios/validación unificados: `FieldErrorComponent` en todos; extraer wizard multistep y cooldown
- [ ] **Fase 4** — i18n robusto: tipado de claves + script de paridad es↔en + mover labels hardcodeados
- [ ] **Fase 5** — Design system: sacar Tailwind de configs TS; reutilizar `stat-card`/tokens
- [ ] **Fase 6** — Estructura/barrels + reglas ESLint anti-acoplamiento + strict TS
- [ ] **Fase 7** — Consolidación de Docs (specs duplicadas) y poblar `TECH_DEBT.md`

---

## 3. Prompt de ejecución (bloque copiable)

```markdown
# PROMPT DE EJECUCIÓN — Refactor de limpieza y mantenibilidad de sapcyti-spa (mocks-first)

## Rol
Eres Implementador SPA senior en Angular 21 (standalone, signals). Tu objetivo es
mejorar la ESTRUCTURA, limpieza y mantenibilidad de `sapcyti-spa` SIN cambiar el
comportamiento observable para el usuario y SIN conectar el backend. Todo sigue
funcionando con mocks; solo se mejora la facilidad de cambiar a API real.

## Reglas globales (aplican a TODAS las fases)
- Fuente de verdad: código actual > specs. Si una spec contradice el código, REPORTA la
  discrepancia y NO la "arregles" saliendo del scope.
- Protocolo atómico: ejecuta UNA tarea numerada a la vez. Al terminar cada tarea:
  1) resume archivos tocados, 2) muestra el checklist de DoD marcado,
  3) ejecuta `pnpm run lint && pnpm test && ng build`, 4) DETENTE y espera "Proceed".
- NO refactores comportamiento ni cambies UI/UX, textos visibles, rutas, ni el contrato de
  `src/environments/environment*.ts` (los flags `mocks.*` deben seguir existiendo con los
  mismos nombres: auth, passwordRecovery, students, professors, passwordChange).
- Convenciones obligatorias del repo: componentes standalone, lazy routes, `OnPush`,
  signals (`signal`/`computed`/`toSignal`), typed reactive forms con `NonNullableFormBuilder`,
  PrimeNG + Tailwind tokens, i18n `@ngx-translate` (es/en), `takeUntilDestroyed(destroyRef)`.
- Prohibido: imports feature→feature; lógica de presentación (clases Tailwind) en archivos de datos;
  `any`; suscripciones sin teardown; duplicar lógica que ya exista en `core/` o `shared/`.
- Cada cambio debe dejar lint/test/build verdes. Si un test falla por el refactor, ACTUALÍZALO
  para reflejar la nueva estructura, nunca lo borres para "pasar".
- No hagas commits salvo que el usuario lo pida.

## Contexto mínimo a cargar (lee antes de empezar)
- src/environments/environment.ts y environment.prod.ts
- src/app/app.config.ts, src/app/app.routes.ts
- src/app/core/mocks/mock.config.ts
- src/app/core/auth/auth.service.ts y core/auth/mock/auth.mock.ts
- src/app/features/academic-catalog/** (services, mocks, components, endpoints)
- src/app/shared/components/field-error/field-error.component.ts
- src/app/features/auth/{login,reset-password}/*.component.ts
- src/app/features/dashboard/dashboard-home.config.ts
- src/assets/i18n/es.json y en.json

============================================================
## FASE 0 — Línea base y red de seguridad (no cambia código de producción)
============================================================
Objetivo único: dejar una baseline verde y reglas medibles antes de refactorizar.

Tareas:
0.1 Ejecuta `pnpm install`, luego `pnpm run lint`, `pnpm test`, `ng build`. Registra el
    estado inicial (verde/rojo, nº de tests). Si algo está rojo de base, REPORTA y detente.
0.2 Genera un inventario en `TECH_DEBT.md` con la tabla de hallazgos de este refactor
    (un ID por hallazgo, prioridad, fase objetivo). No cambies código aún.

DoD Fase 0:
- [ ] lint/test/build verdes documentados como baseline
- [ ] TECH_DEBT.md poblado con IDs trazables a las fases siguientes

============================================================
## FASE 1 — Capa de datos uniforme mock/HTTP (PRIORIDAD: facilidad de cambio a API)
============================================================
Objetivo único: eliminar el `if (this.useMock) return of(...)` repetido y unificar cómo se
elige mock vs HTTP, de modo que cambiar a backend real sea solo flags en `environment`.

Patrón objetivo (NO inventes otro):
- Por feature con datos, define una interfaz de repositorio (puerto), p.ej.
  `StudentRepository` con los métodos del servicio actual (mismas firmas/observables).
- Dos implementaciones: `StudentHttpRepository` (la rama HTTP actual) y
  `StudentMockRepository` (la rama mock actual, hoy en el MockStore).
- Selección por DI mediante factory que lee `injectMockEnabled('students')`:
  `{ provide: StudentRepository, useFactory: () => injectMockEnabled('students') ? new Mock... : new Http... }`
  o `useClass` condicional vía provider factory en el `*.routes.ts` del feature.
- El componente sigue inyectando un único símbolo; ya NO conoce mocks.

Tareas:
1.1 Centraliza endpoints: crea `src/app/core/api/api-endpoints.ts` (o consolida los
    `*.endpoints.ts`) construyendo todas las rutas desde `environment.apiBaseUrl`.
    Mantén `as const`. Reemplaza referencias. DoD: no quedan strings de URL sueltos.
1.2 Aplica el patrón Repository a `students` (interfaz + Http + Mock + provider). El
    `StudentMockRepository` toma su data del store separado (ver Fase 2.1). Mantén
    EXACTAMENTE el comportamiento (errores 409/404, password generado, paginado).
1.3 Aplica el mismo patrón a `professors`.
1.4 Aplica el mismo patrón a `passwordChange` y normaliza `auth`/`passwordRecovery` para que
    expongan la misma forma de selección (no rehagas la lógica de auth, solo alinéala al patrón
    sin cambiar tokens ni flujo de sesión).
1.5 Verifica que `app.config.ts` y los `*.routes.ts` registran los providers; que con
    `mocks.students=true` se usa Mock y con `false` se usa Http (toggle manual de prueba,
    revertir el flag al terminar).

Contratos a preservar:
- environment.mocks.{auth,passwordRecovery,students,professors,passwordChange}
- Errores mock: status 409 `EMAIL_ALREADY_EXISTS|ENROLLMENT_ALREADY_EXISTS|EMPLOYEE_NUMBER_ALREADY_EXISTS`,
  404 `GRADUATE_PROGRAM_NOT_FOUND`; password `Tmp{userId}#Sap26` (solo mock).
- `withCredentials: true` en llamadas HTTP.

DoD Fase 1:
- [ ] Ningún servicio contiene `if (useMock)`; el switch vive en un provider/factory
- [ ] Cambiar un flag en environment alterna la implementación sin tocar componentes
- [ ] Endpoints centralizados; lint/test/build verdes; specs de servicios actualizados

============================================================
## FASE 2 — Genéricos academic-catalog (DRY / SOLID)
============================================================
Objetivo único: eliminar la duplicación student/professor extrayendo base reutilizable,
respetando que professor NO tiene `programType`.

Tareas:
2.1 Separa el mock store en `StudentMockStore` y `ProfessorMockStore`; extrae helpers
    comunes (`page`, `normalize`, `nextId`, `conflict`, `notFound`) a
    `features/academic-catalog/mocks/catalog-mock.util.ts`. SRP por entidad.
2.2 Extrae una base de listado paginado/filtrado reutilizable
    (`shared/` o `features/academic-catalog/components/catalog-list.base.ts`) que maneje:
    signals (items/loading/loadError/page/totalElements), `applyFilters/clearFilters/
    previousPage/nextPage`, y reciba la fn de carga. student-list y professor-list la consumen;
    professor-list extiende añadiendo solo lo suyo. Evalúa usar `p-paginator` de PrimeNG.
2.3 Extrae a un solo lugar los catálogos de opciones (programTypes, statuses) y la lógica de
    mapeo filtros→query (`active`/`programType`).
2.4 Extrae la base de registro multi-step (`step`, `next/previous`, `fieldInvalid`, submit con
    diálogo de password) compartida por student/professor-registration; cada uno aporta su
    `form` y su mapeo de request.

DoD Fase 2:
- [ ] No queda lógica de paginación/filtros copiada entre list components
- [ ] Mock store dividido por entidad con utilidades compartidas
- [ ] Comportamiento UI idéntico (mismos data-testid si existen); tests verdes

============================================================
## FASE 3 — Formularios y validación unificada
============================================================
Objetivo único: una sola forma de mostrar errores de campo en toda la app.

Tareas:
3.1 Estandariza el uso de `FieldErrorComponent` en login, forgot-password, reset-password,
    student/professor-registration y password-change. Elimina los `showFieldError/fieldInvalid`
    ad-hoc duplicados; centraliza la regla "mostrar si submitted || dirty || touched".
3.2 Reescribe la validación de `reset-password` para usar el patrón estándar (reduce los 4
    `toSignal` + `computed` a lo mínimo o muévelos a una utilidad/`computed` reusable). Conserva
    el feedback en tiempo real de "passwords mismatch" y minlength.
3.3 Extrae el cooldown anti-fuerza-bruta de login a una utilidad/función reusable
    (`core/auth/utils/login-cooldown.ts` o un pequeño helper basado en signals) testeable.

DoD Fase 3:
- [ ] Un único mecanismo de error de campo en todos los formularios
- [ ] reset-password sin lógica de validación duplicada; UX preservada
- [ ] cooldown extraído y con su propio spec; tests verdes

============================================================
## FASE 4 — i18n robusto (es/en)
============================================================
Objetivo único: prevenir claves huérfanas/faltantes y sacar labels hardcodeados del TS.

Tareas:
4.1 Mueve los labels de selects/catálogos que hoy son strings en arrays TS a claves i18n
    (ya referencian claves como 'ACADEMIC_CATALOG.PROGRAM_TYPES.*'; verifica que existan en
    ambos idiomas).
4.2 Añade un script `scripts/i18n-check` (Node) que falle si es.json y en.json no tienen el
    MISMO conjunto de claves; intégralo en `pnpm run lint` o como script aparte. Documenta en README.
4.3 (Opcional, si bajo riesgo) genera un tipo de claves i18n para autocompletado/validación.
4.4 Ordena alfabéticamente y normaliza ambos JSON sin perder claves.

DoD Fase 4:
- [ ] es.json y en.json con paridad verificada por script
- [ ] Sin labels de UI hardcodeados en archivos `.ts`
- [ ] Script documentado; lint/test/build verdes

============================================================
## FASE 5 — Design system / presentación fuera de la config
============================================================
Objetivo único: separar datos de presentación.

Tareas:
5.1 En `dashboard-home.config.ts`, saca las clases Tailwind (`iconBgClass`, `valueColorClass`…)
    del modelo de datos: usa variantes/tokens en el componente o un mapa de "tono"→clases en la
    capa de presentación. Tipa `DASHBOARD_CARDS_BY_ROLE` con `RoleType`, no `string`.
5.2 Verifica reutilización de `stat-card` y componentes shared en dashboard; elimina markup repetido.

DoD Fase 5:
- [ ] `dashboard-home.config.ts` solo contiene datos/keys, no clases CSS
- [ ] Tipado por `RoleType`; render visual idéntico; tests verdes

============================================================
## FASE 6 — Estructura, barrels y prevención de bugs
============================================================
Objetivo único: hacer la estructura navegable y blindar contra regresiones.

Tareas:
6.1 Añade barrels `index.ts` donde reduzcan ruido de imports (models, shared/components,
    core/auth/utils) SIN crear ciclos. Actualiza imports.
6.2 Añade regla ESLint que prohíba imports feature→feature (solo feature→{core,shared,models}).
    Documenta el límite arquitectónico.
6.3 Endurece TS si no lo está (`strict`, `noUncheckedIndexedAccess` evaluado). Corrige fallos.
6.4 Revisa accesos a `localStorage`/`navigator`/`route.snapshot.data` con guardas (ya hay
    try/catch en auth; replica el criterio donde falte).

DoD Fase 6:
- [ ] Barrels sin ciclos; ESLint bloquea acoplamiento feature→feature
- [ ] Sin `any`; build estricto verde

============================================================
## FASE 7 — Consolidación de documentación (Docs/)
============================================================
Objetivo único: reportar y, con aprobación, consolidar duplicados documentales.

Tareas:
7.1 Reporta los pares duplicados con contenido distinto:
    SPEC-016A_{spa-student-catalog-registration,student-registration-frontend}-hu15.md
    (y equivalentes 017A/018A). Propón cuál es canónico según SPEC_INDEX.md. NO borres sin OK.
7.2 Cierra TECH_DEBT.md marcando resueltos los IDs abordados y dejando los pendientes.

DoD Fase 7:
- [ ] Discrepancias de specs reportadas con recomendación
- [ ] TECH_DEBT.md actualizado

## Si te bloqueas
- Primero relee el código actual y los specs de iteration-4; no asumas comportamiento.
- NO inventes endpoints, claves i18n ni roles nuevos: usa los existentes.
- Ante ambigüedad de scope, detente y pregunta; no expandas el refactor.
```

---

## 4. Riesgos y orden

**Orden recomendado:** estrictamente 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. La Fase 1 es la de mayor valor
para el objetivo ("fácil cambiar a API") y debe ir antes que la 2, porque los genéricos de catálogo
consumirán los repositorios ya unificados.

**Riesgos principales:**
- **Fase 1 puede romper specs de servicios** (`student.service.spec.ts`, etc.). Mitigación: el prompt
  obliga a actualizar specs y a mantener firmas/errores idénticos.
- **Sobre-abstracción (Fase 2):** professor sin `programType` tienta a un genérico forzado. El prompt
  acota a "base + extensión", no a una jerarquía rígida.
- **reset-password (Fase 3):** su validación reactiva en tiempo real es delicada; el DoD exige
  preservar la UX exacta.
- **i18n script (Fase 4):** si se mete en `pnpm run lint` y hay desbalance previo, romperá el lint;
  correr 4.4 (paridad) antes de activar el gate.
- **Specs duplicadas (Fase 7):** es deuda documental, no de código — el prompt prohíbe borrar sin
  aprobación.

**Prompt alternativo (corto, si el contexto ya está cargado):**

> "Ejecuta el refactor de mantenibilidad de sapcyti-spa por fases (0–7) según el plan acordado, una
> tarea a la vez, deteniéndote tras cada una con resumen + `pnpm run lint && pnpm test && ng build`.
> Empieza por Fase 1.2 (Repository pattern para students). No cambies comportamiento, UI ni el
> contrato de environment.mocks."
