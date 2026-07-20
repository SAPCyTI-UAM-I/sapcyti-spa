import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { GroupStudent, SCHEDULE_DAYS, TrimestralGroup } from '../../../../models';
import { PlanPickersController } from '../../services/plan-pickers.controller';
import { TrimestralPlanService } from '../../services/trimestral-plan.service';
import { buildGroupFormGroup, GroupFormGroup } from '../../utils/group-form.util';
import { GroupCardComponent } from './group-card.component';

const group: TrimestralGroup = {
  id: 10,
  ueaId: 1,
  clave: '2156024',
  nombre: 'REDES',
  tipoUea: 'OBLIGATORIA',
  grupo: 'CO43',
  cupo: '15',
  professorId: null,
  employeeNumber: null,
  professorName: null,
  schedule: SCHEDULE_DAYS.map((day) => ({ day, start: null, end: null, lab: false })),
  obs: null,
  students: [student(1), student(2), student(3)],
};

function student(studentId: number): GroupStudent {
  return {
    studentId,
    enrollmentId: `A${studentId}`,
    fullName: `Alumno ${studentId}`,
    source: 'SURVEY',
    academicTerm: 'II',
  };
}

@Component({
  imports: [GroupCardComponent],
  template: `<app-group-card [form]="form" [students]="students()" />`,
})
class HostComponent {
  readonly form: GroupFormGroup = buildGroupFormGroup(new FormBuilder().nonNullable, group);
  readonly students = signal<GroupStudent[]>([student(1), student(2), student(3)]);
}

describe('GroupCardComponent', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [HostComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        PlanPickersController,
        {
          provide: TrimestralPlanService,
          useValue: {
            searchProfessors: vi.fn(() => of({ content: [] })),
            searchStudents: vi.fn(() => of({ content: [] })),
            searchUeas: vi.fn(() => of({ content: [] })),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const card = fixture.debugElement.children[0]!.componentInstance as GroupCardComponent;
    return { fixture, host: fixture.componentInstance, card };
  }

  it('reacts to the cupo being typed, not only to the student list changing', async () => {
    const { fixture, host, card } = await setup();

    expect(card.overCapacity()).toBe(false);

    // Los valores de un FormControl no son señales: sin la revisión, esto no recalcula.
    host.form.controls.cupo.setValue('1');
    fixture.detectChanges();

    expect(card.overCapacity()).toBe(true);
  });

  it('treats * as unlimited and an empty cupo as not set', async () => {
    const { fixture, host, card } = await setup();

    host.form.controls.cupo.setValue('*');
    fixture.detectChanges();
    expect(card.overCapacity()).toBe(false);

    host.form.controls.cupo.setValue('');
    fixture.detectChanges();
    expect(card.overCapacity()).toBe(false);
  });

  it('exposes the catalog tipo de UEA as a read-only snapshot', async () => {
    const { card } = await setup();

    expect(card.tipoUea()).toBe('OBLIGATORIA');
  });
});
