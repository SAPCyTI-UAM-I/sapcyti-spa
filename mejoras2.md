# Mejoras SPA — Ronda 2 (cierre de gaps post-refactor)

> Prompts de ejecución quirúrgicos para corregir lo pendiente tras el refactor `mejoras-spa.md`
> (fases 0–7). Estado verificado el 2026-06-15: `pnpm run lint` ✅, `pnpm test` ✅ (126/33),
> `ng build` ✅ (warning de budget). **Este documento NO implementa**: define el trabajo.

---

## 1. Diagnóstico

El refactor quedó sólido (Repository pattern, DRY en catálogo, i18n con paridad, ESLint
anti-acoplamiento). Quedan **3 gaps de código** y **1 decisión de producto**: (A) hueco de
cobertura — `CatalogListBase` y los `*-list.component` no tienen specs; (B) Fase 5 sin cerrar —
`dashboard-home.config.ts` mezcla clases Tailwind en los datos, `Record<string,...>` sin tipar, y
`dashboard-home.component.ts` (239 líneas) tiene template inline; (C) optimización opcional —
budget de bundle (546 kB > 500 kB) y `p-paginator` diferido. Todo es **solo SPA, con mocks
activos**; ningún cambio toca contratos HTTP ni backend. Las decisiones de dominio (`advisorId`,
complejidad de password 8 vs 12) se dejan FUERA de scope de código (ver §4).

---

## 2. Plan de tareas

- [ ] **Fase A — Cobertura de tests de catálogo** (prioridad alta: calidad)
  - [ ] A1. Crear spec de `CatalogListBase` (paginación + filtros) con host de prueba
  - [ ] A2. Crear `student-list.component.spec.ts`
  - [ ] A3. Crear `professor-list.component.spec.ts`
- [ ] **Fase B — Cerrar Fase 5 (design system / presentación)**
  - [ ] B1. Sacar Tailwind de `dashboard-home.config.ts` → `tone` + tipar por `RoleType`
  - [ ] B2. Extraer template inline de `dashboard-home.component.ts` a `.html`
- [ ] **Fase C — Optimización (opcional, baja prioridad)**
  - [ ] C1. Resolver warning de budget de bundle
  - [ ] C2. Migrar paginación de `CatalogListBase` a `p-paginator`

---

## 3. Prompts de ejecución

---
### PROMPT DE EJECUCIÓN — Fase A: Cobertura de tests de catálogo

**Rol:** Implementador SPA (tests, Vitest)

**Contexto mínimo a cargar:**
- `sapcyti-spa/src/app/features/academic-catalog/components/catalog-list.base.ts`
- `sapcyti-spa/src/app/features/academic-catalog/components/student-list/student-list.component.ts`
- `sapcyti-spa/src/app/features/academic-catalog/components/professor-list/professor-list.component.ts`
- `sapcyti-spa/src/app/features/academic-catalog/components/professor-registration/professor-registration.component.spec.ts` (patrón de harness a imitar)
- `sapcyti-spa/src/app/features/academic-catalog/services/student.service.ts`
- `sapcyti-spa/src/app/features/academic-catalog/services/professor.service.ts`
- `sapcyti-spa/src/app/models/page-response.model.ts`

**Objetivo único:** cubrir con tests la lógica de paginación/filtros de `CatalogListBase` y de los dos componentes de listado que hoy no tienen spec.

**Scope IN:**
- Nuevo `catalog-list.base.spec.ts` (junto al `.base.ts`) con un componente host mínimo de prueba que extienda `CatalogListBase`.
- Nuevo `student-list.component.spec.ts` y `professor-list.component.spec.ts`.
- Mockear el `StudentService`/`ProfessorService` con `vi.fn()` devolviendo `of(PageResponse<...>)`.

**Scope OUT (no tocar):**
- Lógica de producción (`catalog-list.base.ts`, componentes, servicios, repositorios). Si un test revela un bug, REPÓRTALO y detente; no lo arregles en esta fase.
- Registration components y sus specs (ya cubiertos).
- Backend, i18n, dashboard.

**Dependencias / prerequisitos:** ninguna; mocks de datos vía mock del servicio (no tocar `environment`).

**Instrucciones paso a paso:**
1. **A1** — `catalog-list.base.spec.ts`: define un host `class TestListComponent extends CatalogListBase<{ id: number }>` con un `filters` mínimo (`fb.group({ search: [''] })`) y un `fetchItems()` que delegue a un spy. Cubre:
   - `ngOnInit` dispara `load()` una vez.
   - `load()` éxito → setea `items`, `totalElements`, `loading=false`, `loadError=false`.
   - `load()` error → `items=[]`, `loadError=true`, `loading=false`.
   - `applyFilters()` resetea `page` a 0 y recarga.
   - `clearFilters()` resetea el form y recarga.
   - `nextPage()` no avanza si `(page+1)*pageSize >= totalElements`; sí avanza y recarga en caso contrario.
   - `previousPage()` no retrocede en `page=0`; sí retrocede y recarga.
   - Verifica que cada navegación incrementa el conteo de llamadas a `fetchItems`.
2. **A2** — `student-list.component.spec.ts`: con `TestBed`, `provideRouter([])`, `TranslateModule.forRoot()`, y `{ provide: StudentService, useValue: { listStudents: vi.fn(() => of(page)) } }`. Verifica:
   - Render inicial llama `listStudents` con `page:0, size:10`.
   - El mapeo de filtros usa `parseProgramTypeFilter`/`parseActiveFilter` (filtro `programType='MAESTRIA'` y `active='true'` llegan tipados; `''` → `undefined`).
   - `search` se hace `.trim()` y `''` → `undefined`.
3. **A3** — `professor-list.component.spec.ts`: equivalente a A2 con `ProfessorService.listProfessors`, **sin** `programType`.

**Convenciones obligatorias:**
- Vitest (`describe`/`it`/`expect`/`vi`), igual que `professor-registration.component.spec.ts`.
- Componentes standalone se importan directo en `imports`. `NoopAnimationsModule` si hace falta.
- No usar `any`; tipar los `PageResponse` de prueba.
- Nombres de archivo y ubicación: junto al archivo bajo prueba.

**Contratos técnicos:**
- `PageResponse<T> = { content: T[]; totalElements; totalPages; size; number }`.
- `StudentService.listStudents(query)` / `ProfessorService.listProfessors(query)` → `Observable<PageResponse<Item>>`.
- Query alumno: `{ page, size, search?, programType?, active? }`; profesor: sin `programType`.

**Criterios de aceptación (Definition of Done):**
- [ ] Existen los 3 specs nuevos y cubren los casos listados
- [ ] `pnpm test` verde con conteo de tests **mayor** que 126 (reportar nuevo total)
- [ ] `pnpm run lint` y `ng build` verdes
- [ ] Cero cambios en archivos de producción (git diff solo muestra specs nuevos)

**Protocolo de ejecución:**
- Procesa A1 → A2 → A3, UNA tarea a la vez.
- Tras cada una: resume archivos creados, muestra checklist, corre `pnpm test`, detente y espera "Proceed".

**Si te bloqueas:**
- Primero relee `professor-registration.component.spec.ts` para el setup exacto de `TestBed`.
- NO asumas la firma del `PageResponse`: léela en `models/page-response.model.ts`.
- Si `CatalogListBase` es `@Directive()` abstracta y Vitest se queja al instanciarla, crea el host concreto en el propio spec; no modifiques la base.

---
### PROMPT DE EJECUCIÓN — Fase B: Cerrar Fase 5 (design system)

**Rol:** Implementador SPA

**Contexto mínimo a cargar:**
- `sapcyti-spa/src/app/features/dashboard/dashboard-home.config.ts`
- `sapcyti-spa/src/app/features/dashboard/dashboard-home/dashboard-home.component.ts`
- `sapcyti-spa/src/app/shared/components/stat-card/stat-card.component.ts`
- `sapcyti-spa/src/app/models/role-type.model.ts`
- `sapcyti-spa/src/app/shell/shell-menu.config.ts` (para `resolveShellMenuRole`)

**Objetivo único:** separar presentación (clases Tailwind) de los datos de las tarjetas del dashboard y tipar el mapa por `RoleType`, sin cambiar el render visual.

**Scope IN:**
- En `dashboard-home.config.ts`: reemplazar los 5 campos de clase (`iconBgClass`, `iconColorClass`, `valueColorClass`, `linkColorClass`, `badgeClass`) por **un solo** campo semántico `tone: CardTone` (p. ej. `'primary' | 'secondary' | 'warning' | 'info'`). Tipar `DASHBOARD_CARDS_BY_ROLE` como `Partial<Record<RoleType, DashboardCard[]>>` (o `Record<RoleType, ...>`).
- En `stat-card.component.ts`: recibir `tone` como input y mapear internamente `tone → {iconBgClass, iconColorClass, valueColorClass, linkColorClass, badgeClass}` mediante un objeto de mapeo (la presentación vive aquí, no en los datos).
- Actualizar el binding en `dashboard-home.component.ts` (bloque `@for` de `app-stat-card`) para pasar `[tone]="card.tone"` en vez de las 5 clases.
- **B2:** extraer el `template` inline de `dashboard-home.component.ts` a `dashboard-home.component.html` (`templateUrl`), sin cambiar el markup.

**Scope OUT (no tocar):**
- Claves i18n, rutas, lógica de roles (`resolveShellMenuRole`), datos (icon/value/labelKey/linkRoute).
- Otros componentes que usen `StatCardComponent` fuera del dashboard (si los hay, mantener compatibilidad: el mapeo `tone` es aditivo).
- Tests de catálogo (Fase A), backend.

**Dependencias / prerequisitos:** idealmente tras Fase A (para que la suite verde valide que no hay regresión visual indirecta). No estrictamente bloqueante.

**Instrucciones paso a paso:**
1. **B1a** — Define `type CardTone` y refactoriza la interfaz `DashboardCard` (quita los 5 `*Class`, añade `tone`). Ajusta los arrays `*_CARDS` mapeando cada combinación de clases actual a su `tone` equivalente (documenta el mapeo en un comentario).
2. **B1b** — En `StatCardComponent`, añade input `tone` y un mapa `const TONE_CLASSES: Record<CardTone, {...}>` que reproduzca EXACTAMENTE las clases actuales. Deriva las clases con `computed()`.
3. **B1c** — Tipar `DASHBOARD_CARDS_BY_ROLE` con `RoleType`. Actualiza `dashboard-home.component.ts` para el nuevo binding.
4. **B2** — Mueve el template a `dashboard-home.component.html`, cambia `template:` por `templateUrl:`. Markup idéntico.
5. Verifica visualmente (o por snapshot de clases en un spec ligero opcional) que las tarjetas COORDINATOR/PROFESSOR/ASSISTANT/SPEAKER se ven igual.

**Convenciones obligatorias:**
- `ChangeDetectionStrategy.OnPush`, signals/`computed`, sin `any`.
- Tailwind tokens existentes (`bg-primary-container`, `text-warning`, etc.); **no inventar** clases nuevas.
- Tipos desde `models` vía barrel.

**Contratos técnicos:**
- `RoleType` (de `models/role-type.model.ts`): `SYSTEM_ADMIN | COORDINATOR | ASSISTANT | PROFESSOR | STUDENT | SPEAKER`.
- Mapeo `tone` de referencia (derivado del config actual): `primary` = `bg-primary-container/text-primary/text-primary/text-primary hover:text-primary-hover`; `secondary`, `warning`, `info` análogos a los bloques existentes.

**Criterios de aceptación (Definition of Done):**
- [ ] `dashboard-home.config.ts` no contiene ninguna clase CSS (solo datos + `tone` + keys)
- [ ] `DASHBOARD_CARDS_BY_ROLE` tipado con `RoleType` (sin `Record<string,...>`)
- [ ] `dashboard-home.component.ts` usa `templateUrl`; el `.html` contiene el markup sin cambios
- [ ] Render visual idéntico (verificación manual `ng serve` o spec de clases)
- [ ] `pnpm run lint`, `pnpm test`, `ng build` verdes
- [ ] TD-008 marcado como resuelto en `TECH_DEBT.md`

**Protocolo de ejecución:**
- B1 (pasos 1–3) como una unidad → validar → pausar → "Proceed" → B2.
- Tras cada unidad: resume cambios, checklist, comandos verdes, detente.

**Si te bloqueas:**
- Si `StatCardComponent` se usa en otro lugar con las clases directas, mantén los inputs viejos como deprecados temporalmente o migra todos los call-sites; REPORTA antes de elegir.
- NO cambies los valores de las clases al mapear: copia textual desde el config actual.
- NO toques claves i18n ni `linkRoute`.

---
### PROMPT DE EJECUCIÓN — Fase C: Optimización (opcional)

**Rol:** Implementador SPA

**Contexto mínimo a cargar:**
- `sapcyti-spa/angular.json` (sección `budgets`)
- `sapcyti-spa/src/app/features/academic-catalog/components/catalog-list.base.ts`
- `sapcyti-spa/src/app/features/academic-catalog/components/student-list/student-list.component.html`
- `sapcyti-spa/src/app/features/academic-catalog/components/professor-list/professor-list.component.html`

**Objetivo único:** eliminar el warning de budget y modernizar la paginación con `p-paginator`, sin alterar comportamiento.

**Scope IN:**
- **C1:** decidir entre (a) subir `maximumWarning`/`maximumError` del budget `initial` en `angular.json` a un valor justificado (~600 kB) con comentario, o (b) lazy-loading adicional de módulos PrimeNG pesados. Elegir (a) salvo que (b) sea trivial.
- **C2:** sustituir los botones manuales `previousPage/nextPage` por `p-paginator` en ambos `*-list.component.html`, adaptando `CatalogListBase` para exponer los handlers que `p-paginator` requiere (`onPageChange(event)` con `first/rows`). Mantener `pageSize=10`.

**Scope OUT (no tocar):** servicios, repositorios, mocks, dashboard, i18n salvo claves nuevas de paginación si `p-paginator` las necesita.

**Dependencias / prerequisitos:** Fase A completada (los specs de lista deben seguir verdes tras C2; ajústalos si cambia la API de paginación).

**Instrucciones paso a paso:**
1. **C1** — Ajusta budget o split; documenta la razón. Verifica `ng build` sin warning.
2. **C2** — Refactoriza `CatalogListBase` para `p-paginator` (`first` derivado de `page*pageSize`, `totalRecords=totalElements`). Actualiza los dos HTML. Actualiza specs de Fase A.

**Convenciones obligatorias:** PrimeNG, OnPush, signals; sin `any`.

**Contratos técnicos:** `p-paginator` emite `{ first, rows, page, pageCount }`; derivar `page = first / rows`.

**Criterios de aceptación (Definition of Done):**
- [ ] `ng build` sin warning de budget (o budget justificado en `angular.json` con comentario)
- [ ] Paginación funciona en ambos catálogos vía `p-paginator`
- [ ] Specs de Fase A actualizados y verdes; `pnpm run lint` verde
- [ ] TD-005 actualizado en `TECH_DEBT.md`

**Protocolo de ejecución:** C1 → validar → pausar → "Proceed" → C2. Una tarea a la vez.

**Si te bloqueas:**
- Si `p-paginator` obliga a cambiar la firma de `CatalogListBase`, primero ajusta la base y SUS specs (Fase A), luego los HTML.
- NO cambies `pageSize` ni el contrato del servicio.

---

## 4. Riesgos y orden

**Orden recomendado:** **A → B → C**.
- **A primero** porque es deuda de calidad pura (sin riesgo de regresión: solo añade specs) y porque deja red de seguridad para B y C.
- **B** después: cambio de presentación con riesgo visual bajo si se copian las clases textualmente.
- **C es opcional**; si se hace, va al final porque C2 modifica `CatalogListBase` y depende de los specs de A.

**Riesgos:**
- **A1:** `CatalogListBase` es `@Directive()` abstracta — instanciarla directo falla; el host de prueba debe ser una subclase concreta dentro del spec.
- **B1:** riesgo de **divergencia visual** si el mapeo `tone→clases` no es textual. Mitigación: copiar las clases exactas y, si es posible, un spec que afirme las clases resultantes por `tone`.
- **B / StatCardComponent compartido:** si otros consumidores usan los inputs `*Class`, hay riesgo de romperlos. Mitigación: el ejecutor debe buscar call-sites antes de eliminar inputs y reportar.
- **C2:** cambia la API de paginación → puede romper specs de A si no se actualizan en la misma tarea.
- **Transversal:** budget warning **no** bloquea build; no urge. No subir el budget sin justificar (oculta crecimiento real del bundle).

**Fuera de scope — decisiones de producto (NO ejecutar como código):**
- `advisorId` en alta de alumno: presente en `Docs/sdd/domain/schemas/academic-management.schema.json` y `student_registration.feature`, ausente en SPEC-016A/SPA. Requiere decisión PO antes de tocar el wizard/DTO.
- Complejidad de contraseña: SPA usa `minLength(8)`; el dominio pide 12 mixtos. Alinear solo tras decisión y actualización de la spec correspondiente. El ejecutor debe **marcar el gap**, no cambiarlo unilateralmente.

**Prompt alternativo (corto, si el contexto ya está cargado):**

> "Ejecuta la Fase A de `mejoras2.md`: crea `catalog-list.base.spec.ts` (host concreto que extiende
> la base; cubre load éxito/error, applyFilters, clearFilters, nextPage/previousPage con guardas) y
> los specs `student-list`/`professor-list` mockeando el servicio con `of(PageResponse)`. Una tarea a
> la vez, sin tocar producción, `pnpm test` verde con total > 126. Detente tras cada spec."
