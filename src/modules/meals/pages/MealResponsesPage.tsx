import { Box, Button, InputAdornment, TextField, Typography, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronRight, Clock, Phone, Search, UserRound, Utensils, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import { mealsApi } from '@/modules/meals/api/mealsApi';
import {
  buildMealResponseLists,
  matchesMealResponseSearch,
  mealResponseCardStatus,
  type MealResponseFilter,
  type MealResponseMemberRow,
} from '@/modules/meals/utils/mealResponseMembers';
import { formatMenuDateLabel } from '@/modules/meals/utils/mealDates';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { spaceMealsEditPath, spaceMemberPath } from '@/routes/paths';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import type { MealType } from '@/shared/types/meals';
import { formatMemberContactNumber } from '@/shared/utils/indianMobile';

const FILTERS: MealResponseFilter[] = ['eligible', 'responded', 'not_responded'];

const AVATAR_TONES = [
  { bg: '#ECFBF3', fg: '#059669' },
  { bg: '#F4F0FF', fg: '#6D28D9' },
  { bg: '#FFF4EC', fg: '#C2410C' },
  { bg: '#EEF4FF', fg: '#1D4ED8' },
] as const;

const STATUS_TONE: Record<MealResponseFilter, { fg: string; bg: string; Icon: LucideIcon }> = {
  eligible: { fg: '#059669', bg: '#ECFBF3', Icon: UserRound },
  responded: { fg: '#1D4ED8', bg: '#EEF4FF', Icon: Check },
  not_responded: { fg: '#C2410C', bg: '#FFF4EC', Icon: Clock },
};

function isMealType(value: string | null): value is MealType {
  return value === 'BREAKFAST' || value === 'LUNCH' || value === 'DINNER';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function avatarTone(memberId: string) {
  let hash = 0;
  for (let i = 0; i < memberId.length; i += 1) {
    hash = (hash + memberId.charCodeAt(i)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash];
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
  const [query, setQuery] = useState('');

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
  const visibleRows = useMemo(
    () => rows.filter((row) => matchesMealResponseSearch(row, query)),
    [query, rows],
  );
  const mealLabel = mealType
    ? t(`meals.mealType.${mealType}`)
    : t('meals.responses.title', { meal: '', defaultValue: 'Responses' });
  const searchPlaceholder = t('meals.responses.searchPlaceholder', {
    defaultValue: 'Search by name or mobile',
  });

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

  const chipStyle = (id: MealResponseFilter, selected: boolean) => {
    const tone = STATUS_TONE[id];
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      borderRadius: 999,
      border: '1px solid',
      borderColor: tone.fg,
      borderWidth: selected ? 1.5 : 1,
      bgcolor: tone.bg,
      color: tone.fg,
      px: 1.25,
      py: 0.5,
      cursor: 'pointer',
      font: 'inherit',
      fontSize: '0.75rem',
      fontWeight: selected ? 700 : 600,
      whiteSpace: 'nowrap' as const,
    };
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

      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
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
          const selected = filter === id;
          return (
            <Box
              key={id}
              component="button"
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(id)}
              sx={chipStyle(id, selected)}
            >
              {label}
              <Box
                component="span"
                sx={{
                  minWidth: 18,
                  height: 18,
                  px: 0.5,
                  borderRadius: 9,
                  bgcolor: STATUS_TONE[id].fg,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {count}
              </Box>
            </Box>
          );
        })}
      </Box>

      {mealType && menuDate && !detailQuery.isLoading && !detailQuery.isError ? (
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          size="small"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            },
            htmlInput: { 'aria-label': searchPlaceholder },
          }}
        />
      ) : null}

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
      ) : visibleRows.length === 0 ? (
        <EmptyState
          title={
            query.trim()
              ? t('meals.responses.searchEmptyTitle', { defaultValue: 'No matching members' })
              : emptyCopy.title
          }
          description={
            query.trim()
              ? t('meals.responses.searchEmptyBody', {
                  defaultValue: 'Try a different name or mobile number.',
                })
              : emptyCopy.description
          }
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          {visibleRows.map((row) => (
            <ResponseCard
              key={row.memberId}
              row={row}
              filter={filter}
              href={spaceMemberPath(spaceId, row.memberId)}
              statusLabel={t(statusKey(mealResponseCardStatus(row, filter)))}
              mealLabel={
                row.choice?.trim() || t('meals.poll.notSelected', { defaultValue: 'Not selected' })
              }
            />
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

function statusKey(status: MealResponseFilter): string {
  if (status === 'eligible') return 'meals.responses.filterEligible';
  if (status === 'not_responded') return 'meals.responses.filterNotResponded';
  return 'meals.responses.filterResponded';
}

function ResponseCard({
  row,
  filter,
  href,
  statusLabel,
  mealLabel,
}: {
  row: MealResponseMemberRow;
  filter: MealResponseFilter;
  href: string;
  statusLabel: string;
  mealLabel: string;
}) {
  const status = mealResponseCardStatus(row, filter);
  const tone = STATUS_TONE[status];
  const avatar = avatarTone(row.memberId);
  const phone = formatMemberContactNumber(row.mobileNumber);
  const StatusIcon = tone.Icon;

  return (
    <Box
      component={RouterLink}
      to={href}
      aria-label={`${row.memberName}, ${statusLabel}, ${mealLabel}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.25,
        py: 1,
        minWidth: 0,
        textDecoration: 'none',
        color: 'inherit',
        bgcolor: '#fff',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          bgcolor: avatar.bg,
          color: avatar.fg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials(row.memberName)}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ ...DASHBOARD_UX.cardTitle, color: 'text.primary' }}>
          {row.memberName}
        </Typography>
        {phone ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, mt: 0.25 }}>
            <Phone size={12} color="#94A3B8" />
            <Typography noWrap sx={{ fontSize: 12, color: 'text.secondary' }}>
              {phone}
            </Typography>
          </Box>
        ) : null}
      </Box>
      <Box sx={{ width: '1px', alignSelf: 'stretch', bgcolor: 'divider' }} />
      <Box sx={{ width: '38%', maxWidth: 160, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            gap: 0.5,
            maxWidth: '100%',
            bgcolor: tone.bg,
            color: tone.fg,
            borderRadius: 999,
            px: 0.75,
            py: 0.25,
          }}
        >
          <StatusIcon size={12} />
          <Typography noWrap sx={{ fontSize: 12, fontWeight: 700, color: tone.fg }}>
            {statusLabel}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
          <Utensils size={12} color="#94A3B8" />
          <Typography noWrap sx={{ fontSize: 12, color: 'text.secondary' }}>
            {mealLabel}
          </Typography>
        </Box>
      </Box>
      <ChevronRight size={18} color="#94A3B8" />
    </Box>
  );
}
