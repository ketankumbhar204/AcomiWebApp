import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, useTheme } from '@mui/material';
import { ArrowUpRight, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import type { AddPersonNoun } from '../addPersonChoice';

type AddPersonChoiceDialogProps = {
  open: boolean;
  noun: AddPersonNoun;
  importableCount?: number;
  onAddNew: () => void;
  onImportFromAnotherSpace: () => void;
  onClose: () => void;
};

type ChoiceOption = {
  label: string;
  description: string;
  icon: typeof Plus;
  onClick: () => void;
};

/**
 * Compact choice before Add Member / Add Customer.
 * It does not create people or call membership APIs.
 */
export function AddPersonChoiceDialog({
  open,
  noun,
  importableCount = 0,
  onAddNew,
  onImportFromAnotherSpace,
  onClose,
}: AddPersonChoiceDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const title =
    noun === 'customer'
      ? t('membership.add.choice.titleCustomer')
      : t('membership.add.choice.titleMember');
  const addNewLabel =
    noun === 'customer'
      ? t('membership.add.choice.addNewCustomer')
      : t('membership.add.choice.addNewMember');

  const options: ChoiceOption[] = [
    {
      label: addNewLabel,
      description: t('membership.add.choice.addNewDescription'),
      icon: Plus,
      onClick: onAddNew,
    },
    {
      label: t('membership.add.choice.import'),
      description:
        importableCount > 0
          ? t(
              noun === 'customer'
                ? 'membership.add.choice.importAvailableCustomer'
                : 'membership.add.choice.importAvailable',
              { count: importableCount },
            )
          : t('membership.add.choice.importDescription'),
      icon: ArrowUpRight,
      onClick: onImportFromAnotherSpace,
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="add-person-choice-title"
      aria-describedby="add-person-choice-subtitle"
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            boxShadow: s.shadowHover,
          },
        },
      }}
    >
      <DialogTitle
        id="add-person-choice-title"
        sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, pb: 0.5 }}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography
          id="add-person-choice-subtitle"
          sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 2 }}
        >
          {t('membership.add.choice.subtitle')}
        </Typography>
        <Stack spacing={1.25}>
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Box
                key={option.label}
                component="button"
                type="button"
                onClick={option.onClick}
                aria-label={`${option.label}. ${option.description}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  minHeight: 72,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: `${DASHBOARD_UX.radius}px`,
                  border: `1px solid ${s.border}`,
                  bgcolor: s.surface,
                  color: s.textPrimary,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: s.elevated },
                  '&:focus-visible': {
                    outline: `2px solid ${colors.primaryDark}`,
                    outlineOffset: 2,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                    bgcolor: s.successTint,
                    color: colors.primaryDark,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </Box>
                <Box>
                  <Typography sx={{ ...DASHBOARD_UX.button, color: s.textPrimary, fontWeight: 700 }}>
                    {option.label}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary, mt: 0.25 }}>
                    {option.description}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" sx={{ ...DASHBOARD_UX.button, color: s.textSecondary }}>
          {t('common.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
