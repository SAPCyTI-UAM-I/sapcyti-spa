import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';

import { PRIMARY, SECONDARY, SURFACE } from './design-tokens';

export const SapcytiPreset = definePreset(Lara, {
  semantic: {
    primary: PRIMARY,
    secondary: SECONDARY,
    colorScheme: {
      light: {
        surface: SURFACE,
      },
    },
  },
});
