# design/

This folder contains the SAPCyTI frontend design reference.  
It is **tool-agnostic**: AI agents, developers, and reviewers can all use it.

## Documents

| File | Content |
|------|---------|
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | **Start here.** Token system, component catalog, styling rules, mockup workflow, validation steps. |
| [`MOCK_GUIDE.md`](./MOCK_GUIDE.md) | Mock feature flags, environment toggle, pattern for adding new mocks. |

## Screen Mockups

Each screen mockup lives in a subdirectory with three artifacts:

```
design/<feature>/<screen>/
  DESIGN.md     ← token snapshot and layout notes from the mockup
  code.html     ← HTML reference for spacing and states
  screen.png    ← visual target for final comparison
```

### Inventory

| Path | Screen |
|------|--------|
| `HU-01-03-inicio-sesion/pagina-principal/` | Login page |
| `HU-01-03-inicio-sesion/recuperar-password/` | Password recovery form |
| `HU-01-03-inicio-sesion/correo-enviado/` | Recovery sent state |
| `dashboards/alumno/` | Student dashboard |
| `dashboards/profesor/` | Professor dashboard |
| `dashboards/coordinador/` | Coordinator dashboard |
| `dashboards/asistente/` | Assistant dashboard |

When adding a new mockup, update this table and the one in `DESIGN_SYSTEM.md §7`.
