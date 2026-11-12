import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Snackbar } from 'react-native-paper';

interface Ctx { show: (message: string) => void }
const SnackbarContext = createContext<Ctx>({ show: () => undefined });
export const useSnackbar = (): Ctx => useContext(SnackbarContext);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const show = useCallback((m: string) => setMessage(m), []);
  const value = useMemo(() => ({ show }), [show]);
  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar visible={message !== null} onDismiss={() => setMessage(null)} duration={4000} action={{ label: 'OK', onPress: () => setMessage(null) }}>
        {message ?? ''}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}
