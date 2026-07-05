/**
 * ⚠️ DEMO / SAMPLE DATA — NOT FOR PRODUCTION.
 *
 * Centralized example data so the Academic Offering flow (HU-05, HU-06)
 * can be walked through end-to-end before the real data layer exists. Values
 * mirror the SAPCyTI user manual (§4.2–4.4) so the screens match the documented
 * process.
 *
 * To remove ALL example data: delete this file and the lines that import from
 * it in the academic-offering components (each component falls back to the
 * empty `signal([])` it already declares). Nothing else depends on this module.
 */
import type { AcademicOfferingOption, QuarterlyPlanSubject } from '../../../models';

/** HU-05 — the currently active term shown as "Trimestre actual es". */
export const SAMPLE_CURRENT_TERM = '26O';

/** HU-05 / HU-06 — selectable terms (e.g. 16I). */
export const SAMPLE_TERMS: AcademicOfferingOption[] = [
  { value: '26I', label: '26I — Invierno 2026' },
  { value: '26P', label: '26P — Primavera 2026' },
  { value: '26O', label: '26O — Otoño 2026' },
];

/** HU-05 — professors available in the per-subject edit dialog. */
export const SAMPLE_PROFESSORS: AcademicOfferingOption[] = [
  { value: '40001', label: 'Pérez Cortés Elizabeth (40001)' },
  { value: '40002', label: 'Hernández Gómez Carlos (40002)' },
  { value: '40003', label: 'Martínez Licona Alma Edith (40003)' },
  { value: '40004', label: 'López Guerrero Miguel (40004)' },
];

/** HU-05 — students available for the research-project case. */
export const SAMPLE_STUDENTS: AcademicOfferingOption[] = [
  { value: '223300999', label: 'Acevedo Atenco Habersheel (223300999)' },
  { value: '223301000', label: 'Andrés Marcelo Eduardo (223301000)' },
  { value: '223301001', label: 'Aparicio Reyes Jorge Luis (223301001)' },
];

/**
 * HU-05 — subjects generated from the annual plan, expanded to ONE ROW PER GROUP
 * (as in the manual: Investigación Doctoral I → CO33, CO33A, CO33B…).
 */
export const SAMPLE_QUARTERLY_SUBJECTS: QuarterlyPlanSubject[] = [
  {
    id: 101,
    key: '2156038',
    name: 'Algoritmos distribuidos',
    group: 'CP33',
    capacity: 15,
    professorName: 'Pérez Cortés Elizabeth',
    employeeNumber: '40001',
  },
  {
    id: 102,
    key: '2156033',
    name: 'Evaluación de desempeño',
    group: 'CP33',
    capacity: 15,
    professorName: 'Ruiz Sánchez Juan',
    employeeNumber: '17798',
  },
  {
    id: 103,
    key: '2156053',
    name: 'Ingeniería de software I',
    group: 'CP33',
    capacity: 15,
    professorName: 'Martínez Licona Alma Edith',
    employeeNumber: '40003',
  },
  {
    id: 104,
    key: '2156059',
    name: 'Inteligencia computacional',
    group: 'CP33',
    capacity: 15,
    professorName: 'López Guerrero Miguel',
    employeeNumber: '40004',
  },
  {
    id: 105,
    key: '2159007',
    name: 'Investigación Doctoral I',
    group: 'CO33',
    capacity: 1,
    professorName: 'Pérez Cortés Elizabeth',
    employeeNumber: '40001',
    isResearchProject: true,
  },
  {
    id: 106,
    key: '2159007',
    name: 'Investigación Doctoral I',
    group: 'CO33A',
    capacity: 1,
    professorName: 'Hernández Gómez Carlos',
    employeeNumber: '40002',
    isResearchProject: true,
  },
  {
    id: 107,
    key: '2159007',
    name: 'Investigación Doctoral I',
    group: 'CO33B',
    capacity: 1,
    isResearchProject: true,
  },
  {
    id: 108,
    key: '2159008',
    name: 'Investigación Doctoral II',
    group: 'CP33',
    capacity: 1,
    professorName: 'Martínez Licona Alma Edith',
    employeeNumber: '40003',
    isResearchProject: true,
  },
];
