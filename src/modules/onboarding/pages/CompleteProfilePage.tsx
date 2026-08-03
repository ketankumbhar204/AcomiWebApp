import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { AppLayout } from '@/layouts/AppLayout';
import { useLogout } from '@/modules/auth/hooks/useLogout';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { useCompleteProfile } from '@/modules/onboarding/hooks/useCompleteProfile';
import {
  isGenericUserName,
  profileCompletionPercentage,
} from '@/modules/onboarding/utils/profileCompletion';
import { ContentCard } from '@/shared/components/ContentCard';
import { FormSection } from '@/shared/components/FormSection';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { ROUTES, spaceDashboardPath } from '@/routes/paths';
import type { MemberGender } from '@/shared/types/auth';
import { useAuthStore } from '@/store/authStore';
import { useSpaceStore } from '@/store/spaceStore';

const STEPS = ['personal', 'address', 'emergency', 'documents'] as const;
const GENDERS: MemberGender[] = ['MALE', 'FEMALE', 'OTHER'];

export function CompleteProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isEditMode = params.get('mode') === 'edit';
  const logout = useLogout();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((state) => state.user);
  const selectedSpaceId = useSpaceStore((state) => state.selectedSpaceId);
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const { completeProfile, isSubmitting, error, clearError } = useCompleteProfile();

  const [stepIndex, setStepIndex] = useState(0);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [gender, setGender] = useState<MemberGender | ''>(user?.gender ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.profilePhotoUrl ?? '');
  const [permanentAddress, setPermanentAddress] = useState(user?.permanentAddress ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [stateName, setStateName] = useState(user?.state ?? '');
  const [pincode, setPincode] = useState(user?.pincode ?? '');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactMobile, setEmergencyContactMobile] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [identityDocumentType, setIdentityDocumentType] = useState('');
  const [identityDocumentNumber, setIdentityDocumentNumber] = useState('');
  const [addressProofFileUrl, setAddressProofFileUrl] = useState('');
  const [identityProofFileUrl, setIdentityProofFileUrl] = useState('');
  const [additionalDocumentFileUrl, setAdditionalDocumentFileUrl] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${t('profileCompletion.wizard.title')} · ${t('common.appName')}`;
  }, [t]);

  const progress = useMemo(() => profileCompletionPercentage(user), [user]);

  const validateStep = () => {
    const step = STEPS[stepIndex];
    if (step === 'personal') {
      if (isGenericUserName(fullName) || !fullName.trim()) {
        setFieldError(t('profileCompletion.errors.fullNameRequired'));
        return false;
      }
    }
    if (step === 'address') {
      if (!permanentAddress.trim()) {
        setFieldError(t('profileCompletion.errors.addressRequired'));
        return false;
      }
      if (!city.trim()) {
        setFieldError(t('profileCompletion.errors.cityRequired'));
        return false;
      }
      if (!stateName.trim()) {
        setFieldError(t('profileCompletion.errors.stateRequired'));
        return false;
      }
      if (!pincode.trim()) {
        setFieldError(t('profileCompletion.errors.pincodeRequired'));
        return false;
      }
    }
    setFieldError(null);
    return true;
  };

  const handleNext = () => {
    clearError();
    if (!validateStep()) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    clearError();

    const ok = await completeProfile({
      fullName: fullName.trim(),
      gender: gender || null,
      dateOfBirth: dateOfBirth.trim() || null,
      email: email.trim() || null,
      profilePhotoUrl: profilePhotoUrl.trim() || null,
      permanentAddress: permanentAddress.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      emergencyContactName: emergencyContactName.trim() || null,
      emergencyContactMobile: emergencyContactMobile.trim() || null,
      emergencyContactRelation: emergencyContactRelation.trim() || null,
      identityDocumentType: identityDocumentType || null,
      identityDocumentNumber: identityDocumentNumber.trim() || null,
      addressProofFileUrl: addressProofFileUrl.trim() || null,
      identityProofFileUrl: identityProofFileUrl.trim() || null,
      additionalDocumentFileUrl: additionalDocumentFileUrl.trim() || null,
    });

    if (!ok) return;

    enqueueSnackbar(t('spaces.editSpace.successMessage'), { variant: 'success' });

    const spaceId =
      selectedSpaceId ??
      mySpaces.find((s) => s.membershipRole === 'TENANT' || s.membershipRole === 'CUSTOMER')
        ?.spaceId ??
      mySpaces[0]?.spaceId;

    if (spaceId) {
      navigate(spaceDashboardPath(spaceId), { replace: true });
    } else if (mySpaces.length > 1) {
      navigate(ROUTES.mySpaces, { replace: true });
    } else {
      navigate(ROUTES.root, { replace: true });
    }
  };

  const stepTitle = t(`profileCompletion.wizard.sections.${STEPS[stepIndex]}`);

  return (
    <AppLayout
      headerTitle={t('profileCompletion.wizard.title')}
      headerActions={
        <Button variant="outlined" onClick={() => void logout()} sx={dashOutlinedButtonSx}>
          {t('common.logout')}
        </Button>
      }
      contentDense
      contentMaxWidth={880}
    >
      <PageContainer gap={0}>
        <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
          <PageHeader
            title={t('profileCompletion.gate.heading')}
            description={
              isEditMode
                ? t('profileCompletion.gate.completeProfile')
                : t('profileCompletion.gate.description')
            }
          />

          <ContentCard>
            <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary, mb: 0.75 }}>
              {t('profileCompletion.gate.progress', { percent: progress })}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              aria-label={t('profileCompletion.gate.progress', { percent: progress })}
              sx={{
                height: 6,
                borderRadius: 999,
                bgcolor: s.elevated,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                  bgcolor: colors.primaryDark,
                },
              }}
            />
          </ContentCard>

          <Stepper
            activeStep={stepIndex}
            alternativeLabel
            sx={{
              display: { xs: 'none', md: 'flex' },
              '& .MuiStepLabel-label': {
                ...DASHBOARD_UX.body,
                color: s.textMuted,
                '&.Mui-active, &.Mui-completed': {
                  ...DASHBOARD_UX.link,
                  color: s.textPrimary,
                },
              },
              '& .MuiStepIcon-root': {
                color: s.border,
                '&.Mui-active, &.Mui-completed': { color: colors.primaryDark },
              },
            }}
          >
            {STEPS.map((step) => (
              <Step key={step}>
                <StepLabel>{t(`profileCompletion.wizard.sections.${step}`)}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
            {t('profileCompletion.wizard.stepProgress', {
              current: stepIndex + 1,
              total: STEPS.length,
            })}
          </Typography>

          {(fieldError || error) && (
            <Alert
              severity="error"
              onClose={() => {
                setFieldError(null);
                clearError();
              }}
            >
              {fieldError || (error?.startsWith('profileCompletion.') ? t(error) : error)}
            </Alert>
          )}

          <ContentCard>
            {STEPS[stepIndex] === 'personal' ? (
              <FormSection title={stepTitle}>
                <TextField
                  label={t('profileCompletion.fields.fullName')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('profileCompletion.fields.fullNamePlaceholder')}
                  required
                  fullWidth
                  size="small"
                  sx={{ gridColumn: { md: '1 / -1' } }}
                />
                <FormControl fullWidth size="small">
                  <InputLabel id="gender-label">{t('membership.gender.label')}</InputLabel>
                  <Select
                    labelId="gender-label"
                    label={t('membership.gender.label')}
                    value={gender}
                    onChange={(e) => setGender(e.target.value as MemberGender)}
                  >
                    {GENDERS.map((g) => (
                      <MenuItem key={g} value={g}>
                        {t(`membership.gender.${g.toLowerCase()}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label={t('profileCompletion.fields.dateOfBirth')}
                  placeholder={t('profileCompletion.fields.dateOfBirthPlaceholder')}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label={t('profileCompletion.fields.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('profileCompletion.fields.emailPlaceholder')}
                  fullWidth
                  size="small"
                />
                <TextField
                  label={t('profileCompletion.fields.mobileNumber')}
                  value={user?.mobileNumber ?? ''}
                  disabled
                  fullWidth
                  size="small"
                />
                <TextField
                  label={t('profileCompletion.fields.profilePhoto')}
                  value={profilePhotoUrl}
                  onChange={(e) => setProfilePhotoUrl(e.target.value)}
                  placeholder={t('profileCompletion.fields.profilePhotoPlaceholder')}
                  fullWidth
                  size="small"
                  helperText={t('profileCompletion.wizard.uploadPhoto')}
                  sx={{ gridColumn: { md: '1 / -1' } }}
                />
              </FormSection>
            ) : null}

            {STEPS[stepIndex] === 'address' ? (
              <FormSection title={stepTitle}>
                <TextField
                  label={t('profileCompletion.fields.permanentAddress')}
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  placeholder={t('profileCompletion.fields.permanentAddressPlaceholder')}
                  required
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  sx={{ gridColumn: { md: '1 / -1' } }}
                />
                <TextField
                  label={t('profileCompletion.fields.city')}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('profileCompletion.fields.cityPlaceholder')}
                  required
                  fullWidth
                  size="small"
                />
                <TextField
                  label={t('profileCompletion.fields.state')}
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder={t('profileCompletion.fields.statePlaceholder')}
                  required
                  fullWidth
                  size="small"
                />
                <TextField
                  label={t('profileCompletion.fields.pincode')}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder={t('profileCompletion.fields.pincodePlaceholder')}
                  required
                  fullWidth
                  size="small"
                />
              </FormSection>
            ) : null}

            {STEPS[stepIndex] === 'emergency' ? (
              <FormSection title={stepTitle}>
                <TextField
                  label={t('profileCompletion.fields.guardianName')}
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder={t('profileCompletion.fields.guardianNamePlaceholder')}
                  fullWidth
                  size="small"
                />
                <TextField
                  label={t('profileCompletion.fields.guardianMobile')}
                  value={emergencyContactMobile}
                  onChange={(e) => setEmergencyContactMobile(e.target.value)}
                  placeholder={t('profileCompletion.fields.guardianMobilePlaceholder')}
                  fullWidth
                  size="small"
                />
                <TextField
                  label={t('profileCompletion.fields.relationship')}
                  value={emergencyContactRelation}
                  onChange={(e) => setEmergencyContactRelation(e.target.value)}
                  placeholder={t('profileCompletion.fields.relationshipPlaceholder')}
                  fullWidth
                  size="small"
                  sx={{ gridColumn: { md: '1 / -1' } }}
                />
              </FormSection>
            ) : null}

            {STEPS[stepIndex] === 'documents' ? (
              <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                    ...DASHBOARD_UX.body,
                  }}
                >
                  {t('profileCompletion.wizard.documentsOptional')}
                </Alert>
                <FormSection title={stepTitle}>
                  <TextField
                    label={t('membership.documents.type', { defaultValue: 'Document type' })}
                    value={identityDocumentType}
                    onChange={(e) => setIdentityDocumentType(e.target.value)}
                    placeholder={t('profileCompletion.fields.documentTypePlaceholder')}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={t('profileCompletion.fields.documentNumber')}
                    value={identityDocumentNumber}
                    onChange={(e) => setIdentityDocumentNumber(e.target.value)}
                    placeholder={t('profileCompletion.fields.documentNumberPlaceholder')}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={t('profileCompletion.fields.identityProof')}
                    value={identityProofFileUrl}
                    onChange={(e) => setIdentityProofFileUrl(e.target.value)}
                    placeholder={t('profileCompletion.fields.identityProofPlaceholder')}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={t('profileCompletion.fields.addressProof')}
                    value={addressProofFileUrl}
                    onChange={(e) => setAddressProofFileUrl(e.target.value)}
                    placeholder={t('profileCompletion.fields.addressProofPlaceholder')}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={t('profileCompletion.fields.additionalDocument')}
                    value={additionalDocumentFileUrl}
                    onChange={(e) => setAdditionalDocumentFileUrl(e.target.value)}
                    placeholder={t('profileCompletion.fields.additionalDocumentPlaceholder')}
                    fullWidth
                    size="small"
                    sx={{ gridColumn: { md: '1 / -1' } }}
                  />
                </FormSection>
              </Stack>
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
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              sx={dashContainedButtonSx}
            >
              {isSubmitting ? t('common.pleaseWait') : t('profileCompletion.wizard.submit')}
            </Button>
          )}
        </Stack>
      </StickyFooter>
    </AppLayout>
  );
}
