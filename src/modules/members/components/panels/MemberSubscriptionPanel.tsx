import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ErrorState } from '@/shared/components/ErrorState';
import { InfoRow } from '@/shared/components/InfoRow';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageSection } from '@/shared/components/PageSection';
import { StatusChip } from '@/shared/components/StatusChip';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import type { MemberDetailsResponse } from '@/shared/types/member';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { MemberMealActivitySection } from '../meals/MemberMealActivitySection';
import { memberMealBalanceApi } from '../../api/memberMealBalanceApi';
import {
  useMemberMealBalance,
  useMemberSubscriptionHistory,
} from '../../hooks/useMemberDetailData';
import {
  buildSubscriptionPurchasePayload,
  resolveMemberEffectiveMealBilling,
} from '../../utils/memberValidation';

type MemberSubscriptionPanelProps = {
  spaceId: string;
  member: MemberDetailsResponse;
  onChangeBilling?: () => void;
};

export function MemberSubscriptionPanel({
  spaceId,
  member,
  onChangeBilling,
}: MemberSubscriptionPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const permissions = useSpacePermissions(spaceId);
  const billing = resolveMemberEffectiveMealBilling(member);
  const isPrepaid = billing === 'PREPAID_BALANCE';
  const balanceQuery = useMemberMealBalance(spaceId, member.memberId, isPrepaid);
  const historyQuery = useMemberSubscriptionHistory(spaceId, member.memberId, isPrepaid);
  const [mealQty, setMealQty] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const canManage = permissions.canManageMeals === true;
  const canEditMembers = permissions.canManageMembers === true;

  const billingLabel = t(`spaces.mealBilling.types.${billing}.label`, {
    defaultValue: billing === 'PREPAID_BALANCE' ? 'Prepaid' : 'Pay per meal',
  });

  const handlePurchase = async () => {
    const unit = balanceQuery.balance?.unit ?? 'MEALS';
    const payload = buildSubscriptionPurchasePayload(mealQty, price, unit);
    if (!payload) {
      enqueueSnackbar(
        unit === 'MEALS'
          ? t('members.subscriptionSetup.mealQtyRequired')
          : t('members.subscriptionSetup.priceRequired'),
        { variant: 'warning' },
      );
      return;
    }
    setSaving(true);
    try {
      await memberMealBalanceApi.recordPurchase(spaceId, member.memberId, payload);
      enqueueSnackbar(t('membership.workspace.subscriptionSaved'), { variant: 'success' });
      setMealQty('');
      setPrice('');
      await queryClient.invalidateQueries({
        queryKey: ['member-meal-balance', spaceId, member.memberId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['member-subscription-history', spaceId, member.memberId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['member-meal-activity', spaceId, member.memberId],
      });
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const historyRows =
    historyQuery.history?.events.map((event) => ({
      ...event,
      id: event.eventId,
    })) ?? [];

  const columns: DataTableColumn<(typeof historyRows)[number]>[] = [
    {
      id: 'type',
      header: t('membership.workspace.event'),
      accessor: (row) => row.eventType,
      primary: true,
    },
    {
      id: 'meals',
      header: t('members.subscriptionSetup.mealQtyLabel'),
      accessor: (row) => row.meals ?? '—',
    },
    {
      id: 'paid',
      header: t('members.subscriptionSetup.priceLabel'),
      accessor: (row) =>
        row.paidAmount != null
          ? formatCurrency(row.paidAmount, balanceQuery.balance?.currencyCode)
          : '—',
    },
    {
      id: 'when',
      header: t('membership.details.created'),
      accessor: (row) => new Date(row.createdAt).toLocaleString(),
      primary: true,
    },
  ];

  const balance = balanceQuery.balance;
  const unit = balance?.unit ?? 'MEALS';

  return (
    <Stack spacing={`${DASHBOARD_UX.sectionGap}px`}>
      {/* Meal billing header — parity with mobile MemberMealBillingPanel */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap',
          p: `${DASHBOARD_UX.metricPadding}px`,
          borderRadius: `${DASHBOARD_UX.radius}px`,
          border: `1px solid ${s.border}`,
          bgcolor: s.surface,
          boxShadow: s.shadow,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
            {t('members.mealBilling.title', { defaultValue: 'Meal billing' })}
          </Typography>
          <StatusChip label={billingLabel} tone="info" />
        </Stack>
        {canEditMembers && onChangeBilling ? (
          <Button
            size="small"
            onClick={onChangeBilling}
            sx={{
              ...dashOutlinedButtonSx,
              color: colors.primaryDark,
              borderColor: 'transparent',
              minHeight: 28,
              height: 28,
            }}
          >
            {t('membership.workspace.change')}
          </Button>
        ) : null}
      </Box>

      {isPrepaid ? (
        <>
          {balanceQuery.loading && !balance ? <LoadingState /> : null}
          {balanceQuery.error ? (
            <ErrorState
              title={t('common.errors.generic')}
              message={
                balanceQuery.error instanceof Error
                  ? balanceQuery.error.message
                  : t('common.errors.generic')
              }
              onRetry={() => void balanceQuery.reload()}
            />
          ) : (
            <PageSection title={t('membership.workspace.subscription')}>
              {balance ? (
                <>
                  <InfoRow
                    label={t('membership.workspace.balance')}
                    value={String(balance.balance)}
                  />
                  <InfoRow label={t('membership.workspace.unit')} value={balance.unit} />
                  <InfoRow
                    label={t('membership.workspace.validTill')}
                    value={balance.validTill ?? '—'}
                  />
                  <InfoRow
                    label={t('membership.workspace.active')}
                    value={balance.active ? t('common.ok') : t('common.close')}
                  />
                  {canManage && balance.active ? (
                    <Button
                      variant="outlined"
                      color="warning"
                      disabled={saving}
                      sx={dashOutlinedButtonSx}
                      onClick={async () => {
                        setSaving(true);
                        try {
                          await memberMealBalanceApi.endSubscription(
                            spaceId,
                            member.memberId,
                          );
                          enqueueSnackbar(
                            t('membership.workspace.subscriptionEnded', {
                              defaultValue: 'Subscription ended',
                            }),
                            { variant: 'success' },
                          );
                          await queryClient.invalidateQueries({
                            queryKey: ['member-meal-balance', spaceId, member.memberId],
                          });
                          await queryClient.invalidateQueries({
                            queryKey: ['member-subscription-history', spaceId, member.memberId],
                          });
                        } catch (err) {
                          enqueueSnackbar(
                            err instanceof Error ? err.message : t('common.errors.generic'),
                            { variant: 'error' },
                          );
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      {t('members.mealBalance.endSubscription', {
                        defaultValue: 'End subscription',
                      })}
                    </Button>
                  ) : null}
                </>
              ) : (
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                  {t('membership.workspace.noSubscription')}
                </Typography>
              )}
            </PageSection>
          )}

          {canManage ? (
            <PageSection title={t('members.subscriptionSetup.title')}>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 1 }}>
                {t('members.subscriptionSetup.subtitleOptional')}
              </Typography>
              {unit === 'MEALS' ? (
                <TextField
                  label={t('members.subscriptionSetup.mealQtyLabel')}
                  value={mealQty}
                  onChange={(e) => setMealQty(e.target.value)}
                  placeholder="e.g. 30"
                  fullWidth
                  size="small"
                  sx={{ mb: 1.5 }}
                />
              ) : null}
              <TextField
                label={t('members.subscriptionSetup.priceLabel')}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 2500"
                fullWidth
                size="small"
                sx={{ mb: 1.5 }}
              />
              <Button
                variant="contained"
                disabled={saving}
                onClick={() => void handlePurchase()}
                sx={{
                  ...dashContainedButtonSx,
                  bgcolor: colors.primaryDark,
                  '&:hover': { bgcolor: colors.primaryHover },
                }}
              >
                {t('membership.workspace.recordPack')}
              </Button>
            </PageSection>
          ) : null}

          {historyRows.length > 0 ? (
            <PageSection title={t('membership.workspace.subscriptionHistory')}>
              <DataTable
                columns={columns}
                rows={historyRows}
                loading={historyQuery.loading}
                emptyTitle={t('membership.workspace.noSubscriptionHistory')}
              />
            </PageSection>
          ) : null}
        </>
      ) : null}

      {/* Activity / Calendar — missing on web vs mobile */}
      <MemberMealActivitySection
        spaceId={spaceId}
        memberId={member.memberId}
        effectiveMealBillingType={billing}
      />
    </Stack>
  );
}
