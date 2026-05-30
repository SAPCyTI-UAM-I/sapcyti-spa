# SAPCyTI Design System Guide for Agents

Use this guide before changing UI in this Angular SPA. The goal is simple:
the implementation and the mockups in `design/` must keep the same visual
language, with one source of truth for tokens, spacing, typography and shared
component behavior.

## Current Mockups

Read the relevant mockup before editing or creating UI. Each screen folder has:

- `DESIGN.md`: token snapshot and design notes from the mockup.
- `code.html`: HTML/Tailwind reference for layout, spacing and states.
- `screen.png`: visual reference for final comparison.

Current mockup inventory:

- `design/HU-01-03-inicio-sesion/pagina-principal/`
  Login page.
- `design/HU-01-03-inicio-sesion/recuperar-password/`
  Password recovery form.
- `design/HU-01-03-inicio-sesion/correo-enviado/`
  Password recovery sent state.
- `design/dashboards/alumno/`
  Student dashboard.
- `design/dashboards/profesor/`
  Professor dashboard.
- `design/dashboards/coordinador/`
  Coordinator dashboard.
- `design/dashboards/asistente/`
  Assistant dashboard.

## Source of Truth

Start here when a design token changes:

- `src/app/core/theme/design-tokens.ts`
  Canonical TypeScript token definitions for palette values used by PrimeNG.
- `src/app/core/theme/sapcyti-preset.ts`
  PrimeNG theme preset. Import token scales here instead of hardcoding colors.
- `src/styles.css`
  Tailwind v4 `@theme` tokens and global component overrides. Keep this file in
  sync with `design-tokens.ts`.

For UI components, prefer the shared components and layouts:

- `src/app/shared/components/auth-page-layout/`
  Auth page shell: centered card, language switcher position, footer slot.
- `src/app/shared/components/auth-footer/`
  Auth footer links and copyright.
- `src/app/shared/components/language-switcher/`
  `ES | EN` language control used by auth and shell.
- `src/app/shared/components/stat-card/`
  Dashboard stat card pattern.
- `src/app/shared/components/shell-sidebar-nav/`
  Desktop sidebar container.
- `src/app/shared/components/shell-sidebar-link/`
  Sidebar item/link styling.
- `src/app/shell/shell-mobile-drawer.component.ts`
  Mobile drawer version of the sidebar.
- `src/app/shell/shell.component.html`
  App shell topbar and content spacing.

## Dependencies and UI Stack

Check `package.json` and `README.md` before adding any dependency. Current UI
building blocks include:

- Angular standalone components.
- Tailwind CSS v4 via `@theme` tokens in `src/styles.css`.
- PrimeNG 21 and `@primeuix/themes`.
- PrimeIcons.
- `@ngx-translate/core` for visible strings.

Do not add another styling system unless the user explicitly asks and the
existing stack cannot solve the problem.

## Workflow Before Editing UI

1. Identify the closest existing mockup in `design/`.
2. Open its `DESIGN.md`, `code.html` and `screen.png`.
3. Map mockup tokens to the SPA tokens in `design-tokens.ts` and `styles.css`.
4. Reuse or update shared components before styling one-off screens.
5. Add new token names only when the mockup introduces a real reusable concept.
6. Keep visible strings in `src/assets/i18n/es.json` and `src/assets/i18n/en.json`.
7. Run validation:
   - `pnpm run lint`
   - `pnpm run test`
   - `pnpm run build`

## Styling Rules

- Prefer token classes: `bg-surface`, `text-on-surface`, `text-text-secondary`,
  `border-outline`, `bg-primary-container`, `text-warning`, etc.
- Avoid raw Tailwind palette classes such as `text-blue-600`, `bg-amber-100`,
  `text-teal-700`, unless the token does not exist yet and you are about to add
  it to the token source.
- Avoid hardcoded hex colors inside component templates.
- Keep repeated UI patterns in shared components.
- Use PrimeNG components when already present, but style them through tokens and
  global overrides in `src/styles.css`.
- Match the mockup spacing names where possible: `xs`, `sm`, `md`, `lg`, `xl`,
  `xxl`, `gutter`, `margin`.
- Match the mockup typography names where possible: `caption`, `body-md`,
  `label-md`, `h1`, `h2`, `h3`, `headline-sm`, `headline-md`, `headline-lg`,
  `stat-value`.
- Keep dashboards operational and dense. Do not turn app screens into marketing
  pages.

## Adding a New Mockup

When adding a new screen reference under `design/`, follow the existing shape:

```text
design/<feature-or-flow>/<screen-name>/
  DESIGN.md
  code.html
  screen.png
```

Then update the "Current Mockups" section in this guide so the next agent can
find it.

## Commit Hygiene

If UI changes alter tokens and components together, mention both in the commit.
Example:

```text
feat(ui): align SAPCyTI app with design mockups
```

Include validation results in the PR or handoff notes, especially any build
budget warnings.
