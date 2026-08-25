import {
  Avatar,
  Box,
  Button,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Calendar,
  FolderOpen,
  Globe,
  Languages,
  LogOut,
  Mail,
  MapPin,
  Shield,
  SquarePen,
  Sun,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '@/modules/auth/hooks/useLogout';
import { LanguagePicker } from '@/modules/profile/components/LanguagePicker';
import {
  isConsumerMembershipRole,
  profileCompletionPercentage,
} from '@/modules/onboarding/utils/profileCompletion';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusChip } from '@/shared/components/StatusChip';
import type { AppLanguage } from '@/i18n';
import { ROUTES } from '@/routes/paths';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useAuthStore } from '@/store/authStore';
import { useSpaceStore } from '@/store/spaceStore';
import { useAppStore } from '@/store/appStore';

function CardWatermark({ children }: { children: ReactNode }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        right: 10,
        bottom: 6,
        opacity: 0.08,
        pointerEvents: 'none',
        lineHeight: 0,
      }}
    >
      {children}
    </Box>
  );
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        py: 1.05,
        borderBottom: `1px solid ${s.border}`,
        '&:last-of-type': { borderBottom: 0 },
      }}
    >
      <Box sx={{ color: s.textMuted, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {icon}
      </Box>
      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, flex: 1, minWidth: 0 }}>
        {label}
      </Typography>
      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary, textAlign: 'right' }}>
        {value}
      </Typography>
    </Box>
  );
}

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const logout = useLogout();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const selectedSpaceId = useSpaceStore((state) => state.selectedSpaceId);
  const themeMode = useAppStore((state) => state.themeMode);
  const toggleThemeMode = useAppStore((state) => state.toggleThemeMode);

  useEffect(() => {
    document.title = `${t('navigation.profile')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const currentSpace = useMemo(() => {
    if (selectedSpaceId) {
      return mySpaces.find((space) => space.spaceId === selectedSpaceId) ?? null;
    }
    return mySpaces[0] ?? null;
  }, [mySpaces, selectedSpaceId]);

  const consumerSpace = useMemo(() => {
    if (selectedSpaceId) {
      const selected = mySpaces.find((space) => space.spaceId === selectedSpaceId);
      if (selected && isConsumerMembershipRole(selected.membershipRole)) {
        return selected;
      }
    }
    return mySpaces.find((space) => isConsumerMembershipRole(space.membershipRole)) ?? null;
  }, [mySpaces, selectedSpaceId]);

  const currentLanguage = (i18n.language?.split('-')[0] ?? 'en') as AppLanguage;
  const completionPercent = profileCompletionPercentage(user);
  const profileStatusLabel = user?.profileStatus
    ? t(`settings.profile.profileStatus.${user.profileStatus}`)
    : null;
  const genderLabel = user?.gender
    ? t(`settings.profile.gender.${user.gender}`, { defaultValue: user.gender })
    : '—';

  const dashErrorButtonSx = {
    ...dashOutlinedButtonSx,
    color: colors.danger,
    borderColor: `${colors.danger}99`,
    '&:hover': {
      borderColor: colors.danger,
      bgcolor: `${colors.danger}0F`,
    },
  } as const;

  if (!user) {
    return (
      <PageContainer gap={0}>
        <EmptyState
          icon={<UserRound size={28} />}
          title={t('common.errors.authRequired', { defaultValue: 'Sign in required' })}
          description={t('settings.profile.subheading')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('settings.profile.heading')}
          description={t('settings.profile.subheading')}
        />

        <Box
          sx={{
            display: 'grid',
            gap: `${DASHBOARD_UX.cardGap}px`,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            alignItems: 'stretch',
          }}
        >
          <ContentCard>
            <Stack spacing={2} sx={{ height: '100%' }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                <Avatar
                  src={user.profilePhotoUrl ?? undefined}
                  alt={user.fullName ?? user.mobileNumber}
                  sx={{
                    width: 88,
                    height: 88,
                    bgcolor: colors.primary,
                    color: '#fff',
                  }}
                >
                  <UserRound size={36} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }} noWrap>
                    {user.fullName?.trim() || t('settings.profile.fullNameLabel')}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.25 }}>
                    {user.mobileNumber}
                  </Typography>
                  <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 1, flexWrap: 'wrap' }}>
                    {currentSpace ? (
                      <StatusChip label={currentSpace.spaceName} tone="info" />
                    ) : null}
                    {profileStatusLabel ? (
                      <StatusChip label={profileStatusLabel} tone="warning" />
                    ) : null}
                    {mySpaces.length > 0 ? (
                      <StatusChip
                        label={t('settings.profile.spacesJoined', {
                          count: mySpaces.length,
                          defaultValue: '{{count}} spaces',
                        })}
                        tone="success"
                      />
                    ) : null}
                  </Stack>
                </Box>
              </Stack>
              <Button
                variant="contained"
                startIcon={<SquarePen size={16} />}
                onClick={() => navigate(`${ROUTES.completeProfile}?mode=edit`)}
                sx={{ ...dashContainedButtonSx, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
              >
                {t('settings.profile.editProfile')}
              </Button>
              <Box sx={{ mt: 'auto' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textSecondary }}>
                    {t('settings.profile.completionLabel', {
                      defaultValue: 'Profile completion',
                    })}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textPrimary }}>
                    {completionPercent}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={completionPercent}
                  aria-label={t('settings.profile.completionLabel', {
                    defaultValue: 'Profile completion',
                  })}
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
              </Box>
            </Stack>
          </ContentCard>

          <ContentCard>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
              <UserRound size={18} color={s.textSecondary} />
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                {t('settings.profile.personalSection')}
              </Typography>
            </Stack>
            <ProfileField
              icon={<Mail size={15} />}
              label={t('settings.profile.emailLabel')}
              value={user.email?.trim() || '—'}
            />
            <ProfileField
              icon={<UserRound size={15} />}
              label={t('settings.profile.genderLabel')}
              value={genderLabel}
            />
            <ProfileField
              icon={<Calendar size={15} />}
              label={t('settings.profile.dateOfBirthLabel')}
              value={user.dateOfBirth?.trim() || '—'}
            />
            <ProfileField
              icon={<MapPin size={15} />}
              label={t('settings.profile.permanentAddressLabel')}
              value={user.permanentAddress?.trim() || '—'}
            />
            <ProfileField
              icon={<MapPin size={15} />}
              label={t('settings.profile.cityLabel')}
              value={user.city?.trim() || '—'}
            />
            <ProfileField
              icon={<MapPin size={15} />}
              label={t('settings.profile.stateLabel')}
              value={user.state?.trim() || '—'}
            />
            <ProfileField
              icon={<MapPin size={15} />}
              label={t('settings.profile.pincodeLabel')}
              value={user.pincode?.trim() || '—'}
            />
          </ContentCard>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: `${DASHBOARD_UX.cardGap}px`,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            alignItems: 'stretch',
          }}
        >
          <Box sx={{ position: 'relative', height: '100%', minHeight: 220, '& > .MuiPaper-root': { height: '100%' } }}>
            <ContentCard>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <Globe size={18} color={s.textSecondary} />
                <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                  {t('settings.language.title')}
                </Typography>
              </Stack>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 2 }}>
                {t('settings.language.description')}
              </Typography>
              <LanguagePicker value={currentLanguage} hideLabel />
              <CardWatermark>
                <Languages size={88} />
              </CardWatermark>
            </ContentCard>
          </Box>

          <Box sx={{ position: 'relative', height: '100%', minHeight: 220, '& > .MuiPaper-root': { height: '100%' } }}>
            <ContentCard>
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                    <Sun size={18} color={s.textSecondary} />
                    <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                      {t('settings.profile.appearanceSection', { defaultValue: 'Appearance' })}
                    </Typography>
                  </Stack>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 1.5 }}>
                    {t('settings.profile.themeSystemHint', {
                      defaultValue: 'Use the header toggle to switch light and dark mode.',
                    })}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Sun size={14} />}
                    onClick={toggleThemeMode}
                    sx={dashOutlinedButtonSx}
                  >
                    {themeMode === 'light'
                      ? t('settings.profile.themeLight', { defaultValue: 'Light' })
                      : t('settings.profile.themeDark', { defaultValue: 'Dark' })}
                  </Button>
                </Box>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                    <FolderOpen size={18} color={s.textSecondary} />
                    <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                      {t('settings.profile.documentsSection')}
                    </Typography>
                  </Stack>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 1.5 }}>
                    {consumerSpace
                      ? t('settings.profile.documentsDescription')
                      : t('settings.profile.documentsNoSpace')}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<SquarePen size={16} />}
                    onClick={() => navigate(`${ROUTES.completeProfile}?mode=edit`)}
                    sx={dashOutlinedButtonSx}
                  >
                    {t('settings.profile.editProfile')}
                  </Button>
                </Box>
              </Stack>
              <CardWatermark>
                <FolderOpen size={88} />
              </CardWatermark>
            </ContentCard>
          </Box>

          <Box sx={{ position: 'relative', height: '100%', minHeight: 220, '& > .MuiPaper-root': { height: '100%' } }}>
            <ContentCard>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <Shield size={18} color={s.textSecondary} />
                <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                  {t('settings.profile.sessionTitle')}
                </Typography>
              </Stack>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 2 }}>
                {t('settings.profile.sessionBody')}
              </Typography>
              <Stack spacing={1.25}>
                <Button
                  variant="outlined"
                  startIcon={<LogOut size={16} />}
                  onClick={() => {
                    if (window.confirm(t('settings.profile.logoutMessage'))) {
                      void logout();
                    }
                  }}
                  sx={dashErrorButtonSx}
                >
                  {t('settings.profile.logout')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Trash2 size={16} />}
                  onClick={() => {
                    navigate(ROUTES.deleteAccount, {
                      state: {
                        fromProfile: true,
                        mobileNumber: user.mobileNumber,
                      },
                    });
                  }}
                  sx={dashErrorButtonSx}
                >
                  {t('settings.profile.deleteAccount')}
                </Button>
              </Stack>
              <CardWatermark>
                <Shield size={88} />
              </CardWatermark>
            </ContentCard>
          </Box>
        </Box>
      </Stack>
    </PageContainer>
  );
}
