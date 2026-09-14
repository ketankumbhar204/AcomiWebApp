import { InputAdornment, TextField, type TextFieldProps } from '@mui/material';
import type { ReactNode } from 'react';
import { normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';

type IndianMobileTextFieldProps = Omit<TextFieldProps, 'onChange' | 'value' | 'type'> & {
  value: string;
  onChange: (value: string) => void;
  startIcon?: ReactNode;
};

/**
 * Admin/listing mobile input with a fixed +91 country-code adornment.
 * Value is the national 10-digit number only.
 */
export function IndianMobileTextField({
  value,
  onChange,
  startIcon,
  slotProps,
  ...rest
}: IndianMobileTextFieldProps) {
  const incomingInput = (slotProps?.input ?? {}) as Record<string, unknown>;
  const incomingHtml = (slotProps?.htmlInput ?? {}) as Record<string, unknown>;

  return (
    <TextField
      {...rest}
      value={value}
      onChange={(event) => onChange(normalizeIndianMobileDigits(event.target.value))}
      slotProps={{
        ...slotProps,
        htmlInput: {
          ...incomingHtml,
          maxLength: 10,
          inputMode: 'numeric',
          autoComplete: 'tel-national',
        },
        input: {
          ...incomingInput,
          startAdornment: (
            <InputAdornment position="start" sx={{ gap: 0.75, mr: 0.5 }}>
              {startIcon}
              <span style={{ fontWeight: 700, letterSpacing: '0.02em' }}>+91</span>
              <BoxDivider />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

function BoxDivider() {
  return (
    <span
      aria-hidden
      style={{
        width: 1,
        alignSelf: 'stretch',
        background: 'rgba(148, 163, 184, 0.7)',
        marginLeft: 2,
        marginRight: 2,
      }}
    />
  );
}
