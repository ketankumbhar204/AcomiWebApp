import { Stack, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { StayTrailLine } from '@/shared/components/ContactAndStayMeta';
import { usePaymentStayTrail } from '../hooks/usePaymentStayTrail';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import type { SpacePaymentResponse } from '@/shared/types/payments';

type PaymentReceivedConfirmDialogProps = {
  open: boolean;
  payments: SpacePaymentResponse[];
  spaceName?: string | null;
  confirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

function periodLabel(month?: string | null): string | null {
  if (!month) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  return new Date(Number(match[1]), Number(match[2]) - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

function ConfirmStayLine({ payment }: { payment: SpacePaymentResponse }) {
  const trail = usePaymentStayTrail(payment.spaceId, payment);
  return <StayTrailLine label={trail} />;
}

export function PaymentReceivedConfirmDialog({
  open,
  payments,
  spaceName,
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
            {spaceName ? (
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>{spaceName}</Typography>
            ) : null}
            {payments.map((payment) => {
              const outstanding = payment.outstandingAmount ?? payment.amount;
              const period = periodLabel(payment.month);
              return (
                <Stack key={payment.paymentId} spacing={0.25}>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                    {payment.title}
                  </Typography>
                  <ConfirmStayLine payment={payment} />
                  {period ? (
                    <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                      {period}
                    </Typography>
                  ) : null}
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                    {formatCurrency(outstanding, payment.currencyCode)}
                  </Typography>
                </Stack>
              );
            })}
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, pt: 1 }}>
              {t('paymentCollection.received.skipProof')}
            </Typography>
          </Stack>
        ) : null
      }
    />
  );
}
