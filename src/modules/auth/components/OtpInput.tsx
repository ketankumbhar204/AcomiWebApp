import { Box, TextField, useTheme } from '@mui/material';
import {
  useEffect,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { colors } from '@/shared/theme/colors';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

const OTP_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
};

export function OtpInput({
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  onComplete,
}: OtpInputProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? '');

  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const emitChange = (nextDigits: string[]) => {
    const next = nextDigits.join('').slice(0, OTP_LENGTH);
    onChange(next);
    if (next.length === OTP_LENGTH) {
      onComplete?.(next);
    }
  };

  const handleChange = (text: string, index: number) => {
    const sanitized = text.replace(/\D/g, '');
    if (sanitized.length > 1) {
      const nextDigits = [...digits];
      for (let i = 0; i < sanitized.length && index + i < OTP_LENGTH; i += 1) {
        nextDigits[index + i] = sanitized[i] ?? '';
      }
      emitChange(nextDigits);
      const nextIndex = Math.min(index + sanitized.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = sanitized.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    emitChange(nextDigits);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent, index: number) => {
    if (event.key === 'Backspace') {
      if (digits[index]) {
        const nextDigits = [...digits];
        nextDigits[index] = '';
        emitChange(nextDigits);
      } else if (index > 0) {
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        emitChange(nextDigits);
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) {
      return;
    }
    const nextDigits = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? '');
    emitChange(nextDigits);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
  };

  return (
    <Box
      role="group"
      aria-label={t('auth.otp.ariaLabel')}
      sx={{
        display: 'flex',
        gap: { xs: 0.75, sm: 1 },
        justifyContent: 'space-between',
      }}
    >
      {digits.map((digit, index) => {
        const filled = digit.length > 0;
        return (
          <TextField
            key={index}
            inputRef={(ref: HTMLInputElement | null) => {
              inputRefs.current[index] = ref;
            }}
            value={digit}
            disabled={disabled}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              handleChange(event.target.value, index)
            }
            onKeyDown={(event) => handleKeyDown(event, index)}
            onPaste={handlePaste as (event: ClipboardEvent<HTMLDivElement>) => void}
            slotProps={{
              htmlInput: {
                inputMode: 'numeric',
                maxLength: 6,
                'aria-label': `Digit ${index + 1} of ${OTP_LENGTH}`,
                style: {
                  textAlign: 'center',
                  ...DASHBOARD_UX.cardTitle,
                  color: s.textPrimary,
                },
              },
            }}
            sx={{
              width: { xs: 42, sm: 48 },
              '& .MuiOutlinedInput-root': {
                borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                bgcolor: filled ? s.elevated : s.surface,
                minHeight: 44,
                '& fieldset': {
                  borderColor: filled ? colors.primaryDark : s.border,
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.primaryDark,
                  borderWidth: 2,
                },
              },
            }}
          />
        );
      })}
    </Box>
  );
}
