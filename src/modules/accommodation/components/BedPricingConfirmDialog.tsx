import { Box, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { moneyEquals } from '../utils/commitBedPricing';
import type { PendingBedPricing } from '../hooks/useConfirmBedPricingCommit';

function formatPricingMoney(value: number | null, notSet: string): string {
  if (value == null || Number.isNaN(value)) {
    return notSet;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

type BedPricingConfirmDialogProps = {
  pending: PendingBedPricing | null;
  confirming: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function BedPricingConfirmDialog({
  pending,
  confirming,
  onConfirm,
  onClose,
}: BedPricingConfirmDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const notSet = t('accommodation.pricingConfirm.notSet');

  const rows = pending
    ? [
        {
          key: 'rent',
          label: t('accommodation.setup.fields.rent'),
          current: pending.currentRent,
          next: pending.defaultRent,
        },
        {
          key: 'deposit',
          label: t('accommodation.setup.fields.deposit'),
          current: pending.currentDeposit,
          next: pending.defaultDeposit,
        },
      ]
    : [];

  return (
    <ConfirmDialog
      open={pending != null}
      title={t('accommodation.pricingConfirm.title')}
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
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
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
                  rowGap: 0,
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
              {rows.map((row) => {
                const changed = !moneyEquals(row.current, row.next);
                return (
                  <Box
                    key={row.key}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1.1fr 1fr 1fr',
                      columnGap: 1,
                      alignItems: 'center',
                      px: 1.5,
                      py: 1.1,
                      bgcolor: changed ? s.successTint : 'transparent',
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
                        fontWeight: changed ? 700 : 500,
                        color: changed ? colors.primary : s.textSecondary,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatPricingMoney(row.next, notSet)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
            <Typography
              sx={{
                ...DASHBOARD_UX.smallCaption,
                color: s.textSecondary,
                mt: 1.75,
                lineHeight: 1.45,
              }}
            >
              {t('accommodation.pricingConfirm.propagation')}
            </Typography>
          </Box>
        ) : null
      }
    />
  );
}
