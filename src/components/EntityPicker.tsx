import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Dialog, HelperText, List, Portal, Searchbar, Text } from 'react-native-paper';
import { commonStyles } from '@/theme/commonStyles';

export interface PickerOption { id: string; title: string; description?: string; disabled?: boolean }

interface Props {
  label: string;
  value: string;
  options: PickerOption[];
  onChange: (id: string) => void;
  error?: string;
  emptyText?: string;
}

export function EntityPicker({ label, value, options, onChange, error, emptyText = 'Nothing available' }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.id === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => `${o.title} ${o.description ?? ''}`.toLowerCase().includes(q)) : options;
  }, [options, query]);

  return (
    <View style={commonStyles.field}>
      <Button mode="outlined" icon="chevron-down" contentStyle={{ justifyContent: 'space-between', flexDirection: 'row-reverse' }} style={commonStyles.minTouch} onPress={() => setOpen(true)} accessibilityLabel={`${label}: ${selected?.title ?? 'none selected'}`}>
        {selected ? `${label}: ${selected.title}` : `Select ${label.toLowerCase()}`}
      </Button>
      {error ? <HelperText type="error" visible>{error}</HelperText> : null}
      <Portal>
        <Dialog visible={open} onDismiss={() => setOpen(false)} style={{ maxHeight: '80%' }}>
          <Dialog.Title>{label}</Dialog.Title>
          <Dialog.Content>
            <Searchbar placeholder="Search" value={query} onChangeText={setQuery} />
          </Dialog.Content>
          <Dialog.ScrollArea>
            <ScrollView>
              {filtered.length === 0 ? <Text style={{ padding: 16 }}>{emptyText}</Text> : null}
              {filtered.map((o) => (
                <List.Item key={o.id} title={o.title} description={o.description} disabled={o.disabled} onPress={() => { onChange(o.id); setOpen(false); setQuery(''); }} right={(p) => (o.id === value ? <List.Icon {...p} icon="check" /> : null)} />
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions><Button onPress={() => setOpen(false)}>Close</Button></Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
