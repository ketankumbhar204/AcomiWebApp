import { Box, Button, Typography, useTheme } from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { HealthBandId, SpaceHealthResult } from '@/spaceLifecycle';
import type { MembershipRole, SpaceType } from '@/shared/types/space';
import { spaceSpaceHealthPath } from '@/routes/paths';
import { colors } from '@/shared/theme/colors';
import { HealthScoreRing } from './HealthScoreRing';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';
import { isGenericUserName } from '@/modules/onboarding/utils/profileCompletion';

function bandColor(band: HealthBandId): string {
  switch (band) {
    case 'excellent':
    case 'healthy':
      return colors.success;
    case 'needsImprovement':
      return '#D97706';
    case 'atRisk':
      return '#EA580C';
    case 'critical':
      return '#DC2626';
    default:
      return colors.primaryDark;
  }
}

function greetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'greetingMorning';
  if (hour < 17) return 'greetingAfternoon';
  return 'greetingEvening';
}

function greetingNameFromUser(fullName: string | null | undefined): string | null {
  if (isGenericUserName(fullName)) return null;
  return fullName?.trim().split(/\s+/)[0] ?? null;
}

type SpaceOverviewCardProps = {
  spaceId: string;
  spaceName: string;
  spaceType?: SpaceType;
  membershipRole?: MembershipRole;
  health: SpaceHealthResult | null;
  pendingCount: number;
  onRefresh: () => void;
  userFullName?: string | null;
};

/**
 * Row-1 left card — Space Overview (greeting + context + health + refresh).
 */
export function SpaceOverviewCard({
  spaceId,
  spaceName,
  spaceType,
  membershipRole,
  health,
  pendingCount,
  onRefresh,
  userFullName,
}: SpaceOverviewCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const available = health?.available === true;
  const score = available ? health.score : 0;
  const band = available ? health.band : 'healthy';
  const color = bandColor(band);

  const contextLine = [spaceType, membershipRole].filter(Boolean).join(' · ');
  const displayName = greetingNameFromUser(userFullName);
  const greeting = t(`dashboard.owner.${greetingKey()}`);
  const greetingLine = displayName
    ? t('dashboard.owner.greetingWithName', { greeting, name: displayName })
    : t('dashboard.owner.greetingPlain', { greeting });

  const goHealth = () => navigate(spaceSpaceHealthPath(spaceId));

  return (
    <Box
      component="section"
      aria-label={t('dashboard.spaceOverview.title', { defaultValue: 'Space overview' })}
      sx={{
        p: 1.25,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        border: `1px solid ${s.border}`,
        height: DASHBOARD_UX.summaryCardHeight,
        minHeight: DASHBOARD_UX.summaryCardMinHeight,
        maxHeight: DASHBOARD_UX.summaryCardMaxHeight,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.65,
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            ...DASHBOARD_UX.spaceName,
            color: s.textPrimary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {spaceName}
        </Typography>
        {contextLine ? (
          <Typography
            sx={{
              ...DASHBOARD_UX.spaceRole,
              color: s.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              mt: 0.15,
            }}
            noWrap
          >
            {contextLine}
          </Typography>
        ) : null}
      </Box>

      <Typography
        sx={{
          ...DASHBOARD_UX.greeting,
          color: s.textPrimary,
        }}
        noWrap
      >
        {greetingLine}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.1,
          minWidth: 0,
          flex: 1,
          mt: 0.5,
        }}
      >
        <Box
          role="button"
          tabIndex={0}
          onClick={goHealth}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              goHealth();
            }
          }}
          aria-label={
            available
              ? t('dashboard.health.a11y.summary', {
                  score,
                  band: t(`dashboard.health.bands.${band}`),
                })
              : t('dashboard.health.emptyTitle')
          }
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.15,
            minWidth: 0,
            flex: 1,
            cursor: 'pointer',
            borderRadius: `${DASHBOARD_UX.tileRadius}px`,
            outline: 'none',
            '&:focus-visible': {
              outline: `2px solid ${colors.primary}`,
              outlineOffset: 2,
            },
          }}
        >
          <HealthScoreRing
            score={available ? score : 0}
            color={available ? color : s.border}
            size={DASHBOARD_UX.healthRingSize}
            strokeWidth={DASHBOARD_UX.healthRingStroke}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
              {t('dashboard.health.title')}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.link, color, mt: 0.15 }}>
              {available ? t(`dashboard.health.bands.${band}`) : t('dashboard.health.emptyTitle')}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, mt: 0.2 }} noWrap>
              {pendingCount > 0
                ? t('dashboard.health.banner.issuesAttention', { count: pendingCount })
                : available
                  ? t('dashboard.health.summary.healthy')
                  : t('dashboard.health.emptyBody')}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshCw size={DASHBOARD_UX.iconSize} />}
          onClick={(e) => {
            e.stopPropagation();
            onRefresh();
          }}
          aria-label={t('common.refresh')}
          sx={{
            flexShrink: 0,
            height: DASHBOARD_UX.buttonHeight,
            minHeight: DASHBOARD_UX.buttonHeight,
            px: 1.25,
            borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
            ...DASHBOARD_UX.button,
            borderColor: colors.primary,
            color: colors.primaryDark,
            bgcolor: s.surface,
            '&:hover': {
              borderColor: colors.primaryDark,
              bgcolor: s.hover,
            },
          }}
        >
          {t('common.refresh')}
        </Button>
      </Box>
    </Box>
  );
}
