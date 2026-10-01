import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { BadgeCheck, Check, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { spaceTypeLabelKey } from '@/modules/onboarding/components/createSpace/createSpaceVisuals';
import { DiscoverListingImage } from '@/modules/onboarding/components/DiscoverListingImage';
import { ListingInfoChips } from '@/modules/onboarding/components/ListingInfoChips';
import { discoverDefaultImageUrl } from '@/modules/onboarding/utils/discoverDefaultImages';
import { formatListingPriceInr } from '@/modules/onboarding/utils/listingLocation';
import { useAlreadyInquired, useInquirySentVia } from '@/shared/hooks/useAlreadyInquired';
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
  const address = space.address?.trim() ?? '';
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
  const viewLabel = t('spaces.findPlace.view', { defaultValue: 'View' });
  const viewDetails = t('spaces.findPlace.viewDetails');
  const contactCta = t('spaces.findPlace.getContactDetails', {
    defaultValue: 'Get Contact Details',
  });
  const inquirySent = t('spaces.findPlace.inquirySent', { defaultValue: 'Inquiry sent' });
  const alreadyInquired = useAlreadyInquired(space.spaceId);
  const sentVia = useInquirySentVia(space.spaceId);
  const sentWhere = sentVia === 'APP'
    ? t('spaces.findPlace.inquirySentInApp', { defaultValue: 'Sent in the ACOMI app' })
    : sentVia === 'BOTH'
      ? t('spaces.findPlace.inquirySentEmailAndApp', { defaultValue: 'Sent to your email and the ACOMI app' })
      : sentVia === 'EMAIL'
        ? t('spaces.findPlace.inquirySentByEmail', { defaultValue: 'Sent to your email' })
        : null;

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
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 52,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
            alignItems: 'flex-start',
          }}
        >
          <Box
            component="span"
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: '6px',
              bgcolor: 'rgba(255,255,255,0.95)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: colors.textPrimary,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {t(spaceTypeLabelKey(space.type))}
          </Box>
          {alreadyInquired ? (
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: '6px',
                bgcolor: '#FFEDD5',
                color: '#C2410C',
                border: '1px solid #FDBA74',
                fontSize: '0.68rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              <Check size={12} />
              {inquirySent}
            </Box>
          ) : null}
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

      <Stack spacing={1} sx={{ p: 1.75, flex: 1, textAlign: 'left', containerType: 'inline-size' }}>
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
          {alreadyInquired ? (
            <Typography
              sx={{
                mt: 0.5,
                display: 'inline-flex',
                maxWidth: '100%',
                alignItems: 'center',
                gap: 0.5,
                color: '#C2410C',
                fontSize: '0.6875rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              <Check size={12} />
              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {sentWhere ? `${inquirySent} · ${sentWhere}` : inquirySent}
              </Box>
            </Typography>
          ) : null}
          {address ? (
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
          ) : null}
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
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mb: 0.75, color: '#0F6B4C' }}>
            <BadgeCheck size={14} />
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0F6B4C' }}>
              {t('spaces.findPlace.infoAvailable', { defaultValue: 'Information available' })}
            </Typography>
          </Stack>
          <ListingInfoChips
            listing={space}
            variant="card"
            surface={isMess ? 'meals' : 'places'}
            onEnquire={alreadyInquired ? undefined : () => onEnquire(space)}
          />
        </Box>

        <Box
          sx={{
            mt: 'auto',
            pt: 0.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            '@container (min-width: 260px)': {
              flexDirection: 'row',
            },
          }}
        >
          <Button
            variant="outlined"
            color="primary"
            onClick={() => onViewDetails(space.spaceId)}
            aria-label={`${viewDetails}: ${space.name}`}
            sx={{
              ...dashOutlinedButtonSx,
              width: '100%',
              minHeight: 40,
              borderRadius: '10px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              '@container (min-width: 260px)': { width: 'auto' },
            }}
          >
            {viewLabel}
          </Button>
          {alreadyInquired ? (
            <Button
              disabled
              aria-disabled="true"
              aria-label={sentWhere ? `${inquirySent}. ${sentWhere}` : inquirySent}
              sx={{
                width: '100%',
                minHeight: 40,
                borderRadius: '10px',
                whiteSpace: 'normal',
                bgcolor: '#FFEDD5',
                color: '#C2410C',
                border: '1px solid #FDBA74',
                fontWeight: 700,
                textTransform: 'none',
                '&.Mui-disabled': {
                  bgcolor: '#FFEDD5',
                  color: '#C2410C',
                  opacity: 1,
                },
                '@container (min-width: 260px)': { flexGrow: 1, flexShrink: 0, width: 'auto' },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <Check size={14} />
                  {inquirySent}
                </Box>
                {sentWhere ? (
                  <Box component="span" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#9A3412' }}>
                    {sentWhere}
                  </Box>
                ) : null}
              </Box>
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => onEnquire(space)}
              aria-label={`${contactCta}: ${space.name}`}
              sx={{
                ...dashContainedButtonSx,
                width: '100%',
                minHeight: 40,
                borderRadius: '10px',
                whiteSpace: 'nowrap',
                bgcolor: colors.primaryDark,
                '&:hover': { bgcolor: colors.primaryHover },
                '@container (min-width: 260px)': { flexGrow: 1, flexShrink: 0, width: 'auto' },
              }}
            >
              {contactCta}
            </Button>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
