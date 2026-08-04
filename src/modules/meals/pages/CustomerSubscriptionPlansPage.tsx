import {
  Alert,
  Box,
  Button,
  Stack,
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
import {
  EMPTY_PAYMENT_PROOF,
  UniversalPaymentProofForm,
  validatePaymentProofSubmission,
  type PaymentProofSubmission,
} from '@/modules/payments';
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
 * Activation API has no paymentMethod field — method is prefixed into customerNotes.
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
  const [proof, setProof] = useState<PaymentProofSubmission>(EMPTY_PAYMENT_PROOF);

  useEffect(() => {
    document.title = `${t('meals.subscriptionPlans.title')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    if (selected) {
      setProof(EMPTY_PAYMENT_PROOF);
    }
  }, [selected?.planId]);

  const status = statusQuery.data;
  const blocked =
    status?.subscriptionActive === true || status?.pendingActivationStatus === 'PENDING';

  const activePlans = (plansQuery.data ?? []).filter((p) => p.isActive);

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
                      setProof(EMPTY_PAYMENT_PROOF);
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
              <UniversalPaymentProofForm
                value={proof}
                onChange={setProof}
                disabled={mutations.createActivation.isPending}
              />
            </Stack>
            <StickyFooter>
              <Button onClick={() => setSelected(null)} sx={dashOutlinedButtonSx}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="contained"
                disabled={mutations.createActivation.isPending}
                sx={dashContainedButtonSx}
                onClick={async () => {
                  if (!linkedMember.data?.memberId || !selected) return;
                  const validationError = validatePaymentProofSubmission(proof, undefined, {
                    requireProofOrReference: true,
                  });
                  if (validationError === 'proofOrReferenceRequired') {
                    enqueueSnackbar(t('meals.customerPlans.proofOrReferenceRequired'), {
                      variant: 'warning',
                    });
                    return;
                  }
                  if (validationError) {
                    enqueueSnackbar(t(`paymentCollection.proof.${validationError}`), {
                      variant: 'warning',
                    });
                    return;
                  }
                  const methodLabel = t(
                    `paymentCollection.method.${proof.paymentMethod ?? 'UPI'}`,
                  );
                  const noteParts = [
                    t('paymentCollection.proof.paymentMethod') + `: ${methodLabel}`,
                    proof.remarks?.trim() || null,
                  ].filter(Boolean);
                  try {
                    await mutations.createActivation.mutateAsync({
                      memberId: linkedMember.data.memberId,
                      payload: {
                        planId: selected.planId,
                        paymentReference: proof.referenceNumber?.trim() || undefined,
                        proofImageBase64: proof.proofImageBase64?.trim() || undefined,
                        customerNotes: noteParts.join('\n') || undefined,
                      },
                    });
                    enqueueSnackbar(t('meals.customerPlans.requestSubmitted'), {
                      variant: 'success',
                    });
                    setSelected(null);
                    setProof(EMPTY_PAYMENT_PROOF);
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
