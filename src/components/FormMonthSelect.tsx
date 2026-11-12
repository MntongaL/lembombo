import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Button, Chip, HelperText, Text } from 'react-native-paper';
import { commonStyles } from '@/theme/commonStyles';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const ALL_MONTHS: number[] = MONTHS.map((_, i) => i + 1);

type Props<T extends FieldValues> = {
    control: Control<T>;
    name: Path<T>;
    label: string;
    /** Show "All / Clear" shortcuts. */
    showShortcuts?: boolean;
};

/** Form value is an array of month numbers (1 = January ... 12 = December), kept sorted. */
export function FormMonthSelect<T extends FieldValues>({ control, name, label, showShortcuts = true }: Props<T>) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field: { value, onChange }, fieldState: { error } }) => (
                <MonthSelectView
                    label={label}
                    value={Array.isArray(value) ? (value as number[]) : []}
                    onChange={onChange}
                    error={error?.message}
                    showShortcuts={showShortcuts}
                />
            )}
        />
    );
}

interface ViewProps {
    label: string;
    value: number[];
    onChange: (months: number[]) => void;
    error?: string;
    showShortcuts: boolean;
}

function MonthSelectView({ label, value, onChange, error, showShortcuts }: ViewProps) {
    const selected = useMemo(() => new Set(value), [value]);

    const toggle = (month: number) => {
        const next = new Set(selected);
        if (next.has(month)) next.delete(month);
        else next.add(month);
        onChange(Array.from(next).sort((a, b) => a - b));
    };

    return (
        <View style={commonStyles.field}>
            <View style={commonStyles.row}>
                <Text variant="labelLarge" style={commonStyles.grow}>{label}</Text>
                {showShortcuts ? (
                    <>
                        <Button compact onPress={() => onChange(ALL_MONTHS)}>All</Button>
                        <Button compact onPress={() => onChange([])}>Clear</Button>
                    </>
                ) : null}
            </View>
            <View style={commonStyles.rowWrap}>
                {MONTHS.map((monthName, i) => {
                    const month = i + 1;
                    return (
                        <Chip
                            key={monthName}
                            selected={selected.has(month)}
                            showSelectedCheck
                            onPress={() => toggle(month)}
                            style={commonStyles.minTouch}
                            accessibilityLabel={monthName}
                        >
                            {monthName}
                        </Chip>
                    );
                })}
            </View>
            {error ? <HelperText type="error" visible>{error}</HelperText> : null}
        </View>
    );
}