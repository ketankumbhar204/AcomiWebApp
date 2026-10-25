import { Box, Button, CircularProgress, Typography, useTheme } from '@mui/material';
import { Check, Eye, House, MapPin, Phone } from 'lucide-react';
import { FavoriteHeartButton } from '@/modules/onboarding/components/FavoriteHeartButton';
import { useTranslation } from 'react-i18next';
import { spaceTypeLabelKey } from '@/modules/onboarding/components/createSpace/createSpaceVisuals';
import { DiscoverListingImage } from '@/modules/onboarding/components/DiscoverListingImage';
import { ListingFacts } from '@/modules/onboarding/components/ListingFacts';
import { ListingInfoChips } from '@/modules/onboarding/components/ListingInfoChips';
import { formatListingPriceInr } from '@/modules/onboarding/utils/listingLocation';
import { useAlreadyInquired, useInquiryRecord, useInquirySentVia } from '@/shared/hooks/useAlreadyInquired';
import { useIsEnquirySending } from '@/modules/onboarding/enquiryFeedback';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { resolveListingCover } from '@/shared/utils/representativeImage';
import { listingPriceSuffix } from '@/shared/utils/priceBasis';
import type { ListingSection } from '@/shared/utils/listingInfo';
import type { DiscoverSpaceCardResponse } from '@/shared/types/space';

type DiscoverSpaceCardProps = {
  space: DiscoverSpaceCardResponse;
  onViewDetails: (spaceId: string, section?: ListingSection) => void;
};

/**
 * Public-website PropertyCard layout for authenticated discovery.
 */
export function DiscoverSpaceCard({ space, onViewDetails }: DiscoverSpaceCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const address = space.address?.trim() ?? '';
  const cover = resolveListingCover({
    listingId: space.spaceId,
    spaceType: space.type,
    listingImageUrl: space.listingImageUrl || space.coverImageUrl || space.imageUrl,
  });
  const isMess = space.type === 'MESS';
  const price = isMess
    ? formatListingPriceInr(space.monthlyPrice)
    : formatListingPriceInr(space.startingPrice);
  const mealPrice = isMess ? formatListingPriceInr(space.mealPrice) : null;
  const priceSuffix = listingPriceSuffix(t, space.type, space.priceBasis);
  const mealSuffix = t('spaces.findPlace.mealPriceSuffix', { defaultValue: '/ meal' });
  const viewDetails = t('spaces.findPlace.viewDetails', { defaultValue: 'View Details' });
  const categoryLabel = t(`spaces.findPlace.representativeCategory.${cover.category}`, {
    defaultValue: cover.category,
  });
  const imageAlt = cover.kind === 'representative'
    ? t('spaces.findPlace.representativeImageAria', {
      category: categoryLabel,
      defaultValue: 'Representative image for {{category}} listing',
    })
    : space.name;
  const contactCta = t('spaces.findPlace.getContactDetails', {
    defaultValue: 'Get Contact Details',
  });
  const inquirySent = t('spaces.findPlace.inquirySent', { defaultValue: 'Inquiry sent' });
  const alreadyInquired = useAlreadyInquired(space.spaceId);
  const inquiry = useInquiryRecord(space.spaceId);
  const contactViewed = inquiry?.contactViewed === true;
  const sendingEnquiry = useIsEnquirySending(space.spaceId);
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
        flexDirection: { xs: 'row', sm: 'column' },
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
        role="button"
        tabIndex={0}
        onClick={() => onViewDetails(space.spaceId)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onViewDetails(space.spaceId);
          }
        }}
        sx={{
          position: 'relative',
          width: { xs: 118, sm: '100%' },
          aspectRatio: { xs: 'auto', sm: '16 / 10' },
          minHeight: { xs: 132, sm: 0 },
          flexShrink: 0,
          overflow: 'hidden',
          bgcolor: colors.mintSubtle,
          cursor: 'pointer',
        }}
      >
        <DiscoverListingImage
          src={cover.url}
          alt={imageAlt}
          sx={{ position: 'absolute', inset: 0 }}
        />

        <Box
          component="span"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            maxWidth: 'calc(100% - 64px)',
            px: 1,
            py: 0.5,
            borderRadius: '999px',
            bgcolor: '#fff',
            color: '#0F6B4C',
            border: '1px solid rgba(15,23,42,0.1)',
            boxShadow: '0 2px 8px rgba(15,23,42,0.18)',
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          <House size={13} aria-hidden />
          {t(spaceTypeLabelKey(space.type))}
        </Box>

        <FavoriteHeartButton
          spaceId={space.spaceId}
          listingName={space.name}
          sx={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}
        />

        {(alreadyInquired && !contactViewed) || space.alreadyMember ? (
          <Box sx={{ position: 'absolute', left: 12, bottom: 10, maxWidth: '48%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
            {alreadyInquired && !contactViewed ? (
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
            {space.alreadyMember ? (
              <Box
                component="span"
                sx={{
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
        ) : null}
      </Box>

      <Box sx={{ p: { xs: 1.25, sm: 2 }, flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left', minWidth: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Box
            component="button"
            type="button"
            onClick={() => onViewDetails(space.spaceId)}
            sx={{
              display: 'block',
              width: '100%',
              border: 0,
              bgcolor: 'transparent',
              p: 0,
              textAlign: 'left',
              cursor: 'pointer',
              font: 'inherit',
              color: 'inherit',
            }}
          >
            <Typography
              title={space.name}
              sx={{
                fontWeight: 800,
                fontSize: '1.125rem',
                letterSpacing: '-0.02em',
                color: isDark ? theme.palette.text.primary : colors.textPrimary,
                lineHeight: 1.25,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {space.name}
            </Typography>
          </Box>
          {address ? (
            <Box
              component="button"
              type="button"
              onClick={() => onViewDetails(space.spaceId, 'address')}
              aria-label={`${t('spaces.findPlace.infoAddress', { defaultValue: 'Address' })}: ${space.name}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                width: '100%',
                minWidth: 0,
                border: 0,
                bgcolor: 'transparent',
                p: 0,
                textAlign: 'left',
                cursor: 'pointer',
                font: 'inherit',
                color: 'inherit',
              }}
            >
              <MapPin size={14} aria-hidden color={isDark ? theme.palette.text.secondary : colors.textSecondary} />
              <Typography
                title={address}
                sx={{
                  minWidth: 0,
                  fontSize: '0.8125rem',
                  color: isDark ? theme.palette.text.secondary : colors.textSecondary,
                  lineHeight: 1.35,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {address}
              </Typography>
            </Box>
          ) : null}
          <Box
            component="button"
            type="button"
            onClick={() => onViewDetails(space.spaceId, 'rent')}
            aria-label={`${t('spaces.findPlace.infoRent', { defaultValue: 'Rent' })}: ${space.name}`}
            sx={{
              display: 'block',
              width: '100%',
              border: 0,
              bgcolor: 'transparent',
              p: 0,
              m: 0,
              textAlign: 'left',
              cursor: 'pointer',
              font: 'inherit',
              color: isDark ? theme.palette.text.primary : colors.textPrimary,
            }}
          >
            <Typography sx={{ m: 0, color: 'inherit' }}>
              {price ? (
                <>
                  <Box component="span" sx={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
                    {price}
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      ml: 0.75,
                      fontWeight: 500,
                      fontSize: '0.8125rem',
                      color: isDark ? theme.palette.text.secondary : colors.textSecondary,
                    }}
                  >
                    {priceSuffix}
                  </Box>
                </>
              ) : (
                <Box component="span" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                  {t('spaces.findPlace.priceOnRequest', { defaultValue: 'Price on request' })}
                </Box>
              )}
            </Typography>
            {mealPrice ? (
              <Typography sx={{ m: 0, mt: 0.25, color: 'inherit' }}>
                <Box component="span" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{mealPrice}</Box>
                <Box
                  component="span"
                  sx={{ ml: 0.75, fontWeight: 500, fontSize: '0.75rem', color: isDark ? theme.palette.text.secondary : colors.textSecondary }}
                >
                  {mealSuffix}
                </Box>
              </Typography>
            ) : null}
          </Box>
          <ListingFacts
            appearance="pills"
            genderPolicy={space.genderPolicy}
            sharingNotes={space.sharingNotes}
            foodAvailability={space.foodAvailability}
            foodIncludedInRent={space.foodIncludedInRent}
          />
        </Box>

        <Box sx={{ borderRadius: '14px', bgcolor: isDark ? 'rgba(37,211,102,0.1)' : '#F3FBF7', px: 1.25, py: 1.25 }}>
          <ListingInfoChips
            listing={space}
            variant="card"
            surface={isMess ? 'meals' : 'places'}
            onViewAll={() => onViewDetails(space.spaceId)}
            onSelect={(section) => onViewDetails(space.spaceId, section)}
          />
        </Box>

        <Box
          sx={{
            mt: 'auto',
            pt: 0.25,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'stretch',
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            color="primary"
            onClick={() => onViewDetails(space.spaceId)}
            aria-label={`${viewDetails}: ${space.name}`}
            sx={{
              ...dashOutlinedButtonSx,
              width: 'auto',
              height: 44,
              maxHeight: 44,
              minWidth: 0,
              minHeight: 44,
              flex: '0.82 1 0',
              fontSize: '13px',
              px: 1,
              borderRadius: '12px',
              whiteSpace: 'nowrap',
              bgcolor: isDark ? 'transparent' : '#fff',
              fontWeight: 600,
              px: 1.25,
            }}
          >
            {viewDetails}
          </Button>
          {contactViewed ? (
            <Button
              onClick={() => onViewDetails(space.spaceId, 'contact')}
              aria-label={`${t('spaces.findPlace.contactDetailsViewed', { defaultValue: 'Contact details viewed' })}: ${space.name}`}
              sx={{
                width: 'auto',
                height: 44,
                maxHeight: 44,
                minWidth: 0,
                minHeight: 44,
                flex: '1.18 1 0',
                borderRadius: '12px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                fontSize: '13px',
                px: 1,
                bgcolor: '#E7F6EE',
                color: '#0F6B4C',
                border: '1px solid #8FCBAB',
                fontWeight: 700,
                textTransform: 'none',
                gap: 0.75,
                '&:hover': { bgcolor: '#D8F3E4' },
              }}
            >
              <Eye size={14} />
              {t('spaces.findPlace.viewed', { defaultValue: 'Viewed' })}
            </Button>
          ) : alreadyInquired ? (
            <Button
              onClick={() => onViewDetails(space.spaceId)}
              aria-label={sentWhere ? `${inquirySent}. ${sentWhere}` : inquirySent}
              startIcon={<Check size={14} />}
              sx={{
                width: 'auto',
                height: 44,
                maxHeight: 44,
                minWidth: 0,
                minHeight: 44,
                flex: '1.18 1 0',
                borderRadius: '12px',
                overflow: 'hidden',
                px: 1,
                py: 0,
                bgcolor: '#FFEDD5',
                color: '#C2410C',
                border: '1px solid #FDBA74',
                fontWeight: 600,
                fontSize: '13px',
                lineHeight: 1.15,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#FED7AA' },
              }}
            >
              {inquirySent}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              disabled={sendingEnquiry}
              onClick={() => onViewDetails(space.spaceId, 'contact')}
              aria-label={`${contactCta}: ${space.name}`}
              startIcon={sendingEnquiry ? undefined : <Phone size={16} />}
              sx={{
                ...dashContainedButtonSx,
                width: 'auto',
                height: 44,
                maxHeight: 44,
                minWidth: 0,
                minHeight: 44,
                overflow: 'hidden',
                fontSize: '13px',
                flex: '1.18 1 0',
                borderRadius: '12px',
                whiteSpace: 'nowrap',
                px: 1.25,
                bgcolor: colors.primary,
                '&:hover': { bgcolor: colors.primaryHover },
              }}
            >
              {sendingEnquiry ? (
                <CircularProgress size={16} sx={{ color: colors.white }} />
              ) : (
                contactCta
              )}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
