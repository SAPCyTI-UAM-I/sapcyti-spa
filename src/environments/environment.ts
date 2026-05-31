export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
  mocks: {
    /** Set to false to call the real API at apiBaseUrl. */
    auth: true,
    /** HU-02 backend recovery is out of scope; keep visual flow usable in dev. */
    passwordRecovery: true,
  },
};
