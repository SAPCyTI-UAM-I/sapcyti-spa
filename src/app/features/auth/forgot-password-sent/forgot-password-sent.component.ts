import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';

import { AuthFooterComponent } from '../../../shared/components/auth-footer/auth-footer.component';
import { AuthPageLayoutComponent } from '../../../shared/components/auth-page-layout/auth-page-layout.component';

@Component({
  selector: 'app-forgot-password-sent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, RouterLink, AuthFooterComponent, AuthPageLayoutComponent, Button],
  templateUrl: './forgot-password-sent.component.html',
})
export class ForgotPasswordSentComponent {}
