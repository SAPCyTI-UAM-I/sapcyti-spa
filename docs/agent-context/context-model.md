# Modelo de contexto

Flujo: tarea → guía pequeña → área → instrucciones locales → procedimiento → búsqueda → símbolos → pocos archivos → implementar → verificar.

## Niveles

| Nivel | Qué | Dónde |
|-------|-----|-------|
| **L0** bootstrap | Propósito, límites, navegación, verify | `AGENTS.md` |
| **L1** área | Solo si “qué es distinto aquí” | `docs/agent-context/core.md`, `docs/agent-context/academic-catalog.md` |
| **L2** procedimiento | When/Goal/Steps/Verify | `.agents/skills/*/SKILL.md` |
| **L3** evidencia | Código, specs, endpoints, i18n | `src/**`, `API_ENDPOINTS`, `*.spec.ts` |

L3 se detecta desde L0 (paths canónicos + golden example). No hace falta leer todos los features para hallar L3.

## Tipos de conocimiento

| Tipo | Ejemplos | Estabilidad |
|------|----------|-------------|
| **Knowledge** | Ownership UEA en catalog; placeholders enrollment | Estable |
| **Procedure** | nueva-pantalla, i18n-claves, registrar-endpoint | Estable |
| **Constraint** | No cross-feature; no useMock en UI; §0 only | Estable |
| **Verification** | `ng test --include`, `i18n:sync`, `lint` | Estable |
| **Ephemeral** | coverage HTML, dist, logs de un run | Efímero — no documentar como verdad |

## Coste de cargar

| Coste | Artefacto |
|-------|-----------|
| Tiny | `AGENTS.md`, un SKILL, nota L1 |
| Small | §0 conventions (~40 líneas), un componente+spec |
| Medium | `api-endpoints.ts`, un feature routes+repos |
| Large | Un feature completo; `DESIGN_SYSTEM.md` |
| Very large | conventions entero; ambos conventions; `node_modules` |

## Ruido

| Path | Cuándo mirarlo |
|------|----------------|
| `node_modules/` | Nunca para negocio; solo depurar dependencia rota |
| `dist/` | Solo fallo de build/deploy |
| `coverage/` | Solo investigar hueco de cobertura CI |
| `test-results/` | Solo fallo e2e local |
| `.angular/` | Cache CLI — ignorar |

## Automatización (sin implementar nada nuevo)

| Must remain documentation | Could become automated | Already automated |
|---------------------------|------------------------|-------------------|
| Ownership, “si cambio X”, golden path | Checklist PR agente | `i18n:check` en lint |
| Cuándo no cargar conventions | Generar mapa de rutas | ESLint `no-cross-feature-imports` |
| Placeholders vs features reales | — | Prettier check en lint |
| Recomendaciones external-tools | — | CI workflows en `.github/` |

## Una fuente de verdad

Enlaza; no copies reglas de conventions a AGENTS ni a skills. Si el código contradice un doc, gana el código y actualiza el doc corto.
