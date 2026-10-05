import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';

import { BlankStudent, UnassignedDemand } from '../../../../models';
import { GroupFormGroup } from '../../utils/group-form.util';

export interface GroupOption {
  readonly label: string;
  readonly value: GroupFormGroup;
}

export interface AssignRequest {
  readonly studentId: number;
  readonly group: GroupFormGroup;
}

/**
 * Lo que le queda por resolver al coordinador: inscripciones en blanco y demanda que
 * no cupo. Antes vivía al final de la página, en solo lectura, así que había que
 * memorizar un nombre, subir, encontrar la tarjeta y volver a buscarlo ahí. Ahora se
 * asigna desde la misma fila donde se detecta el problema.
 */
@Component({
  selector: 'app-plan-pending',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe, Button, Select],
  templateUrl: './plan-pending.component.html',
})
export class PlanPendingComponent {
  readonly blankStudents = input.required<readonly BlankStudent[]>();
  readonly unassignedDemand = input.required<readonly UnassignedDemand[]>();
  readonly editable = input(false);
  /** Opciones por UEA; `null` como clave son los grupos ofrecidos a un blanco. */
  readonly groupOptions = input.required<(ueaId: number | null) => GroupOption[]>();

  readonly assign = output<AssignRequest>();
  readonly createGroupForUea = output<number>();

  /** Razones que se resuelven abriendo otro grupo, no moviendo al alumno. */
  private static readonly NEEDS_NEW_GROUP = new Set(['UEA_NOT_OFFERED', 'GROUP_LIMIT_REACHED']);

  needsNewGroup(demand: UnassignedDemand): boolean {
    return PlanPendingComponent.NEEDS_NEW_GROUP.has(demand.reason);
  }

  onAssign(studentId: number, group: GroupFormGroup | null): void {
    if (group) this.assign.emit({ studentId, group });
  }
}
