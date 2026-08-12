import {
  Box,
  Button,
  FormControlLabel,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { Pencil, Phone, User, UserPlus } from 'lucide-react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type {
  MealBillingType,
  MemberDetailsResponse,
  MemberGender,
  MemberResponse,
  PrepaidBalanceUnit,
} from '@/shared/types/member';
import type { MembershipRole, SpaceType } from '@/shared/types/space';
import { normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import { mealBillingApi } from '@/modules/onboarding/api/mealBillingApi';
import { memberApi } from '../api/memberApi';
import { memberMealBalanceApi } from '../api/memberMealBalanceApi';
import {
  useResidentImportSearch,
  type ResidentPickerItem,
} from '../hooks/useResidentImportSearch';
import { useMemberMutations } from '../hooks/useMembers';
import { enrollMemberInFullMeals } from '../utils/enrollMemberInFullMeals';
import { MEMBER_GENDER_OPTIONS, isMemberGenderRequired } from '../utils/memberGender';
import {
  defaultRoleForSpaceType,
  isRoleAssignableInSpace,
} from '../utils/memberRoles';
import {
  buildSubscriptionPurchasePayload,
  validateNewMemberFields,
} from '../utils/memberValidation';
import {
  defaultSubscriptionValidTillIso,
  isSubscriptionBilling,
  parseValidTillInput,
  type MemberMealBillingSelection,
} from '../utils/memberMealBilling';
import { GenderPicker } from './form/GenderPicker';
import { MemberCustomerReusePicker, type MemberPickerMode } from './form/MemberCustomerReusePicker';
import { MemberFormHero } from './form/MemberFormHero';
import { MemberMealBillingTypeSection } from './form/MemberMealBillingTypeSection';
import { MemberSubscriptionSetupFields } from './form/MemberSubscriptionSetupFields';
import { RolePicker } from './form/RolePicker';

type MemberFormDrawerProps = {
  open: boolean;
  mode: 'create' | 'edit';
  spaceId: string;
  spaceType?: SpaceType;
  member?: MemberDetailsResponse | MemberResponse | null;
  onClose: () => void;
  /** Opens invite flow (mobile “Send invitation” link). */
  onInvite?: () => void;
};

type FieldErrors = Record<string, string>;

function formCardSx(s: ReturnType<typeof dashSurfaces>) {
  return {
    borderRadius: `${DASHBOARD_UX.radius + 4}px`,
    border: `1px solid ${s.border}`,
    bgcolor: s.surface,
    boxShadow: s.shadow,
    p: 2,
  } as const;
}

function MemberFormBody({
  mode,
  spaceId,
  spaceType,
  member,
  onClose,
  onInvite,
}: Omit<MemberFormDrawerProps, 'open'>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const { createMember, updateMember } = useMemberMutations(spaceId);
  const mealsSectionRef = useRef<HTMLDivElement | null>(null);

  const isMess = spaceType === 'MESS';
  const genderRequired = isMemberGenderRequired(spaceType);
  const isEdit = mode === 'edit';

  const [fullName, setFullName] = useState(
    isEdit && member ? member.fullName : '',
  );
  const [mobileNumber, setMobileNumber] = useState(
    isEdit && member ? member.mobileNumber : '',
  );
  const [role, setRole] = useState<MembershipRole>(() => {
    if (isEdit && member && member.role !== 'OWNER') {
      return member.role;
    }
    return defaultRoleForSpaceType(spaceType);
  });
  const [gender, setGender] = useState<MemberGender | null>(() => {
    if (isEdit && member?.gender && MEMBER_GENDER_OPTIONS.includes(member.gender)) {
      return member.gender;
    }
    return null;
  });

  const [pickerMode, setPickerMode] = useState<MemberPickerMode>('search');
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedImport, setSelectedImport] = useState<ResidentPickerItem | null>(null);

  const [mealAccessEnabled, setMealAccessEnabled] = useState(true);
  const [mealBillingSelection, setMealBillingSelection] =
    useState<MemberMealBillingSelection>(() =>
      isEdit && member && 'mealBillingType' in member
        ? (member.mealBillingType ?? 'DEFAULT')
        : 'DEFAULT',
    );
  const [spaceDefaultBilling, setSpaceDefaultBilling] =
    useState<MealBillingType>('PAY_PER_MEAL');
  const [prepaidBalanceUnit, setPrepaidBalanceUnit] =
    useState<PrepaidBalanceUnit>('MEALS');
  const [subscriptionMealQty, setSubscriptionMealQty] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [subscriptionValidTill, setSubscriptionValidTill] = useState(
    defaultSubscriptionValidTillIso(),
  );
  const [mealsReviewed, setMealsReviewed] = useState(false);
  const [mealsHighlighted, setMealsHighlighted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [importing, setImporting] = useState(false);

  const showCustomerReuse = !isEdit && isMess && role === 'CUSTOMER';
  const usingImport = showCustomerReuse && pickerMode === 'search' && selectedImport != null;
  const showCreateForm = !showCustomerReuse || pickerMode === 'new';
  const showMealAccess = !isEdit && isMess && role === 'CUSTOMER';
  const showMealBilling = isEdit ? isMess : showMealAccess;
  const showSubscriptionSetup =
    showMealBilling && isSubscriptionBilling(mealBillingSelection, spaceDefaultBilling);
  const messProgressiveEnabled = showMealBilling || showMealAccess;
  const progressiveContinue = messProgressiveEnabled && !mealsReviewed;

  const importSearch = useResidentImportSearch(
    spaceId,
    memberQuery,
    showCustomerReuse && pickerMode === 'search',
  );

  useEffect(() => {
    if (!showMealBilling) {
      return;
    }
    void mealBillingApi.getSettings(spaceId).then((settings) => {
      setSpaceDefaultBilling(settings.billingType);
      setPrepaidBalanceUnit(settings.prepaidBalanceUnit ?? 'MEALS');
    });
  }, [showMealBilling, spaceId]);

  useEffect(() => {
    if (!showCustomerReuse) {
      setPickerMode('new');
      setSelectedImport(null);
      setMemberQuery('');
    } else {
      setPickerMode('search');
    }
  }, [showCustomerReuse, role]);

  useEffect(() => {
    setMealsReviewed(false);
    setMealsHighlighted(false);
  }, [role, messProgressiveEnabled]);

  const saving = createMember.isPending || updateMember.isPending || importing;

  const markMealsReviewed = () => {
    setMealsReviewed(true);
    setMealsHighlighted(false);
  };

  const continueToMeals = () => {
    setMealsReviewed(true);
    setMealsHighlighted(true);
    mealsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => setMealsHighlighted(false), 1600);
  };

  const validateCreate = (): boolean => {
    const fieldErrors = validateNewMemberFields(fullName, mobileNumber, {
      fullNameRequired: t('membership.add.fullNameRequired'),
      mobileRequired: t('membership.invite.mobileRequired'),
      mobileInvalid: t('membership.invite.mobileInvalid'),
    }) as FieldErrors;

    if (!isRoleAssignableInSpace(role, spaceType)) {
      fieldErrors.role = t('membership.invite.roleNotAllowed');
    }
    if (genderRequired && !gender) {
      fieldErrors.gender = t('membership.gender.required');
    }
    if (showSubscriptionSetup && !isEdit) {
      const purchase = buildSubscriptionPurchasePayload(
        subscriptionMealQty,
        subscriptionPrice,
        prepaidBalanceUnit,
      );
      if (!purchase) {
        if (prepaidBalanceUnit === 'MEALS') {
          fieldErrors.subscriptionMealQty = t('members.subscriptionSetup.mealQtyRequired');
        } else {
          fieldErrors.subscriptionPrice = t('members.subscriptionSetup.priceRequired');
        }
      }
    }

    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  const validateImport = (): boolean => {
    const fieldErrors: FieldErrors = {};
    if (!selectedImport) {
      fieldErrors.import = t('membership.add.reuseRequired');
    }
    if (showSubscriptionSetup) {
      const purchase = buildSubscriptionPurchasePayload(
        subscriptionMealQty,
        subscriptionPrice,
        prepaidBalanceUnit,
      );
      if (!purchase) {
        if (prepaidBalanceUnit === 'MEALS') {
          fieldErrors.subscriptionMealQty = t('members.subscriptionSetup.mealQtyRequired');
        } else {
          fieldErrors.subscriptionPrice = t('members.subscriptionSetup.priceRequired');
        }
      }
    }
    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  const finishAfterMemberCreated = async (memberId: string) => {
    if (showMealAccess && mealAccessEnabled) {
      try {
        await enrollMemberInFullMeals(spaceId, memberId);
      } catch {
        enqueueSnackbar(t('meals.errors.mealAccessFailed'), { variant: 'warning' });
      }
    }
    if (showSubscriptionSetup) {
      const purchase = buildSubscriptionPurchasePayload(
        subscriptionMealQty,
        subscriptionPrice,
        prepaidBalanceUnit,
      );
      if (purchase) {
        try {
          await memberMealBalanceApi.recordPurchase(spaceId, memberId, {
            ...purchase,
            validTill:
              parseValidTillInput(subscriptionValidTill) ?? defaultSubscriptionValidTillIso(),
          });
        } catch {
          enqueueSnackbar(t('meals.errors.saveFailed'), { variant: 'warning' });
        }
      }
    }
    enqueueSnackbar(
      usingImport ? t('membership.add.importSuccessToast') : t('membership.add.successToast'),
      { variant: 'success' },
    );
    onClose();
  };

  const handleSubmit = async () => {
    try {
      if (usingImport && selectedImport) {
        if (!validateImport()) {
          return;
        }
        setImporting(true);
        let memberId = selectedImport.memberId;
        if (selectedImport.needsImport) {
          const imported = await memberApi.importMember(spaceId, {
            sourceMemberId: selectedImport.memberId,
          });
          memberId = imported.memberId;
        }
        await finishAfterMemberCreated(memberId);
        return;
      }

      if (!validateCreate()) {
        return;
      }

      const body = {
        fullName: fullName.trim(),
        mobileNumber: normalizeIndianMobileDigits(mobileNumber),
        role,
        gender: gender || null,
        mealBillingType:
          showMealBilling && mealBillingSelection !== 'DEFAULT' ? mealBillingSelection : null,
      };

      if (mode === 'create') {
        const created = await createMember.mutateAsync(body);
        await finishAfterMemberCreated(created.memberId);
        return;
      }

      if (member) {
        await updateMember.mutateAsync({ memberId: member.memberId, body });
        if (showSubscriptionSetup) {
          const purchase = buildSubscriptionPurchasePayload(
            subscriptionMealQty,
            subscriptionPrice,
            prepaidBalanceUnit,
          );
          if (purchase) {
            try {
              await memberMealBalanceApi.recordPurchase(spaceId, member.memberId, {
                ...purchase,
                validTill:
                  parseValidTillInput(subscriptionValidTill) ??
                  defaultSubscriptionValidTillIso(),
              });
            } catch {
              enqueueSnackbar(t('meals.errors.saveFailed'), { variant: 'warning' });
            }
          }
        }
        enqueueSnackbar(t('membership.edit.successToast'), { variant: 'success' });
        onClose();
      }
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
        variant: 'error',
      });
    } finally {
      setImporting(false);
    }
  };

  const saveLabel = usingImport
    ? t('membership.add.saveImport')
    : mode === 'create'
      ? isMess
        ? t('membership.add.saveMess')
        : t('membership.add.save')
      : t('membership.edit.save');

  const saveDisabled =
    saving || (showCustomerReuse && pickerMode === 'search' && !selectedImport);

  const heroHeading =
    mode === 'create'
      ? isMess
        ? t('membership.add.headingMess')
        : t('membership.add.heading')
      : t('membership.edit.heading');
  const heroSubheading =
    mode === 'create'
      ? isMess
        ? t('membership.add.subheadingMess')
        : t('membership.add.subheading')
      : t('membership.edit.subheading');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: s.pageBg }}>
      <Box sx={{ p: `${DASHBOARD_UX.sectionPadding}px`, flex: 1, overflow: 'auto' }}>
        <MemberFormHero
          icon={mode === 'create' ? UserPlus : Pencil}
          eyebrow={
            mode === 'create' ? t('membership.add.eyebrow') : t('membership.edit.eyebrow')
          }
          heading={heroHeading}
          subheading={heroSubheading}
        />

        {mode === 'create' && onInvite ? (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 2 }}>
            {t('membership.add.inviteInstead')}{' '}
            <Box
              component="button"
              type="button"
              onClick={onInvite}
              sx={{
                border: 'none',
                background: 'none',
                p: 0,
                cursor: 'pointer',
                ...DASHBOARD_UX.link,
                color: colors.primaryDark,
              }}
            >
              {t('membership.add.inviteInsteadAction')}
            </Box>
          </Typography>
        ) : null}

        {errors.import ? (
          <Box
            sx={{
              mb: 1.5,
              p: 1.25,
              borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
              bgcolor: s.errorTint,
              border: `1px solid #FECACA`,
            }}
          >
            <Typography sx={{ ...DASHBOARD_UX.body, color: colors.danger }}>
              {errors.import}
            </Typography>
          </Box>
        ) : null}

        <RolePicker
          value={role}
          spaceType={spaceType}
          disabled={saving}
          error={errors.role}
          onChange={(selected) => {
            setRole(selected);
            setSelectedImport(null);
            setErrors((prev) => {
              const next = { ...prev };
              delete next.role;
              return next;
            });
          }}
        />

        {showCustomerReuse ? (
          <MemberCustomerReusePicker
            query={memberQuery}
            onQueryChange={setMemberQuery}
            members={importSearch.members}
            loading={importSearch.loading}
            pickerMode={pickerMode}
            onPickerModeChange={(next) => {
              setPickerMode(next);
              setSelectedImport(null);
              setErrors((prev) => {
                const copy = { ...prev };
                delete copy.import;
                return copy;
              });
            }}
            selectedMemberId={selectedImport?.memberId}
            onSelect={(item) => {
              setSelectedImport(item);
              setErrors((prev) => {
                const copy = { ...prev };
                delete copy.import;
                return copy;
              });
            }}
            newMemberName={fullName}
            newMemberMobile={mobileNumber}
            onNewMemberNameChange={(text) => {
              setFullName(text);
              setErrors((prev) => {
                const copy = { ...prev };
                delete copy.fullName;
                return copy;
              });
            }}
            onNewMemberMobileChange={(text) => {
              setMobileNumber(normalizeIndianMobileDigits(text));
              setErrors((prev) => {
                const copy = { ...prev };
                delete copy.mobileNumber;
                return copy;
              });
            }}
            newMemberErrors={{
              fullName: errors.fullName,
              mobileNumber: errors.mobileNumber,
            }}
            disabled={saving}
          />
        ) : null}

        {showCreateForm && !showCustomerReuse ? (
          <Box sx={{ ...formCardSx(s), mb: 2 }}>
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1.5 }}>
              {t('membership.add.detailsHeading', { defaultValue: 'Member details' })}
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                label={t('membership.add.fullNameLabel')}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.fullName;
                    return copy;
                  });
                }}
                error={Boolean(errors.fullName)}
                helperText={errors.fullName}
                placeholder={t('membership.add.fullNamePlaceholder')}
                fullWidth
                required
                disabled={saving}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <User size={16} color={s.textMuted} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label={t('membership.invite.mobileLabel')}
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(normalizeIndianMobileDigits(e.target.value));
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.mobileNumber;
                    return copy;
                  });
                }}
                error={Boolean(errors.mobileNumber)}
                helperText={errors.mobileNumber}
                placeholder={t('membership.invite.mobilePlaceholder', {
                  defaultValue: 'e.g. 9876543210',
                })}
                fullWidth
                required
                disabled={saving}
                slotProps={{
                  htmlInput: { inputMode: 'numeric', maxLength: 10 },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone size={16} color={s.textMuted} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <GenderPicker
                value={gender}
                required={genderRequired}
                disabled={saving}
                error={errors.gender}
                onChange={(selected) => {
                  setGender(selected);
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.gender;
                    return copy;
                  });
                }}
              />
            </Stack>
          </Box>
        ) : null}

        {usingImport && selectedImport ? (
          <Box
            sx={{
              ...formCardSx(s),
              mb: 2,
              bgcolor: s.successTint,
              borderColor: colors.primary,
            }}
          >
            <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
              {t('membership.add.selectedCustomer')}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mt: 0.5 }}>
              {selectedImport.fullName}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.25 }}>
              {selectedImport.mobileNumber}
            </Typography>
            {selectedImport.sourceSpaceName ? (
              <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mt: 0.5 }}>
                {selectedImport.alreadyInTargetSpace
                  ? t('membership.add.reuseCard.alreadyHere')
                  : t('membership.add.reuseCard.fromSpace', {
                      space: selectedImport.sourceSpaceName,
                    })}
              </Typography>
            ) : null}
          </Box>
        ) : null}

        {showCreateForm && showCustomerReuse ? (
          <Box sx={{ ...formCardSx(s), mb: 2 }}>
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1.5 }}>
              {t('membership.add.detailsHeading', { defaultValue: 'Member details' })}
            </Typography>
            <GenderPicker
              value={gender}
              required={genderRequired}
              disabled={saving}
              error={errors.gender}
              onChange={(selected) => {
                setGender(selected);
                setErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.gender;
                  return copy;
                });
              }}
            />
          </Box>
        ) : null}

        {messProgressiveEnabled ? (
          <Box
            ref={mealsSectionRef}
            sx={{
              ...formCardSx(s),
              mb: 2,
              outline: mealsHighlighted ? `2px solid ${colors.primary}` : 'none',
              outlineOffset: 2,
              transition: 'outline-color 200ms ease',
            }}
          >
            {showMealBilling ? (
              <MemberMealBillingTypeSection
                spaceDefault={spaceDefaultBilling}
                value={mealBillingSelection}
                disabled={saving}
                onChange={(value) => {
                  markMealsReviewed();
                  setMealBillingSelection(value);
                }}
              />
            ) : null}

            {showSubscriptionSetup ? (
              <MemberSubscriptionSetupFields
                unit={prepaidBalanceUnit}
                mealQty={subscriptionMealQty}
                subscriptionPrice={subscriptionPrice}
                validTill={subscriptionValidTill}
                optionalHint={isEdit}
                useSubscriptionLabels={!isEdit}
                disabled={saving}
                mealQtyError={errors.subscriptionMealQty}
                subscriptionPriceError={errors.subscriptionPrice}
                onMealQtyChange={(value) => {
                  markMealsReviewed();
                  setSubscriptionMealQty(value);
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.subscriptionMealQty;
                    return copy;
                  });
                }}
                onSubscriptionPriceChange={(value) => {
                  markMealsReviewed();
                  setSubscriptionPrice(value);
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.subscriptionPrice;
                    return copy;
                  });
                }}
                onValidTillChange={(value) => {
                  markMealsReviewed();
                  setSubscriptionValidTill(value);
                }}
              />
            ) : null}

            {showMealAccess ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  pt: showMealBilling ? 0.5 : 0,
                }}
              >
                <Box>
                  <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
                    {t('meals.mealAccess.label')}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mt: 0.25 }}>
                    {t('meals.mealAccess.addCustomerHint')}
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mealAccessEnabled}
                      disabled={saving}
                      onChange={(_, checked) => {
                        markMealsReviewed();
                        setMealAccessEnabled(checked);
                      }}
                      color="primary"
                    />
                  }
                  label=""
                  sx={{ m: 0 }}
                />
              </Box>
            ) : null}
          </Box>
        ) : null}
      </Box>

      <StickyFooter>
        {progressiveContinue ? (
          <>
            <Box sx={{ flex: 1, mr: 'auto', minWidth: 0 }}>
              <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                {t('progressiveWorkflow.stepOf', { current: 1, total: 2 })}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary }} noWrap>
                {t('progressiveWorkflow.member.progressIdentityNext')}
              </Typography>
            </Box>
            <Button onClick={onClose} disabled={saving} sx={dashOutlinedButtonSx}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={continueToMeals}
              disabled={saving}
              sx={dashContainedButtonSx}
            >
              {t('progressiveWorkflow.member.continueToMeals')}
            </Button>
          </>
        ) : (
          <>
            {messProgressiveEnabled ? (
              <Box sx={{ flex: 1, mr: 'auto', minWidth: 0 }}>
                <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                  {t('progressiveWorkflow.stepOf', { current: 2, total: 2 })}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary }} noWrap>
                  {t('progressiveWorkflow.member.progressReady')}
                </Typography>
              </Box>
            ) : null}
            <Button onClick={onClose} disabled={saving} sx={dashOutlinedButtonSx}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleSubmit()}
              disabled={saveDisabled}
              sx={dashContainedButtonSx}
            >
              {saveLabel}
            </Button>
          </>
        )}
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
  onInvite,
}: MemberFormDrawerProps) {
  return (
    <AppDrawer open={open} onClose={onClose} width={560}>
      {open ? (
        <MemberFormBody
          key={`${mode}-${member?.memberId ?? 'new'}`}
          mode={mode}
          spaceId={spaceId}
          spaceType={spaceType}
          member={member}
          onClose={onClose}
          onInvite={onInvite}
        />
      ) : null}
    </AppDrawer>
  );
}
