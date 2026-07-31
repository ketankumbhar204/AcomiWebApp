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
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { AppLayout } from '@/layouts/AppLayout';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { useCreateSpace } from '@/modules/onboarding/hooks/useCreateSpace';
import {
  normalizeAmenityAssignments,
  PRESET_AMENITY_CODES,
  presetAmenityLabelKey,
  supportsSpaceAmenities,
} from '@/modules/onboarding/utils/amenities';
import {
  PROPERTY_CATEGORY_VALUES,
  propertyCategoryLabelKey,
  supportsSpacePropertyCategory,
} from '@/modules/onboarding/utils/spacePropertyCategory';
import { ContentCard } from '@/shared/components/ContentCard';
import { FormSection } from '@/shared/components/FormSection';
import { InfoRow } from '@/shared/components/InfoRow';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { isAccommodationApplicable } from '@/shared/utils/spacePermissions';
import {
  ROUTES,
  spaceAccommodationPath,
  spaceDashboardPath,
} from '@/routes/paths';
import type { AmenityAssignment, GenderPolicy, SpaceType } from '@/shared/types/space';
import { useSpaceStore } from '@/store/spaceStore';

const SPACE_TYPES: SpaceType[] = ['PG', 'MESS', 'HOSTEL', 'CO_LIVING', 'RENTAL'];
const STEPS = ['basics', 'configuration', 'review'] as const;

function typeLabelKey(type: SpaceType): string {
  if (type === 'CO_LIVING') return 'spaces.types.coLiving.label';
  return `spaces.types.${type.toLowerCase()}.label`;
}

export function CreateSpacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const { createSpace, isSubmitting, error, clearError } = useCreateSpace();
  const loadMySpaces = useSpaceStore((state) => state.loadMySpaces);
  const switchSpace = useSpaceStore((state) => state.switchSpace);

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [type, setType] = useState<SpaceType | ''>('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [genderPolicy, setGenderPolicy] = useState<GenderPolicy | ''>('');
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());
  const [nameError, setNameError] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${t('navigation.createSpace')} · ${t('common.appName')}`;
  }, [t]);

  const showAmenities = supportsSpaceAmenities(type || null);
  const showCategory = supportsSpacePropertyCategory(type || null);

  const amenitiesPayload: AmenityAssignment[] = useMemo(() => {
    if (!showAmenities) return [];
    return normalizeAmenityAssignments(
      [...selectedAmenities].map((code) => ({
        code,
        label: t(presetAmenityLabelKey(code as (typeof PRESET_AMENITY_CODES)[number])),
      })),
    );
  }, [selectedAmenities, showAmenities, t]);

  const validateBasics = () => {
    let ok = true;
    if (!name.trim()) {
      setNameError(t('spaces.createSpace.nameRequired'));
      ok = false;
    } else {
      setNameError(null);
    }
    if (!type) {
      setTypeError(t('spaces.createSpace.typeRequired'));
      ok = false;
    } else {
      setTypeError(null);
    }
    return ok;
  };

  const handleNext = () => {
    clearError();
    if (stepIndex === 0 && !validateBasics()) return;
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleSave = async () => {
    if (!validateBasics() || !type) return;
    clearError();

    const space = await createSpace({
      name: name.trim(),
      type,
      address: address.trim() || undefined,
      contactNumber: contactNumber.trim() || undefined,
      amenities: showAmenities ? amenitiesPayload : undefined,
      genderPolicy: showCategory && genderPolicy ? genderPolicy : undefined,
    });

    if (!space?.id) return;

    try {
      await loadMySpaces();
    } catch {
      // ignore
    }
    await switchSpace(space.id);

    enqueueSnackbar(t('spaces.createSpace.successMessage', { name: space.name }), {
      variant: 'success',
    });

    if (isAccommodationApplicable(space.type)) {
      navigate(spaceAccommodationPath(space.id), { replace: true });
    } else {
      navigate(spaceDashboardPath(space.id), { replace: true });
    }
  };

  return (
    <AppLayout
      headerTitle={t('navigation.createSpace')}
      headerActions={
        <Button
          variant="outlined"
          onClick={() => navigate(ROUTES.onboarding)}
          sx={dashOutlinedButtonSx}
        >
          {t('common.cancel')}
        </Button>
      }
      contentDense
      contentMaxWidth={880}
    >
      <PageContainer gap={0}>
        <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
          <PageHeader
            title={t('spaces.createSpace.heading')}
            description={t('spaces.createSpace.subheading')}
          />

          <Stepper
            activeStep={stepIndex}
            alternativeLabel
            sx={{
              display: { xs: 'none', sm: 'flex' },
              '& .MuiStepLabel-label': {
                ...DASHBOARD_UX.body,
                color: s.textMuted,
                '&.Mui-active, &.Mui-completed': { color: s.textPrimary, fontWeight: 600 },
              },
              '& .MuiStepIcon-root': {
                color: s.border,
                '&.Mui-active, &.Mui-completed': { color: colors.primaryDark },
              },
            }}
          >
            <Step>
              <StepLabel>{t('spaces.createSpace.eyebrow')}</StepLabel>
            </Step>
            <Step>
              <StepLabel>{t('spaces.amenities.title')}</StepLabel>
            </Step>
            <Step>
              <StepLabel>{t('common.confirm')}</StepLabel>
            </Step>
          </Stepper>

          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted, display: { sm: 'none' } }}>
            {t('profileCompletion.wizard.stepProgress', {
              current: stepIndex + 1,
              total: STEPS.length,
              defaultValue: `Step ${stepIndex + 1} of ${STEPS.length}`,
            })}
          </Typography>

          {error ? (
            <Alert severity="error" onClose={clearError}>
              {error}
            </Alert>
          ) : null}

          <ContentCard>
            {stepIndex === 0 ? (
              <FormSection title={t('spaces.createSpace.eyebrow')}>
                <TextField
                  label={t('spaces.createSpace.nameLabel')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    type
                      ? t(`spaces.createSpace.namePlaceholderByType.${type}`, {
                          defaultValue: t('spaces.createSpace.namePlaceholder'),
                        })
                      : t('spaces.createSpace.namePlaceholder')
                  }
                  error={Boolean(nameError)}
                  helperText={nameError}
                  required
                  fullWidth
                  size="small"
                  sx={{ gridColumn: { md: '1 / -1' } }}
                />
                <FormControl fullWidth size="small" error={Boolean(typeError)} required>
                  <InputLabel id="space-type-label">{t('spaces.types.label')}</InputLabel>
                  <Select
                    labelId="space-type-label"
                    label={t('spaces.types.label')}
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value as SpaceType);
                      setSelectedAmenities(new Set());
                      setGenderPolicy('');
                    }}
                  >
                    {SPACE_TYPES.map((value) => (
                      <MenuItem key={value} value={value}>
                        {t(typeLabelKey(value))}
                      </MenuItem>
                    ))}
                  </Select>
                  {typeError ? <FormHelperText>{typeError}</FormHelperText> : null}
                </FormControl>
                <TextField
                  label={t('spaces.createSpace.contactLabel')}
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder={t('spaces.createSpace.contactPlaceholder')}
                  fullWidth
                  size="small"
                />
                <TextField
                  label={t('spaces.createSpace.addressLabel')}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('spaces.createSpace.addressPlaceholder')}
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  sx={{ gridColumn: { md: '1 / -1' } }}
                />
              </FormSection>
            ) : null}

            {stepIndex === 1 ? (
              <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
                {showCategory ? (
                  <FormSection title={t('spaces.propertyCategory.label')}>
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
                            label={t(propertyCategoryLabelKey(type as SpaceType, policy))}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormSection>
                ) : null}

                {showAmenities ? (
                  <FormSection
                    title={t('spaces.amenities.title')}
                    description={t('spaces.amenities.hint')}
                  >
                    <Box
                      sx={{
                        gridColumn: { md: '1 / -1' },
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
                          label={t(presetAmenityLabelKey(code))}
                        />
                      ))}
                    </Box>
                  </FormSection>
                ) : (
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                      ...DASHBOARD_UX.body,
                    }}
                  >
                    {t('spaces.createSpace.subheading')}
                  </Alert>
                )}
              </Stack>
            ) : null}

            {stepIndex === 2 ? (
              <FormSection title={t('common.confirm')}>
                <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                  <InfoRow label={t('spaces.details.name')} value={name.trim()} dense />
                  <InfoRow
                    label={t('spaces.details.type')}
                    value={type ? t(typeLabelKey(type)) : '—'}
                    dense
                  />
                  <InfoRow
                    label={t('spaces.details.address')}
                    value={address.trim() || t('spaces.details.notProvided')}
                    dense
                  />
                  <InfoRow
                    label={t('spaces.details.contact')}
                    value={contactNumber.trim() || t('spaces.details.notProvided')}
                    dense
                  />
                  {showCategory && genderPolicy ? (
                    <InfoRow
                      label={t('spaces.propertyCategory.label')}
                      value={t(propertyCategoryLabelKey(type as SpaceType, genderPolicy))}
                      dense
                    />
                  ) : null}
                  {showAmenities ? (
                    <InfoRow
                      label={t('spaces.amenities.title')}
                      value={
                        amenitiesPayload.length
                          ? amenitiesPayload.map((a) => a.label).join(', ')
                          : t('spaces.details.notProvided')
                      }
                      dense
                    />
                  ) : null}
                </Box>
              </FormSection>
            ) : null}
          </ContentCard>
        </Stack>
      </PageContainer>

      <StickyFooter>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', width: '100%' }}>
          {stepIndex > 0 ? (
            <Button
              variant="outlined"
              onClick={() => setStepIndex((i) => i - 1)}
              disabled={isSubmitting}
              sx={dashOutlinedButtonSx}
            >
              {t('common.back')}
            </Button>
          ) : null}
          {stepIndex < STEPS.length - 1 ? (
            <Button variant="contained" onClick={handleNext} sx={dashContainedButtonSx}>
              {t('common.continue')}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => void handleSave()}
              disabled={isSubmitting}
              sx={dashContainedButtonSx}
            >
              {isSubmitting ? t('common.pleaseWait') : t('spaces.createSpace.save')}
            </Button>
          )}
        </Stack>
      </StickyFooter>
    </AppLayout>
  );
}
