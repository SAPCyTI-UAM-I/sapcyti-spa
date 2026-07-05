import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import {
  CATALOG_PROGRAM_TYPE_TAG,
  type CatalogTagSeverity,
} from '../../../core/theme/design-tokens';
import { CatalogTagComponent } from './catalog-tag.component';

describe('CatalogTagComponent', () => {
  function create(value: string, severity: CatalogTagSeverity) {
    TestBed.configureTestingModule({ imports: [CatalogTagComponent, NoopAnimationsModule] });
    const fixture = TestBed.createComponent(CatalogTagComponent);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('severity', severity);
    fixture.detectChanges();
    return fixture;
  }

  it('passes PrimeNG severities straight through', () => {
    const fixture = create('Activo', 'success');
    expect(fixture.componentInstance.primeSeverity()).toBe('success');
    expect(fixture.componentInstance.customColors()).toBeNull();
  });

  it('uses dedicated colors for program-type severities', () => {
    const fixture = create('Maestría', 'maestria');
    expect(fixture.componentInstance.primeSeverity()).toBeUndefined();
    expect(fixture.componentInstance.customColors()).toEqual(CATALOG_PROGRAM_TYPE_TAG.maestria);
  });
});
