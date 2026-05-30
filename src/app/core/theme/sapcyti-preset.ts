import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';

import { PRIMARY, SECONDARY, SEMANTIC, SURFACE } from './design-tokens';

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
  components: {
    badge: {
      root: {
        borderRadius: '{border.radius.full}',
        padding: '0.1rem 0.45rem',
        fontWeight: '700',
        minWidth: '1.25rem',
        height: '1.25rem',
      },
    },
    tag: {
      root: {
        borderRadius: '{border.radius.md}',
        padding: '0.2rem 0.5rem',
        fontWeight: '600',
      },
      colorScheme: {
        light: {
          primary: {
            background: SEMANTIC.accentContainer,
            color: SEMANTIC.accent,
          },
          success: {
            background: SEMANTIC.successContainer,
            color: SEMANTIC.success,
          },
          warn: {
            background: SEMANTIC.warningContainer,
            color: SEMANTIC.warning,
          },
          danger: {
            background: SEMANTIC.errorContainer,
            color: SEMANTIC.error,
          },
          info: {
            background: SEMANTIC.infoContainer,
            color: SEMANTIC.info,
          },
          secondary: {
            background: SURFACE[100],
            color: SURFACE[500],
          },
        },
      },
    },
    chip: {
      root: {
        borderRadius: '{border.radius.full}',
        paddingX: '0.75rem',
        paddingY: '0.25rem',
        gap: '0.375rem',
        background: SURFACE[100],
        color: SURFACE[700],
      },
    },
    toast: {
      root: {
        borderRadius: '{border.radius.lg}',
        width: '22rem',
      },
      colorScheme: {
        light: {
          success: {
            background: SEMANTIC.successContainer,
            borderColor: SEMANTIC.successBorder,
            color: SEMANTIC.successStrong,
            detailColor: SEMANTIC.success,
          },
          warn: {
            background: SEMANTIC.warningContainer,
            borderColor: SEMANTIC.warningBorder,
            color: SEMANTIC.warningStrong,
            detailColor: SEMANTIC.warning,
          },
          error: {
            background: SEMANTIC.errorContainer,
            borderColor: SEMANTIC.errorBorder,
            color: SEMANTIC.onErrorContainer,
            detailColor: SEMANTIC.error,
          },
          info: {
            background: SEMANTIC.infoContainer,
            borderColor: SEMANTIC.infoBorder,
            color: SEMANTIC.infoStrong,
            detailColor: SEMANTIC.info,
          },
        },
      },
    },
  },
});
