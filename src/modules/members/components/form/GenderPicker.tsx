import { Box, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import type { MemberGender } from '@/shared/types/member';
import { MEMBER_GENDER_OPTIONS, memberGenderLabelKey } from '../../utils/memberGender';

type GenderPickerProps = {
  value: MemberGender | null;
  onChange: (gender: MemberGender) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
};

/** Chip gender picker — matches mobile GenderPicker. */
export function GenderPicker({
  value,
  onChange,
  error,
  required = false,
  disabled,
}: GenderPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box sx={{ mb: 0.5 }}>
      <Typography sx={{ ...DASHBOARD_UX.inputLabel, color: s.textPrimary, mb: 1 }}>
        {t('membership.gender.label')}
        {required ? (
          <Box component="span" sx={{ color: colors.danger }}>
            {' '}
            *
          </Box>
        ) : null}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {MEMBER_GENDER_OPTIONS.map((option) => {
          const selected = value === option;
          return (
            <Box
              key={option}
              component="button"
              type="button"
              disabled={disabled}
              onClick={() => onChange(option)}
              aria-pressed={selected}
              sx={{
                flex: '1 1 30%',
                minWidth: 88,
                cursor: disabled ? 'default' : 'pointer',
                borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                border: `1px solid ${selected ? colors.primary : s.border}`,
                bgcolor: selected ? s.successTint : s.surface,
                px: 1.5,
                py: 1.25,
                textAlign: 'center',
                opacity: disabled ? 0.6 : 1,
                transition: DASHBOARD_UX.transition,
                '&:hover': disabled
                  ? undefined
                  : {
                      bgcolor: selected ? s.successTint : s.hover,
                    },
              }}
            >
              <Typography
                sx={{
                  ...DASHBOARD_UX.link,
                  color: selected ? colors.primaryDark : s.textPrimary,
                }}
              >
                {t(memberGenderLabelKey(option))}
              </Typography>
            </Box>
          );
        })}
      </Box>
      {error ? (
        <Typography sx={{ ...DASHBOARD_UX.caption, color: colors.danger, mt: 0.75 }}>
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}
