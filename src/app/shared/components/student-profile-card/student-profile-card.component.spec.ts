import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import { StudentDetailResponse } from '../../../models';
import { StudentProfileCardComponent } from './student-profile-card.component';

const mockStudent: StudentDetailResponse = {
  id: 1,
  userId: 101,
  enrollmentId: '223300456',
  email: 'ana.garcia@uam.mx',
  graduateProgramId: 1,
  firstName: 'Ana',
  firstLastName: 'García',
  secondLastName: 'López',
  nationality: 'Mexicana',
  birthDate: '1998-04-12',
  phone: '5512345678',
  phoneExtension: '101',
  undergraduateDegree: 'Computación',
  lastDegreeObtained: 'LICENCIATURA',
  programType: 'MAESTRIA',
  admissionDate: '2025-09-01',
  admissionTerm: '25O',
  active: true,
  program: {
    id: 100,
    studentId: 1,
    graduateProgramId: 1,
    enrollmentId: '223300456',
    programType: 'MAESTRIA',
    admissionDate: '2025-09-01',
    status: 'EN_INVESTIGACION',
    advisorIds: [],
    advisors: [],
  },
};

describe('StudentProfileCardComponent', () => {
  async function create(student: StudentDetailResponse = mockStudent) {
    await TestBed.configureTestingModule({
      imports: [StudentProfileCardComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [{ provide: MessageService, useValue: { add: vi.fn() } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(StudentProfileCardComponent);
    fixture.componentRef.setInput('student', student);
    fixture.detectChanges();
    return fixture;
  }

  it('renders student full name and initials', async () => {
    const fixture = await create();
    const nameEl = fixture.debugElement.query(By.css('[data-testid="student-name"]'));
    expect(nameEl.nativeElement.textContent).toContain('Ana García López');
    expect(fixture.componentInstance.initials()).toBe('AG');
  });

  it('renders enrollment ID, email, and phone', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('223300456');
    expect(text).toContain('ana.garcia@uam.mx');
    expect(text).toContain('5512345678');
    expect(text).toContain('ext. 101');
  });

  it('renders research area and advisors when present in program', async () => {
    const fixture = await create({
      ...mockStudent,
      program: {
        ...mockStudent.program,
        researchArea: 'Inteligencia artificial',
        advisors: [
          {
            id: 201,
            firstName: 'Carlos',
            firstLastName: 'Pérez',
            secondLastName: 'Mora',
          },
        ],
      },
    });

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Pérez Mora Carlos');
  });
});
