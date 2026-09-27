import { Stack, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import type { SpacePaymentResponse } from '@/shared/types/payments';

type PaymentReceivedConfirmDialogProps = {
  open: boolean;
  payments: SpacePaymentResponse[];
  confirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function PaymentReceivedConfirmDialog({
  open,
  payments,
  confirming = false,
  onConfirm,
  onClose,
}: PaymentReceivedConfirmDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const primary = payments[0];

  return (
    <ConfirmDialog
      open={open}
      title={t('paymentCollection.received.title')}
      confirmLabel={t('paymentCollection.received.confirm')}
      confirming={confirming}
      onConfirm={onConfirm}
      onClose={onClose}
      content={
        primary ? (
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
              {primary.memberName}
            </Typography>
            {payments.map((payment) => (
              <Typography key={payment.paymentId} sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                {payment.title} · {formatCurrency(payment.amount, payment.currencyCode)}
              </Typography>
            ))}
            {primary.targetLabel ? (
              <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                {primary.targetLabel}
              </Typography>
            ) : null}
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, pt: 1 }}>
              {t('paymentCollection.received.skipProof')}
            </Typography>
          </Stack>
        ) : null
      }
    />
  );
}
