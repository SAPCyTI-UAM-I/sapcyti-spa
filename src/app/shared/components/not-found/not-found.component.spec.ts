import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  it('navigates home when the action is triggered', () => {
    const router = { navigateByUrl: vi.fn() };
    TestBed.configureTestingModule({
      imports: [NotFoundComponent, TranslateModule.forRoot()],
      providers: [{ provide: Router, useValue: router }],
    });
    const component = TestBed.createComponent(NotFoundComponent).componentInstance;

    component.goHome();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
