import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { commonStyles } from '@/theme/commonStyles';

export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={commonStyles.center} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" />
      <Text variant="bodyMedium">{label}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={commonStyles.center}>
      <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#B3261E" />
      <Text variant="titleMedium">Something went wrong</Text>
      <Text variant="bodyMedium" style={{ textAlign: 'center' }}>{message}</Text>
      {onRetry ? <Button mode="contained" onPress={onRetry}>Try again</Button> : null}
    </View>
  );
}

interface EmptyProps { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; hint?: string; actionLabel?: string; onAction?: () => void }
export function EmptyState({ icon, title, hint, actionLabel, onAction }: EmptyProps) {
  return (
    <View style={commonStyles.center}>
      <MaterialCommunityIcons name={icon} size={56} color="#7A8B7A" />
      <Text variant="titleMedium">{title}</Text>
      {hint ? <Text variant="bodyMedium" style={{ textAlign: 'center' }}>{hint}</Text> : null}
      {actionLabel && onAction ? <Button mode="contained" onPress={onAction}>{actionLabel}</Button> : null}
    </View>
  );
}
