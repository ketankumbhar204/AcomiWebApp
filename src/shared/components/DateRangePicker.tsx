import { Box, TextField } from '@mui/material';

export type DateRangeValue = {
  from: string | null;
  to: string | null;
};

type DateRangePickerProps = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  fromLabel?: string;
  toLabel?: string;
  disabled?: boolean;
};

/** Lightweight native date range — no MUI X dependency. */
export function DateRangePicker({
  value,
  onChange,
  fromLabel = 'From',
  toLabel = 'To',
  disabled = false,
}: DateRangePickerProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
      <TextField
        size="small"
        type="date"
        label={fromLabel}
        value={value.from ?? ''}
        disabled={disabled}
        onChange={(event) =>
          onChange({ ...value, from: event.target.value ? event.target.value : null })
        }
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        size="small"
        type="date"
        label={toLabel}
        value={value.to ?? ''}
        disabled={disabled}
        onChange={(event) =>
          onChange({ ...value, to: event.target.value ? event.target.value : null })
        }
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </Box>
  );
}
