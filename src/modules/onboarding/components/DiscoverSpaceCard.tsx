import { Box, Stack, Typography, useTheme } from '@mui/material';
import {
  Car,
  Cctv,
  Droplets,
  Heart,
  MapPin,
  Refrigerator,
  Shirt,
  Sparkles,
  SquareStack,
  UtensilsCrossed,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { spaceTypeLabelKey } from '@/modules/onboarding/components/createSpace/createSpaceVisuals';
import { DiscoverListingImage } from '@/modules/onboarding/components/DiscoverListingImage';
import { discoverDefaultImageUrl } from '@/modules/onboarding/utils/discoverDefaultImages';
import { colors } from '@/shared/theme/colors';
import type { DiscoverSpaceCardResponse } from '@/shared/types/space';

type DiscoverSpaceCardProps = {
  space: DiscoverSpaceCardResponse;
  onViewDetails: (spaceId: string) => void;
};

const MAX_AMENITIES = 4;

const AMENITY_ICONS: Record<string, LucideIcon> = {
  WIFI: Wifi,
  FOOD_INCLUDED: UtensilsCrossed,
  WASHING_MACHINE: Shirt,
  PARKING: Car,
  HOUSEKEEPING: Sparkles,
  POWER_BACKUP: Zap,
  RO_WATER: Droplets,
  CCTV: Cctv,
  HOT_WATER: Droplets,
  REFRIGERATOR: Refrigerator,
  WARDROBE: SquareStack,
};

function amenityIcon(code: string): LucideIcon {
  return AMENITY_ICONS[code] ?? Wifi;
}

/**
 * Public-website PropertyCard layout for authenticated discovery.
 * Uses type default photos (API has no images yet). Does not invent ratings/prices.
 */
export function DiscoverSpaceCard({ space, onViewDetails }: DiscoverSpaceCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const address = space.address?.trim() || t('spaces.findPlace.addressNotSet');
  const cover = discoverDefaultImageUrl(space.type);

  const amenityItems: { key: string; label: string; Icon: LucideIcon }[] = [];
  if (space.foodIncludedInRent) {
    amenityItems.push({
      key: 'food',
      label: t('spaces.findPlace.mealsIncluded'),
      Icon: UtensilsCrossed,
    });
  }
  const codes = space.amenityCodes ?? [];
  const labels = space.amenityLabels ?? [];
  for (let i = 0; i < labels.length && amenityItems.length < MAX_AMENITIES; i += 1) {
    const label = labels[i];
    if (!label) continue;
    amenityItems.push({
      key: codes[i] ?? `label-${i}`,
      label,
      Icon: amenityIcon(codes[i] ?? ''),
    });
  }

  return (
    <Box
      component="article"
      onClick={() => onViewDetails(space.spaceId)}
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
        cursor: 'pointer',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark ? 'none' : '0 10px 24px rgba(15, 23, 42, 0.1)',
        },
      }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', bgcolor: colors.mintSubtle }}>
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

      <Stack spacing={0.75} sx={{ p: 2, flex: 1, textAlign: 'left' }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '-0.02em',
            color: isDark ? theme.palette.text.primary : colors.textPrimary,
            lineHeight: 1.25,
          }}
          noWrap
          title={space.name}
        >
          {space.name}
        </Typography>

        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
          <MapPin size={14} style={{ flexShrink: 0, marginTop: 2, color: colors.muted }} />
          <Typography
            sx={{
              fontSize: '0.8125rem',
              color: isDark ? theme.palette.text.secondary : colors.textSecondary,
              lineHeight: 1.35,
            }}
            title={address}
          >
            {address}
          </Typography>
        </Stack>

        {amenityItems.length > 0 ? (
          <Stack
            direction="row"
            spacing={1.25}
            useFlexGap
            sx={{ flexWrap: 'wrap', pt: 0.75, rowGap: 0.75 }}
          >
            {amenityItems.map(({ key, label, Icon }) => (
              <Stack
                key={key}
                direction="row"
                spacing={0.5}
                sx={{ alignItems: 'center', color: colors.muted }}
              >
                <Icon size={14} />
                <Typography sx={{ fontSize: '0.6875rem', color: colors.muted }}>{label}</Typography>
              </Stack>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}
