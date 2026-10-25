import { Box, Typography, useTheme } from '@mui/material';
import { IndianRupee, Info, Map, MapPin, Phone, Sparkles, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  INFO_GRID_KEYS,
  listingInfoFlags,
  type ListingInfoFlags,
  type ListingInfoSource,
  type ListingSection,
} from '@/shared/utils/listingInfo';

type ListingInfoChipsProps = {
  listing: ListingInfoSource;
  variant: 'card' | 'detail';
  surface?: 'places' | 'meals';
  /** Opens the matching section on the listing detail. */
  onSelect?: (section: ListingSection) => void;
  /** Opens the existing listing detail. Used by the card layout only. */
  onViewAll?: () => void;
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

export function ListingInfoChips({
  listing,
  variant,
  surface = 'places',
  onSelect,
  onViewAll,
}: ListingInfoChipsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const flags = listingInfoFlags(listing);
  const meals = surface === 'meals';
  const isDark = theme.palette.mode === 'dark';

  if (variant === 'card') {
    return (
      <Box component="section" aria-label={t('spaces.findPlace.availableInformation', { defaultValue: 'Available Information' })}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.25 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, minWidth: 0, color: '#0F6B4C' }}>
            <Info size={16} aria-hidden />
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, lineHeight: 1.2, color: '#0F6B4C' }}>
              {t('spaces.findPlace.availableInformation', { defaultValue: 'Available Information' })}
            </Typography>
          </Box>
          {onViewAll ? (
            <Box
              component="button"
              type="button"
              onClick={onViewAll}
              sx={{
                flexShrink: 0,
                border: 0,
                bgcolor: 'transparent',
                p: 0,
                color: '#0F6B4C',
                font: 'inherit',
                fontSize: '0.8125rem',
                fontWeight: 600,
                lineHeight: 1.2,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
                '&:focus-visible': { outline: '2px solid #25D366', outlineOffset: 2, borderRadius: '4px' },
              }}
            >
              {`${t('spaces.findPlace.viewAllInfo', { defaultValue: 'View all' })} →`}
            </Box>
          ) : null}
        </Box>
        <Box
          component="ul"
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 0.25,
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
                sx={{
                  flex: '1 1 0',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.75,
                  color: available ? '#0F6B4C' : isDark ? '#9CA3AF' : '#94A3B8',
                }}
              >
                <Box
                  component={onSelect ? 'button' : 'div'}
                  type={onSelect ? 'button' : undefined}
                  onClick={() => onSelect?.(key)}
                  aria-label={state}
                  sx={{
                    display: 'flex',
                    width: '100%',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.75,
                    border: 0,
                    bgcolor: 'transparent',
                    p: 0,
                    color: 'inherit',
                    font: 'inherit',
                    cursor: onSelect ? 'pointer' : 'default',
                  }}
                >
                <Box
                  aria-hidden
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: available ? (isDark ? 'rgba(255,255,255,0.92)' : '#fff') : (isDark ? 'rgba(255,255,255,0.08)' : '#EEF1F4'),
                    boxShadow: available && !isDark ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
                  }}
                >
                  <Icon size={16} />
                </Box>
                <Typography
                  sx={{
                    width: '100%',
                    fontSize: '0.5625rem',
                    fontWeight: 600,
                    lineHeight: 1.15,
                    textAlign: 'center',
                    color: 'inherit',
                  }}
                >
                  {label}
                </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  }

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
              component={onSelect ? 'button' : 'div'}
              type={onSelect ? 'button' : undefined}
              onClick={() => onSelect?.(key)}
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
                cursor: onSelect ? 'pointer' : 'default',
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
