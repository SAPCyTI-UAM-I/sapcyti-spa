import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';

import { AuthStateService } from '../core/auth/auth.service';
import { ShellComponent } from './shell.component';

describe('ShellComponent', () => {
  it('calls async logout and navigates to login on completion', () => {
    const currentUser$ = new BehaviorSubject(null);
    const authMock = {
      currentUser$,
      logout: vi.fn(() => of(void 0)),
    };
    const routerMock = {
      navigateByUrl: vi.fn(),
    };
    const translateMock = {
      instant: vi.fn((key: string) => key),
      use: vi.fn(),
      onLangChange: new BehaviorSubject(null),
    };

    TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        { provide: AuthStateService, useValue: authMock },
        { provide: Router, useValue: routerMock },
        { provide: TranslateService, useValue: translateMock },
      ],
    });

    const fixture = TestBed.createComponent(ShellComponent);
    const component = fixture.componentInstance;

    component.onLogout();

    expect(authMock.logout).toHaveBeenCalledTimes(1);
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });
});
