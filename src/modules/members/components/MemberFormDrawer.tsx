import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { StickyFooter } from '@/shared/components/StickyFooter';
import type { MemberDetailsResponse, MemberGender, MealBillingType } from '@/shared/types/member';
import type { MembershipRole, SpaceType } from '@/shared/types/space';
import { normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useMemberMutations } from '../hooks/useMembers';
import { MEMBER_GENDER_OPTIONS, isMemberGenderRequired } from '../utils/memberGender';
import {
  assignableRolesForSpaceType,
  defaultRoleForSpaceType,
  isRoleAssignableInSpace,
} from '../utils/memberRoles';
import {
  buildSubscriptionPurchasePayload,
  validateNewMemberFields,
} from '../utils/memberValidation';
import { memberMealBalanceApi } from '../api/memberMealBalanceApi';

type MemberFormDrawerProps = {
  open: boolean;
  mode: 'create' | 'edit';
  spaceId: string;
  spaceType?: SpaceType;
  member?: MemberDetailsResponse | null;
  onClose: () => void;
};

type MemberFormBodyProps = {
  mode: 'create' | 'edit';
  spaceId: string;
  spaceType?: SpaceType;
  member?: MemberDetailsResponse | null;
  onClose: () => void;
};

function MemberFormBody({ mode, spaceId, spaceType, member, onClose }: MemberFormBodyProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const { createMember, updateMember } = useMemberMutations(spaceId);
  const roles = assignableRolesForSpaceType(spaceType);
  const genderRequired = isMemberGenderRequired(spaceType);
  const isMess = spaceType === 'MESS';

  const [fullName, setFullName] = useState(
    mode === 'edit' && member ? member.fullName : '',
  );
  const [mobileNumber, setMobileNumber] = useState(
    mode === 'edit' && member ? member.mobileNumber : '',
  );
  const [role, setRole] = useState<MembershipRole>(() => {
    if (mode === 'edit' && member && member.role !== 'OWNER') {
      return member.role;
    }
    return defaultRoleForSpaceType(spaceType);
  });
  const [gender, setGender] = useState<MemberGender | ''>(() => {
    if (mode === 'edit' && member?.gender && member.gender !== 'UNSPECIFIED') {
      return member.gender;
    }
    return '';
  });
  const [mealBillingType, setMealBillingType] = useState<MealBillingType | ''>(
    mode === 'edit' ? (member?.mealBillingType ?? '') : '',
  );
  const [mealQty, setMealQty] = useState('');
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const saving = createMember.isPending || updateMember.isPending;

  const handleSubmit = async () => {
    const fieldErrors = validateNewMemberFields(fullName, mobileNumber, {
      fullNameRequired: t('membership.add.fullNameRequired'),
      mobileRequired: t('membership.invite.mobileRequired'),
      mobileInvalid: t('membership.invite.mobileInvalid'),
    });
    if (!isRoleAssignableInSpace(role, spaceType)) {
      fieldErrors.role = t('membership.invite.roleNotAllowed');
    }
    if (genderRequired && !gender) {
      fieldErrors.gender = t('membership.gender.required');
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors as Record<string, string>);
      return;
    }

    const body = {
      fullName: fullName.trim(),
      mobileNumber: normalizeIndianMobileDigits(mobileNumber),
      role,
      gender: gender || null,
      mealBillingType: mealBillingType || null,
    };

    try {
      if (mode === 'create') {
        const created = await createMember.mutateAsync(body);
        if (mealBillingType === 'PREPAID_BALANCE' && (mealQty || price)) {
          const payload = buildSubscriptionPurchasePayload(mealQty, price, 'MEALS');
          if (payload) {
            await memberMealBalanceApi.recordPurchase(spaceId, created.memberId, payload);
          }
        }
        enqueueSnackbar(t('membership.add.successToast'), { variant: 'success' });
      } else if (member) {
        await updateMember.mutateAsync({ memberId: member.memberId, body });
        enqueueSnackbar(t('membership.edit.successToast'), { variant: 'success' });
      }
      onClose();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
        variant: 'error',
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          p: `${DASHBOARD_UX.sectionPadding}px`,
          borderBottom: `1px solid ${s.border}`,
        }}
      >
        <Typography sx={{ ...DASHBOARD_UX.sidebarSection, color: s.textMuted }}>
          {mode === 'create' ? t('membership.add.eyebrow') : t('membership.edit.eyebrow')}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mt: 0.5 }}>
          {mode === 'create'
            ? isMess
              ? t('membership.add.headingMess')
              : t('membership.add.heading')
            : t('membership.edit.heading')}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.5 }}>
          {mode === 'create' ? t('membership.add.subheading') : t('membership.edit.subheading')}
        </Typography>
      </Box>

      <Box sx={{ p: `${DASHBOARD_UX.sectionPadding}px`, flex: 1, overflow: 'auto' }}>
        <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
          <TextField
            label={t('membership.add.fullNameLabel')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={Boolean(errors.fullName)}
            helperText={errors.fullName}
            placeholder={t('membership.add.fullNamePlaceholder')}
            fullWidth
            required
          />
          <TextField
            label={t('membership.invite.mobileLabel')}
            value={mobileNumber}
            onChange={(e) => setMobileNumber(normalizeIndianMobileDigits(e.target.value))}
            error={Boolean(errors.mobileNumber)}
            helperText={errors.mobileNumber}
            placeholder="e.g. 9876543210"
            fullWidth
            required
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }}
          />
          <FormControl fullWidth error={Boolean(errors.role)}>
            <InputLabel id="member-role-label">{t('membership.roles.label')}</InputLabel>
            <Select
              labelId="member-role-label"
              label={t('membership.roles.label')}
              value={role}
              onChange={(e) => setRole(e.target.value as MembershipRole)}
            >
              {roles.map((option) => (
                <MenuItem key={option} value={option}>
                  {t(`membership.roles.${option.toLowerCase()}.label`, {
                    defaultValue: option,
                  })}
                </MenuItem>
              ))}
            </Select>
            {errors.role ? <FormHelperText>{errors.role}</FormHelperText> : null}
          </FormControl>

          {(genderRequired || mode === 'edit') && (
            <FormControl fullWidth error={Boolean(errors.gender)} required={genderRequired}>
              <InputLabel id="member-gender-label">{t('membership.gender.label')}</InputLabel>
              <Select
                labelId="member-gender-label"
                label={t('membership.gender.label')}
                value={gender}
                onChange={(e) => setGender(e.target.value as MemberGender)}
              >
                {MEMBER_GENDER_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {t(`membership.gender.${option.toLowerCase()}`)}
                  </MenuItem>
                ))}
              </Select>
              {errors.gender ? <FormHelperText>{errors.gender}</FormHelperText> : null}
            </FormControl>
          )}

          <FormControl fullWidth>
            <InputLabel id="member-billing-label">{t('membership.details.mealBilling')}</InputLabel>
            <Select
              labelId="member-billing-label"
              label={t('membership.details.mealBilling')}
              value={mealBillingType}
              onChange={(e) => setMealBillingType(e.target.value as MealBillingType | '')}
            >
              <MenuItem value="">
                {t('members.mealBilling.useSpaceDefault', { type: 'default' })}
              </MenuItem>
              <MenuItem value="PAY_PER_MEAL">
                {t('spaces.mealBilling.types.PAY_PER_MEAL.label', { defaultValue: 'Pay per meal' })}
              </MenuItem>
              <MenuItem value="PREPAID_BALANCE">
                {t('spaces.mealBilling.types.PREPAID_BALANCE.label', {
                  defaultValue: 'Prepaid balance',
                })}
              </MenuItem>
            </Select>
          </FormControl>

          {mode === 'create' && mealBillingType === 'PREPAID_BALANCE' ? (
            <>
              <TextField
                label={t('members.subscriptionSetup.mealQtyLabel')}
                value={mealQty}
                onChange={(e) => setMealQty(e.target.value)}
                placeholder="e.g. 30"
                fullWidth
              />
              <TextField
                label={t('members.subscriptionSetup.priceLabel')}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 2500"
                fullWidth
              />
            </>
          ) : null}
        </Stack>
      </Box>

      <StickyFooter>
        <Button onClick={onClose} disabled={saving} sx={dashOutlinedButtonSx}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={saving}
          sx={dashContainedButtonSx}
        >
          {mode === 'create'
            ? isMess
              ? t('membership.add.saveMess')
              : t('membership.add.save')
            : t('membership.edit.save')}
        </Button>
      </StickyFooter>
    </Box>
  );
}

export function MemberFormDrawer({
  open,
  mode,
  spaceId,
  spaceType,
  member,
  onClose,
}: MemberFormDrawerProps) {
  return (
    <AppDrawer open={open} onClose={onClose} width={520}>
      {open ? (
        <MemberFormBody
          key={`${mode}-${member?.memberId ?? 'new'}`}
          mode={mode}
          spaceId={spaceId}
          spaceType={spaceType}
          member={member}
          onClose={onClose}
        />
      ) : null}
    </AppDrawer>
  );
}
