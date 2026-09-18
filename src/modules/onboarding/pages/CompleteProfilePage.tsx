import {
  Alert,
  Box,
  Button,
  InputAdornment,
  LinearProgress,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { OnboardingLayout } from '@/layouts/OnboardingLayout';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { uploadLocalFile, mapFileUploadError } from '@/shared/services/fileUploadService';
import { ImageFilePickerField } from '@/shared/components/files/ImageFilePickerField';
import { FileImageViewer } from '@/shared/components/files/FileImageViewer';
import { FileUploadUserError } from '@/shared/utils/fileLimits';
import { prepareFileForUpload } from '@/shared/utils/optimizeImageFile';
import { useCompleteProfile } from '@/modules/onboarding/hooks/useCompleteProfile';
import {
  isGenericUserName,
  profileCompletionPercentage,
} from '@/modules/onboarding/utils/profileCompletion';
import { ContentCard } from '@/shared/components/ContentCard';
import { StickyFooter, StickyFooterClearance } from '@/shared/components/StickyFooter';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { ROUTES, spaceDashboardPath } from '@/routes/paths';
import type { MemberGender } from '@/shared/types/auth';
import type { MemberDocumentType } from '@/shared/types/member';
import { normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import { useAuthStore } from '@/store/authStore';
import { useSpaceStore } from '@/store/spaceStore';
import dayjs from 'dayjs';

const STEPS = ['personal', 'address', 'emergency', 'documents'] as const;
const GENDERS: MemberGender[] = ['MALE', 'FEMALE', 'OTHER'];
const DOCUMENT_TYPES: MemberDocumentType[] = [
  'AADHAAR',
  'PAN',
  'PASSPORT',
  'DRIVING_LICENSE',
  'STUDENT_ID',
  'OTHER',
];
const RELATIONS = ['Mother', 'Father', 'Spouse', 'Sibling', 'Guardian', 'Friend', 'Other'] as const;

function httpUrlOrNull(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return null;
}

function selectableGender(value: MemberGender | null | undefined): MemberGender | '' {
  return value === 'MALE' || value === 'FEMALE' || value === 'OTHER' ? value : '';
}

/** Native date inputs need YYYY-MM-DD. */
function toIsoDate(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed.slice(0, 10);
  const dmy = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) {
    const day = dmy[1];
    const month = dmy[2];
    const year = dmy[3];
    if (day && month && year) {
      const parsed = dayjs(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
    }
  }
  const parsed = dayjs(trimmed);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    minHeight: 48,
    bgcolor: 'background.paper',
  },
  '& .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    minHeight: 48,
    py: 0,
  },
} as const;

function IconField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  required,
  disabled,
  type,
  multiline,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  icon: ReactNode;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  multiline?: boolean;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box>
      <Typography sx={{ ...DASHBOARD_UX.inputLabel, color: s.textSecondary, mb: 0.75 }}>
        {label}
        {required ? ' *' : ''}
      </Typography>
      <TextField
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        type={type}
        multiline={multiline}
        minRows={multiline ? 2 : undefined}
        fullWidth
        hiddenLabel
        sx={fieldSx}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start" sx={{ color: colors.primary }}>
                {icon}
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
}

function DateOfBirthField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const iso = toIsoDate(value);
  const max = dayjs().format('YYYY-MM-DD');
  const min = dayjs().subtract(120, 'year').format('YYYY-MM-DD');
  const display = iso ? dayjs(iso).format('DD-MM-YYYY') : '';

  return (
    <Box>
      <Typography sx={{ ...DASHBOARD_UX.inputLabel, color: s.textSecondary, mb: 0.75 }}>
        {label}
      </Typography>
      <Box sx={{ position: 'relative' }}>
        <TextField
          value={display}
          placeholder={placeholder}
          fullWidth
          hiddenLabel
          sx={fieldSx}
          slotProps={{
            htmlInput: { readOnly: true, tabIndex: -1 },
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ color: colors.primary }}>
                  <Calendar size={16} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Box
          component="input"
          type="date"
          value={iso}
          min={min}
          max={max}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            cursor: 'pointer',
            width: '100%',
            height: '100%',
            border: 0,
            zIndex: 1,
          }}
        />
      </Box>
    </Box>
  );
}

function IconSelectField({
  label,
  placeholder,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  icon: ReactNode;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box>
      <Typography sx={{ ...DASHBOARD_UX.inputLabel, color: s.textSecondary, mb: 0.75 }}>
        {label}
      </Typography>
      <TextField
        select
        fullWidth
        hiddenLabel
        value={value}
        onChange={(event) => onChange(event.target.value)}
        sx={fieldSx}
        slotProps={{
          select: {
            displayEmpty: true,
            renderValue: (selected) => {
              const current = String(selected ?? '');
              if (!current) {
                return (
                  <Typography component="span" sx={{ ...DASHBOARD_UX.inputText, color: s.textMuted }}>
                    {placeholder}
                  </Typography>
                );
              }
              return options.find((option) => option.value === current)?.label ?? current;
            },
          },
          input: {
            startAdornment: (
              <InputAdornment position="start" sx={{ color: colors.primary, pointerEvents: 'none' }}>
                {icon}
              </InputAdornment>
            ),
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}

function MobileWithCountryCodeField({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const digits = normalizeIndianMobileDigits(value);

  return (
    <Box>
      <Typography sx={{ ...DASHBOARD_UX.inputLabel, color: s.textSecondary, mb: 0.75 }}>
        {label}
      </Typography>
      <TextField
        value={digits}
        onChange={onChange ? (event) => onChange(normalizeIndianMobileDigits(event.target.value)) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        fullWidth
        hiddenLabel
        sx={fieldSx}
        slotProps={{
          htmlInput: { inputMode: 'numeric', maxLength: 10, autoComplete: 'tel-national' },
          input: {
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 0.75 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: colors.primary }}>
                  <Phone size={16} />
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: '8px',
                      bgcolor: s.elevated,
                      border: `1px solid ${s.border}`,
                      color: s.textPrimary,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>
                      +91
                    </Typography>
                    <ChevronDown size={14} />
                  </Box>
                </Box>
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
}

function ProfileStepper({
  current,
  labels,
  onStepClick,
}: {
  current: number;
  labels: string[];
  onStepClick: (index: number) => void;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      component="ol"
      sx={{
        listStyle: 'none',
        display: 'flex',
        alignItems: 'center',
        m: 0,
        p: 0,
        width: '100%',
        overflowX: 'auto',
      }}
    >
      {labels.map((label, index) => {
        const active = index === current;
        const completed = index < current;
        const filled = active || completed;
        return (
          <Box
            key={label}
            component="li"
            sx={{
              display: 'flex',
              alignItems: 'center',
              flex: index === labels.length - 1 ? '0 0 auto' : 1,
              minWidth: 0,
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={() => index <= current && onStepClick(index)}
              disabled={index > current}
              aria-current={active ? 'step' : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                border: 0,
                bgcolor: 'transparent',
                p: 0,
                cursor: index <= current ? 'pointer' : 'default',
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: filled ? colors.primary : s.elevated,
                  color: filled ? '#fff' : s.textMuted,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: filled ? 0 : `1px solid ${s.border}`,
                }}
              >
                {index + 1}
              </Box>
              <Typography
                noWrap
                sx={{
                  ...DASHBOARD_UX.body,
                  fontWeight: filled ? 600 : 500,
                  color: filled ? colors.primary : s.textMuted,
                  textDecoration: active ? 'underline' : 'none',
                  textUnderlineOffset: '4px',
                  display: { xs: index === current ? 'block' : 'none', sm: 'block' },
                }}
              >
                {label}
              </Typography>
            </Box>
            {index < labels.length - 1 ? (
              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  mx: 1.5,
                  minWidth: 16,
                  bgcolor: index <= current ? colors.primary : s.border,
                }}
              />
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}

export function CompleteProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isEditMode = params.get('mode') === 'edit';
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const selectedSpaceId = useSpaceStore((state) => state.selectedSpaceId);
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const { completeProfile, isSubmitting, error, clearError } = useCompleteProfile();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [gender, setGender] = useState<MemberGender | ''>(selectableGender(user?.gender));
  const [dateOfBirth, setDateOfBirth] = useState(toIsoDate(user?.dateOfBirth));
  const [email, setEmail] = useState(user?.email ?? '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.profilePhotoUrl ?? '');
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);
  const [profileViewerOpen, setProfileViewerOpen] = useState(false);
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
  const [identityProofFile, setIdentityProofFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [additionalDocumentFile, setAdditionalDocumentFile] = useState<File | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${t('profileCompletion.wizard.title')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    const current = useAuthStore.getState().user;
    if (!current || current.id !== userId) return;
    setFullName(current.fullName ?? '');
    setGender(selectableGender(current.gender));
    setDateOfBirth(toIsoDate(current.dateOfBirth));
    setEmail(current.email ?? '');
    setProfilePhotoUrl(current.profilePhotoUrl ?? '');
    setProfilePhotoFile(null);
    setRemoveProfilePhoto(false);
    setPermanentAddress(current.permanentAddress ?? '');
    setCity(current.city ?? '');
    setStateName(current.state ?? '');
    setPincode(current.pincode ?? '');
  }, [userId]);

  const progress = useMemo(() => profileCompletionPercentage(user), [user]);
  const stepLabels = STEPS.map((step) => t(`profileCompletion.wizard.sections.${step}`));

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

    let profilePhotoFileId: string | undefined;
    if (profilePhotoFile) {
      try {
        profilePhotoFileId = await uploadLocalFile(profilePhotoFile, { purpose: 'PROFILE_PHOTO' });
      } catch (err) {
        setFieldError(mapFileUploadError(err));
        return;
      }
    }

    let identityProofFileId: string | undefined;
    let addressProofFileId: string | undefined;
    let additionalDocumentFileId: string | undefined;
    try {
      if (identityProofFile) {
        identityProofFileId = await uploadLocalFile(identityProofFile, { purpose: 'IDENTITY_DOCUMENT' });
      }
      if (addressProofFile) {
        addressProofFileId = await uploadLocalFile(addressProofFile, { purpose: 'ADDRESS_PROOF' });
      }
      if (additionalDocumentFile) {
        additionalDocumentFileId = await uploadLocalFile(additionalDocumentFile, {
          purpose: 'MEMBER_DOCUMENT',
        });
      }
    } catch (err) {
      setFieldError(mapFileUploadError(err));
      return;
    }

    const ok = await completeProfile({
      fullName: fullName.trim(),
      gender: gender || null,
      dateOfBirth: toIsoDate(dateOfBirth) || null,
      email: email.trim() || null,
      profilePhotoFileId: profilePhotoFileId ?? undefined,
      profilePhotoUrl: removeProfilePhoto && !profilePhotoFile ? '' : undefined,
      permanentAddress: permanentAddress.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      emergencyContactName: emergencyContactName.trim() || null,
      emergencyContactMobile: normalizeIndianMobileDigits(emergencyContactMobile) || null,
      emergencyContactRelation: emergencyContactRelation.trim() || null,
      identityDocumentType: identityDocumentType || null,
      identityDocumentNumber: identityDocumentNumber.trim() || null,
      addressProofFileUrl: httpUrlOrNull(addressProofFileUrl),
      identityProofFileUrl: httpUrlOrNull(identityProofFileUrl),
      additionalDocumentFileUrl: httpUrlOrNull(additionalDocumentFileUrl),
      identityProofFileId,
      addressProofFileId,
      additionalDocumentFileId,
    });

    if (!ok) return;

    enqueueSnackbar(t('spaces.editSpace.successMessage'), { variant: 'success' });

    if (isEditMode) {
      navigate(ROUTES.profile, { replace: true });
      return;
    }

    const spaceId =
      selectedSpaceId ??
      mySpaces.find((space) => space.membershipRole === 'TENANT' || space.membershipRole === 'CUSTOMER')
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

  const onPickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const prepared = await prepareFileForUpload(file, 'PROFILE_PHOTO');
      if (profilePhotoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(profilePhotoUrl);
      }
      setProfilePhotoFile(prepared);
      setProfilePhotoUrl(URL.createObjectURL(prepared));
      setRemoveProfilePhoto(false);
      setFieldError(null);
    } catch (error) {
      if (error instanceof FileUploadUserError) {
        setFieldError(error.message);
      } else {
        setFieldError(t('files.uploadFailed', { defaultValue: 'Unable to upload the file. Please try again.' }));
      }
    }
  };

  const stepTitle = t(`profileCompletion.wizard.sections.${STEPS[stepIndex]}`);

  return (
    <OnboardingLayout
      showUserName={false}
      onCancel={isEditMode ? () => navigate(ROUTES.profile) : undefined}
      cancelLabel={t('common.cancel')}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 880,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: `${DASHBOARD_UX.sectionGap}px`,
          pb: 1,
        }}
      >
        <Box>
          <Typography component="h1" sx={{ ...DASHBOARD_UX.pageTitle, color: s.textPrimary }}>
            {t('profileCompletion.gate.heading')}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.greetingSub, color: s.textSecondary, mt: 0.5 }}>
            {isEditMode
              ? t('profileCompletion.gate.completeProfile')
              : t('profileCompletion.gate.description')}
          </Typography>
        </Box>

        <ContentCard>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 1 }}>
            {t('profileCompletion.gate.progress', { percent: progress })}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            aria-label={t('profileCompletion.gate.progress', { percent: progress })}
            sx={{
              height: 8,
              borderRadius: 999,
              bgcolor: s.elevated,
              '& .MuiLinearProgress-bar': {
                borderRadius: 999,
                bgcolor: colors.primary,
              },
            }}
          />
        </ContentCard>

        <ProfileStepper
          current={stepIndex}
          labels={stepLabels}
          onStepClick={(index) => setStepIndex(index)}
        />

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
          <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mb: 2.5 }}>
            {stepTitle}
          </Typography>

          {STEPS[stepIndex] === 'personal' ? (
            <Stack spacing={2.25}>
              <IconField
                label={t('profileCompletion.fields.fullName')}
                value={fullName}
                onChange={setFullName}
                placeholder={t('profileCompletion.fields.fullNamePlaceholder')}
                icon={<UserRound size={16} />}
                required
              />
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                }}
              >
                <IconSelectField
                  label={t('membership.gender.label')}
                  placeholder={t('profileCompletion.fields.selectGender')}
                  value={gender}
                  onChange={(value) => setGender(value as MemberGender | '')}
                  options={GENDERS.map((g) => ({
                    value: g,
                    label: t(`membership.gender.${g.toLowerCase()}`),
                  }))}
                  icon={<UserRound size={16} />}
                />
                <DateOfBirthField
                  label={t('profileCompletion.fields.dateOfBirth')}
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                  placeholder={t('profileCompletion.fields.dateOfBirthMask')}
                />
                <IconField
                  label={t('profileCompletion.fields.email')}
                  value={email}
                  onChange={setEmail}
                  placeholder={t('profileCompletion.fields.emailEnter')}
                  icon={<Mail size={16} />}
                  type="email"
                />
                <Box>
                  <MobileWithCountryCodeField
                    label={t('profileCompletion.fields.mobileNumber')}
                    value={user?.mobileNumber ?? ''}
                    disabled
                  />
                  <Link
                    component={RouterLink}
                    to={ROUTES.changeMobile}
                    underline="hover"
                    sx={{ ...DASHBOARD_UX.smallCaption, display: 'inline-block', mt: 0.75 }}
                  >
                    {t('settings.profile.changeMobile')}
                  </Link>
                </Box>
              </Box>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(event) => {
                  void onPickPhoto(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.75,
                  width: '100%',
                  textAlign: 'left',
                  border: `1px dashed ${s.border}`,
                  borderRadius: '12px',
                  bgcolor: s.surface,
                  p: 2,
                  minHeight: 88,
                }}
              >
                <Box
                  onClick={() => {
                    if (profilePhotoUrl) {
                      setProfileViewerOpen(true);
                    } else {
                      photoInputRef.current?.click();
                    }
                  }}
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '12px',
                    bgcolor: colors.mintSubtle,
                    color: colors.primary,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  {profilePhotoUrl ? (
                    <Box
                      component="img"
                      src={profilePhotoUrl}
                      alt=""
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <ImageIcon size={26} />
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                    {profilePhotoUrl
                      ? t('profileCompletion.wizard.replacePhoto')
                      : t('profileCompletion.wizard.uploadPhoto')}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
                    {t('profileCompletion.fields.photoHint')}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 1 }}>
                    <Button
                      size="small"
                      onClick={() => photoInputRef.current?.click()}
                      sx={dashOutlinedButtonSx}
                    >
                      {profilePhotoUrl
                        ? t('files.replace', { defaultValue: 'Replace photo' })
                        : t('files.add', { defaultValue: 'Add photo' })}
                    </Button>
                    {profilePhotoUrl ? (
                      <Button
                        size="small"
                        onClick={() => setProfileViewerOpen(true)}
                        sx={dashOutlinedButtonSx}
                      >
                        {t('files.view', { defaultValue: 'View photo' })}
                      </Button>
                    ) : null}
                    {profilePhotoUrl ? (
                      <Button
                        size="small"
                        onClick={() => {
                          if (profilePhotoUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(profilePhotoUrl);
                          }
                          setProfilePhotoFile(null);
                          setProfilePhotoUrl('');
                          setRemoveProfilePhoto(true);
                        }}
                        sx={dashOutlinedButtonSx}
                      >
                        {t('files.remove', { defaultValue: 'Remove photo' })}
                      </Button>
                    ) : null}
                  </Stack>
                </Box>
              </Box>
              <FileImageViewer
                open={profileViewerOpen}
                onClose={() => setProfileViewerOpen(false)}
                fileId={profilePhotoFile ? undefined : user?.profilePhotoFileId}
                imageUrl={profilePhotoUrl || undefined}
                title={t('profileCompletion.fields.profilePhoto')}
                downloadFilename="profile-photo.jpg"
              />
            </Stack>
          ) : null}

          {STEPS[stepIndex] === 'address' ? (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              }}
            >
              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <IconField
                  label={t('profileCompletion.fields.permanentAddress')}
                  value={permanentAddress}
                  onChange={setPermanentAddress}
                  placeholder={t('profileCompletion.fields.permanentAddressPlaceholder')}
                  icon={<MapPin size={16} />}
                  required
                  multiline
                />
              </Box>
              <IconField
                label={t('profileCompletion.fields.city')}
                value={city}
                onChange={setCity}
                placeholder={t('profileCompletion.fields.cityPlaceholder')}
                icon={<MapPin size={16} />}
                required
              />
              <IconField
                label={t('profileCompletion.fields.state')}
                value={stateName}
                onChange={setStateName}
                placeholder={t('profileCompletion.fields.statePlaceholder')}
                icon={<MapPin size={16} />}
                required
              />
              <IconField
                label={t('profileCompletion.fields.pincode')}
                value={pincode}
                onChange={setPincode}
                placeholder={t('profileCompletion.fields.pincodePlaceholder')}
                icon={<MapPin size={16} />}
                required
              />
            </Box>
          ) : null}

          {STEPS[stepIndex] === 'emergency' ? (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              }}
            >
              <IconField
                label={t('profileCompletion.fields.guardianName')}
                value={emergencyContactName}
                onChange={setEmergencyContactName}
                placeholder={t('profileCompletion.fields.guardianNamePlaceholder')}
                icon={<UserRound size={16} />}
              />
              <MobileWithCountryCodeField
                label={t('profileCompletion.fields.guardianMobile')}
                value={emergencyContactMobile}
                onChange={setEmergencyContactMobile}
                placeholder={t('profileCompletion.fields.guardianMobilePlaceholder')}
              />
              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <IconSelectField
                  label={t('profileCompletion.fields.relationship')}
                  placeholder={t('profileCompletion.fields.selectRelationship')}
                  value={emergencyContactRelation}
                  onChange={setEmergencyContactRelation}
                  options={RELATIONS.map((relation) => ({
                    value: relation,
                    label: t(`profileCompletion.fields.relations.${relation}`),
                  }))}
                  icon={<UserRound size={16} />}
                />
              </Box>
            </Box>
          ) : null}

          {STEPS[stepIndex] === 'documents' ? (
            <Stack spacing={2}>
              <Alert
                severity="info"
                sx={{
                  borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                  ...DASHBOARD_UX.body,
                }}
              >
                {t('profileCompletion.wizard.documentsOptional')}
              </Alert>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                }}
              >
                <IconSelectField
                  label={t('membership.documents.type', { defaultValue: 'Document type' })}
                  placeholder={t('profileCompletion.fields.selectDocumentType')}
                  value={identityDocumentType}
                  onChange={setIdentityDocumentType}
                  options={DOCUMENT_TYPES.map((type) => ({
                    value: type,
                    label: t(`membership.documents.types.${type}`),
                  }))}
                  icon={<FileText size={16} />}
                />
                <IconField
                  label={t('profileCompletion.fields.documentNumber')}
                  value={identityDocumentNumber}
                  onChange={setIdentityDocumentNumber}
                  placeholder={t('profileCompletion.fields.documentNumberPlaceholder')}
                  icon={<FileText size={16} />}
                />
                <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                  <ImageFilePickerField
                    purpose="IDENTITY_DOCUMENT"
                    label={t('profileCompletion.fields.identityProof')}
                    hint={t('files.sizeHint', {
                      defaultValue: 'JPEG, PNG, or WebP. Maximum {{maxMb}} MB after compression.',
                      maxMb: 5,
                    })}
                    file={identityProofFile}
                    previewUrl={identityProofFileUrl || undefined}
                    onFile={(next) => {
                      setIdentityProofFile(next);
                      if (!next) {
                        setIdentityProofFileUrl('');
                      }
                    }}
                    onError={setFieldError}
                    disabled={isSubmitting}
                  />
                </Box>
                <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                  <ImageFilePickerField
                    purpose="ADDRESS_PROOF"
                    label={t('profileCompletion.fields.addressProof')}
                    file={addressProofFile}
                    previewUrl={addressProofFileUrl || undefined}
                    onFile={(next) => {
                      setAddressProofFile(next);
                      if (!next) {
                        setAddressProofFileUrl('');
                      }
                    }}
                    onError={setFieldError}
                    disabled={isSubmitting}
                  />
                </Box>
                <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                  <ImageFilePickerField
                    purpose="MEMBER_DOCUMENT"
                    label={t('profileCompletion.fields.additionalDocument')}
                    file={additionalDocumentFile}
                    previewUrl={additionalDocumentFileUrl || undefined}
                    onFile={(next) => {
                      setAdditionalDocumentFile(next);
                      if (!next) {
                        setAdditionalDocumentFileUrl('');
                      }
                    }}
                    onError={setFieldError}
                    disabled={isSubmitting}
                  />
                </Box>
              </Box>
            </Stack>
          ) : null}
        </ContentCard>
        <StickyFooterClearance height={{ xs: 96, md: 80 }} />
      </Box>

      <StickyFooter pin="fixed" sx={{ left: 0 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: 'space-between', width: '100%', alignItems: 'center' }}
        >
          <Stack direction="row" spacing={1}>
            {isEditMode ? (
              <Button
                variant="outlined"
                onClick={() => navigate(ROUTES.profile)}
                disabled={isSubmitting}
                sx={dashOutlinedButtonSx}
              >
                {t('common.cancel')}
              </Button>
            ) : null}
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
          </Stack>
          {stepIndex < STEPS.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowRight size={16} />}
              sx={dashContainedButtonSx}
            >
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
    </OnboardingLayout>
  );
}
