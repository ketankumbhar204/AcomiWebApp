import { Box, Button, ToggleButton, ToggleButtonGroup, Typography, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import { mealsApi } from '@/modules/meals/api/mealsApi';
import {
  buildMealResponseLists,
  type MealResponseFilter,
} from '@/modules/meals/utils/mealResponseMembers';
import { formatMenuDateLabel } from '@/modules/meals/utils/mealDates';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { spaceMealsEditPath } from '@/routes/paths';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import type { MealType } from '@/shared/types/meals';

const FILTERS: MealResponseFilter[] = ['eligible', 'responded', 'not_responded'];

function isMealType(value: string | null): value is MealType {
  return value === 'BREAKFAST' || value === 'LUNCH' || value === 'DINNER';
}

export function MealResponsesPage() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const [searchParams] = useSearchParams();
  const menuDate = searchParams.get('date') ?? '';
  const mealTypeParam = searchParams.get('mealType');
  const mealType = isMealType(mealTypeParam) ? mealTypeParam : null;
  const [filter, setFilter] = useState<MealResponseFilter>('responded');

  const detailQuery = useQuery({
    queryKey: ['meal-responses', spaceId, menuDate, mealType],
    queryFn: () => mealsApi.getMealHeadcountDetail(spaceId, menuDate, mealType!),
    enabled: Boolean(spaceId && menuDate && mealType),
  });

  const lists = useMemo(() => buildMealResponseLists(detailQuery.data), [detailQuery.data]);
  const rows =
    filter === 'eligible'
      ? lists.eligible
      : filter === 'not_responded'
        ? lists.notResponded
        : lists.responded;
  const mealLabel = mealType
    ? t(`meals.mealType.${mealType}`)
    : t('meals.responses.title', { meal: '', defaultValue: 'Responses' });

  const emptyCopy =
    filter === 'responded'
      ? {
          title: t('meals.responses.emptyRespondedTitle'),
          description: t('meals.responses.emptyRespondedBody'),
        }
      : filter === 'not_responded'
        ? {
            title: t('meals.responses.emptyNotRespondedTitle'),
            description: t('meals.responses.emptyNotRespondedBody'),
          }
        : {
            title: t('meals.responses.emptyEligibleTitle'),
            description: t('meals.responses.emptyEligibleBody'),
          };

  return (
    <PageContainer>
      <Box>
        <Typography sx={{ ...DASHBOARD_UX.pageTitle, color: s.textPrimary }}>
          {t('meals.responses.title', { meal: mealLabel })}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.5 }}>
          {menuDate
            ? t('meals.responses.subtitle', {
                meal: mealLabel,
                date: formatMenuDateLabel(menuDate, i18n.language),
              })
            : null}
        </Typography>
      </Box>

      <ToggleButtonGroup
        exclusive
        value={filter}
        onChange={(_, value: MealResponseFilter | null) => {
          if (value) setFilter(value);
        }}
        size="small"
      >
        {FILTERS.map((id) => {
          const count =
            id === 'eligible'
              ? lists.eligible.length
              : id === 'not_responded'
                ? lists.notResponded.length
                : lists.responded.length;
          const label =
            id === 'eligible'
              ? t('meals.responses.filterEligible')
              : id === 'not_responded'
                ? t('meals.responses.filterNotResponded')
                : t('meals.responses.filterResponded');
          return (
            <ToggleButton key={id} value={id}>
              {label} ({count})
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>

      {!mealType || !menuDate ? (
        <EmptyState
          title={t('meals.responses.loadErrorTitle')}
          description={t('meals.responses.loadErrorBody')}
        />
      ) : detailQuery.isLoading ? (
        <LoadingState />
      ) : detailQuery.isError ? (
        <EmptyState
          title={t('meals.responses.loadErrorTitle')}
          description={t('meals.responses.loadErrorBody')}
          action={
            <Button variant="outlined" onClick={() => void detailQuery.refetch()}>
              {t('meals.responses.retry')}
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState title={emptyCopy.title} description={emptyCopy.description} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {rows.map((row) => (
            <ContentCard key={row.memberId}>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                {row.memberName}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                {row.responded
                  ? row.choice || t('meals.responses.respondedChoice')
                  : t('meals.responses.notRespondedChoice')}
              </Typography>
            </ContentCard>
          ))}
        </Box>
      )}

      {mealType && menuDate ? (
        <Button
          component={RouterLink}
          to={spaceMealsEditPath(spaceId, { date: menuDate, mealType })}
          variant="text"
          sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
        >
          {t('meals.responses.editMenu')}
        </Button>
      ) : null}
    </PageContainer>
  );
}
