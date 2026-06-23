import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'domainError',
  standalone: true,
})
export class DomainErrorMessagePipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  transform(errorKey: string | null | undefined, i18nScope: string): string {
    if (!errorKey) {
      return '';
    }

    return this.translate.instant(`${i18nScope}.${errorKey}`);
  }
}
