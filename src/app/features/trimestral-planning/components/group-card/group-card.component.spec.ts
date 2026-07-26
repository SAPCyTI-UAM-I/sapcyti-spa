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
  maxGroups: '2',
  professors: [],
  schedule: SCHEDULE_DAYS.map((day) => ({ day, start: null, end: null, lab: false })),
  students: [student(1), student(2), student(3)],
};

function student(studentId: number): GroupStudent {
  return {
    studentId,
    enrollmentId: `A${studentId}`,
    fullName: `Alumno ${studentId}`,
    source: 'SURVEY',
    academicTerm: 'II',
    obs: null,
  };
}

@Component({
  imports: [GroupCardComponent],
  template: `<app-group-card [form]="form" [students]="students()" [warnings]="warnings()" />`,
})
class HostComponent {
  readonly form: GroupFormGroup = buildGroupFormGroup(new FormBuilder().nonNullable, group);
  readonly students = signal<GroupStudent[]>([student(1), student(2), student(3)]);
  readonly warnings = signal([{ code: 'STUDENT_INACTIVE' as const, enrollmentId: 'A2' }]);
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

  it('shows the annual maximum and an actionable inactive-student warning', async () => {
    const { fixture, card } = await setup();

    expect(card.maxGroups()).toBe('2');
    expect(card.studentInactive(student(2))).toBe(true);
    expect(fixture.nativeElement.querySelector('[data-testid="inactive-student"]')).not.toBeNull();
  });

  // HU-59 — la tabla de alumnos agrega por typeahead y quita por fila.
  it('adds a student once (no duplicates) and removes by row index', async () => {
    const { fixture, host, card } = await setup();
    const rows = host.form.controls.students;

    card.addStudent(2); // ya es integrante: no duplica
    expect(rows.length).toBe(3);

    card.addStudent(99);
    fixture.detectChanges();
    expect(rows.length).toBe(4);
    expect(card.members()).toHaveLength(4);
    expect(card.studentPick()).toBeNull();

    card.removeStudent(3);
    expect(rows.length).toBe(3);
  });

  it('organizes each UEA into identity, configuration, schedule and students', async () => {
    const { fixture } = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="trimestral-group-card"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="group-configuration"]'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="group-students"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[data-testid="schedule-day"]')).toHaveLength(5);
  });

  // El horario vive siempre visible, pero cada día agrupa su inicio, fin y LAB.
  it('renders the 5 day cards with their time inputs always visible', async () => {
    const { fixture } = await setup();

    const timeInputs = fixture.nativeElement.querySelectorAll('input[type="time"]');
    expect(timeInputs).toHaveLength(10); // 5 días × inicio/fin, sin <details> de por medio
    expect(fixture.nativeElement.querySelector('details')).toBeNull();
  });

  it('shows an explicit empty state when a group has no students', async () => {
    const { fixture, host } = await setup();

    host.form.controls.students.clear();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="empty-group-students"]'),
    ).not.toBeNull();
  });
});
