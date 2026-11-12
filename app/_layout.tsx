import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoadingView } from '@/components/StateViews';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { SnackbarProvider } from '@/providers/SnackbarProvider';
import { SyncProvider } from '@/providers/SyncProvider';
import { colors, paperTheme } from '@/theme/paperTheme';

function Gate() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const inAuth = segments[0] === '(auth)';
    if (status === 'signedOut' && !inAuth) router.replace('/login');
    if (status === 'signedIn' && inAuth) router.replace('/');
  }, [status, segments, router]);

  if (status === 'loading') return <LoadingView />;
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="sheep/[id]" options={{ title: 'Sheep details' }} />
      <Stack.Screen name="sheep/new" options={{ title: 'Register sheep' }} />
      <Stack.Screen name="medications/[id]" options={{ title: 'Medication' }} />
      <Stack.Screen name="medications/new" options={{ title: 'Add medication' }} />
      <Stack.Screen name="medications/edit/[id]" options={{ title: 'Edit medication' }} />
      <Stack.Screen name="treatments/[id]" options={{ title: 'Treatment' }} />
      <Stack.Screen name="treatments/new" options={{ title: 'Record treatment' }} />
      <Stack.Screen name="pending" options={{ title: 'Sync queue' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <SnackbarProvider>
          <AuthProvider>
            <SyncProvider>
              <StatusBar style="light" />
              <Gate />
            </SyncProvider>
          </AuthProvider>
        </SnackbarProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
