import { Box, IconButton, Typography, useTheme } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

type PeriodDayNavProps = {
  /** YYYY-MM-DD */
  date: string;
  onPrevious: () => void;
  onNext: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
  /** When set, center opens a native date picker. */
  onDateSelect?: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  /** Override center label; defaults to locale medium date. */
  label?: string;
  size?: 'compact' | 'default';
  sx?: SxProps<Theme>;
};

function defaultDayLabel(date: string, locale?: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Shared day stepper — mobile `MenuDateNavRow` / customer poll date chrome parity.
 * Layout: [‹]  Mon, Aug 3, 2026 📅  [›] as three bordered controls.
 */
export function PeriodDayNav({
  date,
  onPrevious,
  onNext,
  disablePrevious = false,
  disableNext = false,
  onDateSelect,
  minDate,
  maxDate,
  label,
  size = 'default',
  sx,
}: PeriodDayNavProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerEnabled = typeof onDateSelect === 'function';
  const btn = size === 'compact' ? 28 : DASHBOARD_UX.buttonHeight;
  const icon = size === 'compact' ? 14 : DASHBOARD_UX.iconSize;
  const display = label ?? defaultDayLabel(date, i18n.language);

  const openPicker = () => {
    if (!pickerEnabled) return;
    const el = inputRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      el.showPicker();
    } else {
      el.click();
    }
  };

  const controlSx = {
    height: btn,
    minHeight: btn,
    border: `1px solid ${s.border}`,
    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
    bgcolor: s.surface,
  } as const;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        ...sx,
      }}
    >
      <IconButton
        size="small"
        onClick={onPrevious}
        disabled={disablePrevious}
        aria-label={t('common.previous', { defaultValue: 'Previous' })}
        sx={{
          width: btn,
          ...controlSx,
          color: colors.primaryDark,
          '&.Mui-disabled': { opacity: 0.4 },
        }}
      >
        <ChevronLeft size={icon} />
      </IconButton>

      <Box
        component={pickerEnabled ? 'button' : 'div'}
        type={pickerEnabled ? 'button' : undefined}
        onClick={pickerEnabled ? openPicker : undefined}
        aria-label={
          pickerEnabled
            ? t('meals.planning.openCalendar', { defaultValue: 'Open calendar' })
            : undefined
        }
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          px: size === 'compact' ? 1 : 1.25,
          minWidth: size === 'compact' ? 148 : 176,
          ...controlSx,
          border: `1px solid ${s.border}`,
          cursor: pickerEnabled ? 'pointer' : 'default',
          fontFamily: 'inherit',
          color: s.textPrimary,
          '&:hover': pickerEnabled
            ? { borderColor: `${colors.primaryDark}66`, bgcolor: s.hover }
            : undefined,
        }}
      >
        <Typography
          sx={{
            fontSize: size === 'compact' ? 13 : 14,
            fontWeight: 600,
            color: s.textPrimary,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
          }}
        >
          {display}
        </Typography>
        {pickerEnabled ? <CalendarDays size={size === 'compact' ? 14 : 16} color={s.textMuted} /> : null}
        {pickerEnabled ? (
          <Box
            component="input"
            ref={inputRef}
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const next = e.target.value;
              if (!next) return;
              if (minDate && next < minDate) return;
              if (maxDate && next > maxDate) return;
              onDateSelect?.(next);
            }}
            tabIndex={-1}
            aria-hidden
            sx={{
              position: 'absolute',
              opacity: 0,
              width: 1,
              height: 1,
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </Box>

      <IconButton
        size="small"
        onClick={onNext}
        disabled={disableNext}
        aria-label={t('common.next', { defaultValue: 'Next' })}
        sx={{
          width: btn,
          ...controlSx,
          color: colors.primaryDark,
          '&.Mui-disabled': { opacity: 0.4 },
        }}
      >
        <ChevronRight size={icon} />
      </IconButton>
    </Box>
  );
}
