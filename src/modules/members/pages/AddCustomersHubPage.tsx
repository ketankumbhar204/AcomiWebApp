import { Box, Button, CardActionArea, Stack, Typography, useTheme } from '@mui/material';
import { FolderInput, Lightbulb, UserPlus } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { spaceImportPeoplePath, spaceMembersPath } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';

/**
 * Mess guided hub: add customers or import from other spaces.
 * Mirrors mobile `AddCustomersHubScreen` without Space Health stepper (deferred).
 */
export function AddCustomersHubPage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const space = useSpaceStore((state) => state.mySpaces.find((s) => s.spaceId === spaceId));

  useEffect(() => {
    document.title = `${t('membership.addCustomersHub.navTitle')} · ${t('common.appName')}`;
  }, [t]);

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('membership.addCustomersHub.title')}
          description={t('membership.addCustomersHub.subtitle')}
          breadcrumbs={[
            {
              label: space?.spaceName ?? t('navigation.space'),
              to: spaceMembersPath(spaceId),
            },
            { label: t('membership.addCustomersHub.navTitle') },
          ]}
        />

        <Typography
          sx={{
            ...DASHBOARD_UX.sidebarSection,
            color: colors.primaryDark,
            display: 'block',
          }}
        >
          {space?.spaceName || t('membership.add.eyebrow')}
        </Typography>

        <Stack spacing={`${DASHBOARD_UX.cardGap}px`} sx={{ maxWidth: 720 }}>
          <ContentCard padded={false}>
            <CardActionArea
              onClick={() => navigate(`${spaceMembersPath(spaceId)}?create=1`)}
              aria-label={t('membership.addCustomersHub.addCardCta')}
              sx={{ p: `${DASHBOARD_UX.cardPadding}px` }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                <IconBadge accent={colors.primaryDark}>
                  <UserPlus />
                </IconBadge>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                    {t('membership.addCustomersHub.addCardTitle')}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.5, mb: 1.5 }}>
                    {t('membership.addCustomersHub.addCardBody')}
                  </Typography>
                  <Button variant="contained" size="small" sx={dashContainedButtonSx}>
                    {t('membership.addCustomersHub.addCardCta')}
                  </Button>
                </Box>
              </Stack>
            </CardActionArea>
          </ContentCard>

          <Typography align="center" sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
            {t('membership.addCustomersHub.or')}
          </Typography>

          <ContentCard padded={false}>
            <CardActionArea
              onClick={() => navigate(spaceImportPeoplePath(spaceId))}
              aria-label={t('membership.addCustomersHub.importCardCta')}
              sx={{ p: `${DASHBOARD_UX.cardPadding}px` }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                <IconBadge accent="#3B82F6">
                  <FolderInput />
                </IconBadge>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                    {t('membership.addCustomersHub.importCardTitle')}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.5, mb: 1.5 }}>
                    {t('membership.addCustomersHub.importCardBody')}
                  </Typography>
                  <Button variant="outlined" size="small" sx={dashOutlinedButtonSx}>
                    {t('membership.addCustomersHub.importCardCta')}
                  </Button>
                </Box>
              </Stack>
            </CardActionArea>
          </ContentCard>

          <ContentCard>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <IconBadge accent="#D97706">
                <Lightbulb />
              </IconBadge>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                {t('membership.addCustomersHub.tip')}
              </Typography>
            </Box>
          </ContentCard>
        </Stack>
      </Stack>
    </PageContainer>
  );
}
