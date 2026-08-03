import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Copy,
  Share2,
  UtensilsCrossed,
} from 'lucide-react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { spaceMealsPath } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';
import type { MealType } from '@/shared/types/meals';
import { ShareMealSlotCheckbox } from '../components/ShareMealSlotCheckbox';
import { ShareMessagePreviewBubble } from '../components/ShareMessagePreviewBubble';
import { useDailyMenus } from '../hooks/useMeals';
import {
  formatMenuDateLabel,
  isPastMenuDate,
  MEAL_TYPES,
  todayIsoDate,
} from '../utils/mealDates';
import {
  buildShareMessageForSelection,
  defaultSelectedMealTypes,
  getSlotShareState,
  menusByMealType,
  openPollsForMealTypes,
  publishDraftMenusForTypes,
} from '../utils/shareMenuSelection';
import {
  listOtherShareTargetSpaces,
  shareMenusToSpace,
  validateShareMenusToSpace,
} from '../utils/shareMenuToSpaces';

export function MealSharePage() {
  const { t, i18n } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const permissions = useSpacePermissions(spaceId);
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const loadMySpaces = useSpaceStore((state) => state.loadMySpaces);

  const menuDate = searchParams.get('date') || todayIsoDate();
  const initialMealType = (searchParams.get('mealType') as MealType | null) ?? undefined;
  const dateReadOnly = isPastMenuDate(menuDate);

  const menusQuery = useDailyMenus(spaceId, menuDate, permissions.canManageMeals);

  const menuMap = useMemo(() => menusByMealType(menusQuery.menus), [menusQuery.menus]);
  const hasShareableSlot = MEAL_TYPES.some(
    (type) => getSlotShareState(menuMap[type]) === 'shareable',
  );

  const [selectedTypes, setSelectedTypes] = useState<MealType[]>([]);
  const [selectionReady, setSelectionReady] = useState(false);
  const [otherSpacesOpen, setOtherSpacesOpen] = useState(false);
  const [selectedOtherSpaceIds, setSelectedOtherSpaceIds] = useState<string[]>([]);
  const [messageReviewed, setMessageReviewed] = useState(false);
  const [messageHighlight, setMessageHighlight] = useState(false);
  const [sharing, setSharing] = useState(false);
  const messageSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = `${t('meals.planning.shareTitle')} · ${t('common.appName')}`;
  }, [t]);

  // Reset selection when date/space changes; apply defaults once menus arrive.
  useEffect(() => {
    setSelectionReady(false);
    setSelectedTypes([]);
    setSelectedOtherSpaceIds([]);
    setOtherSpacesOpen(false);
    setMessageReviewed(false);
  }, [menuDate, spaceId, initialMealType]);

  useEffect(() => {
    if (selectionReady || menusQuery.loading) {
      return;
    }
    setSelectedTypes(defaultSelectedMealTypes(menuMap, initialMealType));
    setSelectionReady(true);
  }, [selectionReady, menusQuery.loading, menuMap, initialMealType]);

  const otherSpaces = useMemo(
    () => listOtherShareTargetSpaces(mySpaces, spaceId),
    [mySpaces, spaceId],
  );

  const previewQuery = useQuery({
    queryKey: ['meal-share-preview-selection', spaceId, menuDate, selectedTypes.join(',')],
    queryFn: () =>
      buildShareMessageForSelection(spaceId, menuDate, selectedTypes, menuMap),
    enabled:
      Boolean(spaceId && permissions.canManageMeals && selectionReady) &&
      selectedTypes.length > 0 &&
      !menusQuery.loading,
    staleTime: 5_000,
  });

  const messageText = previewQuery.data ?? '';
  const progressiveContinue =
    !dateReadOnly && hasShareableSlot && selectedTypes.length > 0 && !messageReviewed;

  const toggleMealType = (type: MealType) => {
    setSelectedTypes((prev) => {
      const next = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type];
      if (next.length === 0) {
        setMessageReviewed(false);
      }
      return next;
    });
  };

  const continueToMessage = () => {
    setMessageReviewed(true);
    setMessageHighlight(true);
    messageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => setMessageHighlight(false), 1600);
  };

  const openOtherSpaces = async () => {
    const next = !otherSpacesOpen;
    setOtherSpacesOpen(next);
    setMessageReviewed(true);
    if (next && mySpaces.length === 0) {
      await loadMySpaces();
    }
  };

  const copyText = async () => {
    if (!messageText.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(messageText);
      enqueueSnackbar(t('meals.share.copied'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  const handleShare = useCallback(async () => {
    if (dateReadOnly || selectedTypes.length === 0 || !messageText.trim()) {
      return;
    }
    setSharing(true);
    try {
      const targets = otherSpaces.filter((space) =>
        selectedOtherSpaceIds.includes(space.spaceId),
      );

      for (const target of targets) {
        const validation = await validateShareMenusToSpace(menuMap, selectedTypes, target);
        if (!validation.ok) {
          enqueueSnackbar(
            t('meals.planning.shareToSpaceIncompatible', {
              space: validation.spaceName,
              items: validation.missingLabels.join(', '),
            }),
            { variant: 'error' },
          );
          return;
        }
      }

      await publishDraftMenusForTypes(spaceId, menuDate, selectedTypes, menuMap);
      await menusQuery.reload();

      const opened = await openPollsForMealTypes(spaceId, menuDate, selectedTypes);
      if (opened > 0) {
        enqueueSnackbar(t('meals.poll.autoOpened'), { variant: 'success' });
      }

      let sharedOther = 0;
      for (const target of targets) {
        const validation = await validateShareMenusToSpace(menuMap, selectedTypes, target);
        if (!validation.ok) {
          continue;
        }
        try {
          await shareMenusToSpace(target.spaceId, menuDate, selectedTypes, validation);
          sharedOther += 1;
        } catch {
          enqueueSnackbar(
            t('meals.planning.shareToSpaceFailed', { space: target.spaceName }),
            { variant: 'warning' },
          );
        }
      }
      if (sharedOther > 0) {
        enqueueSnackbar(
          t('meals.planning.shareToSpacesSuccess', { count: sharedOther }),
          { variant: 'success' },
        );
      }

      try {
        await navigator.clipboard.writeText(messageText);
        enqueueSnackbar(t('meals.share.copied'), { variant: 'success' });
      } catch {
        // Clipboard optional on some browsers
      }

      enqueueSnackbar(t('meals.share.success'), { variant: 'success' });
      navigate(`${spaceMealsPath(spaceId)}?date=${menuDate}`);
    } catch {
      enqueueSnackbar(t('meals.errors.actionFailed', { defaultValue: t('common.errors.generic') }), {
        variant: 'error',
      });
    } finally {
      setSharing(false);
    }
  }, [
    dateReadOnly,
    enqueueSnackbar,
    menuDate,
    menuMap,
    menusQuery,
    messageText,
    navigate,
    otherSpaces,
    selectedOtherSpaceIds,
    selectedTypes,
    spaceId,
    t,
  ]);

  const currentSpaceName =
    mySpaces.find((space) => space.spaceId === spaceId)?.spaceName ?? t('meals.planning.shareToCurrentSpace');

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%', pb: 10 }}>
        {/* Hero */}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: `${DASHBOARD_UX.radius + 6}px`,
            border: `1px solid ${colors.primary}33`,
            bgcolor: s.successTint,
            boxShadow: s.shadow,
            p: 2.25,
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              width: 140,
              height: 140,
              borderRadius: '50%',
              bgcolor: `${colors.primary}14`,
              top: -40,
              right: -30,
            }}
          />
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
              bgcolor: s.surface,
              border: `1px solid ${s.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.25,
              boxShadow: s.shadow,
            }}
          >
            <Share2 size={18} color={colors.primaryDark} strokeWidth={2.2} />
          </Box>
          <Typography sx={{ ...DASHBOARD_UX.sidebarSection, color: s.textMuted }}>
            {formatMenuDateLabel(menuDate, i18n.language)}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.pageTitle, color: s.textPrimary, mt: 0.5 }}>
            {t('meals.planning.previewShare')}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.5, maxWidth: 560 }}>
            {t('meals.planning.shareHint')}
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={`${DASHBOARD_UX.cardGap}px`}>
          {/* Left: date + slots */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <ContentCard>
              <TextField
                type="date"
                size="small"
                label={t('meals.share.date')}
                value={menuDate}
                disabled={sharing}
                onChange={(e) => setSearchParams({ date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ mb: 2, maxWidth: 220 }}
              />

              {dateReadOnly ? (
                <Box
                  sx={{
                    mb: 2,
                    p: 1.25,
                    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                    bgcolor: s.warningTint,
                    border: `1px solid rgba(245, 158, 11, 0.35)`,
                  }}
                >
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                    {t('meals.planning.pastDateReadOnly')}
                  </Typography>
                </Box>
              ) : null}

              {menusQuery.loading ? (
                <LoadingState />
              ) : !hasShareableSlot ? (
                <EmptyState
                  icon={<UtensilsCrossed size={28} />}
                  title={t('meals.planning.shareEmpty')}
                  description={t('meals.planning.shareSelectAtLeastOne')}
                />
              ) : (
                <>
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1 }}>
                    {t('meals.planning.shareSelectMeals')}
                  </Typography>
                  {MEAL_TYPES.map((mealType) => (
                    <ShareMealSlotCheckbox
                      key={mealType}
                      mealType={mealType}
                      menu={menuMap[mealType]}
                      selected={selectedTypes.includes(mealType)}
                      disabled={dateReadOnly || sharing}
                      onToggle={() => toggleMealType(mealType)}
                    />
                  ))}
                  {selectedTypes.length === 0 ? (
                    <Typography sx={{ ...DASHBOARD_UX.caption, color: colors.danger, mt: 0.5 }}>
                      {t('meals.planning.shareSelectAtLeastOne')}
                    </Typography>
                  ) : null}
                </>
              )}
            </ContentCard>
          </Box>

          {/* Right: other spaces + preview */}
          <Box sx={{ flex: 1.15, minWidth: 0 }} ref={messageSectionRef}>
            <ContentCard>
              <Box
                sx={{
                  outline: messageHighlight ? `2px solid ${colors.primary}` : 'none',
                  outlineOffset: 4,
                  borderRadius: `${DASHBOARD_UX.radius}px`,
                  transition: 'outline-color 200ms ease',
                }}
              >
                {!dateReadOnly && hasShareableSlot ? (
                  <Box sx={{ mb: 2 }}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => void openOtherSpaces()}
                      sx={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        border: `1px solid ${s.border}`,
                        borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                        bgcolor: s.elevated,
                        p: 1.25,
                        cursor: 'pointer',
                        textAlign: 'left',
                        mb: otherSpacesOpen ? 1.25 : 0,
                      }}
                    >
                      <Building2 size={16} color={colors.primaryDark} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
                          {otherSpacesOpen
                            ? t('meals.planning.shareToOtherSpacesHide')
                            : t('meals.planning.shareToOtherSpacesShow')}
                        </Typography>
                        <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                          {selectedOtherSpaceIds.length > 0
                            ? t('meals.planning.shareToOtherSpacesSelected', {
                                count: selectedOtherSpaceIds.length,
                              })
                            : t('meals.planning.shareToOtherSpacesHint')}
                        </Typography>
                      </Box>
                      {otherSpacesOpen ? (
                        <ChevronUp size={16} color={s.textMuted} />
                      ) : (
                        <ChevronDown size={16} color={s.textMuted} />
                      )}
                    </Box>

                    <Collapse in={otherSpacesOpen}>
                      <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mb: 1 }}>
                        {t('meals.planning.shareToHint')}
                      </Typography>
                      <SpaceCheckRow
                        label={currentSpaceName}
                        hint={t('meals.planning.shareToCurrent')}
                        checked
                        locked
                      />
                      {otherSpaces.length === 0 ? (
                        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted, py: 1 }}>
                          {t('meals.planning.shareToNoOtherSpaces')}
                        </Typography>
                      ) : (
                        otherSpaces.map((space) => (
                          <SpaceCheckRow
                            key={space.spaceId}
                            label={space.spaceName}
                            hint={space.spaceType}
                            checked={selectedOtherSpaceIds.includes(space.spaceId)}
                            onChange={(checked) => {
                              setMessageReviewed(true);
                              setSelectedOtherSpaceIds((prev) =>
                                checked
                                  ? [...prev, space.spaceId]
                                  : prev.filter((id) => id !== space.spaceId),
                              );
                            }}
                          />
                        ))
                      )}
                    </Collapse>
                  </Box>
                ) : null}

                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                    {t('meals.share.preview')}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Copy size={14} />}
                    disabled={!messageText.trim() || previewQuery.isFetching}
                    onClick={() => void copyText()}
                    sx={dashOutlinedButtonSx}
                  >
                    {t('meals.share.copy')}
                  </Button>
                </Stack>

                <ShareMessagePreviewBubble
                  spaceId={spaceId}
                  spaceName={currentSpaceName}
                  menuDate={menuDate}
                  selectedTypes={selectedTypes}
                  menuMap={menuMap}
                  loading={previewQuery.isFetching && selectedTypes.length > 0}
                />
              </Box>
            </ContentCard>
          </Box>
        </Stack>
      </Stack>

      {!dateReadOnly && hasShareableSlot ? (
        <StickyFooter>
          {progressiveContinue ? (
            <>
              <Box sx={{ flex: 1, mr: 'auto', minWidth: 0 }}>
                <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                  {t('progressiveWorkflow.stepOf', { current: 1, total: 2 })}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary }} noWrap>
                  {t('progressiveWorkflow.sharePreview.progressSlotsNext')}
                </Typography>
              </Box>
              <Button
                onClick={() => navigate(spaceMealsPath(spaceId))}
                disabled={sharing}
                sx={dashOutlinedButtonSx}
              >
                {t('common.cancel')}
              </Button>
              <Button variant="contained" onClick={continueToMessage} sx={dashContainedButtonSx}>
                {t('progressiveWorkflow.sharePreview.continueToMessage')}
              </Button>
            </>
          ) : (
            <>
              <Box sx={{ flex: 1, mr: 'auto', minWidth: 0 }}>
                <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                  {t('progressiveWorkflow.stepOf', { current: 2, total: 2 })}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary }} noWrap>
                  {t('progressiveWorkflow.sharePreview.progressReady')}
                </Typography>
              </Box>
              <Button
                onClick={() => navigate(spaceMealsPath(spaceId))}
                disabled={sharing}
                sx={dashOutlinedButtonSx}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="contained"
                startIcon={sharing ? <CircularProgress size={14} color="inherit" /> : <Share2 size={14} />}
                disabled={
                  sharing ||
                  selectedTypes.length === 0 ||
                  !messageText.trim() ||
                  previewQuery.isFetching
                }
                onClick={() => void handleShare()}
                sx={dashContainedButtonSx}
              >
                {sharing
                  ? t('meals.poll.openingPolls')
                  : t('meals.planning.copyMessage')}
              </Button>
            </>
          )}
        </StickyFooter>
      ) : (
        <StickyFooter>
          <Button onClick={() => navigate(spaceMealsPath(spaceId))} sx={dashOutlinedButtonSx}>
            {t('common.cancel')}
          </Button>
        </StickyFooter>
      )}
    </PageContainer>
  );
}

function SpaceCheckRow({
  label,
  hint,
  checked,
  locked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  locked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={checked}
          disabled={locked}
          onChange={(_, value) => onChange?.(value)}
          size="small"
        />
      }
      label={
        <Box>
          <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
            {label}
          </Typography>
          {hint ? (
            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>{hint}</Typography>
          ) : null}
        </Box>
      }
      sx={{
        m: 0,
        mb: 0.75,
        width: '100%',
        alignItems: 'flex-start',
        px: 1,
        py: 0.75,
        borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        bgcolor: checked ? s.successTint : s.surface,
        border: `1px solid ${checked ? colors.primary : s.border}`,
      }}
    />
  );
}
