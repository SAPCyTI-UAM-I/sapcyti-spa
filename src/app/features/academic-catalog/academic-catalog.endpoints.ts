import { API_ENDPOINTS } from '../../core/api/api-endpoints';

/** @deprecated Import `API_ENDPOINTS.students` / `API_ENDPOINTS.professors` from `core/api/api-endpoints`. */
export const ACADEMIC_CATALOG_ENDPOINTS = {
  students: API_ENDPOINTS.students,
  professors: API_ENDPOINTS.professors,
} as const;
