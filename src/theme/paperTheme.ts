import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

export const colors = {
  primary: '#1B5E20',
  primaryContainer: '#C8E6C9',
  background: '#F4F6F4',
  surface: '#FFFFFF',
  warning: '#B26A00',
  warningContainer: '#FFE8C2',
};

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: colors.primaryContainer,
    onPrimaryContainer: '#0B2E0F',
    secondary: '#4E6B50',
    secondaryContainer: '#D4E8D4',
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: '#E6EBE6',
  },
};
