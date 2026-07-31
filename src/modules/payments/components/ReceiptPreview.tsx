import { Box, Button, Divider, Stack, Typography, useTheme } from '@mui/material';
import { Printer, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import type { SpacePaymentResponse } from '@/shared/types/payments';
import { paymentStatusLabelKey } from '../utils/paymentHelpers';

type ReceiptPreviewProps = {
  payment: SpacePaymentResponse;
};

/** Print-ready receipt preview from SpacePaymentResponse — no custom receipt engine. */
export function ReceiptPreview({ payment }: ReceiptPreviewProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const status = payment.paymentStatus ?? payment.status ?? 'PENDING';
  const ref = payment.paymentReference ?? payment.referenceNumber ?? payment.paymentId;

  const copyReceipt = async () => {
    const lines = [
      t('payments.receipt.title'),
      `${t('paymentCollection.fields.reference')}: ${ref}`,
      `${t('paymentCollection.fields.member')}: ${payment.memberName}`,
      `${t('paymentCollection.fields.amount')}: ${formatCurrency(payment.amount, payment.currencyCode)}`,
      `${t('paymentCollection.fields.status')}: ${t(paymentStatusLabelKey(status))}`,
      `${t('paymentCollection.fields.dueDate')}: ${payment.dueDate}`,
      payment.paymentDate
        ? `${t('paymentCollection.fields.paidDate')}: ${payment.paymentDate}`
        : '',
      payment.title,
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      enqueueSnackbar(t('payments.receipt.copied'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <Box
      className="payment-receipt-preview"
      sx={{
        p: `${DASHBOARD_UX.cardPadding}px`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
      }}
    >
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
          {t('payments.receipt.title')}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Button
            size="small"
            startIcon={<Copy size={14} />}
            onClick={() => void copyReceipt()}
            sx={dashOutlinedButtonSx}
          >
            {t('payments.receipt.copy')}
          </Button>
          <Button
            size="small"
            startIcon={<Printer size={14} />}
            onClick={printReceipt}
            sx={dashOutlinedButtonSx}
          >
            {t('payments.receipt.print')}
          </Button>
        </Stack>
      </Stack>
      <Divider sx={{ mb: 1.5, borderColor: s.border }} />
      <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>{ref}</Typography>
      <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mt: 0.5 }}>
        {formatCurrency(payment.amount, payment.currencyCode)}
      </Typography>
      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>{payment.memberName}</Typography>
      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>{payment.title}</Typography>
      <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted, display: 'block', mt: 1 }}>
        {t(paymentStatusLabelKey(status))} · {payment.dueDate}
      </Typography>
    </Box>
  );
}
