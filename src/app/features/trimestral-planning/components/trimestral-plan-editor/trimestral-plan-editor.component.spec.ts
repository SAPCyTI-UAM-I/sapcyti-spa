import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { SCHEDULE_DAYS, TrimestralPlanDetail, TrimestralPlanStatus } from '../../../../models';
import { TOAST_LIFE } from '../../../../shared/utils/toast.util';
import { PlanPickersController } from '../../services/plan-pickers.controller';
import { buildStudentRow } from '../../utils/group-form.util';
import { TrimestralPlanService } from '../../services/trimestral-plan.service';
import { TrimestralPlanEditorComponent } from './trimestral-plan-editor.component';

function plan(status: TrimestralPlanStatus = 'BORRADOR'): TrimestralPlanDetail {
  return {
    id: 1,
    term: '26I',
    status,
    surveyId: 1,
    outdated: false,
    outdatedReasons: [],
    prerequisites: { surveyClosed: true, annualPlanTerminated: true },
    exportedAt: null,
    warnings: [],
    blankStudents: [],
    unassignedDemand: [],
    groups: [
      {
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
        students: [
          {
            studentId: 5,
            enrollmentId: '2024630005',
            fullName: 'Elena Torres Gil',
            source: 'SURVEY',
            academicTerm: 'IV',
            obs: null,
          },
        ],
      },
    ],
  };
}

describe('TrimestralPlanEditorComponent', () => {
  async function setup(detail = plan(), saveGroups = vi.fn(() => of(plan()))) {
    const messages = { add: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [TrimestralPlanEditorComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: MessageService, useValue: messages },
        {
          provide: TrimestralPlanService,
          useValue: {
            saveGroups,
            searchProfessors: vi.fn(() =>
              of({
                content: [
                  { id: 8, employeeNumber: '40001', firstName: 'Rafaela', firstLastName: 'Blanco' },
                ],
              }),
            ),
            searchStudents: vi.fn(() =>
              of({
                content: [
                  {
                    id: 3,
                    enrollmentId: '2024630003',
                    firstName: 'Carla',
                    firstLastName: 'Núñez',
                    secondLastName: 'Vega',
                  },
                ],
              }),
            ),
            searchUeas: vi.fn(() =>
              of({
                content: [
                  { id: 7, clave: '2156027', nombre: 'INTELIGENCIA ARTIFICIAL' },
                  // La UEA del grupo que ya trae el plan: agregar otro hereda su maxGroups.
                  { id: 1, clave: '2156024', nombre: 'REDES' },
                ],
              }),
            ),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TrimestralPlanEditorComponent);
    fixture.componentRef.setInput('plan', detail);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, saveGroups, messages };
  }

  it('orders the groups by UEA clave, regardless of the group letter', async () => {
    const detail = plan();
    const base = detail.groups[0]!;
    detail.groups = [
      { ...base, id: 11, clave: '2156073', grupo: 'CP43' },
      { ...base, id: 12, clave: '2156027', grupo: 'CP43A' },
      { ...base, id: 13, clave: '2156024', grupo: 'CO43' },
      { ...base, id: 14, clave: '2156040', grupo: null },
    ];
    const { component } = await setup(detail);

    // Índices ordenados por clave ascendente: 2156024, 2156027, 2156040, 2156073.
    expect(component.order()).toEqual([2, 1, 3, 0]);
  });

  it('reorders when a group is added or removed, not while typing the letter', async () => {
    const { component } = await setup();

    component.addGroup(7); // clave 2156027 > 2156024 → va después
    expect(component.order()).toEqual([0, 1]);

    // La clave es snapshot inmutable: teclear la letra nunca reordena.
    component.groups.at(1).controls.grupo.setValue('CO43A');
    expect(component.order()).toEqual([0, 1]);

    component.requestRemoveGroup(component.groups.at(0));
    component.confirmRemoveGroup(); // queda solo el grupo agregado, ahora en índice 0
    expect(component.order()).toEqual([0]);
  });

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

  it('disables the draft form when a prerequisite is not met', async () => {
    const detail = plan();
    detail.prerequisites = { surveyClosed: true, annualPlanTerminated: false };
    const { component } = await setup(detail);

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
        expect.objectContaining({ id: null, ueaId: 7, grupo: null, cupo: null, students: [] }),
      ],
    });
  });

  it('adds two groups for the same UEA without colliding (HU-57, cupo 1)', async () => {
    const { fixture, component } = await setup();

    component.addGroup(7);
    // El selector se limpia para que volver a elegir la misma UEA sí emita cambio.
    expect(component.ueaPick()).toBeNull();
    component.addGroup(7);
    fixture.detectChanges();

    expect(component.groups.length).toBe(3);
    // Ambos nacen con id 0: si se rastrean por id, @for revienta con claves duplicadas.
    expect(component.groups.at(1).controls.id.value).toBe(0);
    expect(component.groups.at(2).controls.id.value).toBe(0);
    expect(component.studentsByIndex()).toHaveLength(3);
  });

  /**
   * El plan anual permite 2 grupos de esta UEA. Al agregar un tercero los tres quedan
   * marcados, y al quitarlo la marca debe irse: cuando los computed se disparaban con
   * `hasUnsavedChanges` (que ya valía true) no se recalculaban y la bandera se quedaba.
   */
  it('clears the group-limit flag once the offending group is removed', async () => {
    const { component } = await setup();

    // El plan anual permite 2 grupos de la UEA 1; con el que ya existe, el tercero sobra.
    component.addGroup(1);
    component.addGroup(1);
    expect(component.groupLimitViolationIndices().length).toBeGreaterThan(0);
    expect(component.hasLimitViolations()).toBe(true);

    const extra = component.groups.at(component.groups.length - 1);
    component.requestRemoveGroup(extra);
    component.confirmRemoveGroup();

    expect(component.groupLimitViolationIndices()).toEqual([]);
    expect(component.hasLimitViolations()).toBe(false);
    expect(component.problemGroupIndices().size).toBe(0);
  });

  it('recomputes the capacity flag when a member is removed, not only when added', async () => {
    const { component } = await setup();
    const group = component.groups.at(0);
    group.controls.cupo.setValue('1');
    group.controls.students.push(buildStudentRow(new FormBuilder().nonNullable, 3));
    expect(component.capacityViolationIndices()).toEqual([0]);

    group.controls.students.removeAt(1);

    expect(component.capacityViolationIndices()).toEqual([]);
  });

  it('proposes the next group letter when adding a second group for a UEA', async () => {
    const { component } = await setup();

    component.addGroup(7);
    // El primero nace sin letra (no hay hermano del que deducirla) y se captura.
    const first = component.groups.at(component.groups.length - 1);
    expect(first.controls.grupo.value).toBe('');
    first.controls.grupo.setValue('CP43');

    component.addGroup(7);

    expect(component.groups.at(component.groups.length - 1).controls.grupo.value).toBe('CP43A');
  });

  it('marks where each UEA starts in the visible list', async () => {
    const { component } = await setup();

    // Un solo grupo: un encabezado al inicio.
    expect([...component.claveHeaders()]).toEqual([0]);

    // Una UEA distinta abre su propio bloque; dos grupos de la misma comparten uno.
    component.addGroup(7);
    component.addGroup(7);

    expect([...component.claveHeaders()]).toEqual([0, 1]);
  });

  it('ignores an empty pick in the add-group selector', async () => {
    const { component } = await setup();

    component.addGroup(null);

    expect(component.groups.length).toBe(1);
  });

  it('only removes a group from the FormArray after confirmation', async () => {
    const { fixture, component } = await setup();

    const removeButton = fixture.nativeElement.querySelector(
      '[data-testid="request-remove-group"] button',
    ) as HTMLButtonElement;
    expect(removeButton).not.toBeNull();
    removeButton.click();
    fixture.detectChanges();
    expect(component.pendingRemoval()).toBe(component.groups.at(0));
    expect(component.groups.length).toBe(1);
    expect(
      fixture.nativeElement.querySelector('[data-testid="confirm-remove-group"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="remove-group-students-warning"]'),
    ).not.toBeNull();

    component.confirmRemoveGroup();
    expect(component.groups.length).toBe(0);
    expect(component.pendingRemoval()).toBeNull();
  });

  it('cancels a pending group removal without changing the form', async () => {
    const { component } = await setup();

    component.requestRemoveGroup(component.groups.at(0));
    component.cancelRemoveGroup();

    expect(component.groups.length).toBe(1);
    expect(component.pendingRemoval()).toBeNull();
  });

  it('searches by group, UEA key and normalized UEA name', async () => {
    const detail = plan();
    const base = detail.groups[0]!;
    detail.groups = [
      { ...base, id: 11, clave: '2156024', nombre: 'REDES', grupo: 'CO43' },
      {
        ...base,
        id: 12,
        clave: '2156027',
        nombre: 'INTELIGENCIA ARTIFICIAL',
        grupo: 'CO43A',
      },
    ];
    const { component } = await setup(detail);

    component.filters.controls.search.setValue('CO43A');
    expect(component.filteredOrder()).toEqual([1]);

    component.filters.controls.search.setValue('2156024');
    expect(component.filteredOrder()).toEqual([0]);

    component.filters.controls.search.setValue('inteligencia');
    expect(component.filteredOrder()).toEqual([1]);
  });

  it('filters groups by UEA type and operational situation', async () => {
    const detail = plan();
    const base = detail.groups[0]!;
    detail.groups = [
      base,
      {
        ...base,
        id: 12,
        ueaId: 2,
        clave: '2156027',
        nombre: 'OPTATIVA VACÍA',
        tipoUea: 'OPTATIVA',
        professors: [],
        students: [],
      },
    ];
    const { component } = await setup(detail);

    component.filters.controls.ueaType.setValue('OPTATIVA');
    expect(component.filteredOrder()).toEqual([1]);

    component.filters.controls.ueaType.setValue('');
    component.filters.controls.state.setValue('WITHOUT_STUDENTS');
    expect(component.filteredOrder()).toEqual([1]);
  });

  /**
   * El multiselect entrega un `number[]` y la fuente de verdad es un `FormArray` con la
   * nota por alumno: se sincroniza por diferencia, nunca reconstruyendo, o cada cambio
   * de selección borraría notas ya capturadas.
   */
  it('syncs the student selection by diff, keeping the notes already typed', async () => {
    const { component } = await setup();
    const rows = component.groups.at(0).controls.students;

    component.onStudentsChange(0, [5, 7]);
    expect(component.selectedStudentIds(0)).toEqual([5, 7]);

    rows.at(0).controls.obs.setValue('Maestría Física');
    rows.at(1).controls.obs.setValue('PIB');

    // Se quita al segundo y se agrega un tercero: la nota del primero sobrevive.
    component.onStudentsChange(0, [5, 9]);

    expect(component.selectedStudentIds(0)).toEqual([5, 9]);
    expect(rows.at(0).controls.obs.value).toBe('Maestría Física');
    expect(rows.at(1).controls.obs.value).toBe('');
  });

  /**
   * La plantilla lee esto en cada ciclo de detección. Si devolviera un arreglo nuevo,
   * PrimeNG vería un modelo distinto, volvería a marcar para revisar y la página se
   * quedaría colgada — que es exactamente lo que pasó la primera vez.
   */
  it('keeps a stable identity for the cells the template reads every cycle', async () => {
    const { fixture, component } = await setup();

    const ids = component.selectedStudentIds(0);
    const members = component.membersFor(0);
    fixture.detectChanges();

    expect(component.selectedStudentIds(0)).toBe(ids);
    expect(component.membersFor(0)).toBe(members);

    // Y sí cambia cuando el formulario cambia de verdad.
    component.onStudentsChange(0, [5, 7]);
    expect(component.selectedStudentIds(0)).not.toBe(ids);
  });

  it('does not duplicate a student already selected', async () => {
    const { component } = await setup();

    component.onStudentsChange(0, [5]);
    component.onStudentsChange(0, [5, 5, 7]);

    expect(component.selectedStudentIds(0)).toEqual([5, 7]);
  });

  it('derives the instructor names column without repeating the NEMP', async () => {
    const { component } = await setup();

    expect(component.professorNames(0)).toBe('');
    component.groups.at(0).controls.professorIds.setValue([8]);

    // El NEMP ya vive en su propia columna: aquí solo el nombre.
    expect(component.professorNames(0)).toBe('Rafaela Blanco');
  });

  it('reads occupancy and what is missing per row', async () => {
    const { component } = await setup();

    expect(component.occupancyFor(0)).toBe('1/15');
    expect(component.occupancySeverityFor(0)).toBe('ok');
    // Sin profesor ni horario, la fila está incompleta.
    expect(component.incompleteFor(0)).toBe(true);

    component.groups.at(0).controls.cupo.setValue('1');
    expect(component.occupancySeverityFor(0)).toBe('full');
  });

  /**
   * El filtro solo miraba cupo y máximo de grupos, así que «Con problemas» devolvía
   * «0 de 5» mientras el panel listaba dos horarios a medias.
   */
  it('filters by any problem, not only by the quota and group limits', async () => {
    const { component } = await setup();
    component.groups.at(0).controls.schedule.at(2).patchValue({ end: '10:00' });

    component.filters.patchValue({ state: 'HAS_VIOLATIONS' });

    expect(component.problemGroupIndices()).toEqual(new Set([0]));
    expect(component.filteredOrder()).toEqual([0]);
  });

  it('names each broken rule instead of a single invalid-values banner', async () => {
    const detail = plan();
    // Llega así del servidor: nada que el coordinador haya tecleado todavía.
    detail.groups[0]!.schedule[0]!.lab = true;
    const { component } = await setup(detail);

    expect(component.issues()).toMatchObject([
      {
        index: 0,
        grupo: 'CO43',
        key: 'TRIMESTRAL_PLANNING.ISSUES.LAB_TIME_REQUIRED',
        dayKey: 'TRIMESTRAL_PLANNING.DAYS.LUN',
      },
    ]);
    // Sin tocar nada no se acusa al usuario de lo que encontró cargado.
    expect(component.showIssues()).toBe(false);

    component.save();

    expect(component.showIssues()).toBe(true);
  });

  it('flags a stored time that does not match the contract format', async () => {
    const { component } = await setup();
    const monday = component.groups.at(0).controls.schedule.at(0);

    monday.controls.end.setValue('25:00');
    monday.controls.end.markAsDirty();

    expect(component.scheduleCellInvalid(0, 0, 'end')).toBe(true);
    expect(component.scheduleCellError(0, 0, 'end')).toBe(
      'TRIMESTRAL_PLANNING.GROUP.TIME_FORMAT_INVALID',
    );
  });

  it('reports the range error on the day, not the format one', async () => {
    const { component } = await setup();
    const monday = component.groups.at(0).controls.schedule.at(0);

    monday.patchValue({ start: '11:00', end: '09:00' });
    monday.controls.start.markAsDirty();

    expect(component.scheduleCellInvalid(0, 0, 'start')).toBe(true);
    expect(component.scheduleCellError(0, 0, 'start')).toBe(
      'TRIMESTRAL_PLANNING.GROUP.START_AFTER_END',
    );
  });

  it('adds and removes student rows without touching the server snapshots', async () => {
    const { component } = await setup();
    const fb = new FormBuilder().nonNullable;
    const rows = component.groups.at(0).controls.students;

    rows.push(buildStudentRow(fb, 3, 'PIB'));
    expect(rows.getRawValue()).toEqual([
      { studentId: 5, obs: '' },
      { studentId: 3, obs: 'PIB' },
    ]);

    rows.removeAt(0);
    expect(rows.getRawValue()).toEqual([{ studentId: 3, obs: 'PIB' }]);
    // Los snapshots del servidor no se tocan al agregar o quitar filas.
    expect(component.studentsByIndex()[0]).toHaveLength(1);
  });

  it('pins the already-assigned students so the picker keeps them checked', async () => {
    const { fixture } = await setup();
    const pickers = fixture.debugElement.injector.get(PlanPickersController);

    // Elena no la devuelve el buscador (está de baja); sin fijarla se perdería al guardar.
    expect(pickers.students().some((option) => option.value === 5)).toBe(true);
  });

  it('blocks the save when a cupo is invalid', async () => {
    const { component, saveGroups } = await setup();
    component.groups.at(0).controls.cupo.setValue('0');

    component.save();

    expect(saveGroups).not.toHaveBeenCalled();
    expect(component.submitted()).toBe(true);
  });

  // Expandir no basta con 25 grupos: hay que llevar al coordinador al que falló.
  it('scrolls to the first invalid group after a blocked save', async () => {
    // jsdom no implementa scrollIntoView, así que no se puede espiar: hay que definirlo.
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const { component, fixture } = await setup();
    component.groups.at(0).controls.cupo.setValue('0');

    component.save();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('filters down to the groups that break a limit', async () => {
    const { component, fixture } = await setup();
    component.groups.at(0).controls.cupo.setValue('1');
    component.groups
      .at(0)
      .controls.students.push(buildStudentRow(new FormBuilder().nonNullable, 3));
    component.filters.patchValue({ state: 'HAS_VIOLATIONS' });
    fixture.detectChanges();

    expect(component.filteredOrder()).toEqual([0]);
  });

  it('blocks the save when current membership exceeds cupo', async () => {
    const { component, saveGroups } = await setup();
    component.groups.at(0).controls.cupo.setValue('1');
    component.groups
      .at(0)
      .controls.students.push(buildStudentRow(new FormBuilder().nonNullable, 3));

    component.save();

    expect(component.hasLimitViolations()).toBe(true);
    expect(saveGroups).not.toHaveBeenCalled();
  });

  it('saves the full set of groups and emits the returned detail', async () => {
    const saveGroups = vi.fn(() => of(plan()));
    const { component, fixture, messages } = await setup(plan(), saveGroups);
    const emitted = vi.fn();
    fixture.componentInstance.saved.subscribe(emitted);

    component.save();

    expect(saveGroups).toHaveBeenCalledWith(1, {
      groups: [
        expect.objectContaining({
          id: 10,
          ueaId: 1,
          grupo: 'CO43',
          cupo: '15',
          students: [{ studentId: 5, obs: null }],
        }),
      ],
    });
    expect(emitted).toHaveBeenCalled();
    expect(messages.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'TRIMESTRAL_PLANNING.DETAIL.SAVED',
      life: TOAST_LIFE.DEFAULT,
    });
  });
});
