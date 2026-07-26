import {
  GroupStudent,
  SCHEDULE_DAYS,
  TrimestralGroup,
  TrimestralPlanDetail,
} from '../../../models';
import { flattenPlanForPreview } from './excel-preview.util';

function student(id: number, name: string, obs: string | null = null): GroupStudent {
  return {
    studentId: id,
    enrollmentId: `225380088${id}`,
    fullName: name,
    source: 'SURVEY',
    academicTerm: 'II',
    obs,
  };
}

function group(overrides: Partial<TrimestralGroup> = {}): TrimestralGroup {
  return {
    id: 10,
    ueaId: 1,
    clave: '2156024',
    nombre: 'REDES Y PROTOCOLOS DE COMUNICACIONES',
    tipoUea: 'OBLIGATORIA',
    grupo: 'CO43',
    cupo: '15',
    maxGroups: '2',
    professors: [
      { professorId: 1, employeeNumber: '23833', professorName: 'RAMOS RAMOS VÍCTOR MANUEL' },
    ],
    schedule: SCHEDULE_DAYS.map((day) => ({ day, start: null, end: null, lab: false })),
    students: [],
    ...overrides,
  };
}

function plan(groups: TrimestralGroup[]): TrimestralPlanDetail {
  return {
    id: 1,
    term: '26O',
    status: 'BORRADOR',
    surveyId: 1,
    outdated: false,
    outdatedReasons: [],
    prerequisites: { surveyClosed: true, annualPlanTerminated: true },
    exportedAt: null,
    warnings: [],
    blankStudents: [],
    unassignedDemand: [],
    groups,
  };
}

describe('flattenPlanForPreview', () => {
  // Fila 2 del archivo entregado: PCYTI 26O, grupo CO43 de REDES Y PROTOCOLOS.
  it('writes the group columns on the first row of the group', () => {
    const rows = flattenPlanForPreview(
      plan([
        group({
          schedule: SCHEDULE_DAYS.map((day) => ({
            day,
            start: day === 'LUN' || day === 'MIE' ? '09:30' : null,
            end: day === 'LUN' || day === 'MIE' ? '11:00' : null,
            lab: day === 'MIE',
          })),
          students: [student(2, 'JHOVANY BADILLO CRUZ')],
        }),
      ]),
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      div: 'CBI',
      trim: '26O',
      cveUea: '2156024',
      grupo: 'CO43',
      cupo: '15',
      tipoUea: 'OBLIGATORIA',
      nemp: '23833',
      prof: 'RAMOS RAMOS VÍCTOR MANUEL',
      studentName: 'JHOVANY BADILLO CRUZ',
    });
    // LUN inicio/fin/salón, MAR vacío, MIE con LAB.
    expect(rows[0]!.schedule.slice(0, 6)).toEqual(['09:30', '11:00', '', '', '', '']);
    expect(rows[0]!.schedule.slice(6, 9)).toEqual(['09:30', '11:00', 'LAB']);
  });

  it('stacks extra students on continuation rows, leaving the group columns empty', () => {
    const rows = flattenPlanForPreview(
      plan([
        group({
          students: [student(2, 'JHOVANY BADILLO CRUZ'), student(3, 'EDGAR SILVA RODRIGUEZ')],
        }),
      ]),
    );

    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ div: '', cveUea: '', grupo: '', prof: '' });
    expect(rows[1]!.studentName).toBe('EDGAR SILVA RODRIGUEZ');
  });

  // Los grupos de investigación llevan codirector: dos NEMP para un solo alumno.
  it('stacks co-directors on continuation rows too', () => {
    const rows = flattenPlanForPreview(
      plan([
        group({
          clave: '2156047',
          grupo: 'CR43',
          cupo: '1',
          professors: [
            { professorId: 1, employeeNumber: '41530', professorName: 'Leonardo Palacios Luengas' },
            {
              professorId: 2,
              employeeNumber: '42178',
              professorName: 'Salvador Gonzalez Arellano',
            },
          ],
          students: [student(9, 'JESUS ALFONSO REYES DE LA VEGA')],
        }),
      ]),
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]!.nemp).toBe('41530');
    expect(rows[1]!.nemp).toBe('42178');
    // El alumno ya iba en la primera fila; la continuación es solo del profesor.
    expect(rows[1]!.studentName).toBe('');
  });

  it('carries the per-student note, which is the only obs captured', () => {
    const rows = flattenPlanForPreview(
      plan([group({ students: [student(1, 'Alguien', 'Maestría Física')] })]),
    );

    expect(rows[0]!.studentNote).toBe('Maestría Física');
  });

  it('keeps a group with no students as a single row', () => {
    const rows = flattenPlanForPreview(plan([group()]));

    expect(rows).toHaveLength(1);
    expect(rows[0]!.studentName).toBe('');
  });
});
