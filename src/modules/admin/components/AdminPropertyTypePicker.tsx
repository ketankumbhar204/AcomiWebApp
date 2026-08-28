import { Box, Typography, useTheme } from '@mui/material';
import { Check } from 'lucide-react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { SPACE_TYPE_VISUAL } from '@/modules/onboarding/components/createSpace/createSpaceVisuals';
import { colors } from '@/shared/theme/colors';
import type { SpaceType } from '@/shared/types/space';

const PROPERTY_TYPES: Exclude<SpaceType, 'MESS'>[] = ['PG', 'HOSTEL', 'CO_LIVING', 'RENTAL'];

const PROPERTY_TYPE_LABEL: Record<Exclude<SpaceType, 'MESS'>, string> = {
  PG: 'PG',
  HOSTEL: 'Hostel',
  CO_LIVING: 'Co-living',
  RENTAL: 'Rental',
};

const PROPERTY_TYPE_HINT: Record<Exclude<SpaceType, 'MESS'>, string> = {
  PG: 'Paying guest accommodation',
  HOSTEL: 'Shared hostel property',
  CO_LIVING: 'Co-living space',
  RENTAL: 'Rental property',
};

type AdminPropertyTypePickerProps = {
  value: Exclude<SpaceType, 'MESS'>;
  onChange: (type: Exclude<SpaceType, 'MESS'>) => void;
};

export function AdminPropertyTypePicker({ value, onChange }: AdminPropertyTypePickerProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      role="radiogroup"
      aria-label="Property type"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' },
        gap: 1.25,
        gridColumn: { md: '1 / -1' },
      }}
    >
      {PROPERTY_TYPES.map((type) => {
        const selected = value === type;
        const visual = SPACE_TYPE_VISUAL[type];
        const Icon = visual.icon;

        return (
          <Box
            key={type}
            component="button"
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(type)}
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 0.75,
              textAlign: 'left',
              p: 1.5,
              minHeight: 108,
              borderRadius: `${DASHBOARD_UX.radius}px`,
              border: `1.5px solid ${selected ? colors.primary : s.border}`,
              bgcolor: selected ? (isDark ? colors.selected : colors.lightGreen) : s.surface,
              boxShadow: selected ? s.shadowHover : s.shadow,
              cursor: 'pointer',
              color: s.textPrimary,
              transition: 'border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                borderColor: colors.primary,
                boxShadow: s.shadowHover,
              },
              '&:focus-visible': {
                outline: `2px solid ${colors.primary}`,
                outlineOffset: 2,
              },
            }}
          >
            {selected ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: colors.primary,
                  color: colors.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={14} strokeWidth={2.5} />
              </Box>
            ) : null}
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: `${DASHBOARD_UX.iconWellRadius}px`,
                bgcolor: isDark ? `${visual.accent}22` : visual.tint,
                color: visual.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={18} />
            </Box>
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, fontSize: '0.9375rem' }}>
              {PROPERTY_TYPE_LABEL[type]}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, fontSize: '0.8125rem' }}>
              {PROPERTY_TYPE_HINT[type]}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
