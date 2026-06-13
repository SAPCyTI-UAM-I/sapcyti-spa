import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { injectMockEnabled } from '../../../core/mocks/mock.config';
import { StudentRequest, StudentResponse } from '../../../models/student.model';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly useMock = injectMockEnabled('studentRegistration');
  private readonly apiUrl = `${environment.apiBaseUrl}/students`;

  /**
   * Registra un nuevo estudiante en el sistema.
   * Si los mocks están activos, simula la creación y genera la contraseña temporal en el frontend.
   * Si están inactivos, realiza la petición POST al backend.
   */
  registerStudent(student: StudentRequest): Observable<StudentResponse> {
    if (this.useMock) {
      // Simula el guardado exitoso y la generación de la contraseña en el cliente
      const mockResponse: StudentResponse = {
        id: Math.floor(Math.random() * 1000) + 10,
        ...student,
        tempPassword: this.generateRandomTempPassword(),
      };
      return of(mockResponse).pipe(delay(800));
    }

    return this.http.post<StudentResponse>(this.apiUrl, student, {
      withCredentials: true,
    });
  }

  /**
   * Genera una contraseña temporal aleatoria para el modo mock.
   */
  private generateRandomTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
