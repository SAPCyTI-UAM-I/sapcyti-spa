export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
  mocks: {
    /** Set to false to call the real API at apiBaseUrl. */
    auth: true,
    /** Use backend HU-02 by default; switch to true only for local mock demos. */
    passwordRecovery: false,
    students: true,
    professors: true,
    studentPrograms: true,
    passwordChange: true,
    researchCatalog: true,
    ueas: true,
    annualPlanning: true,
    enrollmentSurvey: true,
    trimestralPlanning: true,
  },
};
