import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  List,
  ListItemButton,
  ListItemText,
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
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StickyFooter, StickyFooterClearance } from '@/shared/components/StickyFooter';
import { LoadingState } from '@/shared/components/LoadingState';
import { StatusChip } from '@/shared/components/StatusChip';
import { WidgetCard } from '@/shared/components/WidgetCard';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { spaceAccommodationPath, spaceBedInventoryPath, spaceDashboardPath } from '@/routes/paths';
import { allocateNeedsVacantBedPick } from '@/modules/accommodation/utils/moveInEntry';
import {
  allocationTargetFromKnownBed,
  wizardNeedsTargetSearch,
} from '@/modules/accommodation/utils/knownAllocationTarget';
import { useMembers } from '@/modules/members/hooks/useMembers';
import { accommodationApi } from '../api/accommodationApi';
import { occupancyApi } from '../api/occupancyApi';
import { useOccupancyMutations } from '../hooks/useAccommodation';
import {
  buildAllocateRequest,
  buildReserveRequest,
  buildTransferRequest,
  getAllowedTargetTypes,
} from '../utils/occupancyRules';
import {
  getWizardStepTitleKey,
  getWizardSteps,
  getWizardTitleKey,
} from '../utils/occupancyWizardSteps';
import {
  catalogDepositText,
  catalogRentText,
  parseContractAmount,
} from '../utils/contractRentField';
import { mealsApplicableForSpace } from '@/spaceLifecycle/capabilities';
import type { OccupancyWizardMode, OccupancyWizardStep } from '../utils/types';
import type { AllocationTargetSearchResponse } from '@/shared/types/accommodation';

function parseMode(raw: string | null): OccupancyWizardMode {
  const allowed: OccupancyWizardMode[] = [
    'ALLOCATE',
    'RESERVE',
    'MOVE_IN',
    'TRANSFER',
    'VACATE',
  ];
  if (raw && allowed.includes(raw as OccupancyWizardMode)) {
    return raw as OccupancyWizardMode;
  }
  return 'ALLOCATE';
}

export function OccupancyWizardPage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.space?.spaceType ?? 'PG';
  const mutations = useOccupancyMutations(spaceId);

  const mode = parseMode(searchParams.get('mode'));
  const initialMemberId = searchParams.get('memberId') ?? undefined;
  const initialBedId = searchParams.get('bedId') ?? undefined;
  const initialRoomId = searchParams.get('roomId') ?? undefined;
  const initialUnitId = searchParams.get('unitId') ?? undefined;
  const initialBuildingId = searchParams.get('buildingId') ?? undefined;
  const initialOccupancyId = searchParams.get('occupancyId') ?? undefined;
  const returnToParam = searchParams.get('returnTo');
  const exitPath =
    returnToParam && returnToParam.startsWith(`/spaces/${spaceId}/`)
      ? returnToParam
      : spaceAccommodationPath(spaceId);
  const exitIsBedInventory = exitPath.includes('/bed-inventory');

  const steps = useMemo(
    () =>
      getWizardSteps(mode, {
        memberId: initialMemberId,
        bedId: initialBedId,
        roomId: initialRoomId,
        unitId: initialUnitId,
        occupancyId: initialOccupancyId,
      }),
    [initialBedId, initialMemberId, initialOccupancyId, initialRoomId, initialUnitId, mode],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [memberId, setMemberId] = useState(initialMemberId ?? '');
  const [memberSearch, setMemberSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<AllocationTargetSearchResponse | null>(
    null,
  );
  const [rentError, setRentError] = useState<string | null>(null);
  const [foodEnabled, setFoodEnabled] = useState(false);
  const [priceDraft, setPriceDraft] = useState({
    key: '',
    rent: '',
    deposit: '',
    rentEdited: false,
    depositEdited: false,
  });
  const mealsApply = mealsApplicableForSpace(spaceType);
  const [remarks, setRemarks] = useState('');
  const [moveInDate, setMoveInDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [expectedExitDate, setExpectedExitDate] = useState('');
  const [agreementSigned, setAgreementSigned] = useState(false);

  const membersQuery = useMembers(spaceId, steps.includes('member'));
  const allowedTargets = getAllowedTargetTypes(spaceType);
  const primaryTargetType = allowedTargets[0];

  const needsTargetSearch = wizardNeedsTargetSearch(steps);
  const rentParam = searchParams.get('defaultRent');
  const depositParam = searchParams.get('defaultDeposit');
  const knownBedQuery = useQuery({
    queryKey: ['wizard-known-bed', spaceId, initialBedId],
    queryFn: () => accommodationApi.getBed(spaceId, initialBedId!),
    enabled: Boolean(initialBedId) && !needsTargetSearch && rentParam == null,
    staleTime: 60_000,
  });
  const targetsQuery = useQuery({
    queryKey: [
      'allocation-targets',
      spaceId,
      targetSearch,
      initialBuildingId,
      primaryTargetType,
    ],
    queryFn: () =>
      accommodationApi.searchAllocationTargets(spaceId, {
        query: targetSearch || undefined,
        buildingId: initialBuildingId,
        targetType: primaryTargetType,
        selectableOnly: true,
        size: 40,
      }),
    enabled: needsTargetSearch,
    staleTime: 10_000,
  });

  const occupancyQuery = useQuery({
    queryKey: ['occupancy', spaceId, initialOccupancyId],
    queryFn: () => occupancyApi.getOccupancy(spaceId, initialOccupancyId!),
    enabled: Boolean(initialOccupancyId),
  });

  useEffect(() => {
    document.title = `${t(getWizardTitleKey(mode))} · ${t('common.appName')}`;
  }, [mode, t]);

  const matchedTarget = useMemo(() => {
    if (!targetsQuery.data?.content?.length) {
      return null;
    }
    return (
      targetsQuery.data.content.find(
        (row) =>
          (initialBedId && row.bedId === initialBedId) ||
          (initialUnitId && row.unitId === initialUnitId && row.targetType === 'UNIT'),
      ) ?? null
    );
  }, [initialBedId, initialUnitId, targetsQuery.data]);

  const knownBedTarget = useMemo(() => {
    if (!initialBedId || needsTargetSearch) {
      return null;
    }
    const bed = knownBedQuery.data;
    const rent =
      rentParam != null && rentParam !== '' && Number.isFinite(Number(rentParam))
        ? Number(rentParam)
        : bed?.defaultRent;
    const deposit =
      depositParam != null && depositParam !== '' && Number.isFinite(Number(depositParam))
        ? Number(depositParam)
        : bed?.defaultDeposit;
    return allocationTargetFromKnownBed({
      bedId: initialBedId,
      roomId: initialRoomId ?? bed?.roomId,
      unitId: initialUnitId,
      buildingId: initialBuildingId,
      bedLabel: searchParams.get('bedLabel') ?? bed?.name,
      displayPath: searchParams.get('displayPath') ?? bed?.name,
      defaultRent: rent,
      defaultDeposit: deposit,
      status: bed?.status,
    });
  }, [
    depositParam,
    initialBedId,
    initialBuildingId,
    initialRoomId,
    initialUnitId,
    knownBedQuery.data,
    needsTargetSearch,
    rentParam,
    searchParams,
  ]);

  const effectiveTarget = selectedTarget ?? matchedTarget ?? knownBedTarget;
  const targetKey = `${effectiveTarget?.targetType ?? ''}:${effectiveTarget?.bedId ?? ''}:${effectiveTarget?.unitId ?? ''}`;
  const effectiveMemberId = memberId || occupancyQuery.data?.memberId || '';
  const rentSource = catalogRentText(effectiveTarget?.defaultRent);
  const depositSource = catalogDepositText(effectiveTarget?.defaultDeposit);
  if (priceDraft.key !== targetKey) {
    setPriceDraft({
      key: targetKey,
      rent: rentSource,
      deposit: depositSource,
      rentEdited: false,
      depositEdited: false,
    });
  } else if (
    (!priceDraft.rentEdited && priceDraft.rent !== rentSource) ||
    (!priceDraft.depositEdited && priceDraft.deposit !== depositSource)
  ) {
    setPriceDraft({
      ...priceDraft,
      rent: priceDraft.rentEdited ? priceDraft.rent : rentSource,
      deposit: priceDraft.depositEdited ? priceDraft.deposit : depositSource,
    });
  }
  const rent = priceDraft.key === targetKey ? priceDraft.rent : rentSource;
  const deposit = priceDraft.key === targetKey ? priceDraft.deposit : depositSource;

  const currentStep: OccupancyWizardStep | undefined = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;
  const submitting =
    mutations.allocate.isPending ||
    mutations.reserve.isPending ||
    mutations.moveIn.isPending ||
    mutations.transfer.isPending ||
    mutations.vacate.isPending ||
    mutations.cancelReservation.isPending;

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) {
      return membersQuery.members;
    }
    return membersQuery.members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.mobileNumber.includes(q),
    );
  }, [memberSearch, membersQuery.members]);

  const selectedMember = membersQuery.members.find((m) => m.memberId === effectiveMemberId);

  const goBack = () => {
    if (stepIndex === 0) {
      navigate(exitPath);
      return;
    }
    setStepIndex((i) => i - 1);
  };

  const canAdvance = (): boolean => {
    if (!currentStep) {
      return false;
    }
    switch (currentStep) {
      case 'member':
        return Boolean(effectiveMemberId);
      case 'target':
        return Boolean(effectiveTarget);
      case 'contract':
        return parseContractAmount(rent) != null;
      case 'reserve_dates':
        return Boolean(moveInDate);
      case 'transfer_current':
        return Boolean(occupancyQuery.data || initialOccupancyId);
      case 'vacate_confirm':
        return Boolean(initialOccupancyId || occupancyQuery.data?.occupancyId);
      case 'review':
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!canAdvance()) {
      if (currentStep === 'member') {
        enqueueSnackbar(t('occupancyWizard.errors.memberRequired'), { variant: 'warning' });
      } else if (currentStep === 'target') {
        enqueueSnackbar(t('occupancyWizard.errors.targetRequired'), { variant: 'warning' });
      } else if (currentStep === 'contract') {
        const message = t('occupancy.contract.errors.rentRequired');
        setRentError(message);
        enqueueSnackbar(message, { variant: 'error' });
      }
      return;
    }
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }
    await handleSubmit();
  };

  const handleSubmit = async () => {
    const rentAmount = parseContractAmount(rent);
    const depositAmount = parseContractAmount(deposit);
    if (
      (mode === 'ALLOCATE' || mode === 'MOVE_IN' || mode === 'TRANSFER') &&
      rentAmount == null
    ) {
      const message = t('occupancy.contract.errors.rentRequired');
      setRentError(message);
      const contractIndex = steps.indexOf('contract');
      if (contractIndex >= 0) {
        setStepIndex(contractIndex);
      }
      enqueueSnackbar(message, { variant: 'error' });
      return;
    }
    const rentValue = rentAmount == null ? '' : String(rentAmount);
    const depositValue = depositAmount == null ? '' : String(depositAmount);
    const foodForRequest = mealsApply ? foodEnabled : false;

    try {
      const targetIds = {
        bedId: effectiveTarget?.bedId ?? initialBedId,
        roomId: effectiveTarget?.roomId ?? initialRoomId,
        unitId: effectiveTarget?.unitId ?? initialUnitId,
      };
      const targetType =
        effectiveTarget?.targetType ??
        (targetIds.bedId ? 'BED' : targetIds.unitId ? 'UNIT' : 'ROOM');

      if (mode === 'ALLOCATE') {
        if (effectiveTarget && effectiveTarget.selectable === false) {
          enqueueSnackbar(t('occupancy.errors.targetUnavailable'), { variant: 'error' });
          return;
        }
        const { body, errorKey } = buildAllocateRequest(
          effectiveMemberId,
          spaceType,
          targetType,
          targetIds,
          {
            rentSnapshot: rentValue ? Number(rentValue) : undefined,
            depositSnapshot: depositValue ? Number(depositValue) : undefined,
            foodEnabled: foodForRequest,
            remarks: remarks || undefined,
            expectedExitDate: expectedExitDate || undefined,
          },
        );
        if (!body || errorKey) {
          enqueueSnackbar(t(errorKey ?? 'occupancy.errors.generic'), { variant: 'error' });
          return;
        }
        await mutations.allocate.mutateAsync(body);
        enqueueSnackbar(t('occupancy.toast.allocated'), { variant: 'success' });
      } else if (mode === 'RESERVE') {
        const { body, errorKey } = buildReserveRequest(
          effectiveMemberId,
          spaceType,
          targetType,
          targetIds,
          {
            moveInDate,
            expectedExitDate: expectedExitDate || undefined,
            remarks: remarks || undefined,
          },
        );
        if (!body || errorKey) {
          enqueueSnackbar(t(errorKey ?? 'occupancy.errors.generic'), { variant: 'error' });
          return;
        }
        await mutations.reserve.mutateAsync(body);
        enqueueSnackbar(t('occupancy.toast.reserved'), { variant: 'success' });
      } else if (mode === 'MOVE_IN') {
        const occupancyId = initialOccupancyId ?? occupancyQuery.data?.occupancyId;
        if (!occupancyId) {
          enqueueSnackbar(t('occupancy.errors.generic'), { variant: 'error' });
          return;
        }
        await mutations.moveIn.mutateAsync({
          occupancyId,
          body: {
            moveInDate,
            expectedExitDate: expectedExitDate || undefined,
            agreementSigned,
            remarks: remarks || undefined,
            rentSnapshot: rentValue ? Number(rentValue) : undefined,
            depositSnapshot: depositValue ? Number(depositValue) : undefined,
            foodEnabled: foodForRequest,
          },
        });
        enqueueSnackbar(t('occupancy.toast.movedIn'), { variant: 'success' });
      } else if (mode === 'TRANSFER') {
        const occupancyId = initialOccupancyId ?? occupancyQuery.data?.occupancyId;
        if (!occupancyId) {
          enqueueSnackbar(t('occupancy.errors.generic'), { variant: 'error' });
          return;
        }
        const { body, errorKey } = buildTransferRequest(spaceType, targetType, targetIds, {
          remarks: remarks || undefined,
          rentSnapshot: rentValue ? Number(rentValue) : undefined,
          depositSnapshot: depositValue ? Number(depositValue) : undefined,
        });
        if (!body || errorKey) {
          enqueueSnackbar(t(errorKey ?? 'occupancy.errors.generic'), { variant: 'error' });
          return;
        }
        await mutations.transfer.mutateAsync({ occupancyId, body });
        enqueueSnackbar(t('occupancy.toast.transferred'), { variant: 'success' });
      } else if (mode === 'VACATE') {
        const occupancyId = initialOccupancyId ?? occupancyQuery.data?.occupancyId;
        if (!occupancyId) {
          enqueueSnackbar(t('occupancy.errors.generic'), { variant: 'error' });
          return;
        }
        const status = occupancyQuery.data?.status;
        if (status === 'RESERVED') {
          await mutations.cancelReservation.mutateAsync({
            occupancyId,
            remarks: remarks || undefined,
          });
          enqueueSnackbar(t('occupancy.toast.reservationCancelled'), { variant: 'success' });
        } else {
          await mutations.vacate.mutateAsync({
            occupancyId,
            remarks: remarks || undefined,
          });
          enqueueSnackbar(t('occupancy.toast.vacated'), { variant: 'success' });
        }
      }
      navigate(exitPath);
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  if (!permissions.canManageOccupancy) {
    return (
      <PageContainer>
        <Typography>{t('common.errors.forbidden')}</Typography>
      </PageContainer>
    );
  }

  if (allocateNeedsVacantBedPick(mode, { bedId: initialBedId, unitId: initialUnitId })) {
    return (
      <Navigate
        to={spaceBedInventoryPath(spaceId, 'AVAILABLE', { intent: 'allocate' })}
        replace
      />
    );
  }

  const renderStep = () => {
    if (!currentStep) {
      return null;
    }
    switch (currentStep) {
      case 'member':
        return (
          <Stack spacing={2}>
            <TextField
              size="small"
              placeholder={t('occupancyWizard.searchMemberPlaceholder')}
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              fullWidth
            />
            {membersQuery.loading ? (
              <LoadingState />
            ) : (
              <List dense sx={{ maxHeight: 360, overflow: 'auto' }}>
                {filteredMembers.map((member) => (
                  <ListItemButton
                    key={member.memberId}
                    selected={member.memberId === effectiveMemberId}
                    onClick={() => setMemberId(member.memberId)}
                  >
                    <ListItemText
                      primary={member.fullName}
                      secondary={member.mobileNumber}
                    />
                  </ListItemButton>
                ))}
                {filteredMembers.length === 0 ? (
                  <Typography color="text.secondary" sx={{ p: 2 }}>
                    {t('occupancyWizard.noMembers')}
                  </Typography>
                ) : null}
              </List>
            )}
          </Stack>
        );
      case 'target':
        return (
          <Stack spacing={2}>
            <TextField
              size="small"
              placeholder={t('occupancyWizard.searchTargetPlaceholder')}
              value={targetSearch}
              onChange={(e) => setTargetSearch(e.target.value)}
              fullWidth
            />
            {targetsQuery.isLoading ? (
              <LoadingState />
            ) : (
              <List dense sx={{ maxHeight: 360, overflow: 'auto' }}>
                {(targetsQuery.data?.content ?? []).map((target) => (
                  <ListItemButton
                    key={target.targetId}
                    selected={
                      (selectedTarget?.targetId ?? effectiveTarget?.targetId) === target.targetId
                    }
                    disabled={!target.selectable}
                    onClick={() => {
                      setSelectedTarget(target);
                      setPriceDraft({
                        key: `${target.targetType}:${target.bedId ?? ''}:${target.unitId ?? ''}`,
                        rent: catalogRentText(target.defaultRent),
                        deposit: catalogDepositText(target.defaultDeposit),
                        rentEdited: false,
                        depositEdited: false,
                      });
                    }}
                  >
                    <ListItemText
                      primary={target.displayPath}
                      secondary={
                        <Stack
                          direction="row"
                          spacing={1}
                          component="span"
                          sx={{ alignItems: 'center' }}
                        >
                          <StatusChip label={t(`accommodation.status.${target.status}`)} />
                          <Typography
                            component="span"
                            sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}
                          >
                            {t(`occupancy.targetType.${target.targetType}`)}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItemButton>
                ))}
                {(targetsQuery.data?.content ?? []).length === 0 ? (
                  <Typography color="text.secondary" sx={{ p: 2 }}>
                    {t('occupancyWizard.noTargets')}
                  </Typography>
                ) : null}
              </List>
            )}
          </Stack>
        );
      case 'contract':
        return (
          <Stack spacing={2} sx={{ maxWidth: 480 }}>
            <TextField
              label={t('occupancy.contract.rent')}
              value={rent}
              onChange={(e) => {
                const next = e.target.value;
                setPriceDraft((current) => ({
                  ...current,
                  key: targetKey,
                  rent: next,
                  rentEdited: true,
                }));
                if (parseContractAmount(next) != null) {
                  setRentError(null);
                }
              }}
              placeholder="e.g. 8500"
              type="number"
              required
              error={Boolean(rentError)}
              helperText={rentError ?? ' '}
              fullWidth
            />
            <TextField
              label={t('occupancy.contract.deposit')}
              value={deposit}
              onChange={(e) => {
                const next = e.target.value;
                setPriceDraft((current) => ({
                  ...current,
                  key: targetKey,
                  deposit: next,
                  depositEdited: true,
                }));
              }}
              placeholder="e.g. 15000"
              type="number"
              fullWidth
            />
            <TextField
              label={t('occupancy.section.expectedMoveOut')}
              value={expectedExitDate}
              onChange={(e) => setExpectedExitDate(e.target.value)}
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            {mealsApply ? (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={foodEnabled}
                    onChange={(e) => setFoodEnabled(e.target.checked)}
                  />
                }
                label={t('occupancy.contract.foodEnabled')}
              />
            ) : null}
            {mode === 'MOVE_IN' ? (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreementSigned}
                    onChange={(e) => setAgreementSigned(e.target.checked)}
                  />
                }
                label={t('occupancy.contract.agreementSigned')}
              />
            ) : null}
            <TextField
              label={t('occupancy.contract.remarks')}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={t('occupancy.fields.remarksPlaceholder')}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        );
      case 'reserve_dates':
        return (
          <Stack spacing={2} sx={{ maxWidth: 480 }}>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {t('occupancyWizard.steps.reserveDatesHint')}
            </Typography>
            <TextField
              label={t('occupancy.section.moveInDate')}
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              required
              fullWidth
            />
            <TextField
              label={t('occupancy.section.expectedMoveOut')}
              value={expectedExitDate}
              onChange={(e) => setExpectedExitDate(e.target.value)}
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              label={t('occupancy.contract.remarks')}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={t('occupancy.fields.remarksPlaceholder')}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        );
      case 'transfer_current':
        return occupancyQuery.isLoading ? (
          <LoadingState />
        ) : occupancyQuery.data ? (
          <Stack spacing={1}>
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
              {occupancyQuery.data.memberName}
            </Typography>
            <Typography>
              {[
                occupancyQuery.data.buildingName,
                occupancyQuery.data.floorName,
                occupancyQuery.data.unitName,
                occupancyQuery.data.roomName,
                occupancyQuery.data.bedName,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
            <StatusChip label={t(`occupancy.status.${occupancyQuery.data.status}`)} />
          </Stack>
        ) : (
          <Typography color="text.secondary">{t('occupancyWizard.memberNotAllocated')}</Typography>
        );
      case 'vacate_confirm':
        return (
          <Stack spacing={2} sx={{ maxWidth: 480 }}>
            <Typography>
              {t('occupancy.vacate.confirmBody', {
                name: occupancyQuery.data?.memberName ?? selectedMember?.fullName ?? '',
              })}
            </Typography>
            <TextField
              label={t('occupancy.contract.remarks')}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={t('occupancy.fields.remarksPlaceholder')}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        );
      case 'review':
        return (
          <Stack spacing={1.5}>
            <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary }}>
              {t('occupancyWizard.review.member')}
            </Typography>
            <Typography>
              {selectedMember?.fullName ??
                occupancyQuery.data?.memberName ??
                effectiveMemberId}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary }}>
              {t('occupancyWizard.review.accommodation')}
            </Typography>
            <Typography>
              {effectiveTarget?.displayPath ??
                [
                  occupancyQuery.data?.buildingName,
                  occupancyQuery.data?.roomName,
                  occupancyQuery.data?.bedName,
                ]
                  .filter(Boolean)
                  .join(' · ') ??
                '—'}
            </Typography>
            <Typography>
              {t('occupancy.contract.rent')}:{' '}
              {parseContractAmount(rent) == null
                ? t('accommodation.pricingConfirm.notSet', { defaultValue: 'Not set' })
                : `₹${rent}`}
            </Typography>
            <Typography>
              {t('occupancy.contract.deposit')}:{' '}
              {parseContractAmount(deposit) == null
                ? t('accommodation.pricingConfirm.notSet', { defaultValue: 'Not set' })
                : `₹${deposit}`}
            </Typography>
            {mealsApply ? (
              <Typography>
                {t('occupancy.contract.foodEnabled')}:{' '}
                {foodEnabled ? t('common.yes', { defaultValue: 'Yes' }) : t('common.no', { defaultValue: 'No' })}
              </Typography>
            ) : null}
            {moveInDate && (mode === 'RESERVE' || mode === 'MOVE_IN') ? (
              <Typography>
                {t('occupancy.section.moveInDate')}: {moveInDate}
              </Typography>
            ) : null}
          </Stack>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t(getWizardTitleKey(mode))}
          description={t('occupancyWizard.stepProgress', {
            current: stepIndex + 1,
            total: steps.length,
          })}
          breadcrumbs={[
            { label: t('navigation.dashboard'), to: spaceDashboardPath(spaceId) },
            ...(exitIsBedInventory
              ? [
                  {
                    label: t('dashboard.drilldown.vacantBedsTitle'),
                    to: exitPath.includes('status=')
                      ? exitPath
                      : spaceBedInventoryPath(spaceId, 'AVAILABLE'),
                  },
                ]
              : [
                  {
                    label: t('navigation.rooms'),
                    to: spaceAccommodationPath(spaceId),
                  },
                ]),
            { label: t(getWizardTitleKey(mode)) },
          ]}
        />

        <Box
          sx={{
            display: 'grid',
            gap: `${DASHBOARD_UX.cardGap}px`,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 280px)' },
            minHeight: 420,
          }}
        >
          <ContentCard>
            <Stepper
              activeStep={stepIndex}
              alternativeLabel
              sx={{
                mb: 3,
                overflowX: 'auto',
                maxWidth: '100%',
                '& .MuiStepLabel-label': {
                  ...DASHBOARD_UX.body,
                  color: s.textMuted,
                  '&.Mui-active, &.Mui-completed': { ...DASHBOARD_UX.link, color: s.textPrimary },
                },
              }}
            >
              {steps.map((step) => (
                <Step key={step}>
                  <StepLabel>{t(getWizardStepTitleKey(step))}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mb: 2 }}>
              {currentStep ? t(getWizardStepTitleKey(currentStep)) : null}
            </Typography>
            {renderStep()}
          </ContentCard>

          <WidgetCard title={t('occupancyWizard.context.member')}>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary, mb: 2 }}>
              {selectedMember?.fullName ??
                occupancyQuery.data?.memberName ??
                t('occupancyWizard.steps.memberHint')}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1 }}>
              {t('occupancyWizard.context.accommodation')}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {effectiveTarget?.displayPathShort ??
                effectiveTarget?.displayPath ??
                t('occupancyWizard.breadcrumb.selectedAccommodation')}
            </Typography>
          </WidgetCard>
        </Box>
      </Stack>

      <StickyFooterClearance height={{ xs: 96, md: 80 }} />

      <StickyFooter pin="fixed">
          <Button onClick={goBack} disabled={submitting} sx={dashOutlinedButtonSx}>
            {stepIndex === 0 ? t('common.cancel') : t('common.back')}
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleNext()}
            disabled={submitting}
            sx={dashContainedButtonSx}
          >
            {isLast ? t('common.confirm') : t('common.continue')}
          </Button>
        </StickyFooter>
    </PageContainer>
  );
}
