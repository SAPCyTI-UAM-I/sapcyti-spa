import { HttpContextToken } from '@angular/common/http';

/**
 * Marca peticiones de alumno sobre examen. Por defecto es false para no
 * relajar el interceptor en rutas ajenas.
 */
export const EXAM_STUDENT_OPERATION = new HttpContextToken<boolean>(() => false);
