import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

import { injectMockEnabled } from '../../../core/mocks/mock.config';
import { MOCK_VALID_RESET_TOKEN } from '../../../core/auth/mock/auth.mock';
import { AuthFooterComponent } from '../../../shared/components';
import { AuthPageLayoutComponent } from '../../../shared/components';

@Component({
  selector: 'app-forgot-password-sent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    RouterLink,
    AuthFooterComponent,
    AuthPageLayoutComponent,
    Button,
    Tooltip,
  ],
  templateUrl: './forgot-password-sent.component.html',
})
export class ForgotPasswordSentComponent {
  readonly isMock = injectMockEnabled('passwordRecovery');
  readonly mockResetToken = MOCK_VALID_RESET_TOKEN;
}
