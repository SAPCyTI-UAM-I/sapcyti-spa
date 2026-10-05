# SAPCyTI Frontend — Mock & Feature Flag Reference

> Use this guide before adding or modifying mock behavior in the Angular SPA.

---

## Source of Truth

Mock feature flags are centralized in:

- **`src/app/core/mocks/mock.config.ts`** — `AppMockConfig` type and defaults.

The app receives environment-specific flags from:

- **`src/environments/environment.ts`** — Development defaults.
- **`src/environments/environment.prod.ts`** — Production. Mocks must be `false` here.

The root provider is registered in `src/app/app.config.ts`:

```ts
provideAppMockConfig(environment.mocks)
```

---

## How Auth Mock Works

Fake API behavior lives in `src/app/core/auth/auth.mock.ts`.

The login service reads the flag at injection time:

```ts
private readonly useMock = injectMockEnabled('auth');
```

| Flag | Behavior |
|------|----------|
| `auth: true` | Uses `mockLogin()` and `mockRequestPasswordReset()` |
| `auth: false` | Calls real backend at `environment.apiBaseUrl` |
| `passwordRecovery: true` | Renders the recovery flow visually without a backend |
| `passwordRecovery: false` | Calls real backend for password recovery |

> **Design intent**: `passwordRecovery` is separate because HU-02 backend integration is out of scope for early phases. This lets the visual flow remain testable without a real API.

---

## Toggle Mocks

```ts
// src/environments/environment.ts — use mocks locally
mocks: { auth: true, passwordRecovery: true }

// src/environments/environment.ts — use real API locally
mocks: { auth: false, passwordRecovery: true }

// src/environments/environment.prod.ts — never mock in production
mocks: { auth: false, passwordRecovery: false }
```

---

## Adding a New Mock Feature

Follow this pattern exactly to maintain consistency:

1. **Add the flag** to `AppMockConfig` and `DEFAULT_APP_MOCK_CONFIG` in `mock.config.ts`.
2. **Mirror the flag** in both environment files.
3. **Create mock data** next to the real feature service:
   ```
   src/app/features/<domain>/<domain>.mock.ts
   src/app/core/<domain>/<domain>.mock.ts
   ```
4. **Read the flag** in the real service:
   ```ts
   private readonly useMock = injectMockEnabled('<feature>');
   ```
5. **Branch only at the service boundary**. Components must not know if data is mocked, except when displaying a demo helper (like the pre-filled credentials hint on the login page).
6. **Write focused tests**:
   - Mock helper behavior in isolation.
   - Service using real HTTP when the flag is `false`.
   - Service using mock data when the flag is `true`.

---

## Validation

```bash
pnpm run lint
pnpm run test
pnpm run build
```
