/**
 * ⚠️ DEMO / SAMPLE DATA — NOT FOR PRODUCTION.
 *
 * Datos de ejemplo del flujo de Oferta Académica (HU-06). Los de HU-05 se
 * eliminaron junto con el stub `plan-quarterly`, sustituido por el feature
 * `trimestral-planning`.
 *
 * Para quitar el ejemplo: borra este archivo y el import en `enrollment-start`
 * (el componente ya declara el `signal([])` vacío del que parte).
 */
import type { AcademicOfferingOption } from '../../../models';

/** HU-06 — trimestres seleccionables (ej. 26I). */
export const SAMPLE_TERMS: AcademicOfferingOption[] = [
  { value: '26I', label: '26I — Invierno 2026' },
  { value: '26P', label: '26P — Primavera 2026' },
  { value: '26O', label: '26O — Otoño 2026' },
];
