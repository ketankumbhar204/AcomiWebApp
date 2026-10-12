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
import { useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ChevronDown, ChevronUp, Copy, Share2, UtensilsCrossed } from 'lucide-react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import { GuidedStepPanel } from '@/shared/components/GuidedStepPanel';
import { StickyFooter, StickyFooterClearance } from '@/shared/components/StickyFooter';
import { guidedStepFooterHostSx } from '@/shared/theme/guidedStepFooterHostSx';
import { colors } from '@/shared/theme/colors';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
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
  mapWithConcurrency,
  SHARE_SPACE_CONCURRENCY,
  shareMenusToSpace,
  validateShareMenusToSpace,
} from '../utils/shareMenuToSpaces';
import {
  defaultOtherSpaceIds,
  nextOtherSpaceSelection,
  otherSpaceSelectAllState,
  selectedShareDestinations,
  shouldOfferOtherSpaceShare,
} from '../utils/otherSpaceShareSelection';
import {
  resolveMealReviewIntent,
  shouldOpenExternalShare,
  shouldPublishMenu,
} from '../utils/mealReviewIntent';
import { clearDayShareFailed, markDayShareFailed } from '../utils/dayShareFailure';

export function MealSharePage() {
  const { t, i18n } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const permissions = useSpacePermissions(spaceId);
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const loadMySpaces = useSpaceStore((state) => state.loadMySpaces);

  const menuDate = searchParams.get('date') || todayIsoDate();
  const initialMealType = (searchParams.get('mealType') as MealType | null) ?? undefined;
  const reviewIntent = resolveMealReviewIntent(searchParams.get('intent'));
  const externalShare = shouldOpenExternalShare(reviewIntent);
  const publishMenu = shouldPublishMenu(reviewIntent);
  const dateReadOnly = isPastMenuDate(menuDate);

  const menusQuery = useDailyMenus(spaceId, menuDate, permissions.canManageMeals);

  const menuMap = useMemo(() => menusByMealType(menusQuery.menus), [menusQuery.menus]);
  const hasShareableSlot = MEAL_TYPES.some(
    (type) => getSlotShareState(menuMap[type]) === 'shareable',
  );

  const [selectedTypes, setSelectedTypes] = useState<MealType[]>([]);
  const [selectionReady, setSelectionReady] = useState(false);
  const [otherSpacesOpen, setOtherSpacesOpen] = useState(false);
  const [spaceQuery, setSpaceQuery] = useState('');
  const [selectedOtherSpaceIds, setSelectedOtherSpaceIds] = useState<string[]>([]);
  const [messageReviewed, setMessageReviewed] = useState(false);
  const [messageHighlight, setMessageHighlight] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [sharePhase, setSharePhase] = useState<'saving' | 'opening' | 'sharing' | null>(null);
  const sharingRef = useRef(false);
  const openedCurrentMeals = useRef(new Set<MealType>());
  const openedBySpace = useRef(new Map<string, MealType[]>());
  const messageSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = `${t('meals.planning.shareTitle')} · ${t('common.appName')}`;
  }, [t]);

  // Reset selection when date/space changes; apply defaults once menus arrive.
  useEffect(() => {
    setSelectionReady(false);
    setSelectedTypes([]);
    setMessageReviewed(false);
  }, [menuDate, spaceId, initialMealType, reviewIntent]);

  useEffect(() => {
    if (selectionReady || menusQuery.loading) {
      return;
    }
    setSelectedTypes(
      defaultSelectedMealTypes(menuMap, initialMealType, {
        includePublished: reviewIntent === 'reshare',
      }),
    );
    setSelectionReady(true);
  }, [selectionReady, menusQuery.loading, menuMap, initialMealType, reviewIntent]);

  const otherSpaces = useMemo(
    () => listOtherShareTargetSpaces(mySpaces, spaceId),
    [mySpaces, spaceId],
  );
  const offerOtherSpaces = shouldOfferOtherSpaceShare(otherSpaces.length);
  const otherSpaceKey = otherSpaces.map((space) => space.spaceId).join('|');
  const eligibleOtherIds = useMemo(() => otherSpaces.map((space) => space.spaceId), [otherSpaces]);
  const selectedOtherCount = useMemo(
    () => selectedOtherSpaceIds.filter((id) => eligibleOtherIds.includes(id)).length,
    [eligibleOtherIds, selectedOtherSpaceIds],
  );
  const selectAllState = otherSpaceSelectAllState(eligibleOtherIds, selectedOtherSpaceIds);
  const visibleOtherSpaces = useMemo(() => {
    const query = spaceQuery.trim().toLowerCase();
    if (!query) {
      return otherSpaces;
    }
    return otherSpaces.filter((space) =>
      `${space.spaceName} ${space.address ?? ''}`.toLowerCase().includes(query),
    );
  }, [otherSpaces, spaceQuery]);

  useEffect(() => {
    void loadMySpaces();
  }, [loadMySpaces, spaceId]);

  useEffect(() => {
    const ids = otherSpaceKey ? otherSpaceKey.split('|') : [];
    setSelectedOtherSpaceIds(defaultOtherSpaceIds(ids.map((id) => ({ spaceId: id }))));
    setOtherSpacesOpen(false);
    setSpaceQuery('');
    if (!sharingRef.current) {
      openedCurrentMeals.current = new Set();
      openedBySpace.current = new Map();
    }
  }, [menuDate, otherSpaceKey, spaceId]);

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
    if (sharingRef.current || dateReadOnly || selectedTypes.length === 0 || !messageText.trim()) {
      return;
    }
    sharingRef.current = true;
    setSharing(true);
    setSharePhase('saving');
    try {
      const targets = selectedShareDestinations(otherSpaces, selectedOtherSpaceIds);

      const validations = await mapWithConcurrency(targets, SHARE_SPACE_CONCURRENCY, async (target) => ({
        target,
        validation: await validateShareMenusToSpace(menuMap, selectedTypes, target),
      }));
      const incompatible = validations.find((row) => !row.validation.ok);
      if (incompatible && !incompatible.validation.ok) {
        enqueueSnackbar(
          t('meals.planning.shareToSpaceIncompatible', {
            space: incompatible.validation.spaceName,
            items: incompatible.validation.missingLabels.join(', '),
          }),
          { variant: 'error' },
        );
        return;
      }

      if (publishMenu) {
        await publishDraftMenusForTypes(spaceId, menuDate, selectedTypes, menuMap);
        const pendingPolls = selectedTypes.filter((type) => !openedCurrentMeals.current.has(type));
        if (pendingPolls.length > 0) {
          setSharePhase('opening');
          const pollResult = await openPollsForMealTypes(spaceId, menuDate, pendingPolls);
          pollResult.opened.forEach((type) => openedCurrentMeals.current.add(type));
          const opened = pollResult.opened.length;
          if (opened === 0) {
            enqueueSnackbar(t('meals.errors.saveFailed', { defaultValue: 'Could not save menu.' }), {
              variant: 'error',
            });
            return;
          }
          if (pollResult.failed.length > 0) {
            enqueueSnackbar(t('meals.errors.saveFailed', { defaultValue: 'Could not save menu.' }), {
              variant: 'error',
            });
            return;
          }
        }
        enqueueSnackbar(t('meals.poll.autoOpened'), { variant: 'success' });
      }

      const readyTargets = validations.flatMap((row) =>
        row.validation.ok ? [{ target: row.target, validation: row.validation }] : [],
      );
      const pendingTargets = readyTargets.filter((row) =>
        selectedTypes.some((type) => {
          const options = row.validation.optionsByMeal[type];
          const opened = openedBySpace.current.get(row.target.spaceId) ?? [];
          return Boolean(options && options.length > 0) && !opened.includes(type);
        }),
      );

      let sharedOther = 0;
      let otherFailed = false;
      if (pendingTargets.length > 0) {
        setSharePhase('sharing');
        const shareResults = await mapWithConcurrency(
          pendingTargets,
          SHARE_SPACE_CONCURRENCY,
          async (row) => {
            try {
              const shared = await shareMenusToSpace(
                row.target.spaceId,
                menuDate,
                selectedTypes,
                row.validation,
                openedBySpace.current.get(row.target.spaceId) ?? [],
              );
              openedBySpace.current.set(row.target.spaceId, shared.opened);
              return shared.failed.length === 0;
            } catch {
              return false;
            }
          },
        );
        shareResults.forEach((ok, index) => {
          if (ok) {
            sharedOther += 1;
            return;
          }
          otherFailed = true;
          enqueueSnackbar(
            t('meals.planning.shareToSpaceFailed', { space: pendingTargets[index]?.target.spaceName }),
            { variant: 'warning' },
          );
        });
      }
      if (otherFailed) {
        return;
      }
      if (sharedOther > 0) {
        enqueueSnackbar(t('meals.planning.shareToSpacesSuccess', { count: sharedOther }), {
          variant: 'success',
        });
      }

      if (externalShare) {
        try {
          await navigator.clipboard.writeText(messageText);
          enqueueSnackbar(t('meals.share.copied'), { variant: 'success' });
        } catch {
          // Clipboard optional on some browsers. The meal and poll stay published.
        }
        enqueueSnackbar(t('meals.share.success'), { variant: 'success' });
      }
      clearDayShareFailed(spaceId, menuDate);
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = String(query.queryKey[0]);
          return (
            key.includes('daily-menu') ||
            key.includes('meal-poll') ||
            key.includes('meal-headcount') ||
            key.includes('meal-eligibility')
          );
        },
      });
      sharingRef.current = false;
      navigate(spaceMealsPath(spaceId, menuDate), { replace: true });
    } catch {
      markDayShareFailed(spaceId, menuDate);
      enqueueSnackbar(t('meals.errors.saveFailed', { defaultValue: 'Could not save menu.' }), {
        variant: 'error',
      });
    } finally {
      sharingRef.current = false;
      setSharing(false);
      setSharePhase(null);
    }
  }, [
    dateReadOnly,
    enqueueSnackbar,
    menuDate,
    menuMap,
    queryClient,
    externalShare,
    publishMenu,
    messageText,
    navigate,
    otherSpaces,
    selectedOtherSpaceIds,
    selectedTypes,
    spaceId,
    t,
  ]);

  const shareExitBlocker = useBlocker(
    ({ historyAction }) => sharing && historyAction === 'POP',
  );
  useEffect(() => {
    if (shareExitBlocker.state === 'blocked') {
      shareExitBlocker.reset();
    }
  }, [shareExitBlocker]);

  const currentSpace = mySpaces.find((space) => space.spaceId === spaceId);
  const currentSpaceName = currentSpace?.spaceName ?? t('meals.planning.shareToCurrentSpace');
  const otherSpaceCountLabel =
    selectedOtherCount === 0
      ? t('meals.planning.shareToOtherNone')
      : t('meals.planning.shareToOtherCount', { count: selectedOtherCount });

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
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
            {t(externalShare ? 'meals.planning.previewShare' : 'meals.planning.reviewSaveTitle')}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.5, maxWidth: 560 }}>
            {t(externalShare ? 'meals.planning.shareHint' : 'meals.planning.reviewSaveHint')}
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
                onChange={(e) => {
                  const next = new URLSearchParams(searchParams);
                  next.set('date', e.target.value);
                  setSearchParams(next);
                }}
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
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                        {t('meals.planning.shareToSection')}
                      </Typography>
                      {offerOtherSpaces ? (
                        <Box
                          component="button"
                          type="button"
                          onClick={() => void openOtherSpaces()}
                          aria-expanded={otherSpacesOpen}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            maxWidth: '62%',
                            border: `1px solid ${colors.primary}`,
                            borderRadius: 999,
                            bgcolor: colors.lightGreen,
                            color: colors.tealDark,
                            px: 1.25,
                            py: 0.5,
                            cursor: 'pointer',
                            ...DASHBOARD_UX.caption,
                            fontWeight: 700,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {otherSpaceCountLabel}
                          </Box>
                          {otherSpacesOpen ? (
                            <ChevronUp size={16} color={colors.tealDark} />
                          ) : (
                            <ChevronDown size={16} color={colors.tealDark} />
                          )}
                        </Box>
                      ) : null}
                    </Box>

                    <SpaceCheckRow
                      label={currentSpaceName}
                      hint={currentSpace?.address?.trim() || undefined}
                      badge={t('meals.planning.shareToCurrent')}
                      checked
                      locked
                    />

                    {offerOtherSpaces ? (
                      <Collapse in={otherSpacesOpen}>
                        <SpaceCheckRow
                          label={t('meals.planning.shareToSelectAll', { count: otherSpaces.length })}
                          checked={selectAllState === 'all'}
                          indeterminate={selectAllState === 'some'}
                          onChange={() => {
                            setMessageReviewed(true);
                            setSelectedOtherSpaceIds(
                              nextOtherSpaceSelection(eligibleOtherIds, selectedOtherSpaceIds),
                            );
                          }}
                        />
                        {otherSpaces.length > 6 ? (
                          <TextField
                            value={spaceQuery}
                            onChange={(event) => setSpaceQuery(event.target.value)}
                            placeholder={t('meals.planning.shareToSearch')}
                            size="small"
                            fullWidth
                            sx={{ mb: 1 }}
                          />
                        ) : null}
                        {visibleOtherSpaces.map((space) => (
                          <SpaceCheckRow
                            key={space.spaceId}
                            label={space.spaceName}
                            hint={space.address?.trim() || undefined}
                            checked={selectedOtherSpaceIds.includes(space.spaceId)}
                            onChange={(checked) => {
                              setMessageReviewed(true);
                              setSelectedOtherSpaceIds((prev) =>
                                checked
                                  ? prev.includes(space.spaceId)
                                    ? prev
                                    : [...prev, space.spaceId]
                                  : prev.filter((id) => id !== space.spaceId),
                              );
                            }}
                          />
                        ))}
                      </Collapse>
                    ) : null}
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

      <StickyFooterClearance
        height={
          !dateReadOnly && hasShareableSlot
            ? { xs: 460, sm: 420, md: 360 }
            : { xs: 96, md: 80 }
        }
      />

      {!dateReadOnly && hasShareableSlot ? (
        <StickyFooter pin="fixed" sx={guidedStepFooterHostSx}>
          <GuidedStepPanel
            stepLabel={t('progressiveWorkflow.stepOf', {
              current: progressiveContinue ? 1 : 2,
              total: 2,
            })}
            stepCurrent={progressiveContinue ? 1 : 2}
            stepTotal={2}
            progressLine={
              progressiveContinue
                ? t('progressiveWorkflow.sharePreview.progressSlotsNext')
                : t('progressiveWorkflow.sharePreview.progressReady')
            }
            eyebrow={progressiveContinue ? t('progressiveWorkflow.nextStep') : undefined}
            title={
              progressiveContinue
                ? t('progressiveWorkflow.sharePreview.reviewMessageTitle')
                : undefined
            }
            description={
              progressiveContinue
                ? t('progressiveWorkflow.sharePreview.reviewMessageHint')
                : undefined
            }
            primary={
              progressiveContinue
                ? {
                    label: t('progressiveWorkflow.sharePreview.continueToMessage'),
                    onClick: continueToMessage,
                    disabled: sharing,
                  }
                : {
                    label: sharing
                      ? sharePhase === 'opening'
                        ? t('meals.poll.openingPolls')
                        : sharePhase === 'sharing'
                          ? t('meals.planning.sharingToSpaces')
                          : t('meals.planning.savingMenu')
                      : externalShare
                        ? t('meals.planning.copyMessage')
                        : t('meals.actions.save'),
                    onClick: () => void handleShare(),
                    disabled:
                      sharing ||
                      selectedTypes.length === 0 ||
                      !messageText.trim() ||
                      previewQuery.isFetching,
                    startIcon: sharing ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : externalShare ? (
                      <Share2 size={14} />
                    ) : undefined,
                  }
            }
            secondary={{
              label: t('common.cancel'),
              onClick: () => navigate(spaceMealsPath(spaceId)),
              disabled: sharing,
            }}
          />
        </StickyFooter>
      ) : (
        <StickyFooter pin="fixed">
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
  badge,
  checked,
  indeterminate,
  locked,
  onChange,
}: {
  label: string;
  hint?: string;
  badge?: string;
  checked: boolean;
  indeterminate?: boolean;
  locked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const active = checked || indeterminate;

  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={checked}
          indeterminate={indeterminate}
          disabled={locked}
          onChange={(_, value) => onChange?.(value)}
          size="small"
        />
      }
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, width: '100%' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                ...DASHBOARD_UX.link,
                color: s.textPrimary,
                overflowWrap: 'anywhere',
              }}
            >
              {label}
            </Typography>
            {hint ? (
              <Typography
                sx={{
                  ...DASHBOARD_UX.smallCaption,
                  color: s.textMuted,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {hint}
              </Typography>
            ) : null}
          </Box>
          {badge ? (
            <Typography
              sx={{ ...DASHBOARD_UX.smallCaption, color: colors.tealDark, fontWeight: 700, flexShrink: 0 }}
            >
              {badge}
            </Typography>
          ) : null}
        </Box>
      }
      sx={{
        m: 0,
        mb: 0.75,
        width: '100%',
        alignItems: 'center',
        px: 1,
        py: 0.5,
        minHeight: 48,
        borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        bgcolor: active ? s.successTint : s.surface,
        border: `1px solid ${active ? colors.primary : s.border}`,
        '& .MuiFormControlLabel-label': { flex: 1, minWidth: 0 },
      }}
    />
  );
}
