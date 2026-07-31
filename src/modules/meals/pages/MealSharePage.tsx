import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { LoadingState } from '@/shared/components/LoadingState';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { spaceMealsPath } from '@/routes/paths';
import type { MealType } from '@/shared/types/meals';
import { mealsApi } from '../api/mealsApi';
import { useDailyMenus, useMealMutations } from '../hooks/useMeals';
import { MEAL_TYPES, todayIsoDate } from '../utils/mealDates';

export function MealSharePage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const permissions = useSpacePermissions(spaceId);
  const menuDate = searchParams.get('date') || todayIsoDate();
  const mutations = useMealMutations(spaceId);
  const menus = useDailyMenus(spaceId, menuDate, permissions.canManageMeals);

  const [selected, setSelected] = useState<Record<MealType, boolean>>({
    BREAKFAST: true,
    LUNCH: true,
    DINNER: true,
  });
  const [openPolls, setOpenPolls] = useState(true);

  const preview = useQuery({
    queryKey: ['meal-share-preview', spaceId, menuDate],
    queryFn: () => mealsApi.getSharePreview(spaceId, menuDate),
    enabled: Boolean(spaceId && permissions.canManageMeals),
  });

  useEffect(() => {
    document.title = `${t('meals.share.title')} · ${t('common.appName')}`;
  }, [t]);

  const handlePublishAndShare = async () => {
    try {
      for (const mealType of MEAL_TYPES) {
        if (!selected[mealType]) {
          continue;
        }
        const menu = menus.menus.find((m) => m.mealType === mealType);
        if (!menu) {
          continue;
        }
        if (menu.status !== 'PUBLISHED') {
          await mutations.publishDailyMenu.mutateAsync({ menuDate, mealType });
        }
        if (openPolls) {
          await mutations.openMealPoll.mutateAsync({ menuDate, mealType });
        }
      }
      enqueueSnackbar(t('meals.share.success'), { variant: 'success' });
      navigate(spaceMealsPath(spaceId) + `?date=${menuDate}`);
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  const copyText = async () => {
    const text = preview.data?.messageText ?? '';
    try {
      await navigator.clipboard.writeText(text);
      enqueueSnackbar(t('meals.share.copied'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('meals.share.title')}
          description={t('meals.share.subtitle')}
          breadcrumbs={[
            { label: t('navigation.meals'), to: spaceMealsPath(spaceId) },
            { label: t('meals.share.title') },
          ]}
        />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={`${DASHBOARD_UX.cardGap}px`}>
          <Box sx={{ flex: 1 }}>
            <ContentCard>
              <TextField
                type="date"
                size="small"
                label={t('meals.share.date')}
                value={menuDate}
                onChange={(e) => setSearchParams({ date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ mb: 2 }}
              />
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1 }}>
                {t('meals.share.selectSlots')}
              </Typography>
              <Stack>
                {MEAL_TYPES.map((mealType) => {
                  const menu = menus.menus.find((m) => m.mealType === mealType);
                  return (
                    <FormControlLabel
                      key={mealType}
                      control={
                        <Checkbox
                          checked={selected[mealType]}
                          disabled={!menu}
                          onChange={(e) =>
                            setSelected((prev) => ({ ...prev, [mealType]: e.target.checked }))
                          }
                        />
                      }
                      label={`${t(`meals.mealType.${mealType}`)}${
                        menu ? ` · ${t(`meals.status.${menu.status}`)}` : ` · ${t('meals.planning.emptySlot')}`
                      }`}
                    />
                  );
                })}
              </Stack>
              <FormControlLabel
                control={
                  <Checkbox checked={openPolls} onChange={(e) => setOpenPolls(e.target.checked)} />
                }
                label={t('meals.share.openPolls')}
              />
            </ContentCard>
          </Box>

          <Box sx={{ flex: 1.2, minHeight: 280 }}>
            <ContentCard>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                  {t('meals.share.preview')}
                </Typography>
                <Button size="small" onClick={() => void copyText()} sx={dashOutlinedButtonSx}>
                  {t('meals.share.copy')}
                </Button>
              </Stack>
              {preview.isLoading ? (
                <LoadingState />
              ) : (
                <Box
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    m: 0,
                    ...DASHBOARD_UX.body,
                    color: s.textSecondary,
                  }}
                >
                  {preview.data?.messageText || t('meals.share.emptyPreview')}
                </Box>
              )}
            </ContentCard>
          </Box>
        </Stack>
      </Stack>

      <StickyFooter>
        <Button onClick={() => navigate(spaceMealsPath(spaceId))} sx={dashOutlinedButtonSx}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handlePublishAndShare()}
          sx={dashContainedButtonSx}
        >
          {t('meals.share.publish')}
        </Button>
      </StickyFooter>
    </PageContainer>
  );
}
