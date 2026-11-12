import React, { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { HelperText, Menu, TextInput } from 'react-native-paper';
import { commonStyles } from '@/theme/commonStyles';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

type Props<T extends FieldValues> = {
    control: Control<T>;
    name: Path<T>;
    label: string;
    options: SelectOption[];
    placeholder?: string;
    emptyText?: string;
    disabled?: boolean;
};

/** Dropdown bound to a form field. The form value is the selected option's `value` ('' when nothing is selected). */
export function FormSelect<T extends FieldValues>({ control, name, label, options, placeholder, emptyText = 'No options available', disabled = false }: Props<T>) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
                <SelectView
                    label={label}
                    value={value === undefined || value === null ? '' : String(value)}
                    options={options}
                    placeholder={placeholder}
                    emptyText={emptyText}
                    disabled={disabled}
                    error={error?.message}
                    onChange={onChange}
                    onClose={onBlur}
                />
            )}
        />
    );
}

interface ViewProps {
    label: string;
    value: string;
    options: SelectOption[];
    placeholder?: string;
    emptyText: string;
    disabled: boolean;
    error?: string;
    onChange: (value: string) => void;
    onClose: () => void;
}

function SelectView({ label, value, options, placeholder, emptyText, disabled, error, onChange, onClose }: ViewProps) {
    const [open, setOpen] = useState(false);
    const [width, setWidth] = useState(0);
    const selected = options.find((o) => o.value === value);

    const close = () => {
        setOpen(false);
        onClose();
    };
    return (
        <View style={commonStyles.field} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
            <Menu
                visible={open}
                onDismiss={close}
                contentStyle={{ minWidth: width }}
                anchor={
                    <Pressable
                        onPress={() => { if (!disabled) setOpen(true); }}
                        accessibilityRole="button"
                        accessibilityLabel={`${label}: ${selected?.label ?? 'none selected'}`}
                        accessibilityState={{ expanded: open, disabled }}
                    >
                        <View pointerEvents="none">
                            <TextInput
                                mode="outlined"
                                label={label}
                                value={selected?.label ?? ''}
                                placeholder={placeholder}
                                editable={false}
                                disabled={disabled}
                                error={!!error}
                                right={<TextInput.Icon icon={open ? 'menu-up' : 'menu-down'} />}
                            />
                        </View>
                    </Pressable>
                }
            >
                {options.length === 0 ? <Menu.Item title={emptyText} disabled /> : null}
                {options.map((o) => (
                    <Menu.Item
                        key={o.value}
                        title={o.label}
                        disabled={o.disabled}
                        leadingIcon={o.value === value ? 'check' : undefined}
                        onPress={() => {
                            onChange(o.value);
                            close();
                        }}
                    />
                ))}
            </Menu>
            {error ? <HelperText type="error" visible>{error}</HelperText> : null}
        </View>
    );
}