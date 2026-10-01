# Herramientas externas (solo recomendaciones)

No instalar ni cablear desde esta tarea. Evaluación para el equipo.

| Name | Problem solved | Expected benefit | Complexity | Dependency | Infrastructure | Maintenance | Alternative without tooling | Priority |
|------|----------------|------------------|------------|------------|----------------|-------------|-----------------------------|----------|
| Angular MCP (`angular-cli` ya en workspace) | Dudas de API Angular / best practices | Menos alucinación de APIs | Low | MCP Cursor existente | Ninguna extra | Baja | `search_documentation` mental + docs.angular.dev | P2 |
| Engram (`mem_*`) | Continuidad entre sesiones | Menos redescubrimiento | Low | Plugin Engram | Local | Media (guardar selectivo) | Notas en `docs/agent-context/` | P1 |
| ripgrep / búsqueda IDE | Hallar símbolos sin leer árboles | Tokens bajos L3 | Low | Ya en entorno | Ninguna | Nula | `find` + `grep` | P0 |
| Playwright MCP / browser | Verificar UI visible | Cierra definition of done visual | Medium | Browser tools | Display local | Media | Manual en `ng serve` | P2 |
| Copilot/context ignore lists | Excluir `node_modules`/`dist` del índice | Menos ruido | Low | Config IDE | Ninguna | Baja | Disciplina en skills explorar | P1 |
| Generador de mapa de rutas | Derivar tabla “si cambio X” | Menos drift del índice | Medium | Script custom | CI opcional | Media | Mantener `docs/architecture/index.md` a mano | P3 |
| Storybook | Catálogo visual de shared | Aísla UI | High | Dep nueva + CI | Build extra | Alta | `design/` mockups existentes | P3 |
| Nx / monorepo tooling | Límites de libs | Enforcement fuerte | High | Migración repo | CI | Alta | ESLint cross-feature actual | P3 |

**Prioridad práctica:** P0 búsqueda local; P1 Engram + ignore de ruido; P2 Angular MCP y browser solo si la tarea lo pide; P3 no adoptar sin necesidad clara.
