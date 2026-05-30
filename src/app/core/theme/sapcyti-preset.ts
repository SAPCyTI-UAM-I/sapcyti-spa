import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';

import { PRIMARY, SURFACE } from './design-tokens';

export const SapcytiPreset = definePreset(Lara, {
  semantic: {
    primary: PRIMARY,
    colorScheme: {
      light: {
        surface: SURFACE,
      },
    },
  },
});
