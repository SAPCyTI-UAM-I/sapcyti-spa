# SAPCyTI Mock Configuration Guide for Agents

Use this guide before adding or changing mock behavior in the SPA.

## Source of Truth

Mock feature flags are centralized in:

- `src/app/core/mocks/mock.config.ts`

The app receives environment-specific mock flags in:

- `src/environments/environment.ts`
  Development defaults. Auth mock is currently enabled here.
- `src/environments/environment.prod.ts`
  Production defaults. Mocks must stay disabled here unless explicitly required.

The root provider is registered in:

- `src/app/app.config.ts`

```ts
provideAppMockConfig(environment.mocks)
```

## How Auth Mock Works

Auth mock data and fake API behavior live in:

- `src/app/core/auth/auth.mock.ts`

The login service checks the centralized config:

```ts
private readonly useMock = injectMockEnabled('auth');
```

When `auth` is `true`, `AuthStateService` uses:

- `mockLogin(email, password)`
- `mockRequestPasswordReset(email)`

When `auth` is `false`, `AuthStateService` calls the real backend using
`environment.apiBaseUrl`.

The login page also reads `injectMockEnabled('auth')` to decide whether to show
the demo-account helper.

## Toggle Mocks

To use mocked auth locally:

```ts
// src/environments/environment.ts
mocks: {
  auth: true,
}
```

To call the real API locally:

```ts
// src/environments/environment.ts
mocks: {
  auth: false,
}
```

Production config should remain:

```ts
// src/environments/environment.prod.ts
mocks: {
  auth: false,
}
```

## Adding a New Mock Feature

1. Add the feature flag to `AppMockConfig` and `DEFAULT_APP_MOCK_CONFIG` in
   `src/app/core/mocks/mock.config.ts`.
2. Add the same flag to `mocks` in both environment files.
3. Create feature mock data near the real feature service, for example:
   `src/app/features/enrollment/enrollment.mock.ts` or
   `src/app/core/<domain>/<domain>.mock.ts`.
4. In the real service, read the flag with:

```ts
private readonly useMock = injectMockEnabled('<feature>');
```

5. Branch only at the service boundary. Components should not know whether data
   is mocked unless they need to display a demo helper.
6. Add focused tests for:
   - the mock helper behavior;
   - the service using real HTTP when the flag is false;
   - the service using mock data when the flag is true.

## Validation

Run after changing mock configuration:

```bash
pnpm run lint
pnpm run test
pnpm run build
```
