import { API_ENDPOINTS } from '../../core/api/api-endpoints';

/** @deprecated Import `API_ENDPOINTS.userPassword` from `core/api/api-endpoints`. */
export function passwordEndpoint(userId: number): string {
  return API_ENDPOINTS.userPassword(userId);
}
