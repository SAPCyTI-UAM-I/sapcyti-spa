import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly graduateProgramIdSubject = new BehaviorSubject<number | null>(null);
  readonly graduateProgramId$ = this.graduateProgramIdSubject.asObservable();

  set(id: number): void {
    this.graduateProgramIdSubject.next(id);
  }

  get(): number | null {
    return this.graduateProgramIdSubject.getValue();
  }

  clear(): void {
    this.graduateProgramIdSubject.next(null);
  }
}
