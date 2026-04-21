# SAPCyTI — SPA Frontend

> Sistema de Administración de Posgrado del PCyTI — Universidad Autónoma Metropolitana, Unidad Iztapalapa

## Overview

Single Page Application (SPA) for the SAPCyTI graduate program management portal. Built with **Angular** following a **feature module** architecture with lazy loading.

## Architecture

- **Pattern:** Feature Modules with Lazy Loading
- **Core/Shared Module pattern** for reusable services and components
- **Multi-tenant support** via `X-Graduate-Id` HTTP header injection
- **Full documentation:** [Architecture.md](../Docs/Design/Architecture.md)

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Angular 17+ |
| **Language** | TypeScript 5.x (strict mode) |
| **Styling** | SCSS |
| **HTTP** | Angular HttpClient |
| **Linting** | ESLint + @angular-eslint |
| **Testing** | Karma + Jasmine |
| **Coverage** | istanbul/nyc |

## Prerequisites

See [PREREQUISITES.md](../sapcyti-api/PREREQUISITES.md) for required tools and versions.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
ng serve

# 3. Open in browser
# http://localhost:4200
```

## Development

```bash
# Run linter
ng lint

# Run tests
ng test

# Run tests with coverage
ng test --code-coverage

# Build for production
ng build --configuration production

# Security audit
npm audit --audit-level=critical
```

## Project Structure

```
src/app/
├── core/                   # Singleton services (TenantContext, Interceptors)
│   ├── services/
│   └── interceptors/
├── shared/                 # Reusable components, pipes, directives
│   ├── components/
│   └── services/
├── features/               # Feature modules (lazy-loaded)
│   ├── dashboard/
│   └── program-selection/
└── shell/                  # Layout (top bar, sidebar, content area)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on branching, commits, PRs, and code standards.

## License

MIT — See [LICENSE](LICENSE)
