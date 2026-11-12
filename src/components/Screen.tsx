import React from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { RefreshControl } from 'react-native';
import { useTheme } from 'react-native-paper';
import { commonStyles } from '@/theme/commonStyles';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, scroll = true, refreshing = false, onRefresh, contentStyle }: Props) {
  const theme = useTheme();
  const bg = { backgroundColor: theme.colors.background };
  if (!scroll) return <View style={[styles.flex, bg]}>{children}</View>;
  return (
    <ScrollView
      style={[styles.flex, bg]}
      contentContainerStyle={[commonStyles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}
const styles = StyleSheet.create({ flex: { flex: 1 } });
