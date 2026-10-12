import { Box, Button, Typography } from '@mui/material';
import { Heart } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DiscoverSpaceCard } from '@/modules/onboarding/components/DiscoverSpaceCard';
import { DiscoverSpaceDetailDrawer } from '@/modules/onboarding/components/DiscoverSpaceDetailDrawer';
import { EnquireDialog } from '@/modules/onboarding/components/EnquireDialog';
import { favoritesApi } from '@/shared/api/favoritesApi';
import { getErrorMessage } from '@/shared/api/errors';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { useFavoriteIds } from '@/shared/hooks/useFavorites';
import { loadFavoriteListings } from '@/shared/state/favoriteListings';
import { colors } from '@/shared/theme/colors';
import type { DiscoverSpaceCardResponse } from '@/shared/types/space';
import { useAuthStore } from '@/store/authStore';

export function FavoritesPage() {
  const { t } = useTranslation();
  const userId = useAuthStore((state) => state.userId);
  const favoriteIds = useFavoriteIds();
  const [items, setItems] = useState<DiscoverSpaceCardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [enquireSpace, setEnquireSpace] = useState<DiscoverSpaceCardResponse | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      if (userId) {
        await loadFavoriteListings(userId, { force: true });
      }
      setItems(await favoritesApi.list());
    } catch (err) {
      setError(getErrorMessage(err, t('spaces.favorites.loadFailed', { defaultValue: 'Could not load favorites.' })));
    } finally {
      setLoading(false);
    }
  }, [t, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = items.filter((item) => favoriteIds.has(item.spaceId));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: colors.textPrimary }}>
        {t('navigation.favorites', { defaultValue: 'Favorites' })}
      </Typography>
      <Typography sx={{ mt: 0.5, color: colors.textSecondary, fontSize: '0.875rem' }}>
        {t('spaces.favorites.subtitle', {
          defaultValue: 'Places and mess listings you saved on this account.',
        })}
      </Typography>

      {loading && items.length === 0 ? <LoadingState minHeight={240} label={t('common.loading', { defaultValue: 'Loading' })} /> : null}

      {error && items.length === 0 ? (
        <Box sx={{ mt: 2 }}>
          <ErrorState message={error} onRetry={() => { setLoading(true); void load(); }} />
        </Box>
      ) : null}

      {!loading && !error && visible.length === 0 ? (
        <Box sx={{ mt: 4, textAlign: 'center', color: colors.textSecondary }}>
          <Heart size={28} />
          <Typography sx={{ mt: 1, fontWeight: 700, color: colors.textPrimary }}>
            {t('spaces.favorites.empty', { defaultValue: 'No favorites yet' })}
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: '0.875rem' }}>
            {t('spaces.favorites.emptyHint', {
              defaultValue: 'Tap the heart on a PG, hostel, co-living, rental, or mess listing to save it here.',
            })}
          </Typography>
        </Box>
      ) : null}

      {visible.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            mt: 2,
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 19.25rem), 1fr))',
          }}
        >
          {visible.map((space) => (
            <DiscoverSpaceCard
              key={space.spaceId}
              space={space}
              onViewDetails={setDetailId}
              onEnquire={setEnquireSpace}
            />
          ))}
        </Box>
      ) : null}

      {!loading && error && items.length > 0 ? (
        <Button onClick={() => { setLoading(true); void load(); }} sx={{ mt: 2, textTransform: 'none' }}>
          {t('common.tryAgain', { defaultValue: 'Try again' })}
        </Button>
      ) : null}

      <DiscoverSpaceDetailDrawer
        spaceId={detailId}
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
      />
      {enquireSpace ? (
        <EnquireDialog
          open
          spaceId={enquireSpace.spaceId}
          spaceName={enquireSpace.name}
          ownedByCurrentUser={Boolean(enquireSpace.ownedByCurrentUser)}
          onClose={() => setEnquireSpace(null)}
          onViewedHere={() => setDetailId(enquireSpace.spaceId)}
        />
      ) : null}
    </Box>
  );
}
