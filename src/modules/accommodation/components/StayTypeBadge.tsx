import { Box, Typography } from '@mui/material';
import { CalendarClock, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pastels } from '@/shared/theme/colors';
import {
  stayChoiceDefaultLabel,
  stayChoiceLabelKey,
  type StayChoice,
} from '../utils/shortStay';

type StayTypeBadgeProps = {
  stayKind?: StayChoice | null;
  /** Compact OPEN_ENDED label (“No Fixed”) for tight bed/member chips. */
  compact?: boolean;
};

const TONES: Record<StayChoice, { fg: string; bg: string; border: string }> = {
  MONTHLY: pastels.mint,
  SHORT: pastels.blue,
  OPEN_ENDED: pastels.orange,
};

/** Compact stay-type chip. Renders nothing when stayKind is null/unknown. */
export function StayTypeBadge({ stayKind, compact = true }: StayTypeBadgeProps) {
  const { t } = useTranslation();
  if (stayKind !== 'MONTHLY' && stayKind !== 'SHORT' && stayKind !== 'OPEN_ENDED') {
    return null;
  }

  const tone = TONES[stayKind];
  const Icon = stayKind === 'SHORT' ? CalendarClock : CalendarDays;
  const fullLabel = t(stayChoiceLabelKey(stayKind), {
    defaultValue: stayChoiceDefaultLabel(stayKind),
  });
  const label =
    compact && stayKind === 'OPEN_ENDED'
      ? t('occupancy.section.openEndedStayChoiceCompact', {
          defaultValue: 'No Fixed',
        })
      : fullLabel;

  return (
    <Box
      component="span"
      aria-label={fullLabel}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        flexShrink: 0,
        borderRadius: 999,
        border: `1px solid ${tone.border}`,
        bgcolor: tone.bg,
        px: 0.75,
        py: 0.25,
        maxWidth: '100%',
      }}
    >
      <Icon size={11} color={tone.fg} strokeWidth={2.3} aria-hidden />
      <Typography
        component="span"
        sx={{
          fontSize: 10,
          lineHeight: '13px',
          fontWeight: 700,
          color: tone.fg,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
