import { Chip, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ListingMarketingStatus, WhatsAppAvailability } from '@/shared/types/admin';
import { colors } from '@/shared/theme/colors';

type Props = {
  marketingStatus?: ListingMarketingStatus | null;
  whatsappAvailability?: WhatsAppAvailability | null;
  dense?: boolean;
};

export function AdminListingMarketingChips({
  marketingStatus,
  whatsappAvailability,
  dense = false,
}: Props) {
  const { t } = useTranslation();
  const status = marketingStatus ?? 'NOT_SHARED';
  const availability = whatsappAvailability ?? 'UNKNOWN';

  return (
    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
      <Chip
        size="small"
        label={
          status === 'SHARED'
            ? t('admin.marketing.status.shared')
            : t('admin.marketing.status.notShared')
        }
        sx={{
          fontWeight: 700,
          height: dense ? 22 : 24,
          bgcolor: status === 'SHARED' ? colors.successTint : colors.section,
          color: status === 'SHARED' ? colors.success : colors.textSecondary,
        }}
      />
      <Chip
        size="small"
        label={
          availability === 'AVAILABLE'
            ? t('admin.marketing.whatsapp.available')
            : availability === 'UNAVAILABLE'
              ? t('admin.marketing.whatsapp.unavailable')
              : t('admin.marketing.whatsapp.unknown')
        }
        sx={{
          fontWeight: 700,
          height: dense ? 22 : 24,
          bgcolor:
            availability === 'AVAILABLE'
              ? '#ECFDF5'
              : availability === 'UNAVAILABLE'
                ? '#FEF2F2'
                : colors.section,
          color:
            availability === 'AVAILABLE'
              ? '#047857'
              : availability === 'UNAVAILABLE'
                ? '#B91C1C'
                : colors.textSecondary,
        }}
      />
    </Stack>
  );
}
