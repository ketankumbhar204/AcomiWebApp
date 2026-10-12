import { Box, Button, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

export type GuidedStepAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  startIcon?: ReactNode;
};

type GuidedStepPanelProps = {
  stepLabel?: string;
  stepCurrent?: number;
  stepTotal?: number;
  progressLine?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  primary?: GuidedStepAction;
  secondary?: GuidedStepAction;
  extra?: ReactNode;
  /**
   * Compact sticky bar: status line and side-by-side actions.
   * Hides the eyebrow, title, and description block.
   */
  compact?: boolean;
};

const g = colors.guidance;

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <Box
      aria-hidden
      sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, ml: 1.5 }}
    >
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        const on = step <= current;
        return (
          <Box key={step} sx={{ display: 'flex', alignItems: 'center' }}>
            {index > 0 ? (
              <Box
                sx={{
                  width: 16,
                  height: 2,
                  borderRadius: 1,
                  bgcolor: step <= current ? colors.primary : g.track,
                }}
              />
            ) : null}
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: on ? colors.primary : 'transparent',
                border: `2px solid ${on ? colors.primary : g.track}`,
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
}

/**
 * Dark workflow-guidance panel. Copy and actions stay with the caller.
 * It does not change navigation or validation.
 */
export function GuidedStepPanel({
  stepLabel,
  stepCurrent,
  stepTotal,
  progressLine,
  eyebrow,
  title,
  description,
  primary,
  secondary,
  extra,
  compact = false,
}: GuidedStepPanelProps) {
  const showDots =
    stepCurrent != null && stepTotal != null && stepTotal > 1 && stepCurrent >= 1;
  const summary = [stepLabel, progressLine, title, description].filter(Boolean).join('. ');

  return (
    <Box
      role="region"
      aria-label={summary || stepLabel || title}
      sx={{
        width: '100%',
        flex: '1 1 100%',
        alignSelf: 'stretch',
        boxSizing: 'border-box',
        mt: compact ? 0.5 : 1,
        p: compact ? { xs: 1.5, md: 1.75 } : { xs: 2, md: 2.5 },
        borderRadius: `${DASHBOARD_UX.radius + 4}px`,
        bgcolor: g.surface,
        border: `1px solid ${g.border}`,
        color: g.text,
      }}
    >
      {stepLabel || showDots ? (
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          {stepLabel ? (
            <Typography
              sx={{
                ...DASHBOARD_UX.smallCaption,
                color: g.label,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {stepLabel}
            </Typography>
          ) : (
            <Box />
          )}
          {showDots && stepCurrent != null && stepTotal != null ? (
            <StepDots current={stepCurrent} total={stepTotal} />
          ) : null}
        </Stack>
      ) : null}

      {progressLine ? (
        <Typography
          sx={{
            ...(compact ? DASHBOARD_UX.caption : DASHBOARD_UX.body),
            color: g.text,
            mt: stepLabel ? (compact ? 0.5 : 1) : 0,
          }}
        >
          {progressLine}
        </Typography>
      ) : null}

      {!compact && (eyebrow || title || description) ? (
        <Box
          sx={{
            mt: stepLabel || progressLine ? 1.75 : 0,
            pt: stepLabel || progressLine ? 1.75 : 0,
            borderTop: stepLabel || progressLine ? `1px solid ${g.divider}` : 'none',
          }}
        >
          {eyebrow ? (
            <Typography
              sx={{
                ...DASHBOARD_UX.smallCaption,
                color: g.label,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {eyebrow}
            </Typography>
          ) : null}
          {title ? (
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: g.text, mt: eyebrow ? 0.5 : 0 }}>
              {title}
            </Typography>
          ) : null}
          {description ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: g.textMuted, mt: 0.75 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
      ) : null}

      {extra ? <Box sx={{ mt: 1 }}>{extra}</Box> : null}

      {primary || secondary ? (
        <Stack
          direction={compact ? 'row' : 'column'}
          useFlexGap
          spacing={1}
          sx={{
            mt: compact ? 1.25 : 2,
            alignItems: 'stretch',
            flexWrap: compact ? 'wrap' : 'nowrap',
          }}
        >
          {primary ? (
            <Button
              variant="contained"
              fullWidth={!compact}
              disabled={primary.disabled}
              onClick={primary.onClick}
              startIcon={primary.startIcon}
              sx={{
                ...DASHBOARD_UX.button,
                minHeight: compact ? 44 : 48,
                height: compact ? 'auto' : 48,
                py: compact ? 1 : undefined,
                flex: compact ? '1.6 1 160px' : undefined,
                textTransform: 'none',
                whiteSpace: 'normal',
                lineHeight: 1.2,
                bgcolor: colors.primary,
                color: g.ctaText,
                boxShadow: 'none',
                '&:hover': { bgcolor: colors.primaryHover, boxShadow: 'none' },
                '&.Mui-disabled': { bgcolor: colors.primary, color: g.ctaText, opacity: 0.5 },
              }}
            >
              {primary.label}
            </Button>
          ) : null}
          {secondary ? (
            <Button
              variant="outlined"
              fullWidth={!compact}
              disabled={secondary.disabled}
              onClick={secondary.onClick}
              startIcon={secondary.startIcon}
              sx={{
                ...DASHBOARD_UX.button,
                minHeight: compact ? 44 : 48,
                height: compact ? 'auto' : 48,
                py: compact ? 1 : undefined,
                flex: compact ? '0.8 1 96px' : undefined,
                textTransform: 'none',
                whiteSpace: 'normal',
                lineHeight: 1.2,
                bgcolor: 'transparent',
                color: g.text,
                borderColor: g.outline,
                boxShadow: 'none',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', borderColor: g.outline },
              }}
            >
              {secondary.label}
            </Button>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
}
