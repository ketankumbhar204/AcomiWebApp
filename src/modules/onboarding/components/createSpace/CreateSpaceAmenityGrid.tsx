import { Box, Button, TextField, Typography, useTheme } from '@mui/material';
import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authSurfaces } from '@/modules/auth/theme/authUx';
import { colors } from '@/shared/theme/colors';
import type { AmenityAssignment } from '@/shared/types/space';
import {
  MAX_CUSTOM_AMENITY_LABEL_LENGTH,
  MAX_SPACE_AMENITIES,
  PRESET_AMENITY_CODES,
  amenityKey,
  normalizeAmenityAssignments,
  resolvePresetAmenityLabel,
  type AmenityCode,
} from '@/modules/onboarding/utils/amenities';
import { AMENITY_VISUAL } from './createSpaceVisuals';

type CreateSpaceAmenityGridProps = {
  value: AmenityAssignment[];
  onChange: (next: AmenityAssignment[]) => void;
  disabled?: boolean;
};

export function CreateSpaceAmenityGrid({ value, onChange, disabled }: CreateSpaceAmenityGridProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);
  const isDark = theme.palette.mode === 'dark';
  const [customLabel, setCustomLabel] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const selectedKeys = new Set(value.map(amenityKey));
  const customItems = value.filter((item) => item.code === 'CUSTOM');

  function togglePreset(code: (typeof PRESET_AMENITY_CODES)[number]) {
    if (disabled) return;
    if (selectedKeys.has(code)) {
      onChange(value.filter((item) => amenityKey(item) !== code));
      return;
    }
    if (value.length >= MAX_SPACE_AMENITIES) return;
    onChange(
      normalizeAmenityAssignments([
        ...value,
        { code, label: resolvePresetAmenityLabel(code, t) },
      ]),
    );
  }

  function removeCustom(item: AmenityAssignment) {
    if (disabled) return;
    const key = amenityKey(item);
    onChange(value.filter((entry) => amenityKey(entry) !== key));
  }

  function addCustom() {
    if (disabled) return;
    const label = customLabel.trim();
    if (!label) {
      setCustomError(t('spaces.amenities.customRequired'));
      return;
    }
    if (label.length > MAX_CUSTOM_AMENITY_LABEL_LENGTH) {
      setCustomError(t('spaces.amenities.customTooLong'));
      return;
    }
    if (value.length >= MAX_SPACE_AMENITIES) {
      setCustomError(t('spaces.amenities.maxReached'));
      return;
    }
    onChange(
      normalizeAmenityAssignments([
        ...value,
        { code: 'CUSTOM' satisfies AmenityCode, label },
      ]),
    );
    setCustomLabel('');
    setCustomError(null);
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 1,
        }}
      >
        {PRESET_AMENITY_CODES.map((code) => {
          const selected = selectedKeys.has(code);
          const visual = AMENITY_VISUAL[code];
          const Icon = visual.icon;
          return (
            <Box
              key={code}
              component="button"
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => togglePreset(code)}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 1,
                textAlign: 'left',
                px: 1.15,
                py: 0.75,
                minHeight: 44,
                height: 44,
                borderRadius: '12px',
                border: `1.5px solid ${selected ? colors.primary : a.border}`,
                bgcolor: selected ? (isDark ? `${visual.accent}24` : visual.tint) : a.surface,
                cursor: disabled ? 'default' : 'pointer',
                color: a.textPrimary,
                transition: 'border-color 140ms ease, background-color 140ms ease',
                '&:hover': disabled
                  ? undefined
                  : {
                      borderColor: visual.accent,
                    },
                '&:focus-visible': {
                  outline: `2px solid ${visual.accent}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: '7px',
                  bgcolor: isDark ? `${visual.accent}33` : visual.tint,
                  color: visual.accent,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={14} strokeWidth={2.2} />
              </Box>
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {resolvePresetAmenityLabel(code, t)}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: selected ? visual.accent : a.textMuted,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {selected
                  ? t('spaces.createSpace.wizard.available', { defaultValue: 'Available' })
                  : t('spaces.createSpace.wizard.notSelected', { defaultValue: 'Not selected' })}
              </Typography>
              <Box
                aria-hidden
                sx={{
                  width: 18,
                  height: 18,
                  ml: 'auto',
                  borderRadius: '50%',
                  border: selected ? 'none' : `1.5px solid ${a.border}`,
                  bgcolor: selected ? colors.primary : 'transparent',
                  color: '#FFFFFF',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                {selected ? <Check size={11} strokeWidth={3} /> : null}
              </Box>
            </Box>
          );
        })}
        {customItems.map((item) => (
          <Box
            key={amenityKey(item)}
            component="button"
            type="button"
            disabled={disabled}
            aria-pressed
            onClick={() => removeCustom(item)}
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1,
              textAlign: 'left',
              px: 1.15,
              py: 0.75,
              minHeight: 44,
              height: 44,
              borderRadius: '12px',
              border: `1.5px solid ${a.brand}`,
              bgcolor: isDark ? a.brandSoft : '#F0FDFA',
              cursor: disabled ? 'default' : 'pointer',
              color: a.textPrimary,
            }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: '7px',
                bgcolor: a.brandSoft,
                color: a.brand,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Plus size={14} strokeWidth={2.2} />
            </Box>
            <Typography
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                lineHeight: 1.2,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'flex-start' }}>
        <TextField
          size="small"
          fullWidth
          disabled={disabled}
          label={t('spaces.amenities.customLabel')}
          placeholder={t('spaces.amenities.customPlaceholder')}
          value={customLabel}
          onChange={(event) => {
            setCustomLabel(event.target.value);
            if (customError) setCustomError(null);
          }}
          error={Boolean(customError)}
          helperText={customError}
          slotProps={{ htmlInput: { maxLength: MAX_CUSTOM_AMENITY_LABEL_LENGTH } }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: a.surface,
            },
          }}
        />
        <Button
          variant="outlined"
          disabled={disabled}
          onClick={addCustom}
          sx={{
            mt: '2px',
            minHeight: 40,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 700,
            color: a.brand,
            borderColor: a.brand,
            whiteSpace: 'nowrap',
          }}
        >
          {t('spaces.amenities.addCustom')}
        </Button>
      </Box>
    </Box>
  );
}
