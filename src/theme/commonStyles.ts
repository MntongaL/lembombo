import { StyleSheet } from 'react-native';

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24 } as const;

export const commonStyles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg * 3 },
  card: { borderRadius: 16, backgroundColor: '#FFFFFF' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  grow: { flex: 1 },
  field: { marginBottom: spacing.xs },
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md },
  minTouch: { minHeight: 48 },
});
