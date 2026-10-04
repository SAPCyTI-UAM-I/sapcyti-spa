---
name: eliminar-modulo
description: Guía exhaustiva para eliminar o podar un módulo o pantalla del SPA sin dejar elementos, rutas, tests o traducciones huérfanos.
---

# Eliminar módulo o pantalla

## When

Eliminar o retirar un feature completo, una ruta/pantalla obsoleta o un placeholder no utilizado en la SPA.

## Goal

Remover completamente el código, dependencias, rutas, accesos de UI, claves de i18n y tests asociados, sin dejar enlaces muertos (404), fallos de lint/Prettier ni aserciones de prueba rotas.

## Checklist de impacto (qué puede quedar huérfano)

Antes y después de eliminar, auditar cada una de estas áreas:

1. **Rutas y Routing**:
   - [ ] `src/app/app.routes.ts`: ruta padre lazy (`loadChildren` / `loadComponent`), breadcrumbs y guards.
   - [ ] `src/app/features/{feature}/{feature}.routes.ts`: archivo de rutas o subrutas eliminadas.
   - [ ] Redirecciones huérfanas: verificar que ninguna otra ruta redirija a la eliminada.

2. **Navegación del Shell (`shell-menu.config.ts`)**:
   - [ ] Constantes de enlace (`*_LINK`).
   - [ ] Secciones e ítems en **todos los roles**: revisar `COORDINATOR_NAV`, `PROFESSOR_NAV`, `STUDENT_NAV`, `ASSISTANT_NAV`, `SPEAKER_NAV`, `SYSTEM_ADMIN_NAV`.
   - [ ] Formateo limpio: si un rol se queda sin secciones, usar `sections: []` sin espacios extras para cumplir Prettier.

3. **Dashboard (`dashboard-home.config.ts`)**:
   - [ ] Tarjetas asociadas en `*_CARDS` y `DASHBOARD_CARDS_BY_ROLE`.
   - [ ] Propiedades `linkRoute`: verificar que las tarjetas activas no enlacen a rutas eliminadas (evita 404 al usuario).
   - [ ] Textos de bienvenida: si el rol queda sin módulos o cambia su propósito, ajustar `HOME.{ROLE}.SUBTITLE` en lugar de dejar texto incongruente o cadenas vacías `""`.

4. **Políticas de Autorización / RBAC (`rbac.policy.ts`)**:
   - [ ] Entradas en `ROUTE_PERMISSIONS`: remover la clave de la ruta borrada.
   - [ ] Roles huérfanos: ajustar si un rol ya no tiene funciones en la aplicación.

5. **Pruebas unitarias (`*.spec.ts`)**:
   - [ ] `src/app/shell/shell-menu.config.spec.ts`: actualizar o remover tests que esperan rutas del módulo eliminado para cada rol.
   - [ ] Specs de dashboard y auth guards si referencian rutas eliminadas.
   - [ ] Eliminar los specs propios del feature junto con sus componentes.

6. **Traducciones e i18n (`src/assets/i18n/`)**:
   - [ ] Remover claves en `es.json` **y** `en.json`:
     - Namespace completo del módulo (`{FEATURE}.*`).
     - Placeholders (`{FEATURE}.PLACEHOLDER.*`).
     - Breadcrumbs (`BREADCRUMB.{ROUTE}`).
     - Elementos del menú (`SHELL.MENU.{ITEM}`, `SHELL.SECTIONS.{SECTION}`).
     - Tarjetas del dashboard (`DASHBOARD.CARDS.{CARD}`, `DASHBOARD.CARDS.{LINK}`).
   - [ ] Ejecutar `pnpm run i18n:sync` para ordenar archivos y regenerar `i18n-keys.generated.ts`.

7. **Capa de Datos, Modelos y Mocks**:
   - [ ] `src/app/core/api/api-endpoints.ts`: remover endpoints de `API_ENDPOINTS` que solo usaba este módulo.
   - [ ] `src/app/core/api/data-layer.providers.ts`: remover tokens y providers DI huérfanos.
   - [ ] `src/app/models/`: eliminar modelos exclusivos y su export en `models/index.ts`.
   - [ ] Mocks locales o en `shared/mocks/` exclusivos del módulo.

8. **Documentación del SPA**:
   - [ ] `docs/architecture/index.md` y `docs/architecture/repository-map.md`: remover o actualizar filas que mencionan el módulo.

## Steps

1. **Búsqueda de referencias (Grep)**:

   ```bash
   git grep -i "{nombre-modulo}"
   git grep "{ruta-a-eliminar}"
   ```

   Identificar todos los archivos que consumen la ruta, el componente o sus claves i18n.

2. **Remover archivos de código**:
   Eliminar la carpeta `src/app/features/{feature}/` (o componente/subruta específica).

3. **Limpiar configuración de rutas y navegación**:
   - Desconectar de `app.routes.ts`.
   - Desconectar de `shell-menu.config.ts` (revisando todos los roles).
   - Retirar tarjetas o actualizar enlaces en `dashboard-home.config.ts`.
   - Remover permisos en `rbac.policy.ts`.

4. **Limpiar capa de datos y modelos**:
   Remover endpoints en `api-endpoints.ts`, providers en `data-layer.providers.ts` y tipos en `models/`.

5. **Limpiar i18n**:
   Eliminar claves no utilizadas en `es.json` y `en.json`. Ejecutar:

   ```bash
   pnpm run i18n:sync
   ```

6. **Actualizar o podar tests**:
   Actualizar `shell-menu.config.spec.ts` y cualquier otro test que aserte sobre rutas eliminadas.

## Verification

Ejecutar obligatoriamente en este orden:

```bash
# 1. Tests afectados (navegación, dashboard, auth)
pnpm exec ng test --no-watch --include=src/app/shell/shell-menu.config.spec.ts

# 2. Lint completo (ESLint + Prettier + i18n:check)
pnpm run lint

# 3. Compilación limpia de producción (sin chunks rotos ni imports huérfanos)
pnpm exec ng build
```

## Common mistakes

- **Olvidar roles secundarios en el menú**: Limpiar solo `COORDINATOR` y dejar enlaces rotos en `SPEAKER`, `ASSISTANT` o `SYSTEM_ADMIN`.
- **No actualizar los tests de navegación**: Modificar `shell-menu.config.ts` pero olvidar actualizar las aserciones en `shell-menu.config.spec.ts`.
- **Dejar tarjetas en el dashboard con enlaces muertos**: Dejar `linkRoute` apuntando a una ruta que ahora redirige a 404 (`not-found`).
- **Espacios en blanco en arrays vacíos**: Poner `sections: [   ],` en lugar de `sections: []`, lo que hace fallar el paso de Prettier en `pnpm run lint`.
- **Traducciones huérfanas**: Borrar componentes y rutas pero dejar bloques enteros de traducción muertos en `es.json` y `en.json`.
- **No ejecutar `pnpm run i18n:sync`**: Dejar `src/app/core/i18n/i18n-keys.generated.ts` desincronizado con respecto a los archivos JSON.
