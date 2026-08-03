import { Box, IconButton, Typography, useTheme } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

type PeriodMonthNavProps = {
  /** YYYY-MM */
  month: string;
  onPrevious: () => void;
  onNext: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
  /** When set, month label opens a native month picker (mobile month-jump parity). */
  onMonthSelect?: (monthKey: string) => void;
  minMonth?: string;
  maxMonth?: string;
  size?: 'compact' | 'default';
  sx?: SxProps<Theme>;
};

function formatMonthLabel(monthKey: string, locale?: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Shared month stepper — mobile `MemberMealActivityMonthNav` parity.
 * Layout: [‹] July 2026 [›] in one bordered pill.
 */
export function PeriodMonthNav({
  month,
  onPrevious,
  onNext,
  disablePrevious = false,
  disableNext = false,
  onMonthSelect,
  minMonth,
  maxMonth,
  size = 'default',
  sx,
}: PeriodMonthNavProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerEnabled = typeof onMonthSelect === 'function';
  const btn = size === 'compact' ? 28 : DASHBOARD_UX.buttonHeight;
  const icon = size === 'compact' ? 16 : DASHBOARD_UX.iconSize;

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

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.75,
        py: 0.35,
        minHeight: btn + 8,
        borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
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
          height: btn,
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
        aria-label={pickerEnabled ? t('common.selectMonth', { defaultValue: 'Select month' }) : undefined}
        sx={{
          position: 'relative',
          flex: 1,
          minWidth: size === 'compact' ? 112 : 128,
          minHeight: btn,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 0.75,
          border: 'none',
          background: 'transparent',
          cursor: pickerEnabled ? 'pointer' : 'default',
          fontFamily: 'inherit',
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
          '&:hover': pickerEnabled ? { bgcolor: s.hover } : undefined,
        }}
      >
        <Typography
          sx={{
            fontSize: size === 'compact' ? 13 : 14,
            fontWeight: 600,
            color: s.textPrimary,
            textAlign: 'center',
            lineHeight: 1.2,
            textDecoration: pickerEnabled ? 'underline' : 'none',
            textUnderlineOffset: 3,
          }}
        >
          {formatMonthLabel(month, i18n.language)}
        </Typography>
        {pickerEnabled ? (
          <Box
            component="input"
            ref={inputRef}
            type="month"
            value={month}
            min={minMonth}
            max={maxMonth}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const next = e.target.value;
              if (next) onMonthSelect?.(next);
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
          height: btn,
          color: colors.primaryDark,
          '&.Mui-disabled': { opacity: 0.4 },
        }}
      >
        <ChevronRight size={icon} />
      </IconButton>
    </Box>
  );
}
