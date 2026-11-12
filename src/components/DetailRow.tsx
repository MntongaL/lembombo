import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

export function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={{ gap: 2 }}>
      <Text variant="labelMedium" style={{ opacity: 0.7 }}>{label}</Text>
      <Text variant="bodyLarge">{String(value)}</Text>
    </View>
  );
}
