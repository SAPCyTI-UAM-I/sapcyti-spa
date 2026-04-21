# Contributing to SAPCyTI SPA

Thank you for contributing to the SAPCyTI project! This guide ensures consistency across the team, especially important given our rotating student developers (CON-6).

## Branching Model (GitFlow)

```
main          ← production-ready releases
  └── release/*   ← release candidates
develop       ← integration branch (all features merge here)
  └── feature/*   ← new features
  └── fix/*       ← bug fixes
  └── hotfix/*    ← urgent production fixes (from main)
```

### Branch naming

- `feature/HU-XX-short-description` — New features
- `fix/issue-number-short-description` — Bug fixes
- `hotfix/critical-fix-description` — Urgent production fixes
- `release/X.Y.Z` — Release candidates
- `docs/description` — Documentation changes
- `chore/description` — Tooling/config changes

## Commit Messages (Conventional Commits)

All commits **must** follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Allowed types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no logic change) |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding or updating tests |
| `chore` | Build, CI, or tooling changes |
| `perf` | Performance improvement |
| `ci` | CI configuration changes |
| `build` | Build system changes |
| `revert` | Reverts a previous commit |

### Examples

```bash
# ✅ Valid
feat(shell): add graduate program selector dropdown
fix(interceptor): handle missing tenant context
docs: update README with development commands
test(shared): add data-table component specs

# ❌ Invalid
Added new component
Fix bug
update stuff
FEAT: new view
```

## Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes with Conventional Commits
3. Ensure all checks pass:
   - ESLint (no new violations)
   - Unit tests pass (`ng test`)
   - Coverage ≥ 80%
   - `npm audit` passes
4. Push your branch and create a PR to `develop`
5. Fill in the PR template completely
6. Request at least 1 reviewer
7. Address all review comments
8. Merge after approval and CI passes

## Code Standards

- Follow Angular style guide
- 2-space indentation (enforced by `.editorconfig`)
- TypeScript strict mode enabled
- Use `OnPush` change detection where possible
- Lazy-load feature modules
- Test coverage ≥ 80% (enforced by istanbul)

## Questions?

Open an issue with the `question` label or contact the project maintainers.
