export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
  mocks: {
    /** Set to false to call the real API at apiBaseUrl. */
    auth: false,
    /** Use backend HU-02 by default; switch to true only for local mock demos. */
    passwordRecovery: false,
  },
};
