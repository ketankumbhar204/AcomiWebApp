import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SpaceEnquiryStatus } from '@/shared/types/enquiry';

const STATUS_SX: Record<
  SpaceEnquiryStatus,
  { bgcolor: string; color: string; border?: string }
> = {
  SHARED: { bgcolor: '#22C55E', color: '#FFFFFF' },
  PENDING: { bgcolor: '#FEE2E2', color: '#B91C1C' },
  EXPIRED: { bgcolor: '#F1F5F9', color: '#475569' },
  REJECTED: { bgcolor: '#FEF3C7', color: '#B45309' },
  CANCELLED: { bgcolor: '#F1F5F9', color: '#64748B' },
};

export function AdminEnquiryStatusChip({ status }: { status: SpaceEnquiryStatus }) {
  const { t } = useTranslation();
  const sx = STATUS_SX[status] ?? STATUS_SX.EXPIRED;
  return (
    <Chip
      size="small"
      label={t(`admin.enquiries.status.${status}`)}
      sx={{
        height: 24,
        fontWeight: 700,
        fontSize: 12,
        borderRadius: '999px',
        ...sx,
      }}
    />
  );
}
