import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { Check, MapPin, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { MealDeliveryLocation } from '@/shared/types/meals';

type MealPollDeliveryPickerProps = {
  locations: MealDeliveryLocation[];
  selectedId?: string;
  lastUsedLocationId?: string;
  onSelect: (locationId: string) => void;
  disabled?: boolean;
};

/** Flat delivery strip matching the mock: pin · name · Last used · Change. */
export function MealPollDeliveryPicker({
  locations,
  selectedId,
  lastUsedLocationId,
  onSelect,
  disabled = false,
}: MealPollDeliveryPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const [open, setOpen] = useState(false);
  const active = locations.filter((l) => l.active);
  const options = active.length > 0 ? active : locations;

  if (options.length === 0) return null;

  const selected = options.find((l) => l.id === selectedId) ?? null;
  const isLastUsed = Boolean(selectedId && selectedId === lastUsedLocationId);
  const canChange = !disabled && options.length > 1;

  return (
    <>
      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1.15,
          borderRadius: 2,
          border: `1px solid ${colors.primaryDark}28`,
          bgcolor: colors.section,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1.5,
              bgcolor: `${colors.primaryDark}14`,
              color: colors.primaryDark,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MapPin size={15} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary }}>
              {t('meals.poll.deliveryLocation', { defaultValue: 'Delivery location' })}
            </Typography>
            {selected ? (
              <Stack
                direction="row"
                spacing={0.75}
                useFlexGap
                sx={{ flexWrap: 'wrap', alignItems: 'center', mt: 0.15 }}
              >
                <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
                  {selected.name}
                </Typography>
                {selected.description ? (
                  <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                    {selected.description}
                  </Typography>
                ) : null}
                {isLastUsed ? (
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.15,
                      borderRadius: 999,
                      bgcolor: `${colors.primary}22`,
                    }}
                  >
                    <Typography sx={{ ...DASHBOARD_UX.badge, color: colors.primaryDark, fontWeight: 700 }}>
                      {t('meals.poll.lastUsedDelivery', { defaultValue: 'Last used' })}
                    </Typography>
                  </Box>
                ) : null}
              </Stack>
            ) : (
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
                {t('meals.poll.selectDeliveryLocation', {
                  defaultValue: 'Select a delivery location',
                })}
              </Typography>
            )}
          </Box>
        </Stack>

        {canChange ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<Pencil size={13} />}
            onClick={() => setOpen(true)}
            sx={{ ...dashOutlinedButtonSx, flexShrink: 0 }}
          >
            {t('common.change', { defaultValue: 'Change' })}
          </Button>
        ) : null}
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
          {t('meals.poll.selectDeliveryLocationTitle', {
            defaultValue: 'Select delivery location',
          })}
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Stack spacing={0.75}>
            {options.map((location) => {
              const isSelected = location.id === selectedId;
              const optionLastUsed = location.id === lastUsedLocationId;
              return (
                <MenuItem
                  key={location.id}
                  selected={isSelected}
                  onClick={() => {
                    onSelect(location.id);
                    setOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${isSelected ? colors.primary : s.border}`,
                    bgcolor: isSelected ? colors.selected : colors.surface,
                    py: 1.1,
                    px: 1.25,
                    alignItems: 'flex-start',
                    gap: 1,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
                        {location.name}
                      </Typography>
                      {optionLastUsed ? (
                        <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                          {t('meals.poll.lastUsedDelivery', { defaultValue: 'Last used' })}
                        </Typography>
                      ) : null}
                    </Stack>
                    {location.description ? (
                      <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                        {location.description}
                      </Typography>
                    ) : null}
                  </Box>
                  {isSelected ? <Check size={16} color={colors.primaryDark} /> : null}
                </MenuItem>
              );
            })}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
