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

## Compilación (Build)

Para compilar el proyecto:

```bash
ng build
```

Esto compilará el proyecto y almacenará los artefactos generados en el directorio `dist/`.

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
