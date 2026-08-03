import { Box, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import type { MealBillingType } from '@/shared/types/member';
import type { MemberMealBillingSelection } from '../../utils/memberMealBilling';

const BILLING_TYPES: MealBillingType[] = ['PAY_PER_MEAL', 'PREPAID_BALANCE'];

type MemberMealBillingTypeSectionProps = {
  spaceDefault: MealBillingType;
  value: MemberMealBillingSelection;
  onChange: (value: MemberMealBillingSelection) => void;
  disabled?: boolean;
};

function isOptionSelected(
  option: MealBillingType,
  value: MemberMealBillingSelection,
  spaceDefault: MealBillingType,
): boolean {
  if (value === option) {
    return true;
  }
  return value === 'DEFAULT' && option === spaceDefault;
}

/** Radio cards for meal billing — matches mobile MemberMealBillingTypeSection. */
export function MemberMealBillingTypeSection({
  spaceDefault,
  value,
  onChange,
  disabled,
}: MemberMealBillingTypeSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
        {t('members.mealBilling.title')}
      </Typography>
      <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mt: 0.5, mb: 1.25 }}>
        {t('members.mealBilling.subtitle', {
          defaultValue:
            'Choose how this member pays for meals. Override only if they need a different plan from the mess default.',
        })}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {BILLING_TYPES.map((option) => {
          const selected = isOptionSelected(option, value, spaceDefault);
          const base = t(`spaces.mealBilling.types.${option}.label`);
          const label =
            option === spaceDefault
              ? t('members.mealBilling.typeWithDefault', {
                  type: base,
                  defaultValue: `${base} (Default choice)`,
                })
              : base;
          return (
            <Box
              key={option}
              component="button"
              type="button"
              disabled={disabled}
              onClick={() => onChange(option === spaceDefault ? 'DEFAULT' : option)}
              aria-pressed={selected}
              sx={{
                textAlign: 'left',
                cursor: disabled ? 'default' : 'pointer',
                borderRadius: `${DASHBOARD_UX.radius}px`,
                border: `1px solid ${selected ? colors.primary : s.border}`,
                bgcolor: selected ? s.successTint : s.surface,
                p: 1.5,
                opacity: disabled ? 0.6 : 1,
                transition: DASHBOARD_UX.transition,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `2px solid ${selected ? colors.primary : s.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {selected ? (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: colors.primary,
                      }}
                    />
                  ) : null}
                </Box>
                <Typography
                  sx={{
                    ...DASHBOARD_UX.link,
                    color: selected ? colors.primaryDark : s.textPrimary,
                  }}
                >
                  {label}
                </Typography>
              </Box>
              <Typography
                sx={{
                  ...DASHBOARD_UX.caption,
                  color: s.textMuted,
                  mt: 0.5,
                  ml: '26px',
                }}
              >
                {t(`spaces.mealBilling.types.${option}.description`)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
