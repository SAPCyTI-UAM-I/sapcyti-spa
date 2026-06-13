/**
 * Interfaz que representa los datos necesarios para registrar un nuevo estudiante.
 */
export interface StudentRequest {
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  email: string;
  nationality: string;
  undergraduateDegree: string;
  enrollmentId: string;
  programType: 'MASTER' | 'DOCTORATE';
  admissionDate: string; // Formato YYYY-MM-DD
}

/**
 * Interfaz que representa la respuesta del servidor tras registrar un estudiante.
 */
export interface StudentResponse {
  id: number;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  email: string;
  nationality: string;
  undergraduateDegree: string;
  enrollmentId: string;
  programType: 'MASTER' | 'DOCTORATE';
  admissionDate: string;
  tempPassword?: string; // Contraseña autogenerada por el sistema, presente solo en la respuesta de creación
}
