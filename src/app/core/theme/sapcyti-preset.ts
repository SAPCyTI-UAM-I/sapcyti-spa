import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';

/** Design tokens from design/HU-01-03-inicio-sesion/pagina-principal/DESIGN.md */
export const SapcytiPreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '#E8F1F8',
      100: '#D4E6F4',
      200: '#A8CCE8',
      300: '#6FA3D1',
      400: '#3D6F9C',
      500: '#1E4D7B',
      600: '#163A5F',
      700: '#0F2D47',
      800: '#0A2236',
      900: '#051525',
      950: '#020A12',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#FFFFFF',
          50: '#F7F8FA',
          100: '#F0F4F8',
          200: '#E5E8EB',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#5C6670',
          600: '#42474F',
          700: '#1A1D21',
          800: '#0B1C30',
          900: '#051525',
          950: '#020A12',
        },
      },
    },
  },
});
