import {
  Avatar,
  Box,
  Button,
  Divider,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Languages,
  LogOut,
  SquarePen,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { useLogout } from '@/modules/auth/hooks/useLogout';
import { LanguagePicker } from '@/modules/profile/components/LanguagePicker';
import {
  isConsumerMembershipRole,
  profileCompletionPercentage,
} from '@/modules/onboarding/utils/profileCompletion';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { FormSection } from '@/shared/components/FormSection';
import { InfoRow } from '@/shared/components/InfoRow';
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

  if (!user) {
    return (
      <AppLayout headerTitle={t('navigation.profile')}>
        <PageContainer gap={0}>
          <EmptyState
            icon={<UserRound size={28} />}
            title={t('common.errors.authRequired', { defaultValue: 'Sign in required' })}
            description={t('settings.profile.subheading')}
          />
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      headerTitle={t('navigation.profile')}
      headerSubtitle={user.fullName?.trim() || user.mobileNumber}
      headerActions={
        <Button variant="outlined" onClick={() => navigate(ROUTES.mySpaces)} sx={dashOutlinedButtonSx}>
          {t('navigation.mySpaces')}
        </Button>
      }
      contentDense
    >
      <PageContainer gap={0}>
        <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
          <PageHeader
            title={t('settings.profile.heading')}
            description={t('settings.profile.subheading')}
          />

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={`${DASHBOARD_UX.cardGap}px`}
            sx={{ alignItems: { md: 'stretch' } }}
          >
            <ContentCard>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar
                  src={user.profilePhotoUrl ?? undefined}
                  alt={user.fullName ?? user.mobileNumber}
                  sx={{ width: 72, height: 72, borderRadius: `${DASHBOARD_UX.radius}px` }}
                >
                  <UserRound size={28} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }} noWrap>
                    {user.fullName?.trim() || t('settings.profile.fullNameLabel')}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                    {user.mobileNumber}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1, flexWrap: 'wrap' }}>
                    {currentSpace ? (
                      <StatusChip label={currentSpace.spaceName} tone="info" />
                    ) : null}
                    {profileStatusLabel ? <StatusChip label={profileStatusLabel} /> : null}
                    {mySpaces.length > 0 ? (
                      <StatusChip
                        label={t('settings.profile.spacesJoined', {
                          count: mySpaces.length,
                          defaultValue: '{{count}} spaces',
                        })}
                        tone="neutral"
                      />
                    ) : null}
                  </Stack>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<SquarePen size={16} />}
                  onClick={() => navigate(`${ROUTES.completeProfile}?mode=edit`)}
                  sx={dashContainedButtonSx}
                >
                  {t('settings.profile.editProfile')}
                </Button>
              </Stack>
              <Box sx={{ mt: 2 }}>
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
                    height: 6,
                    borderRadius: 999,
                    bgcolor: s.elevated,
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 999,
                      bgcolor: colors.primaryDark,
                    },
                  }}
                />
              </Box>
            </ContentCard>

            <ContentCard>
              <FormSection title={t('settings.profile.personalSection')}>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <InfoRow label={t('settings.profile.emailLabel')} value={user.email?.trim() || '—'} dense />
                  <InfoRow label={t('settings.profile.genderLabel')} value={user.gender?.trim() || '—'} dense />
                  <InfoRow
                    label={t('settings.profile.dateOfBirthLabel')}
                    value={user.dateOfBirth?.trim() || '—'}
                    dense
                  />
                  <InfoRow
                    label={t('settings.profile.permanentAddressLabel')}
                    value={user.permanentAddress?.trim() || '—'}
                    dense
                  />
                  <InfoRow label={t('settings.profile.cityLabel')} value={user.city?.trim() || '—'} dense />
                  <InfoRow label={t('settings.profile.stateLabel')} value={user.state?.trim() || '—'} dense />
                  <InfoRow
                    label={t('settings.profile.pincodeLabel')}
                    value={user.pincode?.trim() || '—'}
                    dense
                  />
                </Box>
              </FormSection>
            </ContentCard>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={`${DASHBOARD_UX.cardGap}px`}>
            <ContentCard>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <Languages size={18} color={s.textSecondary} />
                <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                  {t('settings.language.title')}
                </Typography>
              </Stack>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 2 }}>
                {t('settings.language.description')}
              </Typography>
              <LanguagePicker value={currentLanguage} />
            </ContentCard>

            <ContentCard>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1 }}>
                {t('settings.profile.appearanceSection', { defaultValue: 'Appearance' })}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 2 }}>
                {t('settings.profile.themeSystemHint', {
                  defaultValue: 'Use the header toggle to switch light and dark mode.',
                })}
              </Typography>
              <Button variant="outlined" onClick={toggleThemeMode} sx={dashOutlinedButtonSx}>
                {themeMode === 'light'
                  ? t('settings.profile.themeDark', { defaultValue: 'Dark' })
                  : t('settings.profile.themeLight', { defaultValue: 'Light' })}
              </Button>
              <Divider sx={{ my: 2, borderColor: s.border }} />
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1 }}>
                {t('settings.profile.documentsSection')}
              </Typography>
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
            </ContentCard>

            <ContentCard>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1 }}>
                {t('settings.profile.sessionTitle')}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 2 }}>
                {t('settings.profile.sessionBody')}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogOut size={16} />}
                onClick={() => {
                  if (window.confirm(t('settings.profile.logoutMessage'))) {
                    void logout();
                  }
                }}
                sx={dashOutlinedButtonSx}
              >
                {t('settings.profile.logout')}
              </Button>
            </ContentCard>
          </Stack>
        </Stack>
      </PageContainer>
    </AppLayout>
  );
}
