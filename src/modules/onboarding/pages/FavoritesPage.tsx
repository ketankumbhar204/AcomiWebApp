import { Box, Button, Typography } from '@mui/material';
import { Heart } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DiscoverSpaceCard } from '@/modules/onboarding/components/DiscoverSpaceCard';
import { DiscoverSpaceDetailDrawer } from '@/modules/onboarding/components/DiscoverSpaceDetailDrawer';
import { favoritesApi } from '@/shared/api/favoritesApi';
import { getErrorMessage } from '@/shared/api/errors';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { useFavoriteIds, useToggleFavorite } from '@/shared/hooks/useFavorites';
import { loadFavoriteListings } from '@/shared/state/favoriteListings';
import { colors } from '@/shared/theme/colors';
import type { ListingSection } from '@/shared/utils/listingInfo';
import type { DiscoverSpaceCardResponse } from '@/shared/types/space';
import { useAuthStore } from '@/store/authStore';

export function FavoritesPage() {
  const { t } = useTranslation();
  const userId = useAuthStore((state) => state.userId);
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const [filter, setFilter] = useState<'all' | 'places' | 'meals'>('all');
  const [items, setItems] = useState<DiscoverSpaceCardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailFocus, setDetailFocus] = useState<ListingSection | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);

  const load = useCallback(async () => {
    setError(null);
    try {
      if (userId) {
        await loadFavoriteListings(userId, { force: true });
      }
      const rows = await favoritesApi.list();
      const seen = new Set<string>();
      setItems(rows.filter((row) => {
        if (!row.spaceId || seen.has(row.spaceId)) return false;
        seen.add(row.spaceId);
        return true;
      }));
    } catch (err) {
      setError(getErrorMessage(err, t('spaces.favorites.loadFailed', { defaultValue: 'Could not load favorites.' })));
    } finally {
      setLoading(false);
    }
  }, [t, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') void load();
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  const saved = items.filter((item) => favoriteIds.has(item.spaceId));
  const visible = saved.filter((item) => {
    if (filter === 'meals') return item.type === 'MESS';
    if (filter === 'places') return item.type !== 'MESS';
    return true;
  });
  const present = new Set(items.map((item) => item.spaceId));
  const missingIds = !loading && !error && filter === 'all'
    ? [...favoriteIds].filter((id) => !present.has(id))
    : [];

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
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }} role="tablist">
        {([
          ['all', t('spaces.favorites.all', { defaultValue: 'All' })],
          ['places', t('navigation.findAPlace', { defaultValue: 'Places' })],
          ['meals', t('navigation.findAMeal', { defaultValue: 'Meals' })],
        ] as const).map(([value, label]) => (
          <Button
            key={value}
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            variant={filter === value ? 'contained' : 'outlined'}
            sx={{ textTransform: 'none', borderRadius: 999 }}
          >
            {label}
          </Button>
        ))}
      </Box>

      {loading && items.length === 0 ? <LoadingState minHeight={240} label={t('common.loading', { defaultValue: 'Loading' })} /> : null}

      {error && items.length === 0 ? (
        <Box sx={{ mt: 2 }}>
          <ErrorState message={error} onRetry={() => { setLoading(true); void load(); }} />
        </Box>
      ) : null}

      {!loading && !error && visible.length === 0 && missingIds.length === 0 ? (
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

      {visible.length > 0 || missingIds.length > 0 ? (
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
              onViewDetails={(spaceId, section) => {
                setDetailFocus(section ?? null);
                setFocusNonce((value) => value + 1);
                setDetailId(spaceId);
              }}
            />
          ))}
          {missingIds.map((id) => (
            <Box key={id} sx={{ border: '1px solid rgba(15,23,42,0.08)', borderRadius: 2, p: 2 }}>
              <Typography sx={{ fontWeight: 700, color: colors.textPrimary }}>
                {t('spaces.favorites.unavailable', { defaultValue: 'This listing is no longer available.' })}
              </Typography>
              <Button onClick={() => { void toggleFavorite(id); }} sx={{ mt: 1, textTransform: 'none', px: 0 }}>
                {t('spaces.favorites.removeSaved', { defaultValue: 'Remove from favorites' })}
              </Button>
            </Box>
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
        focusSection={detailFocus}
        focusNonce={focusNonce}
        onClose={() => {
          setDetailId(null);
          setDetailFocus(null);
        }}
      />
    </Box>
  );
}
