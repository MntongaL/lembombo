import React from 'react';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

interface Props { visible: boolean; title: string; message: string; confirmLabel?: string; onConfirm: () => void; onDismiss: () => void }

export function ConfirmDialog({ visible, title, message, confirmLabel = 'Confirm', onConfirm, onDismiss }: Props) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content><Text variant="bodyMedium">{message}</Text></Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={onConfirm}>{confirmLabel}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
