import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  Info,
  MapPin,
  Phone,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { mealBillingApi } from '@/modules/onboarding/api/mealBillingApi';
import { mealPollClosingApi } from '@/modules/onboarding/api/mealPollClosingApi';
import { spaceApi } from '@/modules/onboarding/api/spaceApi';
import {
  normalizeAmenityAssignments,
  PRESET_AMENITY_CODES,
  resolvePresetAmenityLabel,
  supportsSpaceAmenities,
} from '@/modules/onboarding/utils/amenities';
import { isSpaceOwner } from '@/modules/onboarding/utils/spaceOwnership';
import {
  PROPERTY_CATEGORY_VALUES,
  propertyCategoryLabelKey,
  supportsSpacePropertyCategory,
} from '@/modules/onboarding/utils/spacePropertyCategory';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ContentCard } from '@/shared/components/ContentCard';
import { FormSection } from '@/shared/components/FormSection';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StickyFooter, StickyFooterClearance } from '@/shared/components/StickyFooter';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { ROUTES, spaceDetailsPath } from '@/routes/paths';
import type {
  GenderPolicy,
  MealBillingSettings,
  MealPollClosingSettings,
  PollCloseDayOffset,
  SpaceDetailsResponse,
  SpaceType,
} from '@/shared/types/space';
import type { MealBillingType, PrepaidBalanceUnit } from '@/shared/types/dashboard';
import { useAuthStore } from '@/store/authStore';
import { useSpaceStore } from '@/store/spaceStore';

type EditTab = 'general' | 'meals' | 'polls';

function typeLabelKey(type: SpaceType): string {
  if (type === 'CO_LIVING') return 'spaces.types.coLiving.label';
  return `spaces.types.${type.toLowerCase()}.label`;
}

/** Mock field row: light-grey icon well + outlined floating-label control. */
function EditField({
  icon: Icon,
  children,
  fullWidth = false,
}: {
  icon: LucideIcon;
  children: ReactNode;
  fullWidth?: boolean;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.25,
        width: '100%',
        gridColumn: fullWidth ? { md: '1 / -1' } : undefined,
      }}
    >
      <Box
        sx={{
          mt: '10px',
          width: DASHBOARD_UX.iconWell,
          height: DASHBOARD_UX.iconWell,
          borderRadius: `${DASHBOARD_UX.iconWellRadius}px`,
          bgcolor: theme.palette.mode === 'dark' ? s.elevated : '#F1F5F9',
          color: s.textSecondary,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          '& svg': {
            width: DASHBOARD_UX.iconSize,
            height: DASHBOARD_UX.iconSize,
            strokeWidth: 1.75,
          },
        }}
        aria-hidden
      >
        <Icon />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

type EditSpaceFormProps = {
  spaceId: string;
  details: SpaceDetailsResponse;
  showMealsTab: boolean;
  showPollsTab: boolean;
  billing: MealBillingSettings | null;
  poll: MealPollClosingSettings | null;
};

function EditSpaceForm({
  spaceId,
  details,
  showMealsTab,
  showPollsTab,
  billing,
  poll,
}: EditSpaceFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const loadMySpaces = useSpaceStore((state) => state.loadMySpaces);
  const deactivateSpace = useSpaceStore((state) => state.deactivateSpace);
  const deactivating = useSpaceStore((state) => state.loading);

  const showAmenities = supportsSpaceAmenities(details.type);
  const showCategory = supportsSpacePropertyCategory(details.type);

  const [tab, setTab] = useState<EditTab>('general');
  const [name, setName] = useState(details.name);
  const [address, setAddress] = useState(details.address ?? '');
  const [contactNumber, setContactNumber] = useState(details.contactNumber ?? '');
  const [genderPolicy, setGenderPolicy] = useState<GenderPolicy | ''>(
    details.genderPolicy ?? '',
  );
  const [selectedAmenities, setSelectedAmenities] = useState(
    () => new Set((details.amenities ?? []).map((a) => a.code).filter(Boolean)),
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const [billingType, setBillingType] = useState<MealBillingType>(
    billing?.billingType ?? details.mealBillingType ?? 'PAY_PER_MEAL',
  );
  const [prepaidUnit, setPrepaidUnit] = useState<PrepaidBalanceUnit | ''>(
    billing?.prepaidBalanceUnit ?? details.prepaidBalanceUnit ?? 'MEALS',
  );
  const [fallback, setFallback] = useState(
    billing?.fallbackToPayPerMeal ?? details.prepaidFallbackToPayPerMeal ?? true,
  );

  const [timezone, setTimezone] = useState(poll?.timezone ?? 'Asia/Kolkata');
  const [breakfastOffset, setBreakfastOffset] = useState<PollCloseDayOffset>(
    poll?.breakfastDayOffset ?? 'PREVIOUS_DAY',
  );
  const [breakfastTime, setBreakfastTime] = useState(poll?.breakfastTime ?? '22:00');
  const [lunchOffset, setLunchOffset] = useState<PollCloseDayOffset>(
    poll?.lunchDayOffset ?? 'SAME_DAY',
  );
  const [lunchTime, setLunchTime] = useState(poll?.lunchTime ?? '10:00');
  const [dinnerOffset, setDinnerOffset] = useState<PollCloseDayOffset>(
    poll?.dinnerDayOffset ?? 'SAME_DAY',
  );
  const [dinnerTime, setDinnerTime] = useState(poll?.dinnerTime ?? '16:00');

  const visibleTab: EditTab =
    (tab === 'meals' && !showMealsTab) || (tab === 'polls' && !showPollsTab)
      ? 'general'
      : tab;

  const amenitiesPayload = useMemo(() => {
    if (!showAmenities) return undefined;
    return normalizeAmenityAssignments(
      [...selectedAmenities].map((code) => ({
        code,
        label: resolvePresetAmenityLabel(code as (typeof PRESET_AMENITY_CODES)[number], t),
      })),
    );
  }, [selectedAmenities, showAmenities, t]);

  const fieldSx = {
    width: '100%',
    '& .MuiOutlinedInput-root': {
      borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
      bgcolor: s.surface,
      '& fieldset': { borderColor: s.border },
      '&:hover fieldset': { borderColor: s.border },
      '&.Mui-focused fieldset': { borderColor: colors.primaryDark },
      '&.Mui-disabled': { bgcolor: s.elevated },
    },
    '& .MuiInputLabel-root': {
      ...DASHBOARD_UX.metricLabel,
      color: s.textMuted,
      '&.Mui-focused': { color: colors.primaryDark },
    },
    '& .MuiInputBase-input': {
      ...DASHBOARD_UX.inputText,
      color: s.textPrimary,
      py: 1.15,
    },
  } as const;

  const primaryOutlinedSx = {
    ...dashOutlinedButtonSx,
    color: colors.primaryDark,
    borderColor: colors.primaryDark,
    '&:hover': {
      borderColor: colors.primaryDark,
      bgcolor: `${colors.primaryDark}0F`,
    },
  } as const;

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError(t('spaces.editSpace.nameRequired'));
      setTab('general');
      return;
    }
    setNameError(null);
    setFormError(null);
    setSaving(true);

    try {
      await spaceApi.updateSpace(spaceId, {
        name: name.trim(),
        address: address.trim() || undefined,
        contactNumber: contactNumber.trim() || undefined,
        genderPolicy: showCategory ? genderPolicy || null : undefined,
        amenities: amenitiesPayload,
      });

      if (showMealsTab) {
        await mealBillingApi.updateSettings(spaceId, {
          billingType,
          prepaidBalanceUnit:
            billingType === 'PREPAID_BALANCE' ? prepaidUnit || 'MEALS' : null,
          fallbackToPayPerMeal: billingType === 'PREPAID_BALANCE' ? fallback : undefined,
        });
      }

      if (showPollsTab) {
        await mealPollClosingApi.updateSettings(spaceId, {
          timezone,
          breakfastDayOffset: breakfastOffset,
          breakfastTime,
          lunchDayOffset: lunchOffset,
          lunchTime,
          dinnerDayOffset: dinnerOffset,
          dinnerTime,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['space-details', spaceId] });
      await loadMySpaces();
      enqueueSnackbar(t('spaces.editSpace.successMessage'), { variant: 'success' });
      navigate(spaceDetailsPath(spaceId));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('spaces.errors.update'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%', maxWidth: 1100 }}>
        <PageHeader
          title={t('spaces.editSpace.heading')}
          description={t('spaces.editSpace.subheading')}
          actions={
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate(spaceDetailsPath(spaceId))}
              sx={primaryOutlinedSx}
            >
              {t('common.cancel')}
            </Button>
          }
        />

        {formError ? (
          <Alert severity="error" onClose={() => setFormError(null)}>
            {formError}
          </Alert>
        ) : null}

        <Tabs
          value={visibleTab}
          onChange={(_, value: EditTab) => setTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{
            minHeight: 40,
            borderBottom: `1px solid ${s.border}`,
            '& .MuiTab-root': {
              minHeight: 40,
              py: 0.75,
              px: 1.75,
              textTransform: 'none',
              ...DASHBOARD_UX.button,
              color: s.textMuted,
              '&.Mui-selected': { color: colors.primaryDark },
            },
            '& .MuiTabs-indicator': {
              bgcolor: colors.primaryDark,
              height: 2.5,
              borderRadius: 2,
            },
          }}
        >
          <Tab value="general" label={t('progressiveWorkflow.editSpace.tabGeneral')} />
          {showMealsTab ? (
            <Tab value="meals" label={t('progressiveWorkflow.editSpace.tabMeals')} />
          ) : null}
          {showPollsTab ? (
            <Tab value="polls" label={t('progressiveWorkflow.editSpace.tabPolls')} />
          ) : null}
        </Tabs>

        {visibleTab === 'general' ? (
          <>
            <ContentCard>
              <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mb: 2 }}>
                {t('spaces.editSpace.generalInformation')}
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gap: `${DASHBOARD_UX.sectionGap}px`,
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                }}
              >
                <EditField icon={Building2} fullWidth>
                  <TextField
                    label={`${t('spaces.createSpace.nameLabel')} *`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t(`spaces.createSpace.namePlaceholderByType.${details.type}`, {
                      defaultValue: t('spaces.createSpace.namePlaceholder'),
                    })}
                    error={Boolean(nameError)}
                    helperText={nameError}
                    required
                    fullWidth
                    size="small"
                    sx={fieldSx}
                  />
                </EditField>

                <EditField icon={Building2}>
                  <TextField
                    label={t('spaces.editSpace.typeLabel')}
                    value={t(typeLabelKey(details.type))}
                    disabled
                    fullWidth
                    size="small"
                    sx={fieldSx}
                  />
                </EditField>

                <EditField icon={Phone}>
                  <TextField
                    label={t('spaces.createSpace.contactLabel')}
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder={t('spaces.createSpace.contactPlaceholder')}
                    fullWidth
                    size="small"
                    sx={fieldSx}
                  />
                </EditField>

                <EditField icon={MapPin} fullWidth>
                  <TextField
                    label={t('spaces.createSpace.addressLabel')}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t('spaces.createSpace.addressPlaceholder')}
                    fullWidth
                    size="small"
                    multiline
                    minRows={3}
                    sx={fieldSx}
                  />
                </EditField>

                {showCategory ? (
                  <FormControl sx={{ gridColumn: { md: '1 / -1' } }}>
                    <FormLabel sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted, mb: 0.5 }}>
                      {t('spaces.propertyCategory.label')}
                    </FormLabel>
                    <RadioGroup
                      row
                      value={genderPolicy}
                      onChange={(e) => setGenderPolicy(e.target.value as GenderPolicy)}
                    >
                      {PROPERTY_CATEGORY_VALUES.map((policy) => (
                        <FormControlLabel
                          key={policy}
                          value={policy}
                          control={<Radio size="small" />}
                          label={t(propertyCategoryLabelKey(details.type, policy))}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                ) : null}

                {showAmenities ? (
                  <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                    <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted, mb: 0.75 }}>
                      {t('spaces.amenities.title')}
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        gap: 0.5,
                      }}
                    >
                      {PRESET_AMENITY_CODES.map((code) => (
                        <FormControlLabel
                          key={code}
                          control={
                            <Checkbox
                              size="small"
                              checked={selectedAmenities.has(code)}
                              onChange={(e) => {
                                setSelectedAmenities((prev) => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(code);
                                  else next.delete(code);
                                  return next;
                                });
                              }}
                            />
                          }
                          label={resolvePresetAmenityLabel(code, t)}
                        />
                      ))}
                    </Box>
                  </Box>
                ) : null}
              </Box>

              <Alert
                severity="info"
                icon={<Info size={16} color="#2563EB" />}
                sx={{
                  mt: 2.5,
                  borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                  border: '1px solid #BFDBFE',
                  bgcolor: theme.palette.mode === 'dark' ? s.elevated : '#EFF6FF',
                  color: s.textPrimary,
                  ...DASHBOARD_UX.body,
                  alignItems: 'center',
                  py: 1,
                  '& .MuiAlert-icon': { color: '#2563EB', py: 0, mr: 1 },
                  '& .MuiAlert-message': { ...DASHBOARD_UX.body, color: s.textSecondary, py: 0.25 },
                }}
              >
                {t('spaces.editSpace.typeOwnerLocked')}
              </Alert>
            </ContentCard>

            <ContentCard>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'stretch', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, minWidth: 0 }}>
                  <IconBadge accent={colors.danger}>
                    <AlertTriangle />
                  </IconBadge>
                  <Box>
                    <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                      {t('spaces.details.deactivateTitle')}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.35 }}>
                      {t('spaces.editSpace.deactivateMessage')}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<Trash2 size={14} />}
                  onClick={() => setDeactivateOpen(true)}
                  aria-label={t('spaces.details.deactivate')}
                  sx={{
                    ...dashOutlinedButtonSx,
                    minHeight: 40,
                    height: 40,
                    color: colors.danger,
                    borderColor: colors.danger,
                    flexShrink: 0,
                    alignSelf: { xs: 'stretch', sm: 'center' },
                    '&:hover': {
                      borderColor: colors.danger,
                      bgcolor: `${colors.danger}0F`,
                    },
                  }}
                >
                  {t('spaces.details.deactivate')}
                </Button>
              </Box>
            </ContentCard>
          </>
        ) : null}

        {visibleTab === 'meals' ? (
          <ContentCard>
            <FormSection
              title={t('spaces.mealBilling.title')}
              description={t('spaces.mealBilling.subtitle')}
            >
              <FormControl sx={{ gridColumn: { md: '1 / -1' } }}>
                <RadioGroup
                  value={billingType}
                  onChange={(e) => setBillingType(e.target.value as MealBillingType)}
                >
                  <FormControlLabel
                    value="PAY_PER_MEAL"
                    control={<Radio size="small" />}
                    label={t('spaces.mealBilling.types.PAY_PER_MEAL.label')}
                  />
                  <FormHelperText sx={{ ml: 4, mt: 0, ...DASHBOARD_UX.body }}>
                    {t('spaces.mealBilling.types.PAY_PER_MEAL.description')}
                  </FormHelperText>
                  <FormControlLabel
                    value="PREPAID_BALANCE"
                    control={<Radio size="small" />}
                    label={t('spaces.mealBilling.types.PREPAID_BALANCE.label')}
                  />
                  <FormHelperText sx={{ ml: 4, mt: 0, ...DASHBOARD_UX.body }}>
                    {t('spaces.mealBilling.types.PREPAID_BALANCE.description')}
                  </FormHelperText>
                </RadioGroup>
              </FormControl>

              {billingType === 'PREPAID_BALANCE' ? (
                <>
                  <FormControl fullWidth size="small" sx={{ gridColumn: { md: '1 / -1' } }}>
                    <InputLabel id="prepaid-unit">
                      {t('spaces.mealBilling.balanceUnitLabel')}
                    </InputLabel>
                    <Select
                      labelId="prepaid-unit"
                      label={t('spaces.mealBilling.balanceUnitLabel')}
                      value={prepaidUnit}
                      onChange={(e) => setPrepaidUnit(e.target.value as PrepaidBalanceUnit)}
                    >
                      <MenuItem value="MEALS">{t('spaces.mealBilling.units.MEALS')}</MenuItem>
                      <MenuItem value="CURRENCY">
                        {t('spaces.mealBilling.units.CURRENCY')}
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    sx={{ gridColumn: { md: '1 / -1' } }}
                    control={
                      <Checkbox
                        size="small"
                        checked={fallback}
                        onChange={(e) => setFallback(e.target.checked)}
                      />
                    }
                    label={t('spaces.mealBilling.fallbackLabel')}
                  />
                  <FormHelperText sx={{ gridColumn: { md: '1 / -1' }, mt: 0, ...DASHBOARD_UX.body }}>
                    {t('spaces.mealBilling.fallbackHint')}
                  </FormHelperText>
                </>
              ) : null}
            </FormSection>
          </ContentCard>
        ) : null}

        {visibleTab === 'polls' ? (
          <ContentCard>
            <FormSection description={t('meals.pollClosing.subtitle')}>
              <TextField
                label={t('meals.pollClosing.timezone')}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder={t('meals.pollClosing.timezonePlaceholder')}
                fullWidth
                size="small"
                sx={{ gridColumn: { md: '1 / -1' }, ...fieldSx }}
              />
              {(
                [
                  [
                    'breakfast',
                    breakfastOffset,
                    setBreakfastOffset,
                    breakfastTime,
                    setBreakfastTime,
                  ],
                  ['lunch', lunchOffset, setLunchOffset, lunchTime, setLunchTime],
                  ['dinner', dinnerOffset, setDinnerOffset, dinnerTime, setDinnerTime],
                ] as const
              ).map(([slot, offset, setOffset, time, setTime]) => (
                <Box
                  key={slot}
                  sx={{
                    gridColumn: { md: '1 / -1' },
                    display: 'grid',
                    gap: `${DASHBOARD_UX.cardGap}px`,
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  }}
                >
                  <Typography
                    sx={{
                      gridColumn: '1 / -1',
                      ...DASHBOARD_UX.metricLabel,
                      color: s.textPrimary,
                    }}
                  >
                    {t(`meals.slots.${slot}`, { defaultValue: slot })}
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel id={`${slot}-offset`}>
                      {t('meals.pollClosing.dayOffset')}
                    </InputLabel>
                    <Select
                      labelId={`${slot}-offset`}
                      label={t('meals.pollClosing.dayOffset')}
                      value={offset}
                      onChange={(e) => setOffset(e.target.value as PollCloseDayOffset)}
                    >
                      <MenuItem value="PREVIOUS_DAY">
                        {t('meals.pollClosing.offsets.PREVIOUS_DAY')}
                      </MenuItem>
                      <MenuItem value="SAME_DAY">
                        {t('meals.pollClosing.offsets.SAME_DAY')}
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label={t('meals.pollClosing.time')}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder={t('meals.pollClosing.timePlaceholder')}
                    fullWidth
                    size="small"
                    sx={fieldSx}
                  />
                </Box>
              ))}
            </FormSection>
          </ContentCard>
        ) : null}
      </Stack>

      <StickyFooterClearance height={{ xs: 88, md: 80 }} />

      <StickyFooter pin="fixed">
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate(ROUTES.mySpaces)}
            disabled={saving || deactivating}
            sx={{ ...primaryOutlinedSx, minHeight: 40, height: 40 }}
          >
            {t('navigation.mySpaces')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => void handleSave()}
            disabled={saving || deactivating}
            sx={{
              ...dashContainedButtonSx,
              bgcolor: colors.primaryDark,
              '&:hover': { bgcolor: colors.primaryHover },
            }}
          >
            {saving ? t('common.pleaseWait') : t('spaces.editSpace.save')}
          </Button>
        </StickyFooter>

      <ConfirmDialog
        open={deactivateOpen}
        title={t('spaces.details.deactivateTitle')}
        description={t('spaces.editSpace.deactivateMessage')}
        confirmLabel={t('spaces.details.deactivateConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        confirming={deactivating}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={() => {
          void deactivateSpace(spaceId).then((ok) => {
            setDeactivateOpen(false);
            if (ok) {
              enqueueSnackbar(t('spaces.details.deactivateSuccess'), { variant: 'success' });
              navigate(ROUTES.mySpaces);
            } else {
              enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
            }
          });
        }}
      />
    </PageContainer>
  );
}

export function EditSpacePage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const userId = useAuthStore((state) => state.userId);
  const mySpace = useSpaceStore((state) =>
    state.mySpaces.find((space) => space.spaceId === spaceId),
  );

  const detailsQuery = useQuery({
    queryKey: ['space-details', spaceId],
    queryFn: () => spaceApi.getSpaceById(spaceId),
    enabled: Boolean(spaceId),
  });

  const details = detailsQuery.data;
  const owner = isSpaceOwner(
    {
      ownerId: details?.ownerId ?? mySpace?.ownerId,
      membershipRole: mySpace?.membershipRole,
    },
    userId,
  );
  const showMealsTab = Boolean(owner && details?.type === 'MESS');
  const showPollsTab = Boolean(owner);

  const billingQuery = useQuery({
    queryKey: ['meal-billing-settings', spaceId],
    queryFn: () => mealBillingApi.getSettings(spaceId),
    enabled: Boolean(spaceId) && showMealsTab,
  });

  const pollQuery = useQuery({
    queryKey: ['meal-poll-closing-settings', spaceId],
    queryFn: () => mealPollClosingApi.getSettings(spaceId),
    enabled: Boolean(spaceId) && showPollsTab,
  });

  useEffect(() => {
    document.title = `${t('navigation.editSpace')} · ${t('common.appName')}`;
  }, [t]);

  if (detailsQuery.isLoading) {
    return <LoadingFallback />;
  }

  if (!details) {
    return (
      <PageContainer gap={0}>
        <Alert severity="error">{t('spaces.errors.loadDetails')}</Alert>
      </PageContainer>
    );
  }

  if (!owner) {
    return <Navigate to={spaceDetailsPath(spaceId)} replace />;
  }

  if ((showMealsTab && billingQuery.isLoading) || (showPollsTab && pollQuery.isLoading)) {
    return <LoadingFallback />;
  }

  return (
    <EditSpaceForm
      key={`${details.id}-${details.updatedAt}-${billingQuery.dataUpdatedAt}-${pollQuery.dataUpdatedAt}`}
      spaceId={spaceId}
      details={details}
      showMealsTab={showMealsTab}
      showPollsTab={showPollsTab}
      billing={billingQuery.data ?? null}
      poll={pollQuery.data ?? null}
    />
  );
}
