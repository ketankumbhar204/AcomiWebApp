import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Clock3, Info, UtensilsCrossed } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardCustomerMealsSection } from '@/modules/dashboard/components/customer/DashboardCustomerMealsSection';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { useCustomerSubscriptionStatus } from '@/modules/meals/hooks/useCustomerSubscriptionStatus';
import { mealPollClosingApi } from '@/modules/onboarding/api/mealPollClosingApi';
import { MemberMealActivitySection } from '@/modules/members/components/meals/MemberMealActivitySection';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { ContentCard } from '@/shared/components/ContentCard';
import { LoadingState } from '@/shared/components/LoadingState';
import { useLinkedMember } from '@/shared/hooks/useLinkedMember';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { colors } from '@/shared/theme/colors';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { MealBillingType } from '@/shared/types/meals';
import {
  spaceDashboardPath,
  spaceMealsPath,
  spaceMealsPlansCustomerPath,
} from '@/routes/paths';

function resolveCustomerBillingType(
  prepaidBilling: boolean | undefined,
  mealBillingType: MealBillingType | undefined,
): MealBillingType | undefined {
  if (mealBillingType) return mealBillingType;
  if (prepaidBilling) return 'PREPAID_BALANCE';
  return 'PAY_PER_MEAL';
}

/** Format `HH:mm` / `HH:mm:ss` → `09:00 AM`. */
function formatCutoffLabel(time: string | null | undefined): string | null {
  if (!time?.trim()) return null;
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return time;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(h12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
}

/**
 * Customer / tenant Meals tab — My Orders UI matching approved mock.
 */
export function CustomerMealsHomePage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const permissions = useSpacePermissions(spaceId);
  const { member, memberId: linkedMemberId, loading } = useLinkedMember(spaceId);
  const { status: subscriptionStatus } = useCustomerSubscriptionStatus(spaceId, linkedMemberId);

  const closingQuery = useQuery({
    queryKey: ['meal-poll-closing', spaceId],
    queryFn: () => mealPollClosingApi.getSettings(spaceId),
    enabled: Boolean(spaceId),
    staleTime: 60_000,
  });

  const cutoffLabel = useMemo(
    () => formatCutoffLabel(closingQuery.data?.breakfastTime) ?? '09:00 AM',
    [closingQuery.data?.breakfastTime],
  );

  const effectiveMealBillingType = useMemo(
    () =>
      resolveCustomerBillingType(
        subscriptionStatus?.prepaidBilling,
        subscriptionStatus?.mealBillingType ?? undefined,
      ),
    [subscriptionStatus?.mealBillingType, subscriptionStatus?.prepaidBilling],
  );

  useEffect(() => {
    document.title = `${t('dashboard.customer.quickActions.myOrders', {
      defaultValue: 'My Orders',
    })} · ${t('common.appName')}`;
  }, [t]);

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 2.5 },
        width: '100%',
        boxSizing: 'border-box',
        bgcolor: s.pageBg,
        minHeight: '100%',
      }}
    >
      <Stack spacing={1.5} sx={{ width: '100%' }}>
        <Box>
          <Breadcrumbs
            items={[
              {
                label: permissions.space?.spaceName ?? t('navigation.space'),
                to: spaceDashboardPath(spaceId),
              },
              {
                label: t('navigation.meals'),
                to: spaceMealsPath(spaceId),
              },
              {
                label: t('dashboard.customer.quickActions.myOrders', {
                  defaultValue: 'My Orders',
                }),
              },
            ]}
          />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{
              mt: 1,
              alignItems: { sm: 'flex-start' },
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
              <IconBadge accent={colors.primaryDark}>
                <UtensilsCrossed />
              </IconBadge>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  component="h1"
                  sx={{
                    fontSize: 22,
                    fontWeight: 700,
                    lineHeight: 1.25,
                    color: s.textPrimary,
                  }}
                >
                  {t('dashboard.customer.quickActions.myOrders', {
                    defaultValue: 'My Orders',
                  })}
                </Typography>
                <Typography sx={{ fontSize: 13, color: s.textSecondary, mt: 0.25, lineHeight: 1.4 }}>
                  {t('meals.myOrdersSubtitle', {
                    defaultValue:
                      'Choose meals for today, then review your order history below.',
                  })}
                </Typography>
              </Box>
            </Stack>
            {subscriptionStatus?.prepaidBilling ? (
              <Button
                variant="outlined"
                onClick={() => navigate(spaceMealsPlansCustomerPath(spaceId))}
                sx={{
                  ...dashOutlinedButtonSx,
                  minHeight: 32,
                  height: 32,
                  py: 0,
                  flexShrink: 0,
                }}
              >
                {t('meals.subscription.customer.viewPlans', { defaultValue: 'View plans' })}
              </Button>
            ) : null}
          </Stack>
        </Box>

        <DashboardCustomerMealsSection spaceId={spaceId} variant="orders" />

        {loading && !linkedMemberId ? <LoadingState label={t('common.loading')} /> : null}

        {linkedMemberId ? (
          <MemberMealActivitySection
            spaceId={spaceId}
            memberId={linkedMemberId}
            effectiveMealBillingType={effectiveMealBillingType}
            audience="customer"
          />
        ) : !loading ? (
          <ContentCard>
            <Typography sx={{ fontSize: 13, color: s.textMuted }}>
              {t('dashboard.customer.linkPending', {
                defaultValue:
                  'Your member profile is still linking. Meal history will appear shortly.',
              })}
            </Typography>
            {member?.fullName ? (
              <Typography sx={{ fontSize: 12, color: s.textSecondary, mt: 1 }}>
                {member.fullName}
              </Typography>
            ) : null}
          </ContentCard>
        ) : null}

        {/* Footer hint — mock */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
            gap: 1,
            px: 1.5,
            py: 1.1,
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            bgcolor: s.successTint,
          }}
        >
          <Stack direction="row" spacing={0.85} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Info size={15} color={colors.primaryDark} />
            <Typography sx={{ fontSize: 13, color: s.textSecondary }}>
              {t('meals.activity.cutoffHint', {
                defaultValue:
                  'Respond to the poll before cutoff time to help your mess plan better.',
              })}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={0.6}
            sx={{ alignItems: 'center', flexShrink: 0, color: s.textSecondary }}
          >
            <Clock3 size={14} />
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: s.textPrimary }}>
              {t('meals.activity.cutoffTime', {
                defaultValue: 'Cutoff time: {{time}}',
                time: cutoffLabel,
              })}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
