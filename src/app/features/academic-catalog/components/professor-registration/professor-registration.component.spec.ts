import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AuthStateService } from '../../../../core/auth/auth.service';
import { ProfessorService } from '../../services/professor.service';
import { ProfessorRegistrationComponent } from './professor-registration.component';

describe('ProfessorRegistrationComponent', () => {
  it('validates, confirms and opens the temporary password dialog', async () => {
    const service = {
      registerProfessor: vi.fn(() =>
        of({ id: 12, userId: 212, active: true, generatedPassword: 'TempProfessor' }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [ProfessorRegistrationComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ProfessorService, useValue: service },
        {
          provide: AuthStateService,
          useValue: { getCurrentUser: () => ({ graduateProgramId: 1 }) },
        },
      ],
    }).compileComponents();
    const component = TestBed.createComponent(ProfessorRegistrationComponent).componentInstance;

    component.next();
    expect(component.step()).toBe(1);
    component.form.setValue({
      firstName: 'Laura',
      firstLastName: 'Martínez',
      secondLastName: '',
      email: 'laura.new@uam.mx',
      employeeNumber: '40002',
    });
    component.next();
    component.submit();

    expect(service.registerProfessor).toHaveBeenCalledWith(
      expect.objectContaining({ graduateProgramId: 1, secondLastName: undefined }),
    );
    expect(component.showPasswordDialog()).toBe(true);
  });
});
