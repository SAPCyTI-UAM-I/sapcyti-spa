# SAPCyTI Frontend — Design System Reference

> **Scope**: This document is the single reference for anyone (human or agent) working on the UI of the SAPCyTI Angular SPA. Read it before creating or modifying any component, token, or style.

---

## 1. Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Angular Standalone Components | 21 |
| CSS utility | Tailwind CSS v4 (`@theme` tokens) | 4.x |
| Component library | PrimeNG | 21 |
| Icon set | PrimeIcons | 7 |
| i18n | `@ngx-translate/core` | 17 |
| Type system | TypeScript strict | 5.9 |

**Rule**: Do not add another styling library or icon set. If a visual need exists that can't be met by this stack, open a discussion first.

---

## 2. Token System — Source of Truth

There are **three canonical files** that must stay in sync. Always update them in this order:

```
src/app/core/theme/design-tokens.ts   ← 1. Change values here first
src/styles.css @theme block           ← 2. Mirror the change in Tailwind tokens
src/app/core/theme/sapcyti-preset.ts ← 3. Update PrimeNG preset if a component is affected
```

### 2.1 Palette constants (`design-tokens.ts`)

Four named scales:

| Export | Description | Example tokens |
|--------|-------------|----------------|
| `PRIMARY` | Brand blue | `500: #1E4D7B` |
| `SECONDARY` | Teal accent | `500: #0F766E` |
| `SURFACE` | Neutral grays | `50: #F7F8FA` |
| `SEMANTIC` | Status colors | `error`, `success`, `warning`, `info`, `accent` |

### 2.2 Canonical CSS token names (Tailwind `@theme`)

**Token names do NOT use a `brand-` prefix.** The canonical pattern is:

```css
/* ✅ Canonical */
--color-primary          --color-surface          --color-text-secondary
--color-primary-hover    --color-surface-muted    --color-text-tertiary
--color-on-primary       --color-surface-subtle   --color-outline
--color-primary-container --color-sidebar         --color-sidebar-border

/* ❌ Do not use — these aliases were removed */
--color-brand-primary    --color-brand-surface    --color-brand-text
```

### 2.3 Spacing scale

| Token | Value | Usage |
|-------|-------|-------|
| `spacing-xs` | 4px | Tight inline gaps |
| `spacing-sm` | 8px | Component internal padding |
| `spacing-md` | 16px | Standard padding |
| `spacing-lg` | 24px | Section padding |
| `spacing-xl` | 32px | Page section gaps |
| `spacing-xxl` | 48px | Large layout gaps |
| `spacing-gutter` | 16px | Horizontal page margin |
| `spacing-margin` | 24px | Standard outer margin |

Use token classes: `gap-sm`, `px-lg`, `py-md`, `mt-xs`, etc.  
**Do not use raw Tailwind numbers** (`gap-1`, `px-4`, `mt-2`) unless the token doesn't cover the value.

### 2.4 Typography scale

All fonts use `Inter`. Apply using the composite class (sets font-family, size, line-height, and weight together):

| Class | Size | Weight | Use for |
|-------|------|--------|---------|
| `text-caption font-caption` | 12px / 400 | — | Labels, metadata |
| `text-body-md font-body-md` | 14px / 400 | — | Body copy |
| `text-label-md font-label-md` | 14px / 500 | — | Buttons, nav items |
| `text-h3 font-h3` | 16px / 600 | — | Card titles |
| `text-h2 font-h2` | 20px / 600 | — | Section headers |
| `text-h1 font-h1` | 24px / 600 | — | Page titles |
| `text-headline-sm font-headline-sm` | 16px / 600 | — | Dashboard small headings |
| `text-headline-md font-headline-md` | 20px / 600 | — | Dashboard medium headings |
| `text-headline-lg font-headline-lg` | 24px / 600 | — | Dashboard large headings |
| `text-stat-value font-stat-value` | 28px / 700 | — | KPI numbers |

### 2.5 Radius scale

| Class | Value |
|-------|-------|
| `rounded-sm` | 4px |
| `rounded-md` | 6px |
| `rounded-lg` | 8px |
| `rounded-xl` | 12px |
| `rounded-full` | 9999px |

### 2.6 Catalog badge severities (`design-tokens.ts` → `CATALOG_TAG_SEVERITY`)

Catalog list and detail views use PrimeNG `p-tag` with severities mapped in **`CATALOG_TAG_SEVERITY`** (`src/app/core/theme/design-tokens.ts`). Colors resolve through `sapcyti-preset` → `tag.colorScheme` (SEMANTIC palette).

| Domain value | Tag severity | Visual |
|--------------|--------------|--------|
| Program type Maestría | `maestria` | Teal (brand secondary) |
| Program type Doctorado | `doctorado` | Purple (violet) |
| Student account active | `success` | Green |
| Student account inactive | `secondary` | Gray |
| Program status ACTIVO | `success` | Green |
| Program status BAJA | `warn` | Amber |
| Program status EGRESADO | `info` | Blue |

**Do not hardcode** severities or hex colors on catalog tags. Use `app-catalog-tag` with helpers in `catalog-tag.util.ts`. Program-type colors live in `CATALOG_PROGRAM_TYPE_TAG`.

---

## 3. PrimeNG Preset (`sapcyti-preset.ts`)

The preset extends Lara with the SAPCyTI palette and component overrides.

**Components with custom tokens**: Badge, Tag, Chip, Toast.  
For any other PrimeNG component, consult `node_modules/@primeuix/themes/types/<component>/index.d.ts` for valid token names before adding overrides.

**Strict typing rules**:
- Use `padding` (not `paddingX`/`paddingY`) for badge and tag.
- Use `paddingX` + `paddingY` for chip.
- `font.size` is NOT a valid token in badge root — use Tailwind classes instead.
- `boxShadow` is NOT a valid token in toast root — configure in `styles.css`.

When adding a new component override, always compile with `pnpm run build` to validate types.

---

## 4. Component Catalog

### Shell components (`src/app/shell/`)

| Component | File | Role |
|-----------|------|------|
| `ShellComponent` | `shell.component.ts` | Top-level layout (topbar + sidebar + content) |
| `ShellNavContentComponent` | `shell-nav-content.component.ts` | **Shared** nav links + logout. Used by sidebar and drawer — do not duplicate. |
| `ShellSidebarNavComponent` | `shared/components/shell-sidebar-nav/` | Desktop sidebar wrapper (`<aside>`) |
| `ShellMobileDrawerComponent` | `shell-mobile-drawer.component.ts` | Mobile drawer wrapper (`p-drawer`) |
| `ShellSidebarLinkComponent` | `shared/components/shell-sidebar-link/` | Single nav link with active state |

**Key rule**: Navigation markup lives in `ShellNavContentComponent` **only**. Both the desktop sidebar and the mobile drawer delegate to it. Never copy nav markup into a host component.

### Auth components (`src/app/shared/components/`)

| Component | Role |
|-----------|------|
| `AuthPageLayoutComponent` | Auth page shell (centered card, language switcher, footer slot) |
| `AuthFooterComponent` | Footer links and copyright |
| `LanguageSwitcherComponent` | `ES \| EN` control. Uses `signal<SupportedLanguage>` for reactivity with `OnPush`. |

### Data display (`src/app/shared/components/`)

| Component | Role |
|-----------|------|
| `StatCardComponent` | KPI card with icon, value, label, optional badge and link |
| `FieldErrorComponent` | Validation error message beneath form fields |
| `FeaturePlaceholderComponent` | Empty-state placeholder for unimplemented features |

---

## 5. Input Fields with Icons

**Always use `p-iconfield` + `p-inputicon`** from PrimeNG when an input needs a leading or trailing icon.

```html
<!-- ✅ Correct — p-iconfield handles padding automatically -->
<p-iconfield class="w-full">
  <p-inputicon class="pi pi-search" />
  <input pInputText type="text" class="w-full" />
</p-iconfield>
```

```html
<!-- ❌ Wrong — the .p-inputtext global override resets padding,
     causing the icon to overlap the text -->
<div class="relative">
  <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2"></i>
  <input pInputText class="pl-10" />
</div>
```

The icon color is set via `.p-iconfield .p-inputicon { color: var(--color-text-tertiary); }` in `styles.css`.

---

## 6. Styling Rules

1. **Prefer token classes**: `bg-surface`, `text-on-surface`, `text-text-secondary`, `border-outline`, `bg-primary-container`, `text-warning`, etc.
2. **Avoid raw palette classes**: `text-blue-600`, `bg-amber-100`, `text-teal-700` — unless the token doesn't exist yet and you are adding it.
3. **Avoid hardcoded hex** inside templates.
4. **Keep patterns in shared components** — if you paste the same 3+ lines of markup in two places, extract a component.
5. **Use PrimeNG when available**, but style via tokens and `styles.css` overrides.
6. **Match spacing token names** from section 2.3.
7. **Match typography token names** from section 2.4.
8. **Dashboards are dense** — do not add decorative sections or marketing-style spacing.
9. **All visible strings** go in `src/assets/i18n/es.json` and `en.json`.

---

## 7. Mockup Workflow

Before editing or creating any screen:

1. Check `design/<feature>/<screen>/` for an existing mockup.
2. Open `DESIGN.md` (token snapshot), `code.html` (layout reference), `screen.png` (visual target).
3. Map mockup tokens to the Tailwind token names from section 2.
4. Reuse or update shared components before adding one-off styles.

### Mockup inventory

| Mockup path | Screen |
|-------------|--------|
| `design/HU-01-03-inicio-sesion/pagina-principal/` | Login page |
| `design/HU-01-03-inicio-sesion/recuperar-password/` | Password recovery form |
| `design/HU-01-03-inicio-sesion/correo-enviado/` | Recovery sent state |
| `design/dashboards/alumno/` | Student dashboard |
| `design/dashboards/profesor/` | Professor dashboard |
| `design/dashboards/coordinador/` | Coordinator dashboard |
| `design/dashboards/asistente/` | Assistant dashboard |

### Adding a new mockup

```text
design/<feature-or-flow>/<screen-name>/
  DESIGN.md     ← token snapshot and design notes
  code.html     ← HTML layout reference
  screen.png    ← visual target
```

Then add an entry to the table above.

---

## 8. Validation Before Committing

```bash
pnpm run lint    # ESLint + Prettier check
pnpm run test    # Unit tests
pnpm run build   # Type check + bundle
```

If `build` shows budget warnings, check the initial bundle column — the 500 kB budget applies to the initial load. Lazy chunks are excluded.

---

## 9. Commit Hygiene

```text
feat(ui): <screen or component changed>

# Examples
feat(ui): add enrollment stat card to coordinator dashboard
fix(ui): correct search icon overlap in topbar
refactor(ui): extract ShellNavContentComponent from sidebar and drawer
```

If tokens AND components change together, mention both in the commit message.
