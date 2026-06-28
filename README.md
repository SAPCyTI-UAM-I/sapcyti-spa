# SAPCyTI SPA

Este proyecto fue generado con [Angular CLI](https://github.com/angular/angular-cli) versión 21.2.10.

## Configuración inicial del entorno

**1. Instalar NVM (Node Version Manager)**

**2. Instalar y configurar Node.js 22**

```bash
nvm install 22
nvm use 22
nvm alias default 22
```

**3. Activar Corepack y pnpm**
Corepack permite gestionar `pnpm` directamente desde Node.js:

```bash
corepack enable pnpm
```

**4. Configurar el directorio global de pnpm**

```bash
pnpm setup
source ~/.zshrc

# o con bash
source ~/.bashrc
```

**5. Instalar Angular CLI globalmente**

```bash
pnpm install -g @angular/cli
ng config -g cli.packageManager pnpm
```

**6. Instalar dependencias del proyecto**

```bash
pnpm install
```

## Servidor de desarrollo

Para iniciar un servidor de desarrollo local, ejecuta:

```bash
ng serve
```

La aplicación estará disponible en [http://localhost:4200/](http://localhost:4200/).

## Generación de código (Scaffolding)

Angular CLI incluye herramientas de generación de código. Para crear un nuevo componente:

```bash
ng generate component nombre-del-componente
```

Para ver la lista completa de esquemas de generación disponibles (como `directives`, `pipes`, o `services`), ejecuta:

```bash
ng generate --help
```

## Formateo (Prettier)

El proyecto usa [Prettier](https://prettier.io/) con [`prettier-plugin-tailwindcss`](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) para formateo consistente de código y ordenamiento automático de clases de Tailwind. La configuración se encuentra en `.prettierrc`.

Para verificar el formato sin modificar archivos:

```bash
pnpm run lint
```

Para aplicar el formato automáticamente:

```bash
pnpm run format
```

## Linting (ESLint)

El proyecto usa [ESLint](https://eslint.org/) con [`@angular-eslint`](https://github.com/angular-eslint/angular-eslint) para análisis estático de código TypeScript y plantillas HTML. La configuración se encuentra en `eslint.config.mjs`.

Incluye la regla local **`sapcyti/no-cross-feature-imports`**, que impide que un feature importe código de otro feature (ver [`conventions.md`](conventions.md) sección 17). `pnpm run lint` también ejecuta Prettier e `i18n:check`.

Para analizar el proyecto:

```bash
ng lint
```

Para corregir automáticamente los errores que ESLint pueda resolver:

```bash
ng lint --fix
```

## Internacionalización (i18n)

Traducciones en `src/assets/i18n/es.json` y `en.json`. El proyecto verifica que ambos archivos tengan **exactamente el mismo conjunto de claves**.

Verificar paridad (incluido en `pnpm run lint`):

```bash
pnpm run i18n:check
```

Ordenar JSON y regenerar tipos TypeScript (`I18nKey` en `src/app/core/i18n/i18n-keys.generated.ts`) tras añadir o renombrar claves:

```bash
pnpm run i18n:sync
```

Script: `scripts/i18n-check.mjs` (flags `--sort`, `--types`). Convenciones detalladas en [`conventions.md`](conventions.md) (sección 10 — i18n).

## Compilación (Build)

Para compilar el proyecto:

```bash
ng build
```

Esto compilará el proyecto y almacenará los artefactos generados en el directorio `dist/sapcyti-spa/browser`.

## Docker / full stack (SPEC-010)

The production image is built from this repo and orchestrated by **`sapcyti-infra/local-dev/docker-compose.stack.yml`** (service `edge`). Clone layout:

```text
SAPCyTI/
├── sapcyti-infra/  ← docker compose -f local-dev/docker-compose.stack.yml up --build
├── sapcyti-api/    ← build context ../../sapcyti-api
└── sapcyti-spa/    ← build context ../../sapcyti-spa
```

### Build edge image only

```bash
docker build -t sapcyti-spa:local .
```

Artifacts: `dist/sapcyti-spa/browser` copied into Nginx; [`docker/nginx/default.conf.template`](docker/nginx/default.conf.template) is rendered at startup via `API_URL` (default `http://api:8080`) and proxies `/api/` to the backend.

### Run with the full stack

From `sapcyti-infra/`:

```bash
cp local-dev/.env.example local-dev/.env   # or Copy-Item on Windows
docker compose -f local-dev/docker-compose.stack.yml up --build
```

Open [http://localhost](http://localhost). Production build uses `apiBaseUrl: '/api'` in [`src/environments/environment.prod.ts`](src/environments/environment.prod.ts) (same-origin via Nginx).

### Optional Playwright shell smoke

With the stack running:

```bash
pnpm exec playwright test e2e/smoke-shell.spec.ts
```

Asserts `[data-testid="app-shell"]` on the root shell container.

## Pruebas unitarias

Para ejecutar las pruebas unitarias utilizando [Vitest](https://vitest.dev/):

```bash
ng test
```

## Pruebas e2e (End-to-End)

Para las pruebas e2e, se debe instalar el navegador firefox para playwright:

```bash
npx playwright install firefox
```

Posteriormente, podremos ejecutar:

```bash
ng e2e
```
