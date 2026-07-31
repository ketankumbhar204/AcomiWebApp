import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { StatusChip } from '@/shared/components/StatusChip';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { memberApi } from '@/modules/members/api/memberApi';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import { spaceMealsPath } from '@/routes/paths';
import type { SubscriptionPlanResponse } from '@/shared/types/subscription';
import {
  useMySubscriptionStatus,
  useSubscriptionPlanMutations,
  useSubscriptionPlans,
} from '../hooks/useSubscriptionPlans';

/**
 * Customer-facing plan catalog + activation request.
 * Mirrors mobile CustomerSubscriptionPlansScreen (no join invent).
 */
export function CustomerSubscriptionPlansPage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const plansQuery = useSubscriptionPlans(spaceId, false, true);
  const statusQuery = useMySubscriptionStatus(spaceId);
  const mutations = useSubscriptionPlanMutations(spaceId);

  const linkedMember = useQuery({
    queryKey: ['linked-member-me', spaceId],
    queryFn: () => memberApi.getMyLinkedMember(spaceId),
    enabled: Boolean(spaceId),
  });

  const [selected, setSelected] = useState<SubscriptionPlanResponse | null>(null);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [proofBase64, setProofBase64] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${t('meals.subscriptionPlans.title')} · ${t('common.appName')}`;
  }, [t]);

  const status = statusQuery.data;
  const blocked =
    status?.subscriptionActive === true || status?.pendingActivationStatus === 'PENDING';

  const activePlans = (plansQuery.data ?? []).filter((p) => p.isActive);

  const handleFile = async (file: File | null) => {
    if (!file) {
      setProofBase64(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setProofBase64(base64 || null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('meals.subscriptionPlans.title')}
          description={t('meals.customerPlans.browseHint', {
            defaultValue: 'Browse active plans and request activation.',
          })}
          breadcrumbs={[
            { label: t('navigation.meals'), to: spaceMealsPath(spaceId) },
            { label: t('meals.subscriptionPlans.title') },
          ]}
        />

        {statusQuery.isLoading || plansQuery.isLoading ? <LoadingState /> : null}

        {status ? (
          <Alert severity="info">
            {status.lifecycleStatus === 'pay_per_meal'
              ? t('spaces.mealBilling.types.PAY_PER_MEAL.label')
              : status.subscriptionActive
                ? t('meals.customerPlans.selectionPendingHint', {
                    defaultValue: 'Your subscription is active.',
                  })
                : status.pendingActivationStatus === 'PENDING'
                  ? t('meals.subscriptionPlans.requestedPlan', {
                      plan: status.pendingPlanName ?? '—',
                    })
                  : t('meals.customerPlans.selectionRequiredHint')}
            {status.mealsRemaining != null
              ? ` · ${t('meals.subscriptionPlans.mealsLine', { count: status.mealsRemaining })}`
              : null}
          </Alert>
        ) : null}

        {activePlans.length === 0 ? (
          <EmptyState title={t('meals.subscriptionPlans.empty')} />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: `${DASHBOARD_UX.cardGap}px`,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            }}
          >
            {activePlans.map((plan) => (
              <ContentCard key={plan.planId}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
                    {plan.name}
                  </Typography>
                  <StatusChip label={t('meals.subscriptionPlans.statusActive')} tone="success" />
                </Stack>
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
                  {t('meals.subscriptionPlans.mealsLine', { count: plan.mealsIncluded })}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                  {formatCurrency(plan.price, plan.currencyCode)}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                  {t('meals.subscriptionPlans.validityLine', { days: plan.validityDays })}
                </Typography>
                {plan.description ? (
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted, mt: 1 }}>
                    {plan.description}
                  </Typography>
                ) : null}
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    disabled={blocked || !linkedMember.data?.memberId}
                    sx={dashContainedButtonSx}
                    onClick={() => {
                      setSelected(plan);
                      setReference('');
                      setNotes('');
                      setProofBase64(null);
                    }}
                  >
                    {t('meals.customerPlans.submitRequest')}
                  </Button>
                </Box>
              </ContentCard>
            ))}
          </Box>
        )}
      </Stack>

      <AppDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? t('meals.customerPlans.submitRequest')}
        width={480}
      >
        {selected ? (
          <>
            <Stack spacing={2} sx={{ p: 2 }}>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
                {formatCurrency(selected.price, selected.currencyCode)} ·{' '}
                {t('meals.subscriptionPlans.mealsLine', { count: selected.mealsIncluded })}
              </Typography>
              <Alert severity="info">{t('meals.customerPlans.paymentProofHint')}</Alert>
              <TextField
                label={t('meals.customerPlans.paymentReferenceLabel', {
                  defaultValue: 'Payment reference',
                })}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={t('meals.subscription.customer.paymentReferencePlaceholder')}
                fullWidth
              />
              <Button variant="outlined" component="label" sx={dashOutlinedButtonSx}>
                {proofBase64
                  ? t('meals.customerPlans.removeScreenshot')
                  : t('meals.subscriptionPlans.viewPaymentProof')}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (proofBase64) {
                      setProofBase64(null);
                      e.target.value = '';
                      return;
                    }
                    void handleFile(file);
                  }}
                />
              </Button>
              <TextField
                label={t('meals.customerPlans.notesLabel')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('meals.subscription.customer.notesPlaceholder')}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
            <StickyFooter>
              <Button
                variant="contained"
                disabled={mutations.createActivation.isPending}
                sx={dashContainedButtonSx}
                onClick={async () => {
                  if (!linkedMember.data?.memberId || !selected) return;
                  if (!reference.trim() && !proofBase64) {
                    enqueueSnackbar(t('meals.customerPlans.proofOrReferenceRequired'), {
                      variant: 'warning',
                    });
                    return;
                  }
                  try {
                    await mutations.createActivation.mutateAsync({
                      memberId: linkedMember.data.memberId,
                      payload: {
                        planId: selected.planId,
                        paymentReference: reference.trim() || undefined,
                        proofImageBase64: proofBase64 || undefined,
                        customerNotes: notes.trim() || undefined,
                      },
                    });
                    enqueueSnackbar(t('meals.customerPlans.requestSubmitted'), {
                      variant: 'success',
                    });
                    setSelected(null);
                    void statusQuery.refetch();
                  } catch {
                    enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
                  }
                }}
              >
                {mutations.createActivation.isPending
                  ? t('common.pleaseWait')
                  : t('meals.customerPlans.submitRequest')}
              </Button>
            </StickyFooter>
          </>
        ) : null}
      </AppDrawer>
    </PageContainer>
  );
}
