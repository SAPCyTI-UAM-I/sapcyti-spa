import { DestroyRef, Directive, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';

import { CatalogError, mapCatalogError } from '../utils/catalog-error.util';

@Directive()
export abstract class CatalogRegistrationBase<TResponse extends { generatedPassword: string }> {
  protected readonly router = inject(Router);
  protected readonly destroyRef = inject(DestroyRef);

  readonly step = signal(1);
  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly error = signal<CatalogError | null>(null);
  readonly generatedPassword = signal('');
  readonly showPasswordDialog = signal(false);
  readonly passwordCopied = signal(false);

  protected abstract readonly listRoute: string;
  protected abstract readonly maxStep: number;
  protected abstract validateStep(step: number): boolean;
  protected abstract isFormValidForSubmit(): boolean;
  protected abstract register(): Observable<TResponse>;

  next(): void {
    this.submitted.set(true);
    if (!this.validateStep(this.step())) {
      return;
    }
    this.submitted.set(false);
    this.step.update((value) => Math.min(this.maxStep, value + 1));
  }

  previous(): void {
    this.submitted.set(false);
    this.step.update((value) => Math.max(1, value - 1));
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (!this.isFormValidForSubmit()) {
      return;
    }

    this.loading.set(true);
    this.register()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.generatedPassword.set(response.generatedPassword);
          this.showPasswordDialog.set(true);
        },
        error: (error) => this.error.set(mapCatalogError(error)),
      });
  }

  cancel(): void {
    void this.router.navigate([this.listRoute]);
  }

  closePasswordDialog(): void {
    this.showPasswordDialog.set(false);
    this.generatedPassword.set('');
    this.passwordCopied.set(false);
    void this.router.navigate([this.listRoute]);
  }
}
