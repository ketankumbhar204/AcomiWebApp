import { Box, type SxProps, type Theme } from '@mui/material';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { useIsFavorite, useToggleFavorite } from '@/shared/hooks/useFavorites';
import { colors } from '@/shared/theme/colors';

const FILLED = '#E11D48';

type FavoriteHeartButtonProps = {
  spaceId: string;
  listingName?: string;
  sx?: SxProps<Theme>;
};

export function FavoriteHeartButton({ spaceId, listingName, sx }: FavoriteHeartButtonProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const favorited = useIsFavorite(spaceId);
  const toggle = useToggleFavorite();
  const label = favorited
    ? t('spaces.favorites.remove', { name: listingName ?? '', defaultValue: 'Remove from favorites' })
    : t('spaces.favorites.add', { name: listingName ?? '', defaultValue: 'Add to favorites' });

  return (
    <Box
      component="button"
      type="button"
      aria-pressed={favorited}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        toggle(spaceId).then((result) => {
          if (result === 'failed') {
            enqueueSnackbar(
              t('spaces.favorites.failed', { defaultValue: 'Could not update favorites. Please try again.' }),
              { variant: 'error' },
            );
          } else if (result === 'auth-required') {
            enqueueSnackbar(
              t('spaces.favorites.signIn', { defaultValue: 'Sign in to save favorites.' }),
              { variant: 'warning' },
            );
          }
        });
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
      }}
      sx={[
        {
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid rgba(15,23,42,0.1)',
          bgcolor: '#fff',
          color: favorited ? FILLED : colors.textPrimary,
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(15,23,42,0.18)',
          p: 0,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Heart size={16} fill={favorited ? FILLED : 'transparent'} color={favorited ? FILLED : colors.textPrimary} />
    </Box>
  );
}
