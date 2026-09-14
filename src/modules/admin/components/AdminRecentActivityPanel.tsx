import {
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AdminActivityItem } from '@/shared/types/admin';
import { AdminActivityRow } from '@/modules/admin/components/AdminActivityRow';
import { adminActivityPath } from '@/routes/paths';

type AdminRecentActivityPanelProps = {
  items: AdminActivityItem[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  viewAllFrom?: string;
  viewAllTo?: string;
  maxItems?: number;
};

export function AdminRecentActivityPanel({
  items,
  loading,
  error,
  onRetry,
  viewAllFrom,
  viewAllTo,
  maxItems = 10,
}: AdminRecentActivityPanelProps) {
  const { t } = useTranslation();
  const visible = items.slice(0, maxItems);

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        minHeight: { lg: 720 },
        borderRadius: '14px',
        border: '1px solid',
        borderColor: 'primary.light',
        boxShadow: '0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px rgb(34 197 94 / 0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}>
      <CardContent
        sx={{
          p: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          '&:last-child': { pb: 2 },
        }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 16 }}>
            {t('admin.dashboard.activity.title')}
          </Typography>
          <Button
            component={RouterLink}
            to={adminActivityPath({ from: viewAllFrom, to: viewAllTo })}
            size="small"
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              color: 'primary.main',
              minWidth: 0,
              px: 0.5,
            }}>
            {t('admin.dashboard.activity.viewAll')}
          </Button>
        </Stack>

        {loading ? (
          <Stack spacing={1.25}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={52} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        ) : error ? (
          <Box sx={{ py: 6, textAlign: 'center', flex: 1 }}>
            <Typography color="text.secondary" sx={{ mb: 1.5 }}>
              {t('admin.dashboard.activity.loadError')}
            </Typography>
            {onRetry ? (
              <Button variant="outlined" onClick={onRetry}>
                {t('common.retry')}
              </Button>
            ) : null}
          </Box>
        ) : visible.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', flex: 1 }}>
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
              {t('admin.dashboard.activity.emptyTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('admin.dashboard.activity.emptyHint')}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={0.25} sx={{ flex: 1, overflow: 'auto' }}>
            {visible.map((item) => (
              <AdminActivityRow key={item.id} activity={item} />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
