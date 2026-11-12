import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { colors } from '@/theme/paperTheme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
const icon = (name: IconName) => ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name={name} color={color} size={size} />;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF', tabBarActiveTintColor: colors.primary }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: icon('view-dashboard-outline') }} />
      <Tabs.Screen name="sheep" options={{ title: 'Sheep', tabBarIcon: icon('sheep') }} />
      <Tabs.Screen name="medications" options={{ title: 'Medications', tabBarIcon: icon('pill') }} />
      <Tabs.Screen name="treatments" options={{ title: 'Treatments', tabBarIcon: icon('needle') }} />
    </Tabs>
  );
}
