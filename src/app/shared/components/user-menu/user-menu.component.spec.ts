import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { UserMenuComponent } from './user-menu.component';
import { UserMenuItem } from './user-menu.model';

describe('UserMenuComponent', () => {
  const items: readonly UserMenuItem[] = [
    {
      id: 'change-password',
      labelKey: 'SHELL.MENU.CHANGE_PASSWORD',
      icon: 'pi pi-key',
      route: '/account/password',
    },
  ];

  function createComponent() {
    const router = { navigateByUrl: vi.fn() };
    TestBed.configureTestingModule({
      imports: [UserMenuComponent, TranslateModule.forRoot()],
      providers: [{ provide: Router, useValue: router }],
    });
    const fixture = TestBed.createComponent(UserMenuComponent);
    fixture.componentRef.setInput('initials', 'CO');
    fixture.componentRef.setInput('email', 'coordinator@uam.mx');
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    return { component: fixture.componentInstance, router };
  }

  it('builds one menu entry per item preserving order and icon', () => {
    const { component } = createComponent();

    const model = component.model();
    expect(model).toHaveLength(1);
    expect(model[0]?.icon).toBe('pi pi-key');
  });

  it('navigates to the item route when its command runs', () => {
    const { component, router } = createComponent();

    component.model()[0]?.command?.({} as never);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/account/password');
  });
});
