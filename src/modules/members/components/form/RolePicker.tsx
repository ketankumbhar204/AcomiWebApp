import { Box, Typography, useTheme } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import type { MembershipRole, SpaceType } from '@/shared/types/space';
import { assignableRolesForSpaceType } from '../../utils/memberRoles';

const ALL_ROLES: MembershipRole[] = ['TENANT', 'CUSTOMER', 'STAFF', 'MANAGER'];

type RolePickerProps = {
  value: MembershipRole | null;
  onChange: (role: MembershipRole) => void;
  spaceType?: SpaceType;
  error?: string;
  disabled?: boolean;
};

/** Chip-grid role picker — matches mobile RolePicker. */
export function RolePicker({ value, onChange, spaceType, error, disabled }: RolePickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  const roles = useMemo(
    () => assignableRolesForSpaceType(spaceType).filter((role) => ALL_ROLES.includes(role)),
    [spaceType],
  );

  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ ...DASHBOARD_UX.inputLabel, color: s.textPrimary, mb: 1 }}>
        {t('membership.roles.label')}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 1,
        }}
      >
        {roles.map((role) => {
          const selected = value === role;
          const descriptionKey =
            spaceType === 'MESS' && role === 'CUSTOMER'
              ? 'membership.roles.customer.descriptionMess'
              : `membership.roles.${role.toLowerCase()}.description`;
          return (
            <Box
              key={role}
              component="button"
              type="button"
              disabled={disabled}
              onClick={() => onChange(role)}
              aria-pressed={selected}
              sx={{
                textAlign: 'left',
                cursor: disabled ? 'default' : 'pointer',
                borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                border: `1px solid ${selected ? colors.primary : s.border}`,
                bgcolor: selected ? s.successTint : s.surface,
                p: 1.5,
                opacity: disabled ? 0.6 : 1,
                transition: DASHBOARD_UX.transition,
                '&:hover': disabled
                  ? undefined
                  : {
                      bgcolor: selected ? s.successTint : s.hover,
                      borderColor: selected ? colors.primary : colors.primaryDark,
                    },
              }}
            >
              <Typography
                sx={{
                  ...DASHBOARD_UX.link,
                  color: selected ? colors.primaryDark : s.textPrimary,
                }}
              >
                {t(`membership.roles.${role.toLowerCase()}.label`)}
              </Typography>
              <Typography
                sx={{
                  ...DASHBOARD_UX.caption,
                  color: selected ? colors.primaryDark : s.textMuted,
                  mt: 0.25,
                }}
              >
                {t(descriptionKey)}
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
