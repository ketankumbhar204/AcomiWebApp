import { Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { AdminListingMarketingActivity } from '@/shared/types/admin';
import { colors } from '@/shared/theme/colors';

type Props = {
  activities?: AdminListingMarketingActivity[] | null;
};

function formatWhen(value: string): string {
  try {
    return new Date(value).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export function AdminListingMarketingHistory({ activities }: Props) {
  const { t } = useTranslation();
  const items = activities ?? [];

  return (
    <Stack spacing={1.25}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
        {t('admin.marketing.history.title')}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
          {t('admin.marketing.history.empty')}
        </Typography>
      ) : (
        items.map((activity) => (
          <Stack
            key={activity.id}
            spacing={0.25}
            sx={{
              p: 1.25,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#FAFBFC',
            }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {t(`admin.marketing.outcomes.${activity.outcome}`, {
                defaultValue: activity.outcome,
              })}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              {t(`admin.marketing.channels.${activity.channel}`, {
                defaultValue: activity.channel,
              })}
              {activity.templateKey
                ? ` · ${t(`admin.marketing.templates.${activity.templateKey}`, {
                    defaultValue: activity.templateKey,
                  })}`
                : ''}
              {` · ${formatWhen(activity.createdAt)}`}
            </Typography>
            {activity.note ? (
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                {activity.note}
              </Typography>
            ) : null}
          </Stack>
        ))
      )}
    </Stack>
  );
}
