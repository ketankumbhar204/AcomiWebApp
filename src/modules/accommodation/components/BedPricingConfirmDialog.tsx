import { Box, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { formatPricingMoney, moneyEquals } from '../utils/commitBedPricing';
import type { PendingBedPricing } from '../hooks/useConfirmBedPricingCommit';

type BedPricingConfirmDialogProps = {
  pending: PendingBedPricing | null;
  confirming: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export function BedPricingConfirmDialog({
  pending,
  confirming,
  error,
  onConfirm,
  onClose,
}: BedPricingConfirmDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const notSet = t('accommodation.pricingConfirm.notSet');
  const rentChanged = pending ? !moneyEquals(pending.currentRent, pending.defaultRent) : false;
  const depositChanged = pending
    ? !moneyEquals(pending.currentDeposit, pending.defaultDeposit)
    : false;
  const title =
    rentChanged && !depositChanged
      ? t('accommodation.pricingConfirm.titleRent')
      : depositChanged && !rentChanged
        ? t('accommodation.pricingConfirm.titleDeposit')
        : t('accommodation.pricingConfirm.title');
  const rows = pending
    ? [
        ...(rentChanged
          ? [
              {
                key: 'rent',
                label: t('accommodation.setup.fields.rent'),
                current: pending.currentRent,
                next: pending.defaultRent,
              },
            ]
          : []),
        ...(depositChanged
          ? [
              {
                key: 'deposit',
                label: t('accommodation.setup.fields.deposit'),
                current: pending.currentDeposit,
                next: pending.defaultDeposit,
              },
            ]
          : []),
      ]
    : [];

  return (
    <ConfirmDialog
      open={pending != null}
      title={title}
      confirmLabel={t('accommodation.pricingConfirm.confirm')}
      confirmingLabel={t('accommodation.pricingConfirm.confirming')}
      cancelLabel={t('common.cancel')}
      confirming={confirming}
      maxWidth="sm"
      onConfirm={onConfirm}
      onClose={onClose}
      content={
        pending ? (
          <Box>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {t('accommodation.pricingConfirm.changingFor', {
                field:
                  rentChanged && !depositChanged
                    ? t('accommodation.setup.fields.rent')
                    : depositChanged && !rentChanged
                      ? t('accommodation.setup.fields.deposit')
                      : t('accommodation.pricingConfirm.price'),
              })}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mt: 0.5 }}>
              {pending.bedLabel}
            </Typography>
            <Box
              sx={{
                mt: 1.5,
                border: `1px solid ${s.border}`,
                borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                overflow: 'hidden',
                bgcolor: s.elevated,
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 1fr 1fr',
                  columnGap: 1,
                  px: 1.5,
                  py: 1,
                  borderBottom: `1px solid ${s.border}`,
                }}
              >
                <Box />
                <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                  {t('accommodation.pricingConfirm.current')}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                  {t('accommodation.pricingConfirm.next')}
                </Typography>
              </Box>
              {rows.map((row) => (
                <Box
                  key={row.key}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1.1fr 1fr 1fr',
                    columnGap: 1,
                    alignItems: 'center',
                    px: 1.5,
                    py: 1.1,
                    bgcolor: s.successTint,
                    borderBottom: `1px solid ${s.border}`,
                    '&:last-of-type': { borderBottom: 'none' },
                  }}
                >
                  <Typography sx={{ ...DASHBOARD_UX.body, fontWeight: 600, color: s.textPrimary }}>
                    {row.label}
                  </Typography>
                  <Typography
                    sx={{
                      ...DASHBOARD_UX.body,
                      color: s.textSecondary,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatPricingMoney(row.current, notSet)}
                  </Typography>
                  <Typography
                    sx={{
                      ...DASHBOARD_UX.body,
                      fontWeight: 700,
                      color: colors.primary,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatPricingMoney(row.next, notSet)}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Typography
              sx={{
                ...DASHBOARD_UX.body,
                color: s.textPrimary,
                mt: 1.75,
              }}
            >
              {pending.affectedBedCount != null
                ? t('accommodation.pricingConfirm.affectedCount', {
                    count: pending.affectedBedCount,
                  })
                : t('accommodation.pricingConfirm.propagation')}
            </Typography>
            {pending.affectedLocations.length > 0 ? (
              <Box sx={{ mt: 1.25 }}>
                <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, fontWeight: 700 }}>
                  {t('accommodation.pricingConfirm.affectedLocations')}
                </Typography>
                {pending.affectedLocations.map((location) => (
                  <Typography
                    key={location}
                    sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}
                  >
                    {location}
                  </Typography>
                ))}
              </Box>
            ) : null}
            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textSecondary, mt: 1.5 }}>
              {t('accommodation.pricingConfirm.continue')}
            </Typography>
            {error ? (
              <Typography sx={{ ...DASHBOARD_UX.body, color: colors.danger, mt: 1.25 }}>
                {error}
              </Typography>
            ) : null}
          </Box>
        ) : null
      }
    />
  );
}
