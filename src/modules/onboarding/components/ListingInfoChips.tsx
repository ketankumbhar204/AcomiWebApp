import { Box, Typography } from '@mui/material';
import { IndianRupee, Map, MapPin, Phone, Sparkles, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  INFO_GRID_KEYS,
  listingInfoFlags,
  type ListingInfoFlags,
  type ListingInfoSource,
} from '@/shared/utils/listingInfo';

type ListingInfoChipsProps = {
  listing: ListingInfoSource;
  variant: 'card' | 'detail';
  surface?: 'places' | 'meals';
  onEnquire?: () => void;
};

const PLACE_LABELS: Record<keyof ListingInfoFlags, string> = {
  contact: 'spaces.findPlace.infoContact',
  address: 'spaces.findPlace.infoAddress',
  map: 'spaces.findPlace.infoMap',
  rent: 'spaces.findPlace.infoRent',
  amenities: 'spaces.findPlace.infoAmenities',
  food: 'spaces.findPlace.infoFood',
};

const CHIP_ICONS: Record<keyof ListingInfoFlags, LucideIcon> = {
  contact: Phone,
  address: MapPin,
  map: Map,
  rent: IndianRupee,
  amenities: Sparkles,
  food: UtensilsCrossed,
};

export function ListingInfoChips({ listing, surface = 'places', onEnquire }: ListingInfoChipsProps) {
  const { t } = useTranslation();
  const flags = listingInfoFlags(listing);
  const meals = surface === 'meals';

  return (
    <Box
      component="ul"
      aria-label={t('spaces.findPlace.infoAvailable', { defaultValue: 'Information available' })}
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1,
        m: 0,
        p: 0,
        listStyle: 'none',
      }}
    >
      {INFO_GRID_KEYS.map((key) => {
        const available = flags[key];
        const label = t(meals && key === 'rent' ? 'spaces.findPlace.infoPrice' : PLACE_LABELS[key], {
          defaultValue: key,
        });
        const state = t(
          available ? 'spaces.findPlace.infoAvailableState' : 'spaces.findPlace.infoUnavailableState',
          { field: label },
        );
        const Icon = CHIP_ICONS[key];
        return (
          <Box
            key={key}
            component="li"
            sx={{ minWidth: 0 }}
          >
            <Box
              component={onEnquire ? 'button' : 'div'}
              type={onEnquire ? 'button' : undefined}
              onClick={onEnquire}
              aria-label={state}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: '100%',
                minHeight: 40,
                px: 1.25,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: available ? '#C6EBD7' : '#E6E8EC',
                bgcolor: available ? '#F3FBF7' : '#F4F5F7',
                color: available ? '#0F172A' : '#8B95A1',
                cursor: onEnquire ? 'pointer' : 'default',
                textAlign: 'left',
              }}
            >
              <Box
                aria-hidden
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '8px',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  bgcolor: '#fff',
                  color: available ? '#059669' : '#A3ABB6',
                }}
              >
                <Icon size={14} />
              </Box>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  color: 'inherit',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {`${available ? '✓' : '—'} ${label}`}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
