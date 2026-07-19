import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { SCHEDULE_DAYS, TrimestralPlanDetail, TrimestralPlanStatus } from '../../../../models';
import { TrimestralPlanService } from '../../services/trimestral-plan.service';
import { TrimestralPlanEditorComponent } from './trimestral-plan-editor.component';

function plan(status: TrimestralPlanStatus = 'BORRADOR'): TrimestralPlanDetail {
  return {
    id: 1,
    term: '26I',
    status,
    surveyId: 1,
    outdated: false,
    warnings: [],
    blankStudents: [],
    groups: [
      {
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
        students: [
          {
            studentId: 5,
            enrollmentId: '2024630005',
            fullName: 'Elena Torres Gil',
            source: 'SURVEY',
            academicTerm: 'IV',
          },
        ],
      },
    ],
  };
}

describe('TrimestralPlanEditorComponent', () => {
  async function setup(detail = plan(), saveGroups = vi.fn(() => of(plan()))) {
    await TestBed.configureTestingModule({
      imports: [TrimestralPlanEditorComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        MessageService,
        {
          provide: TrimestralPlanService,
          useValue: {
            saveGroups,
            searchProfessors: vi.fn(() => of({ content: [] })),
            searchStudents: vi.fn(() => of({ content: [] })),
            searchUeas: vi.fn(() =>
              of({ content: [{ id: 7, clave: '2156027', nombre: 'INTELIGENCIA ARTIFICIAL' }] }),
            ),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TrimestralPlanEditorComponent);
    fixture.componentRef.setInput('plan', detail);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, saveGroups };
  }

  it('builds one form group per plan group, with the 5 fixed days', async () => {
    const { component } = await setup();

    expect(component.groups.length).toBe(1);
    expect(component.groups.at(0).controls.schedule.length).toBe(5);
    expect(component.editable()).toBe(true);
  });

  it('disables the form when the plan is TERMINADA', async () => {
    const { component } = await setup(plan('TERMINADA'));

    expect(component.editable()).toBe(false);
    expect(component.groups.disabled).toBe(true);
  });

  it('adds a group for a catalog UEA, sent to the API with id null (HU-59)', async () => {
    const saveGroups = vi.fn(() => of(plan()));
    const { component } = await setup(plan(), saveGroups);

    component.addGroup(7);

    expect(component.groups.length).toBe(2);
    const added = component.groups.at(1);
    expect(added.controls.ueaId.value).toBe(7);
    expect(added.controls.clave.value).toBe('2156027');
    expect(added.controls.grupo.value).toBe('');
    expect(component.studentsByIndex()[1]).toEqual([]);

    component.save();
    expect(saveGroups).toHaveBeenCalledWith(1, {
      groups: [
        expect.objectContaining({ id: 10 }),
        expect.objectContaining({ id: null, ueaId: 7, grupo: null, cupo: null, studentIds: [] }),
      ],
    });
  });

  it('ignores an empty pick in the add-group selector', async () => {
    const { component } = await setup();

    component.addGroup(null);

    expect(component.groups.length).toBe(1);
  });

  it('removes a group from the FormArray', async () => {
    const { component } = await setup();

    component.removeGroup(0);

    expect(component.groups.length).toBe(0);
  });

  it('adds and removes students, keeping ids and snapshots in sync', async () => {
    const { component } = await setup();

    component.addStudentTo(0, 3);
    expect(component.groups.at(0).controls.studentIds.value).toEqual([5, 3]);
    expect(component.studentsByIndex()[0]).toHaveLength(2);
    expect(component.studentsByIndex()[0]![1]!.source).toBe('MANUAL');

    component.removeStudentFrom(0, 5);
    expect(component.groups.at(0).controls.studentIds.value).toEqual([3]);
    expect(component.studentsByIndex()[0]).toHaveLength(1);
  });

  it('blocks the save when a cupo is invalid', async () => {
    const { component, saveGroups } = await setup();
    component.groups.at(0).controls.cupo.setValue('0');

    component.save();

    expect(saveGroups).not.toHaveBeenCalled();
    expect(component.submitted()).toBe(true);
  });

  it('saves the full set of groups and emits the returned detail', async () => {
    const saveGroups = vi.fn(() => of(plan()));
    const { component, fixture } = await setup(plan(), saveGroups);
    const emitted = vi.fn();
    fixture.componentInstance.saved.subscribe(emitted);

    component.save();

    expect(saveGroups).toHaveBeenCalledWith(1, {
      groups: [
        expect.objectContaining({ id: 10, ueaId: 1, grupo: 'CO43', cupo: '15', studentIds: [5] }),
      ],
    });
    expect(emitted).toHaveBeenCalled();
  });
});
