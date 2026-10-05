import packageJson from '../../../../package.json';

/**
 * Versión semántica de SAPCyTI leída desde package.json.
 * Fuente única de verdad centralizada para la aplicación.
 */
export const APP_VERSION = packageJson.version;
