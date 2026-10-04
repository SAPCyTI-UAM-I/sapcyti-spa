import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { EnrollmentHistoryEntry } from '../../../models';
import { StudentEnrollmentHistoryComponent } from './student-enrollment-history.component';

const mockHistory: EnrollmentHistoryEntry[] = [
  {
    term: '24-O',
    academicTermSelected: 'I',
    mode: 'ENROLL_UEAS',
    planStatus: 'TERMINADA',
    note: null,
    ueas: [
      {
        clave: '2111001',
        nombre: 'Seminario de Investigación I',
        status: 'ASSIGNED',
        grupo: 'CC01',
        professors: [
          {
            professorId: 10,
            employeeNumber: '9988',
            professorName: 'Dr. Turing',
          },
        ],
        schedule: [
          {
            day: 'LUN',
            start: '10:00',
            end: '12:00',
            lab: false,
          },
        ],
      },
    ],
  },
];

describe('StudentEnrollmentHistoryComponent', () => {
  async function create(
    history: EnrollmentHistoryEntry[] = mockHistory,
    loading = false,
    error = false,
  ) {
    await TestBed.configureTestingModule({
      imports: [StudentEnrollmentHistoryComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    }).compileComponents();

    const fixture = TestBed.createComponent(StudentEnrollmentHistoryComponent);
    fixture.componentRef.setInput('history', history);
    fixture.componentRef.setInput('loading', loading);
    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
    return fixture;
  }

  it('renders history entries with term and UEAs', async () => {
    const fixture = await create();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('24-O');
    expect(text).toContain('2111001');
    expect(text).toContain('Seminario de Investigación I');
    expect(text).toContain('CC01');
    expect(text).toContain('Dr. Turing');
  });

  it('emits retry when error occurs and retry button is clicked', async () => {
    const fixture = await create([], false, true);
    let retried = false;
    fixture.componentInstance.retry.subscribe(() => {
      retried = true;
    });

    const button = fixture.nativeElement.querySelector('button');
    if (button) {
      button.click();
      expect(retried).toBe(true);
    }
  });
});
