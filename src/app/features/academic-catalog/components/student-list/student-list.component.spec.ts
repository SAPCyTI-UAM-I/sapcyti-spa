import { TestBed } from '@angular/core/testing';
import { FormGroupDirective } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { PageResponse, StudentCatalogItem } from '../../../../models';
import { StudentProgramService } from '../../services/student-program.service';
import { StudentService } from '../../services/student.service';
import { StudentListComponent } from './student-list.component';

const sampleStudent: StudentCatalogItem = {
  id: 1,
  userId: 101,
  active: true,
  enrollmentId: '223300001',
  email: 'ana@uam.mx',
  graduateProgramId: 1,
  firstName: 'Ana',
  firstLastName: 'García',
  nationality: 'Mexicana',
  birthDate: '1998-04-12',
  phone: '5512345678',
  undergraduateDegree: 'Computación',
  lastDegreeObtained: 'Licenciatura en Computación',
  programType: 'MAESTRIA',
  admissionDate: '2025-09-01',
};

function buildStudentPage(
  content: StudentCatalogItem[] = [sampleStudent],
): PageResponse<StudentCatalogItem> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 10,
    number: 0,
  };
}

describe('StudentListComponent', () => {
  async function setup() {
    const listStudents = vi.fn(() => of(buildStudentPage()));
    await TestBed.configureTestingModule({
      imports: [StudentListComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        MessageService,
        { provide: StudentService, useValue: { listStudents } },
        { provide: StudentProgramService, useValue: { listPrograms: vi.fn(() => of([])) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StudentListComponent);
    return { fixture, listStudents };
  }

  function patchFilters(
    fixture: ReturnType<typeof TestBed.createComponent<StudentListComponent>>,
    values: { search?: string; programType?: string; active?: string },
  ): void {
    const form = fixture.debugElement.query(By.css('form')).injector.get(FormGroupDirective);
    form.form.patchValue(values);
  }

  it('calls listStudents on init with page 0 and size 10', async () => {
    const { fixture, listStudents } = await setup();
    fixture.detectChanges();

    expect(listStudents).toHaveBeenCalledTimes(1);
    expect(listStudents).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      search: undefined,
      programType: undefined,
      active: undefined,
    });
  });

  it('maps filters through parseProgramTypeFilter, parseActiveFilter and trims search', async () => {
    const { fixture, listStudents } = await setup();
    fixture.detectChanges();
    listStudents.mockClear();

    patchFilters(fixture, { search: '  ana  ', programType: 'MAESTRIA', active: 'true' });
    fixture.componentInstance.applyFilters();

    expect(listStudents).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      search: 'ana',
      programType: 'MAESTRIA',
      active: true,
    });
  });

  it('maps empty filter values to undefined', async () => {
    const { fixture, listStudents } = await setup();
    fixture.detectChanges();
    listStudents.mockClear();

    patchFilters(fixture, { search: '   ', programType: '', active: '' });
    fixture.componentInstance.applyFilters();

    expect(listStudents).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      search: undefined,
      programType: undefined,
      active: undefined,
    });
  });
});
