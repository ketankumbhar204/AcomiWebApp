import {
  Alert,
  Box,
  Button,
  InputAdornment,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { ArrowRight, Building2, Info, MapPin, Pencil, Phone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { OnboardingLayout } from '@/layouts/OnboardingLayout';
import { AUTH_UX, authContainedButtonSx, authSurfaces } from '@/modules/auth/theme/authUx';
import { CreateSpaceAmenityGrid } from '@/modules/onboarding/components/createSpace/CreateSpaceAmenityGrid';
import { CreateSpaceLeftPanel } from '@/modules/onboarding/components/createSpace/CreateSpaceLeftPanel';
import { CreateSpaceStepper } from '@/modules/onboarding/components/createSpace/CreateSpaceStepper';
import { CreateSpaceTypeCards } from '@/modules/onboarding/components/createSpace/CreateSpaceTypeCards';
import {
  createSpaceSteps,
  spaceTypeDescriptionKey,
  spaceTypeLabelKey,
  type CreateSpaceStepId,
} from '@/modules/onboarding/components/createSpace/createSpaceVisuals';
import { useCreateSpace } from '@/modules/onboarding/hooks/useCreateSpace';
import {
  buildAllPresetAmenities,
  normalizeAmenityAssignments,
  resolvePresetAmenityLabel,
  supportsSpaceAmenities,
  type AmenityCode,
} from '@/modules/onboarding/utils/amenities';
import {
  PROPERTY_CATEGORY_VALUES,
  propertyCategoryLabelKey,
  supportsSpacePropertyCategory,
} from '@/modules/onboarding/utils/spacePropertyCategory';
import { resolveDefaultSpaceContact } from '@/modules/onboarding/utils/defaultSpaceContact';
import { ROUTES, spaceAccommodationPath, spaceDashboardPath } from '@/routes/paths';
import type { AmenityAssignment, GenderPolicy, SpaceType } from '@/shared/types/space';
import { isAccommodationApplicable } from '@/shared/utils/spacePermissions';
import { useAuthStore } from '@/store/authStore';
import { useSpaceStore } from '@/store/spaceStore';

export function CreateSpacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const { createSpace, isSubmitting, error, clearError } = useCreateSpace();
  const loadMySpaces = useSpaceStore((state) => state.loadMySpaces);
  const switchSpace = useSpaceStore((state) => state.switchSpace);
  const userMobile = useAuthStore((state) => state.user?.mobileNumber);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [step, setStep] = useState<CreateSpaceStepId>('type');
  const [name, setName] = useState('');
  const [type, setType] = useState<SpaceType | ''>('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState(() =>
    resolveDefaultSpaceContact({ userMobile, accessToken }),
  );
  const [genderPolicy, setGenderPolicy] = useState<GenderPolicy | ''>('');
  const [amenities, setAmenities] = useState<AmenityAssignment[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${t('navigation.createSpace')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    const next = resolveDefaultSpaceContact({ userMobile, accessToken });
    if (!next) {
      return;
    }
    setContactNumber((current) => (current.trim() ? current : next));
  }, [accessToken, userMobile]);

  const includeAmenities = supportsSpaceAmenities(type || null);
  const includeCategory = supportsSpacePropertyCategory(type || null);
  const steps = useMemo(() => createSpaceSteps(includeAmenities), [includeAmenities]);
  const stepIndex = Math.max(0, steps.indexOf(step));

  useEffect(() => {
    if (!steps.includes(step)) {
      setStep('details');
    }
  }, [step, steps]);

  function handleTypeChange(nextType: SpaceType) {
    setType(nextType);
    setTypeError(null);
    if (!supportsSpacePropertyCategory(nextType)) {
      setGenderPolicy('');
    }
    if (!supportsSpaceAmenities(nextType)) {
      setAmenities([]);
    } else if (amenities.length === 0) {
      setAmenities(buildAllPresetAmenities((code) => resolvePresetAmenityLabel(code, t)));
    }
  }

  function validateType() {
    if (!type) {
      setTypeError(t('spaces.createSpace.typeRequired'));
      return false;
    }
    setTypeError(null);
    return true;
  }

  function validateDetails() {
    if (!name.trim()) {
      setNameError(t('spaces.createSpace.nameRequired'));
      return false;
    }
    setNameError(null);
    return true;
  }

  function goTo(next: CreateSpaceStepId) {
    const targetIndex = steps.indexOf(next);
    if (targetIndex < 0 || targetIndex > stepIndex) return;
    setStep(next);
  }

  function handleBack() {
    clearError();
    const prev = steps[stepIndex - 1];
    if (prev) setStep(prev);
  }

  function handleContinue() {
    clearError();
    if (step === 'type' && !validateType()) return;
    if (step === 'details' && !validateDetails()) return;
    const next = steps[stepIndex + 1];
    if (next) setStep(next);
  }

  async function handleSave() {
    if (!validateType() || !validateDetails() || !type) return;
    clearError();

    const space = await createSpace({
      name: name.trim(),
      type,
      address: address.trim() || undefined,
      contactNumber: contactNumber.trim() || undefined,
      amenities: includeAmenities ? normalizeAmenityAssignments(amenities) : undefined,
      genderPolicy: includeCategory && genderPolicy ? genderPolicy : undefined,
    });

    if (!space?.id) return;

    try {
      await loadMySpaces();
    } catch {
      // Created space id is enough to enter the app.
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
  }

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '14px',
      minHeight: 48,
      bgcolor: a.surface,
    },
  } as const;

  const primaryButtonSx = {
    ...authContainedButtonSx(a.cta, a.ctaHover),
    minWidth: { xs: '100%', sm: 168 },
    px: 2.5,
    borderRadius: '14px',
  };

  const secondaryButtonSx = {
    ...AUTH_UX.button,
    minHeight: 48,
    height: 48,
    minWidth: { xs: '100%', sm: 120 },
    px: 2.25,
    borderRadius: '14px',
    color: a.textSecondary,
    borderColor: a.border,
    bgcolor: a.surface,
    boxShadow: 'none',
    '&:hover': {
      borderColor: a.brand,
      bgcolor: a.brandSoft,
      boxShadow: 'none',
    },
  };

  return (
    <OnboardingLayout
      pageTitle={t('navigation.createSpace')}
      onCancel={() => navigate(ROUTES.onboarding)}
      cancelLabel={t('common.cancel')}
      showLogout={false}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 1480,
          mx: 'auto',
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 240px) minmax(0, 1fr)' },
          gap: { xs: 2, md: 3 },
          alignItems: 'stretch',
        }}
      >
        <CreateSpaceLeftPanel />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: { md: 'calc(100dvh - 120px)' },
            bgcolor: a.surface,
            border: `1px solid ${a.border}`,
            borderRadius: '20px',
            boxShadow: a.shadow,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.25, pb: 1.5, borderBottom: `1px solid ${a.border}` }}>
            <CreateSpaceStepper steps={steps} current={step} onStepClick={goTo} />
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: { xs: 2, md: 3 }, py: 2.25 }}>
            {error ? (
              <Alert severity="error" onClose={clearError} sx={{ mb: 2, borderRadius: '12px' }}>
                {error}
              </Alert>
            ) : null}

            {step === 'type' ? (
              <Box>
                <StepHeading
                  title={t('spaces.createSpace.wizard.chooseTypeTitle', {
                    defaultValue: 'Choose your space type',
                  })}
                  subtitle={t('spaces.createSpace.wizard.chooseTypeSubtitle', {
                    defaultValue: 'Select the type of space you want to create.',
                  })}
                />
                <CreateSpaceTypeCards value={type} onChange={handleTypeChange} error={typeError} />
              </Box>
            ) : null}

            {step === 'details' ? (
              <Box>
                <StepHeading
                  title={t('spaces.createSpace.wizard.detailsTitle', { defaultValue: 'Space details' })}
                  subtitle={t('spaces.createSpace.wizard.detailsSubtitle', {
                    defaultValue: 'Add a name and optional contact details.',
                  })}
                />
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 1.5,
                  }}
                >
                  <TextField
                    label={t('spaces.createSpace.nameLabel')}
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (nameError) setNameError(null);
                    }}
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
                    sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Building2 size={18} color={a.brand} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    label={t('spaces.createSpace.contactLabel')}
                    value={contactNumber}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, '');
                      const local =
                        digits.startsWith('91') && digits.length >= 11
                          ? digits.slice(-10)
                          : digits.slice(0, 10);
                      setContactNumber(local);
                    }}
                    placeholder={t('spaces.createSpace.contactPlaceholder')}
                    fullWidth
                    sx={fieldSx}
                    slotProps={{
                      htmlInput: { maxLength: 10, inputMode: 'numeric' },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start" sx={{ gap: 0.75 }}>
                            <Phone size={18} color={a.brand} />
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: a.textPrimary }}>
                              +91
                            </Typography>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    label={t('spaces.createSpace.addressLabel')}
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder={t('spaces.createSpace.addressPlaceholder')}
                    fullWidth
                    sx={fieldSx}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <MapPin size={18} color={a.brand} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>

                {includeCategory && type ? (
                  <Box sx={{ mt: 2.25 }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: a.textMuted, mb: 1 }}>
                      {t('spaces.propertyCategory.label')}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {PROPERTY_CATEGORY_VALUES.map((policy) => {
                        const selected = genderPolicy === policy;
                        return (
                          <Box
                            key={policy}
                            component="button"
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setGenderPolicy(policy)}
                            sx={{
                              px: 1.5,
                              py: 1,
                              borderRadius: '999px',
                              border: `1.5px solid ${selected ? a.cta : a.border}`,
                              bgcolor: selected ? a.brandSoft : a.surface,
                              color: selected ? a.cta : a.textPrimary,
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              '&:focus-visible': {
                                outline: `2px solid ${a.brand}`,
                                outlineOffset: 2,
                              },
                            }}
                          >
                            {t(propertyCategoryLabelKey(type, policy))}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                ) : null}
              </Box>
            ) : null}

            {step === 'amenities' ? (
              <Box>
                <StepHeading title={t('spaces.amenities.title')} subtitle={t('spaces.amenities.hint')} />
                <CreateSpaceAmenityGrid value={amenities} onChange={setAmenities} disabled={isSubmitting} />
              </Box>
            ) : null}

            {step === 'confirm' ? (
              <Box>
                <StepHeading
                  title={t('spaces.createSpace.wizard.confirmTitle', { defaultValue: 'Confirm space' })}
                  subtitle={t('spaces.createSpace.wizard.confirmSubtitle', {
                    defaultValue: 'Review the details before creating your space.',
                  })}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  <SummaryCard
                    title={t('spaces.details.name')}
                    value={name.trim()}
                    extra={
                      type
                        ? `${t(spaceTypeLabelKey(type))} · ${t(spaceTypeDescriptionKey(type))}${
                            includeCategory && genderPolicy
                              ? ` · ${t(propertyCategoryLabelKey(type, genderPolicy))}`
                              : ''
                          }`
                        : undefined
                    }
                    onEdit={() => setStep('details')}
                  />
                  <SummaryCard
                    title={t('spaces.details.address')}
                    value={address.trim() || t('spaces.details.notProvided')}
                    onEdit={() => setStep('details')}
                  />
                  <SummaryCard
                    title={t('spaces.details.contact')}
                    value={
                      contactNumber.trim()
                        ? `+91 ${contactNumber.trim()}`
                        : t('spaces.details.notProvided')
                    }
                    onEdit={() => setStep('details')}
                  />
                  {includeAmenities ? (
                    <SummaryCard
                      title={t('spaces.amenities.title')}
                      value={
                        amenities.length
                          ? amenities
                              .map((item) =>
                                item.code === 'CUSTOM'
                                  ? item.label
                                  : resolvePresetAmenityLabel(item.code as Exclude<AmenityCode, 'CUSTOM'>, t),
                              )
                              .join(', ')
                          : t('spaces.details.notProvided')
                      }
                      onEdit={() => setStep('amenities')}
                    />
                  ) : null}
                </Box>
              </Box>
            ) : null}

            <Box
              sx={{
                mt: 2.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                px: 1.5,
                py: 1.15,
                borderRadius: '14px',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.16)' : '#EFF6FF',
                border: '1px solid rgba(37, 99, 235, 0.16)',
              }}
            >
              <Info size={16} color="#2563EB" style={{ marginTop: 2, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: a.textSecondary, lineHeight: 1.45 }}>
                {t('spaces.createSpace.wizard.updateLater', {
                  defaultValue: 'You can update these details anytime later from space settings.',
                })}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              justifyContent: 'flex-end',
              gap: 1,
              px: { xs: 2, md: 3 },
              py: 1.5,
              borderTop: `1px solid ${a.border}`,
              bgcolor: theme.palette.mode === 'dark' ? a.elevated : '#F8FBFA',
            }}
          >
            {stepIndex > 0 ? (
              <Button variant="outlined" onClick={handleBack} disabled={isSubmitting} sx={secondaryButtonSx}>
                {t('common.back')}
              </Button>
            ) : null}
            {step !== 'confirm' ? (
              <Button variant="contained" onClick={handleContinue} endIcon={<ArrowRight size={16} />} sx={primaryButtonSx}>
                {t('common.continue')}
              </Button>
            ) : (
              <Button variant="contained" onClick={() => void handleSave()} disabled={isSubmitting} sx={primaryButtonSx}>
                {isSubmitting
                  ? t('common.pleaseWait')
                  : t('spaces.createSpace.wizard.create', { defaultValue: t('navigation.createSpace') })}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </OnboardingLayout>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        sx={{
          fontSize: { xs: '1.2rem', md: '1.35rem' },
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: a.textPrimary,
        }}
      >
        {title}
      </Typography>
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: a.textMuted, mt: 0.4 }}>
        {subtitle}
      </Typography>
    </Box>
  );
}

function SummaryCard({
  title,
  value,
  extra,
  onEdit,
}: {
  title: string;
  value: string;
  extra?: string;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 1.5,
        p: 1.5,
        borderRadius: '16px',
        border: `1px solid ${a.border}`,
        bgcolor: theme.palette.mode === 'dark' ? a.elevated : '#F8FBFA',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: a.textMuted,
          }}
        >
          {title}
        </Typography>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: a.textPrimary, mt: 0.35 }}>
          {value}
        </Typography>
        {extra ? (
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: a.textMuted, mt: 0.25 }}>
            {extra}
          </Typography>
        ) : null}
      </Box>
      <Button
        onClick={onEdit}
        startIcon={<Pencil size={14} />}
        sx={{
          ...AUTH_UX.button,
          minHeight: 34,
          height: 34,
          px: 1.25,
          borderRadius: '10px',
          color: a.brand,
        }}
      >
        {t('common.edit')}
      </Button>
    </Box>
  );
}
