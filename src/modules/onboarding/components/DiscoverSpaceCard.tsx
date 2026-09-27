import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { BadgeCheck, Heart, Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { spaceTypeLabelKey } from '@/modules/onboarding/components/createSpace/createSpaceVisuals';
import { DiscoverListingImage } from '@/modules/onboarding/components/DiscoverListingImage';
import { ListingInfoChips } from '@/modules/onboarding/components/ListingInfoChips';
import { discoverDefaultImageUrl } from '@/modules/onboarding/utils/discoverDefaultImages';
import { formatListingPriceInr } from '@/modules/onboarding/utils/listingLocation';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { DiscoverSpaceCardResponse, SpaceType } from '@/shared/types/space';

type DiscoverSpaceCardProps = {
  space: DiscoverSpaceCardResponse;
  onViewDetails: (spaceId: string) => void;
  onEnquire: (space: DiscoverSpaceCardResponse) => void;
};

/**
 * Public-website PropertyCard layout for authenticated discovery.
 */
export function DiscoverSpaceCard({ space, onViewDetails, onEnquire }: DiscoverSpaceCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const address = space.address?.trim() || t('spaces.findPlace.addressNotSet');
  const cover = discoverDefaultImageUrl(
    space.type,
    space.spaceId,
    space.listingImageUrl || space.coverImageUrl || space.imageUrl,
  );
  const isMess = space.type === 'MESS';
  const price = isMess
    ? formatListingPriceInr(space.monthlyPrice)
    : formatListingPriceInr(space.startingPrice);
  const mealPrice = isMess ? formatListingPriceInr(space.mealPrice) : null;
  const viewDetails = t('spaces.findPlace.viewDetails');
  const contactCta = t('spaces.findPlace.getContactDetails', {
    defaultValue: 'Get Contact Details',
  });

  return (
    <Box
      component="article"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 0,
        borderRadius: '16px',
        border: `1px solid ${isDark ? theme.palette.divider : 'rgba(15,23,42,0.06)'}`,
        bgcolor: isDark ? theme.palette.background.paper : '#fff',
        boxShadow: isDark ? 'none' : '0 1px 3px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark ? 'none' : '0 10px 24px rgba(15, 23, 42, 0.1)',
        },
      }}
    >
      <Box
        sx={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', bgcolor: colors.mintSubtle, cursor: 'pointer' }}
        onClick={() => onViewDetails(space.spaceId)}
      >
        <DiscoverListingImage src={cover} alt={space.name} />

        <Box
          component="span"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            px: 1,
            py: 0.5,
            borderRadius: '6px',
            bgcolor: 'rgba(255,255,255,0.95)',
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: colors.textPrimary,
            maxWidth: '70%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {t(spaceTypeLabelKey(space.type))}
        </Box>

        {space.testSpace ? (
          <Box
            component="span"
            sx={{
              position: 'absolute',
              top: 44,
              left: 12,
              px: 1,
              py: 0.5,
              borderRadius: '6px',
              bgcolor: '#FFEDD5',
              border: '1px solid #F59E0B',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#9A3412',
            }}
          >
            {t('spaces.findPlace.testBadge')}
          </Box>
        ) : null}

        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.95)',
            display: 'grid',
            placeItems: 'center',
            color: colors.textPrimary,
            boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
          }}
        >
          <Heart size={15} />
        </Box>

        {space.alreadyMember ? (
          <Box
            component="span"
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              px: 1.25,
              py: 0.5,
              borderRadius: '999px',
              bgcolor: colors.primary,
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            {t('spaces.findPlace.alreadyMember')}
          </Box>
        ) : null}
      </Box>

      <Stack spacing={1} sx={{ p: 1.75, flex: 1, textAlign: 'left' }}>
        <Box sx={{ cursor: 'pointer' }} onClick={() => onViewDetails(space.spaceId)}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '-0.02em',
              color: isDark ? theme.palette.text.primary : colors.textPrimary,
              lineHeight: 1.25,
            }}
            title={space.name}
          >
            {space.name}
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              fontSize: '0.8125rem',
              color: isDark ? theme.palette.text.secondary : colors.textSecondary,
              lineHeight: 1.35,
            }}
            title={address}
          >
            {address}
          </Typography>
          <Typography sx={{ mt: 1, fontWeight: 700, fontSize: '0.95rem', color: colors.textPrimary }}>
            {price
              ? `${price} ${t(`spaces.findPlace.priceSuffix.${space.type as SpaceType}`, { defaultValue: '/ month' })}`
              : t('spaces.findPlace.priceOnRequest', { defaultValue: 'Price on request' })}
          </Typography>
          {mealPrice ? (
            <Typography sx={{ mt: 0.25, fontWeight: 600, fontSize: '0.8125rem', color: colors.textPrimary }}>
              {`${mealPrice} ${t('spaces.findPlace.mealPriceSuffix', { defaultValue: '/ meal' })}`}
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ mt: 0.5, borderRadius: '16px', bgcolor: '#EAF8F2', p: 1.25 }}>
          <Box
            component="button"
            type="button"
            onClick={() => onEnquire(space)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
              border: 0,
              borderRadius: '12px',
              bgcolor: '#fff',
              px: 1,
              py: 1,
              textAlign: 'left',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(11,28,22,0.04)',
              '&:hover': { bgcolor: '#F3FBF7' },
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: '#E8F8EF',
                color: '#0F6B4C',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Map size={16} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: colors.muted, textTransform: 'uppercase' }}>
                {t('spaces.findPlace.location')}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F6B4C' }}>
                {t('spaces.findPlace.openInGoogleMaps')}
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 1, mb: 0.75, color: '#0F6B4C' }}>
            <BadgeCheck size={14} />
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0F6B4C' }}>
              {t('spaces.findPlace.infoAvailable', { defaultValue: 'Information available' })}
            </Typography>
          </Stack>
          <ListingInfoChips
            listing={space}
            variant="card"
            surface={isMess ? 'meals' : 'places'}
            onEnquire={() => onEnquire(space)}
          />
        </Box>

        <Stack spacing={1} sx={{ mt: 'auto', pt: 0.5 }}>
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={() => onViewDetails(space.spaceId)}
            aria-label={`${viewDetails}: ${space.name}`}
            sx={{ ...dashOutlinedButtonSx, minHeight: 40, borderRadius: '10px' }}
          >
            {viewDetails}
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => onEnquire(space)}
            aria-label={`${contactCta}: ${space.name}`}
            sx={{
              ...dashContainedButtonSx,
              minHeight: 40,
              borderRadius: '10px',
              bgcolor: colors.primaryDark,
              '&:hover': { bgcolor: colors.primaryHover },
            }}
          >
            {contactCta}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
