import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
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
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { getErrorMessage } from '@/shared/api/errors';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { AllocationTargetType } from '@/shared/types/accommodation';
import {
  spaceAccommodationPath,
  spaceBedInventoryPath,
  spaceDashboardPath,
  spaceMemberPath,
} from '@/routes/paths';
import { allocateNeedsVacantBedPick } from '@/modules/accommodation/utils/moveInEntry';
import {
  allocationTargetFromKnownBed,
  wizardNeedsTargetSearch,
} from '@/modules/accommodation/utils/knownAllocationTarget';
import { useMembers } from '@/modules/members/hooks/useMembers';
import { accommodationApi } from '../api/accommodationApi';
import { occupancyApi } from '../api/occupancyApi';
import { OccupancySuccessDialog } from '../components/OccupancySuccessDialog';
import type { OccupancySuccessOperation } from '../components/OccupancySuccessDialog';
import { useOccupancyMutations } from '../hooks/useAccommodation';
import { useReservationCancellationDialog } from '../hooks/useReservationCancellationDialog';
import {
  buildAllocateRequest,
  buildReserveRequest,
  buildTransferRequest,
  getAllowedTargetTypes,
} from '../utils/occupancyRules';
import {
  applyStayChoice,
  shortStayNightCount,
  stayChoiceDefaultLabel,
  stayChoiceLabelKey,
  type StayChoice,
} from '../utils/shortStay';
import { pricingDefaultsForStayChoice } from '../utils/pricingDefaultsForStayChoice';
import { stayTypesAvailableForSpace } from '../utils/accommodationStaySupport';
import { formatOccupancyInventoryTitle } from '../utils/formatOccupancyInventoryTitle';
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
import { resolveBookingAdvanceSplit } from '../utils/bookingAdvance';
import { spaceApi } from '@/modules/onboarding/api/spaceApi';
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
  const { openCancelReservation, cancellationDialog } = useReservationCancellationDialog(
    spaceId,
    () => navigate(exitPath),
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [memberId, setMemberId] = useState(initialMemberId ?? '');
  const [memberSearch, setMemberSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<AllocationTargetSearchResponse | null>(
    null,
  );
  const [rentError, setRentError] = useState<string | null>(null);
  const [moveInDateError, setMoveInDateError] = useState<string | null>(null);
  const [expectedExitError, setExpectedExitError] = useState<string | null>(null);
  const [agreedTotalError, setAgreedTotalError] = useState<string | null>(null);
  const moveInDateRef = useRef<HTMLInputElement | null>(null);
  const expectedExitRef = useRef<HTMLInputElement | null>(null);
  const agreedTotalRef = useRef<HTMLInputElement | null>(null);
  const rentFieldRef = useRef<HTMLInputElement | null>(null);

  const scrollToField = (el: HTMLElement | null) => {
    if (!el) {
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof el.focus === 'function') {
      el.focus({ preventScroll: true });
    }
  };
  // Match Android emptyContractTermsFormValues — owner can turn off; amenities do not drive this.
  const [foodEnabled, setFoodEnabled] = useState(true);
  const [priceDraft, setPriceDraft] = useState({
    key: '',
    rent: '',
    deposit: '',
    bookingAdvance: '',
    bookingAdvanceCollected: true,
    rentEdited: false,
    depositEdited: false,
  });
  const [remarks, setRemarks] = useState('');
  const [moveInDate, setMoveInDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [expectedExitDate, setExpectedExitDate] = useState('');
  const [stayChoice, setStayChoice] = useState<StayChoice>('MONTHLY');
  const [agreedTotal, setAgreedTotal] = useState('');
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [successPayload, setSuccessPayload] = useState<{
    operation: OccupancySuccessOperation;
    memberId: string;
    memberName: string;
    locationLabel: string;
    stayTypeLabel?: string | null;
  } | null>(null);

  const spaceDetailsQuery = useQuery({
    queryKey: ['space-details', spaceId],
    queryFn: () => spaceApi.getSpaceById(spaceId),
    enabled: Boolean(spaceId),
  });
  // Prefer live space details so co-living ROOM targeting is not stuck on the PG
  // default while mySpaces permissions are still loading.
  const spaceType =
    spaceDetailsQuery.data?.type ?? permissions.space?.spaceType ?? 'PG';
  const mealsApply = mealsApplicableForSpace(spaceType);
  const showStayChoice = stayTypesAvailableForSpace(spaceType);

  const steps = useMemo(
    () =>
      getWizardSteps(
        mode,
        {
          memberId: initialMemberId,
          bedId: initialBedId,
          roomId: initialRoomId,
          unitId: initialUnitId,
          occupancyId: initialOccupancyId,
        },
        { spaceType },
      ),
    [
      initialBedId,
      initialMemberId,
      initialOccupancyId,
      initialRoomId,
      initialUnitId,
      mode,
      spaceType,
    ],
  );

  const membersQuery = useMembers(spaceId, steps.includes('member'));
  const allowedTargets = getAllowedTargetTypes(spaceType);
  const primaryTargetType = allowedTargets[0];
  const [selectedTargetType, setSelectedTargetType] = useState<AllocationTargetType | null>(null);
  const effectiveTargetType = selectedTargetType ?? primaryTargetType;

  useEffect(() => {
    if (!primaryTargetType) {
      return;
    }
    if (!selectedTargetType || !allowedTargets.includes(selectedTargetType)) {
      setSelectedTargetType(primaryTargetType);
    }
  }, [allowedTargets, primaryTargetType, selectedTargetType]);

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
      effectiveTargetType,
    ],
    queryFn: () =>
      accommodationApi.searchAllocationTargets(spaceId, {
        query: targetSearch || undefined,
        buildingId: initialBuildingId,
        targetType: effectiveTargetType,
        selectableOnly: true,
        size: 40,
      }),
    enabled: needsTargetSearch && Boolean(effectiveTargetType),
    staleTime: 10_000,
  });

  const occupancyQuery = useQuery({
    queryKey: ['occupancy', spaceId, initialOccupancyId],
    queryFn: () => occupancyApi.getOccupancy(spaceId, initialOccupancyId!),
    enabled: Boolean(initialOccupancyId),
  });

  useEffect(() => {
    const kind = occupancyQuery.data?.stayKind;
    if (kind === 'SHORT' || kind === 'OPEN_ENDED') {
      setStayChoice(kind);
    }
    if (occupancyQuery.data?.agreedTotal != null) {
      setAgreedTotal(String(occupancyQuery.data.agreedTotal));
    }
    if (occupancyQuery.data?.expectedExitDate) {
      setExpectedExitDate(occupancyQuery.data.expectedExitDate.slice(0, 10));
    }
  }, [occupancyQuery.data]);

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
  const stayPricingDefaults = pricingDefaultsForStayChoice({
    choice: stayChoice,
    catalogRent: effectiveTarget?.defaultRent ?? null,
    catalogDeposit: effectiveTarget?.defaultDeposit ?? null,
  });
  const rentSource =
    stayChoice === 'SHORT' || stayChoice === 'OPEN_ENDED'
      ? stayPricingDefaults.rentSnapshot
      : catalogRentText(effectiveTarget?.defaultRent);
  const depositSource =
    stayChoice === 'SHORT' || stayChoice === 'OPEN_ENDED'
      ? stayPricingDefaults.depositSnapshot
      : catalogDepositText(effectiveTarget?.defaultDeposit);
  if (priceDraft.key !== targetKey) {
    setPriceDraft({
      key: targetKey,
      rent: rentSource,
      deposit: depositSource,
      bookingAdvance: '',
      bookingAdvanceCollected: true,
      rentEdited: stayChoice === 'SHORT' || stayChoice === 'OPEN_ENDED',
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
  const bookingAdvance = priceDraft.key === targetKey ? priceDraft.bookingAdvance : '';
  const bookingAdvanceCollected =
    priceDraft.key === targetKey ? priceDraft.bookingAdvanceCollected : true;

  const handleStayChoiceChange = (choice: StayChoice) => {
    if (choice === stayChoice) {
      return;
    }
    setStayChoice(choice);
    setAgreedTotalError(null);
    setExpectedExitError(null);
    setRentError(null);
    const defaults = pricingDefaultsForStayChoice({
      choice,
      catalogRent: effectiveTarget?.defaultRent ?? null,
      catalogDeposit: effectiveTarget?.defaultDeposit ?? null,
    });
    setAgreedTotal(defaults.agreedTotal);
    setPriceDraft({
      key: targetKey,
      rent: defaults.rentSnapshot,
      deposit: defaults.depositSnapshot,
      bookingAdvance: '',
      bookingAdvanceCollected: true,
      // Short Stay / Until I Leave: keep rent blank so catalog sync cannot re-inject monthly rent.
      rentEdited: choice === 'SHORT' || choice === 'OPEN_ENDED',
      depositEdited: false,
    });
    if (defaults.clearExpectedExit) {
      setExpectedExitDate('');
    }
  };

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
      case 'stay_type':
        return Boolean(stayChoice);
      case 'stay_details':
        if (mode !== 'TRANSFER' && !moveInDate) {
          return false;
        }
        if (showStayChoice && stayChoice === 'SHORT') {
          return Boolean(expectedExitDate);
        }
        return true;
      case 'contract':
        if (showStayChoice && stayChoice === 'SHORT') {
          return parseContractAmount(agreedTotal) != null;
        }
        return parseContractAmount(rent) != null;
      case 'reserve_dates':
        if (!moveInDate) {
          return false;
        }
        if (showStayChoice && stayChoice === 'SHORT') {
          return (
            Boolean(expectedExitDate) && parseContractAmount(agreedTotal) != null
          );
        }
        return true;
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
      } else if (currentStep === 'stay_details' || currentStep === 'reserve_dates') {
        if (mode !== 'TRANSFER' && !moveInDate) {
          const message = t('occupancy.errors.moveInDateRequired');
          setMoveInDateError(message);
          enqueueSnackbar(message, { variant: 'error' });
          scrollToField(moveInDateRef.current);
          return;
        }
        if (showStayChoice && stayChoice === 'SHORT' && !expectedExitDate) {
          const message = t('occupancy.errors.checkoutRequired', {
            defaultValue: 'Checkout date must be set for short stay.',
          });
          setExpectedExitError(message);
          enqueueSnackbar(message, { variant: 'error' });
          scrollToField(expectedExitRef.current);
          return;
        }
        if (
          currentStep === 'reserve_dates' &&
          showStayChoice &&
          stayChoice === 'SHORT' &&
          parseContractAmount(agreedTotal) == null
        ) {
          const message = t('occupancy.errors.dailyRentRequired', {
            defaultValue: 'Please enter the daily rent.',
          });
          setAgreedTotalError(message);
          enqueueSnackbar(message, { variant: 'error' });
          scrollToField(agreedTotalRef.current);
          return;
        }
      } else if (currentStep === 'contract') {
        if (showStayChoice && stayChoice === 'SHORT') {
          const message = t('occupancy.errors.dailyRentRequired', {
            defaultValue: 'Please enter the daily rent.',
          });
          setAgreedTotalError(message);
          enqueueSnackbar(message, { variant: 'error' });
          scrollToField(agreedTotalRef.current);
        } else {
          const message = t('occupancy.contract.errors.rentRequired');
          setRentError(message);
          enqueueSnackbar(message, { variant: 'error' });
          scrollToField(rentFieldRef.current);
        }
      }
      return;
    }
    setMoveInDateError(null);
    setExpectedExitError(null);
    setAgreedTotalError(null);
    setRentError(null);
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }
    await handleSubmit();
  };

  const handleSubmit = async () => {
    const rentAmount = parseContractAmount(rent);
    const depositAmount = parseContractAmount(deposit);
    const shortStay = showStayChoice && stayChoice === 'SHORT';
    if (
      (mode === 'ALLOCATE' || mode === 'MOVE_IN' || mode === 'TRANSFER') &&
      !shortStay &&
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
    // Android bundles food into rent when enabled and no separate food-charge policy UI.
    const foodIncludedInRentForRequest = foodForRequest;

    try {
      const targetIds = {
        bedId: effectiveTarget?.bedId ?? initialBedId,
        roomId: effectiveTarget?.roomId ?? initialRoomId,
        unitId: effectiveTarget?.unitId ?? initialUnitId,
      };
      const targetType =
        effectiveTarget?.targetType ??
        (targetIds.bedId ? 'BED' : targetIds.unitId ? 'UNIT' : 'ROOM');

      const withStay = <T extends Parameters<typeof applyStayChoice>[0]>(body: T) => {
        const dailyRentForStay =
          stayChoice === 'SHORT'
            ? parseContractAmount(agreedTotal)
            : stayChoice === 'OPEN_ENDED'
              ? parseContractAmount(rent)
              : null;
        const stayed = applyStayChoice(body, {
          enabled: true,
          choice: stayChoice,
          dailyRent: dailyRentForStay,
          expectedExitDate: expectedExitDate || undefined,
          checkInDate: moveInDate || undefined,
        });
        if (stayed.errorKey) {
          enqueueSnackbar(
            t(stayed.errorKey, {
              defaultValue:
                stayed.errorKey === 'occupancy.section.expectedMoveOut'
                  ? 'A short stay needs a checkout date.'
                  : stayed.errorKey === 'occupancy.errors.codes.SHORT_STAY_SAME_DAY'
                    ? 'A short stay checkout must be after the check-in date. The same date is not a stay.'
                    : stayed.errorKey === 'occupancy.errors.codes.SHORT_STAY_CROSSES_MONTH'
                      ? 'A short stay cannot cover nights in more than one calendar month.'
                      : 'Enter a daily rent greater than zero.',
            }),
            { variant: 'error' },
          );
          return null;
        }
        return stayed.body;
      };

      if (mode === 'ALLOCATE') {
        if (effectiveTarget && effectiveTarget.selectable === false) {
          enqueueSnackbar(effectiveTarget.notSelectableReason ?? t('occupancy.errors.targetUnavailable'), {
            variant: 'error',
          });
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
            foodIncludedInRent: foodIncludedInRentForRequest,
            remarks: remarks || undefined,
            moveInDate: moveInDate || undefined,
            expectedExitDate: expectedExitDate || undefined,
          },
        );
        if (!body || errorKey) {
          enqueueSnackbar(t(errorKey ?? 'occupancy.errors.generic'), { variant: 'error' });
          return;
        }
        const stayedBody = withStay(body);
        if (!stayedBody) {
          return;
        }
        await mutations.allocate.mutateAsync(stayedBody);
        setSuccessPayload({
          operation: 'ALLOCATE',
          memberId: effectiveMemberId,
          memberName: selectedMember?.fullName ?? '',
          locationLabel: effectiveTarget?.displayPath ?? effectiveTarget?.displayPathShort ?? '',
          stayTypeLabel: showStayChoice
            ? t(stayChoiceLabelKey(stayChoice), { defaultValue: stayChoiceDefaultLabel(stayChoice) })
            : null,
        });
        return;
      } else if (mode === 'RESERVE') {
        const advanceParsed = parseContractAmount(bookingAdvance);
        const bookingAdvanceAmount =
          advanceParsed != null && advanceParsed > 0 ? advanceParsed : null;
        if (bookingAdvanceAmount != null) {
          const shortNights =
            stayChoice === 'SHORT' && moveInDate && expectedExitDate
              ? shortStayNightCount(moveInDate, expectedExitDate)
              : null;
          const shortDaily = stayChoice === 'SHORT' ? parseContractAmount(agreedTotal) : null;
          const firstPeriodForAdvance =
            stayChoice === 'SHORT' && shortDaily != null && shortNights != null && shortNights > 0
              ? shortDaily * shortNights
              : rentAmount;
          const advanceCheck = resolveBookingAdvanceSplit({
            firstPeriodRent: firstPeriodForAdvance,
            bookingAdvanceText: bookingAdvance,
          });
          if (advanceCheck.errorKey) {
            enqueueSnackbar(
              t(advanceCheck.errorKey, {
                defaultValue:
                  advanceCheck.errorKey === 'occupancy.bookingAdvance.errors.exceedsRent'
                    ? 'Booking advance cannot exceed the first-period rent.'
                    : 'Invalid booking advance.',
              }),
              { variant: 'error' },
            );
            return;
          }
        }
        const { body, errorKey } = buildReserveRequest(
          effectiveMemberId,
          spaceType,
          targetType,
          targetIds,
          {
            moveInDate,
            expectedExitDate: expectedExitDate || undefined,
            remarks: remarks || undefined,
            rentSnapshot: rentValue ? Number(rentValue) : undefined,
            bookingAdvanceAmount,
            bookingAdvanceCollected: bookingAdvanceAmount ? bookingAdvanceCollected : undefined,
            depositSnapshot: depositValue ? Number(depositValue) : undefined,
            foodEnabled: foodForRequest,
            foodIncludedInRent: foodIncludedInRentForRequest,
          },
        );
        if (!body || errorKey) {
          enqueueSnackbar(t(errorKey ?? 'occupancy.errors.generic'), { variant: 'error' });
          return;
        }
        const stayedBody = withStay(body);
        if (!stayedBody) {
          return;
        }
        await mutations.reserve.mutateAsync(stayedBody);
        setSuccessPayload({
          operation: 'RESERVE',
          memberId: effectiveMemberId,
          memberName: selectedMember?.fullName ?? '',
          locationLabel: effectiveTarget?.displayPath ?? effectiveTarget?.displayPathShort ?? '',
          stayTypeLabel: showStayChoice
            ? t(stayChoiceLabelKey(stayChoice), { defaultValue: stayChoiceDefaultLabel(stayChoice) })
            : null,
        });
        return;
      } else if (mode === 'MOVE_IN') {
        const occupancyId = initialOccupancyId ?? occupancyQuery.data?.occupancyId;
        if (!occupancyId) {
          enqueueSnackbar(t('occupancy.errors.generic'), { variant: 'error' });
          return;
        }
        const stayedBody = withStay({
          moveInDate,
          expectedExitDate: expectedExitDate || undefined,
          agreementSigned,
          remarks: remarks || undefined,
          rentSnapshot: rentValue ? Number(rentValue) : undefined,
          depositSnapshot: depositValue ? Number(depositValue) : undefined,
          foodEnabled: foodForRequest,
          foodIncludedInRent: foodIncludedInRentForRequest,
        });
        if (!stayedBody) {
          return;
        }
        await mutations.moveIn.mutateAsync({
          occupancyId,
          body: stayedBody,
        });
        setSuccessPayload({
          operation: 'MOVE_IN',
          memberId: effectiveMemberId || occupancyQuery.data?.memberId || '',
          memberName:
            selectedMember?.fullName ?? occupancyQuery.data?.memberName ?? '',
          locationLabel:
            effectiveTarget?.displayPath ??
            [occupancyQuery.data?.buildingName, occupancyQuery.data?.bedName]
              .filter(Boolean)
              .join(' · ') ??
            '',
        });
        return;
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
        const stayedBody = withStay(body);
        if (!stayedBody) {
          return;
        }
        if (stayChoice === 'SHORT') {
          stayedBody.rentSnapshot = undefined;
        }
        await mutations.transfer.mutateAsync({ occupancyId, body: stayedBody });
        setSuccessPayload({
          operation: 'TRANSFER',
          memberId: effectiveMemberId || occupancyQuery.data?.memberId || '',
          memberName:
            selectedMember?.fullName ?? occupancyQuery.data?.memberName ?? '',
          locationLabel: effectiveTarget?.displayPath ?? effectiveTarget?.displayPathShort ?? '',
          stayTypeLabel: showStayChoice
            ? t(stayChoiceLabelKey(stayChoice), { defaultValue: stayChoiceDefaultLabel(stayChoice) })
            : null,
        });
        return;
      } else if (mode === 'VACATE') {
        const occupancyId = initialOccupancyId ?? occupancyQuery.data?.occupancyId;
        if (!occupancyId) {
          enqueueSnackbar(t('occupancy.errors.generic'), { variant: 'error' });
          return;
        }
        const status = occupancyQuery.data?.status;
        if (status === 'RESERVED') {
          openCancelReservation(occupancyId);
          return;
        }
        await mutations.vacate.mutateAsync({
          occupancyId,
          remarks: remarks || undefined,
        });
        setSuccessPayload({
          operation: 'VACATE',
          memberId: effectiveMemberId || occupancyQuery.data?.memberId || '',
          memberName:
            selectedMember?.fullName ?? occupancyQuery.data?.memberName ?? '',
          locationLabel:
            [
              occupancyQuery.data?.buildingName,
              occupancyQuery.data?.roomName,
              occupancyQuery.data?.bedName,
            ]
              .filter(Boolean)
              .join(' · ') || '',
        });
        return;
      }
      navigate(exitPath);
    } catch (error) {
      const fallback = t('common.errors.generic');
      enqueueSnackbar(getErrorMessage(error, fallback) || fallback, { variant: 'error' });
    }
  };

  if (!permissions.canManageOccupancy) {
    return (
      <PageContainer>
        <Typography>{t('common.errors.forbidden')}</Typography>
      </PageContainer>
    );
  }

  if (
    allocateNeedsVacantBedPick(
      mode,
      { bedId: initialBedId, roomId: initialRoomId, unitId: initialUnitId },
      spaceDetailsQuery.data?.type ?? permissions.space?.spaceType ?? null,
    )
  ) {
    return (
      <Navigate
        to={spaceBedInventoryPath(spaceId, 'AVAILABLE', {
          intent: 'allocate',
          memberId: initialMemberId,
        })}
        replace
      />
    );
  }

  const renderStep = () => {
    if (!currentStep) {
      return null;
    }
    const shortSelected = showStayChoice && stayChoice === 'SHORT';
    const openEndedSelected = showStayChoice && stayChoice === 'OPEN_ENDED';
    const shortNights =
      shortSelected && moveInDate && expectedExitDate
        ? shortStayNightCount(moveInDate, expectedExitDate)
        : null;
    const stayTypeFields = showStayChoice ? (
      <Stack spacing={1.25}>
        {(['MONTHLY', 'SHORT', 'OPEN_ENDED'] as const).map((choice) => {
          const selected = stayChoice === choice;
          const title = t(stayChoiceLabelKey(choice), {
            defaultValue: stayChoiceDefaultLabel(choice),
          });
          const hint = t(
            choice === 'SHORT'
              ? 'occupancy.section.shortStayChoiceHint'
              : choice === 'OPEN_ENDED'
                ? 'occupancy.section.openEndedStayChoiceHint'
                : 'occupancy.section.monthlyStayChoiceHint',
            {
              defaultValue:
                choice === 'SHORT'
                  ? 'Pay a daily rent for a fixed number of days (e.g., a few days or weeks).'
                  : choice === 'OPEN_ENDED'
                    ? 'No fixed move-out date. Pay daily rent until the resident vacates.'
                    : 'Fixed monthly rent.',
            },
          );
          return (
            <Box
              key={choice}
              component="button"
              type="button"
              onClick={() => handleStayChoiceChange(choice)}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                textAlign: 'left',
                width: '100%',
                cursor: 'pointer',
                borderRadius: 2,
                border: '1.5px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'action.selected' : 'background.paper',
                px: 2,
                py: 1.5,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                  {title}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted, mt: 0.5 }}>
                  {hint}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: '1.5px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: selected ? 'primary.main' : 'transparent',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {selected ? '✓' : null}
              </Box>
            </Box>
          );
        })}
      </Stack>
    ) : null;
    const stayDetailsExtras = showStayChoice ? (
      <Stack spacing={1}>
        {stayChoice === 'MONTHLY' ? (
          <Alert severity="info">
            {effectiveTarget?.defaultRent != null && effectiveTarget.defaultRent > 0
              ? t('occupancy.section.monthlyStayHintWithRent', {
                  amount: effectiveTarget.defaultRent.toLocaleString('en-IN'),
                  defaultValue:
                    'Monthly rent ({{amount}}) will be charged starting from the move-in date.',
                })
              : t('occupancy.section.monthlyStayHint', {
                  defaultValue: 'Monthly rent will be charged starting from the move-in date.',
                })}
          </Alert>
        ) : null}
        {openEndedSelected ? (
          <Alert severity="info">
            {t('occupancy.section.openEndedStayBanner', {
              defaultValue: 'No Fixed Move-Out Date | No fixed planned checkout date.',
            })}
          </Alert>
        ) : null}
        {shortSelected ? (
          <Alert severity="info">
            {t('occupancy.section.shortStayBanner', {
              defaultValue: 'Daily | Pay daily rent for a fixed number of days.',
            })}
            {shortNights != null
              ? ` ${t('occupancy.section.stayDurationNights', {
                  count: shortNights,
                  defaultValue: 'Stay duration: {{count}} nights',
                })}`
              : ''}
          </Alert>
        ) : null}
        {stayChoice === 'MONTHLY' ? (
          <TextField
            label={t('occupancy.section.expectedMoveOut', { defaultValue: 'Expected move-out' })}
            value={expectedExitDate}
            onChange={(e) => {
              setExpectedExitDate(e.target.value);
              setExpectedExitError(null);
            }}
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
        ) : null}
        {shortSelected ? (
          <>
            <TextField
              inputRef={expectedExitRef}
              label={t('occupancy.section.expectedMoveOut', { defaultValue: 'Checkout' })}
              value={expectedExitDate}
              onChange={(e) => {
                setExpectedExitDate(e.target.value);
                setExpectedExitError(null);
              }}
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              required
              error={Boolean(expectedExitError)}
              helperText={expectedExitError || ' '}
              fullWidth
            />
            {shortNights != null ? (
              <Typography variant="body2" color="text.secondary">
                {t('occupancy.section.stayDurationNights', {
                  count: shortNights,
                  defaultValue: 'Stay duration: {{count}} nights',
                })}
              </Typography>
            ) : null}
          </>
        ) : null}
      </Stack>
    ) : null;
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
            {allowedTargets.length > 1 ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {allowedTargets.map((targetType) => (
                  <Button
                    key={targetType}
                    size="small"
                    variant={effectiveTargetType === targetType ? 'contained' : 'outlined'}
                    onClick={() => {
                      setSelectedTargetType(targetType);
                      setSelectedTarget(null);
                      setTargetSearch('');
                    }}
                  >
                    {t(`occupancy.targetType.${targetType}`)}
                  </Button>
                ))}
              </Stack>
            ) : null}
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
                        bookingAdvance: '',
                        bookingAdvanceCollected: true,
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
      case 'stay_type':
        return <Stack spacing={2}>{stayTypeFields}</Stack>;
      case 'stay_details':
        return (
          <Stack spacing={2} sx={{ maxWidth: 480 }}>
            {mode !== 'TRANSFER' ? (
              <TextField
                inputRef={moveInDateRef}
                label={t('occupancy.section.moveInDate')}
                value={moveInDate}
                onChange={(e) => {
                  setMoveInDate(e.target.value);
                  if (moveInDateError) {
                    setMoveInDateError(null);
                  }
                }}
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                required
                error={Boolean(moveInDateError)}
                helperText={moveInDateError || ' '}
                fullWidth
              />
            ) : null}
            {stayDetailsExtras}
          </Stack>
        );
      case 'contract': {
        const nights =
          shortSelected && moveInDate && expectedExitDate
            ? shortStayNightCount(moveInDate, expectedExitDate)
            : null;
        const dailyForStay = shortSelected
          ? parseContractAmount(agreedTotal)
          : null;
        const stayRentAmount =
          nights != null && nights > 0 && dailyForStay != null
            ? dailyForStay * nights
            : null;
        const depositParsed = parseContractAmount(deposit) ?? 0;
        const totalPayable =
          stayRentAmount != null ? stayRentAmount + Math.max(0, depositParsed) : null;
        const pricingHint = shortSelected
          ? t('occupancy.contract.hintDaily', {
              defaultValue: 'Daily rent and deposit for this stay. Not monthly billing.',
            })
          : stayChoice === 'OPEN_ENDED'
            ? t('occupancy.contract.hintOpenEnded', {
                defaultValue:
                  'Daily rent accumulates into one rent charge per calendar month until vacate.',
              })
            : t('occupancy.contract.hintMonthly', {
                defaultValue:
                  'Agreed monthly rent and charges at activation. Not billing or payments.',
              });
        return (
          <Stack spacing={2} sx={{ maxWidth: 480 }}>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {shortSelected
                ? t('occupancy.contract.stepHintDaily', {
                    defaultValue: 'Set daily rent, deposit and applicable charges for this stay.',
                  })
                : stayChoice === 'OPEN_ENDED'
                  ? t('occupancy.contract.stepHintOpenEnded', {
                      defaultValue:
                        'Set daily rent, deposit and applicable charges until vacate.',
                    })
                  : t('occupancy.contract.stepHintMonthly', {
                      defaultValue: 'Set rent, deposit and applicable charges for this stay.',
                    })}
            </Typography>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${s.border}`,
                bgcolor: s.surface,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Box>
                <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                  {t('occupancy.contract.pricingDetails', { defaultValue: 'Pricing Details' })}
                </Typography>
                <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mt: 0.5 }}>
                  {pricingHint}
                </Typography>
              </Box>

              {shortSelected ? (
                <TextField
                  inputRef={agreedTotalRef}
                  label={t('occupancy.contract.dailyRentPerNight', {
                    defaultValue: 'Daily rent (per night)',
                  })}
                  value={agreedTotal}
                  onChange={(e) => {
                    setAgreedTotal(e.target.value);
                    if (agreedTotalError) {
                      setAgreedTotalError(null);
                    }
                  }}
                  type="number"
                  required
                  fullWidth
                  placeholder={t('occupancy.contract.dailyRentPlaceholder', {
                    defaultValue: 'Enter rent per night, e.g. 500',
                  })}
                  error={Boolean(agreedTotalError)}
                  helperText={agreedTotalError || ' '}
                />
              ) : (
                <TextField
                  inputRef={rentFieldRef}
                  label={
                    stayChoice === 'OPEN_ENDED'
                      ? t('occupancy.contract.dailyRent', { defaultValue: 'Daily rent' })
                      : t('occupancy.contract.rent')
                  }
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
                  placeholder={stayChoice === 'OPEN_ENDED' ? 'e.g. 200' : 'e.g. 8500'}
                  type="number"
                  required
                  error={Boolean(rentError)}
                  helperText={rentError || ' '}
                  fullWidth
                />
              )}

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

              {mode === 'RESERVE' ? (
                <Stack spacing={1}>
                  <TextField
                    label={t('occupancy.bookingAdvance.label', {
                      defaultValue: 'Booking advance (optional)',
                    })}
                    value={bookingAdvance}
                    onChange={(e) => {
                      const next = e.target.value;
                      setPriceDraft((current) => ({
                        ...current,
                        key: targetKey,
                        bookingAdvance: next,
                      }));
                    }}
                    placeholder="0"
                    type="number"
                    fullWidth
                    helperText={t('occupancy.bookingAdvance.hint', {
                      defaultValue:
                        'Part of the first-period rent, not an extra charge. Leave empty for existing reservation behaviour.',
                    })}
                  />
                  {(() => {
                    const firstPeriod =
                      stayChoice === 'SHORT' && stayRentAmount != null
                        ? stayRentAmount
                        : parseContractAmount(rent);
                    const { split, errorKey: advanceError } = resolveBookingAdvanceSplit({
                      firstPeriodRent: firstPeriod,
                      bookingAdvanceText: bookingAdvance,
                    });
                    if (advanceError) {
                      return (
                        <Alert severity="error">
                          {t(advanceError, {
                            defaultValue:
                              advanceError === 'occupancy.bookingAdvance.errors.exceedsRent'
                                ? 'Booking advance cannot exceed the first-period rent.'
                                : 'Enter a valid booking advance.',
                          })}
                        </Alert>
                      );
                    }
                    if (!split) {
                      return null;
                    }
                    return (
                      <Alert severity="info" variant="outlined">
                        {t('occupancy.bookingAdvance.remaining', {
                          defaultValue: 'Remaining rent: ₹{{amount}}',
                          amount: split.remainingRent.toLocaleString('en-IN'),
                        })}
                        <FormControlLabel
                          sx={{ display: 'block', mt: 0.5, ml: 0 }}
                          control={
                            <Checkbox
                              checked={bookingAdvanceCollected}
                              onChange={(e) =>
                                setPriceDraft((current) => ({
                                  ...current,
                                  key: targetKey,
                                  bookingAdvanceCollected: e.target.checked,
                                }))
                              }
                            />
                          }
                          label={t('occupancy.bookingAdvance.collected', {
                            defaultValue: 'Advance already collected',
                          })}
                        />
                      </Alert>
                    );
                  })()}
                </Stack>
              ) : null}

              <Stack spacing={0.25}>
                {!shortSelected &&
                stayChoice === 'MONTHLY' &&
                effectiveTarget?.defaultRent != null &&
                effectiveTarget.defaultRent > 0 ? (
                  <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                    {t('occupancy.contract.catalogRentHint', {
                      amount: effectiveTarget.defaultRent.toLocaleString('en-IN'),
                      defaultValue: 'Catalog default: ₹{{amount}}',
                    })}
                  </Typography>
                ) : null}
                {effectiveTarget?.defaultDeposit != null && effectiveTarget.defaultDeposit > 0 ? (
                  <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                    {t('occupancy.contract.catalogDepositHint', {
                      amount: effectiveTarget.defaultDeposit.toLocaleString('en-IN'),
                      defaultValue: 'Catalog default: ₹{{amount}}',
                    })}
                  </Typography>
                ) : (
                  <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                    {t('occupancy.contract.depositDefaultHint', {
                      defaultValue: 'Defaults to 0 if left empty',
                    })}
                  </Typography>
                )}
                {shortSelected ? (
                  <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                    {t('occupancy.contract.dailyRentPerNightHint', {
                      defaultValue: 'Amount charged for each night of the stay.',
                    })}
                  </Typography>
                ) : null}
                {stayChoice === 'OPEN_ENDED' ? (
                  <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                    {t('occupancy.contract.dailyRentHint', {
                      defaultValue:
                        'Owner-entered ₹/day. Not derived from monthly catalog rent.',
                    })}
                  </Typography>
                ) : null}
              </Stack>

              {nights != null && nights > 0 ? (
                <Alert severity="info" variant="outlined">
                  {t('occupancy.section.shortStayContractBanner', {
                    count: nights,
                    defaultValue: 'Daily · {{count}} nights',
                  })}
                </Alert>
              ) : null}

              {stayRentAmount != null && nights != null ? (
                <Alert severity="success" variant="outlined">
                  <Typography sx={{ fontWeight: 700 }}>
                    {t('occupancy.contract.stayRent', { defaultValue: 'Total stay rent' })}
                    {`: ₹${stayRentAmount.toLocaleString('en-IN')}`}
                  </Typography>
                  <Typography variant="body2">
                    {t('occupancy.contract.stayRentCalc', {
                      daily: `₹${dailyForStay}`,
                      count: nights,
                      defaultValue: '{{daily}} × {{count}} nights',
                    })}
                  </Typography>
                </Alert>
              ) : null}

              {totalPayable != null && stayRentAmount != null ? (
                <Alert severity="info" variant="outlined">
                  <Typography sx={{ fontWeight: 700 }}>
                    {t('occupancy.contract.totalPayableAtMoveIn', {
                      defaultValue: 'Total payable at move-in',
                    })}
                    {`: ₹${totalPayable.toLocaleString('en-IN')}`}
                  </Typography>
                  <Typography variant="body2">
                    {t('occupancy.contract.totalPayableBreakdown', {
                      defaultValue: 'Stay rent + Deposit',
                    })}
                    {` · ₹${stayRentAmount.toLocaleString('en-IN')} + ₹${depositParsed.toLocaleString('en-IN')}`}
                  </Typography>
                </Alert>
              ) : null}
            </Box>

            {mealsApply ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${s.border}`,
                  bgcolor: s.surface,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={foodEnabled}
                      onChange={(e) => setFoodEnabled(e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ ...DASHBOARD_UX.body, fontWeight: 700 }}>
                        {t('occupancy.contract.foodEnabled')}
                      </Typography>
                      <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
                        {foodEnabled
                          ? shortSelected
                            ? t('occupancy.contract.foodBundledHintShortStay', {
                                defaultValue:
                                  'Food is included in the stay rent. There is no separate food line.',
                              })
                            : stayChoice === 'OPEN_ENDED'
                              ? t('occupancy.contract.foodBundledHintDaily', {
                                  defaultValue:
                                    'Food is included in the daily rent amount above. There is no separate food line.',
                                })
                              : t('occupancy.contract.foodBundledHint', {
                                  defaultValue:
                                    'Food is included in the monthly rent amount above. There is no separate food line.',
                                })
                          : t('occupancy.contract.foodEnabledHint', {
                              defaultValue:
                                'Turn off if meals are not included with this stay',
                            })}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
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
      }
      case 'reserve_dates':
        return (
          <Stack spacing={2} sx={{ maxWidth: 480 }}>
            {stayDetailsExtras}
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {t('occupancyWizard.steps.reserveDatesHint')}
            </Typography>
            <TextField
              inputRef={moveInDateRef}
              label={t('occupancy.section.moveInDate')}
              value={moveInDate}
              onChange={(e) => {
                setMoveInDate(e.target.value);
                if (moveInDateError) {
                  setMoveInDateError(null);
                }
              }}
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              required
              error={Boolean(moveInDateError)}
              helperText={moveInDateError || ' '}
              fullWidth
            />
            {!shortSelected ? (
              <TextField
                label={t('occupancy.section.expectedMoveOut')}
                value={expectedExitDate}
                onChange={(e) => setExpectedExitDate(e.target.value)}
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            ) : (
              <TextField
                inputRef={agreedTotalRef}
                label={t('occupancy.contract.dailyRentPerNight', {
                  defaultValue: 'Daily rent (per night)',
                })}
                value={agreedTotal}
                onChange={(e) => {
                  setAgreedTotal(e.target.value);
                  if (agreedTotalError) {
                    setAgreedTotalError(null);
                  }
                }}
                type="number"
                required
                fullWidth
                placeholder={t('occupancy.contract.dailyRentPlaceholder', {
                  defaultValue: 'Enter rent per night, e.g. 500',
                })}
                error={Boolean(agreedTotalError)}
                helperText={
                  agreedTotalError ||
                  t('occupancy.contract.dailyRentPerNightHint', {
                    defaultValue: 'Amount charged for each night of the stay.',
                  })
                }
              />
            )}
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
      case 'review': {
        const dailyAmount = shortSelected ? parseContractAmount(agreedTotal) : null;
        const depositAmount = parseContractAmount(deposit) ?? 0;
        const reviewNights =
          shortSelected && moveInDate && expectedExitDate
            ? shortStayNightCount(moveInDate, expectedExitDate)
            : null;
        const stayRentAmount =
          dailyAmount != null && reviewNights != null && reviewNights > 0
            ? dailyAmount * reviewNights
            : null;
        const shortAllocationTotal =
          stayRentAmount != null ? stayRentAmount + Math.max(0, depositAmount) : null;
        const stayTypeLabel = t(stayChoiceLabelKey(stayChoice), {
          defaultValue: stayChoiceDefaultLabel(stayChoice),
        });
        const foodLabel = foodEnabled
          ? t('common.yes', { defaultValue: 'Yes' })
          : t('common.no', { defaultValue: 'No' });
        const formatInr = (value: number) => `₹${value.toLocaleString('en-IN')}`;
        const reviewCardSx = {
          p: 2,
          borderRadius: 2,
          border: `1px solid ${s.border}`,
          bgcolor: s.surface,
        };
        const reviewRow = (label: string, value: string, emphasize = false) => (
          <Stack
            key={`${label}-${value}`}
            direction="row"
            justifyContent="space-between"
            spacing={2}
            sx={{ py: 0.5 }}
          >
            <Typography
              sx={{
                ...DASHBOARD_UX.body,
                color: emphasize ? 'primary.main' : s.textSecondary,
                fontWeight: emphasize ? 700 : 500,
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                ...DASHBOARD_UX.body,
                fontWeight: emphasize ? 800 : 700,
                color: emphasize ? 'primary.main' : s.textPrimary,
                textAlign: 'right',
              }}
            >
              {value}
            </Typography>
          </Stack>
        );
        return (
          <Stack spacing={2} sx={{ maxWidth: 560 }}>
            <Box sx={reviewCardSx}>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, mb: 1 }}>
                {t('occupancyWizard.review.accommodation')}
              </Typography>
              <Typography sx={{ fontWeight: 800 }}>
                {formatOccupancyInventoryTitle(
                  {
                    bedName: effectiveTarget?.bedName ?? occupancyQuery.data?.bedName,
                    roomName: effectiveTarget?.roomName ?? occupancyQuery.data?.roomName,
                    unitName: effectiveTarget?.unitName ?? occupancyQuery.data?.unitName,
                    buildingName:
                      effectiveTarget?.buildingName ?? occupancyQuery.data?.buildingName,
                    displayPathShort: effectiveTarget?.displayPathShort,
                  },
                  t,
                )}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                {effectiveTarget?.displayPath ??
                  [occupancyQuery.data?.buildingName, occupancyQuery.data?.roomName]
                    .filter(Boolean)
                    .join(' · ') ??
                  '—'}
              </Typography>
            </Box>

            <Box sx={reviewCardSx}>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, mb: 1 }}>
                {t('occupancyWizard.review.member')}
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {selectedMember?.fullName ??
                  occupancyQuery.data?.memberName ??
                  effectiveMemberId}
              </Typography>
              {selectedMember?.mobileNumber ? (
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                  {selectedMember.mobileNumber}
                </Typography>
              ) : null}
            </Box>

            <Box sx={reviewCardSx}>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, mb: 1 }}>
                {shortSelected
                  ? t('occupancyWizard.review.chargesSummary', {
                      defaultValue: 'Charges Summary',
                    })
                  : t('occupancy.contract.title', { defaultValue: 'Contract terms' })}
              </Typography>
              {showStayChoice
                ? reviewRow(
                    t('occupancyWizard.steps.stayType', { defaultValue: 'Stay type' }),
                    stayTypeLabel,
                  )
                : null}
              {shortSelected ? (
                <>
                  {reviewRow(
                    t('occupancy.contract.dailyRent', { defaultValue: 'Daily rent' }),
                    dailyAmount != null
                      ? `${formatInr(dailyAmount)} / night`
                      : t('accommodation.pricingConfirm.notSet', { defaultValue: 'Not set' }),
                  )}
                  {reviewNights != null
                    ? reviewRow(
                        t('occupancy.section.duration', { defaultValue: 'Duration' }),
                        t('occupancy.section.stayDurationNightsCount', {
                          count: reviewNights,
                          defaultValue: '{{count}} nights',
                        }),
                      )
                    : null}
                  {stayRentAmount != null && dailyAmount != null && reviewNights != null
                    ? reviewRow(
                        t('occupancy.contract.stayRent', { defaultValue: 'Total stay rent' }),
                        `${formatInr(dailyAmount)} × ${reviewNights} = ${formatInr(stayRentAmount)}`,
                      )
                    : null}
                </>
              ) : (
                reviewRow(
                  stayChoice === 'OPEN_ENDED'
                    ? t('occupancy.contract.dailyRent', { defaultValue: 'Daily rent' })
                    : t('occupancy.contract.rent'),
                  parseContractAmount(rent) == null
                    ? t('accommodation.pricingConfirm.notSet', { defaultValue: 'Not set' })
                    : stayChoice === 'OPEN_ENDED'
                      ? `₹${rent} / day`
                      : `₹${rent}`,
                )
              )}
              {reviewRow(
                t('occupancy.contract.paymentSummary.deposit', {
                  defaultValue: 'Security deposit',
                }),
                parseContractAmount(deposit) == null
                  ? t('accommodation.pricingConfirm.notSet', { defaultValue: 'Not set' })
                  : `₹${deposit}`,
              )}
              {mode === 'RESERVE'
                ? (() => {
                    const firstPeriod =
                      stayChoice === 'SHORT' && stayRentAmount != null
                        ? stayRentAmount
                        : parseContractAmount(rent);
                    const { split } = resolveBookingAdvanceSplit({
                      firstPeriodRent: firstPeriod,
                      bookingAdvanceText: bookingAdvance,
                    });
                    if (!split) {
                      return reviewRow(
                        t('occupancy.bookingAdvance.label', {
                          defaultValue: 'Booking advance',
                        }),
                        t('occupancy.bookingAdvance.none', {
                          defaultValue: 'None — rent due at move-in',
                        }),
                      );
                    }
                    return (
                      <>
                        {reviewRow(
                          t('occupancy.bookingAdvance.label', {
                            defaultValue: 'Booking advance',
                          }),
                          `₹${split.bookingAdvance.toLocaleString('en-IN')}${
                            bookingAdvanceCollected ? ' (collected)' : ' (pending)'
                          }`,
                        )}
                        {reviewRow(
                          t('occupancy.bookingAdvance.remainingLabel', {
                            defaultValue: 'Remaining rent',
                          }),
                          `₹${split.remainingRent.toLocaleString('en-IN')}`,
                        )}
                      </>
                    );
                  })()
                : null}
              {mealsApply
                ? reviewRow(t('occupancy.contract.foodEnabled'), foodLabel)
                : null}
              {mode !== 'RESERVE' && shortAllocationTotal != null
                ? reviewRow(
                    t('occupancy.contract.paymentSummary.totalOnAllocation', {
                      defaultValue: 'Total on allocation',
                    }),
                    formatInr(shortAllocationTotal),
                    true,
                  )
                : null}
              {openEndedSelected ? (
                <Alert severity="info" sx={{ mt: 1 }}>
                  {t('occupancy.contract.dailyRentBillingNote', {
                    defaultValue:
                      'Daily rent accumulates into one rent charge per calendar month until vacate. Deposit is collected once on allocation.',
                  })}
                </Alert>
              ) : null}
            </Box>

            {(moveInDate &&
              (mode === 'ALLOCATE' || mode === 'RESERVE' || mode === 'MOVE_IN')) ||
            expectedExitDate ? (
              <Box sx={reviewCardSx}>
                <Typography sx={{ ...DASHBOARD_UX.cardTitle, mb: 1 }}>
                  {mode === 'RESERVE'
                    ? t('occupancyWizard.steps.reserveDates', {
                        defaultValue: 'Reservation details',
                      })
                    : t('occupancyWizard.review.stayDates', { defaultValue: 'Stay dates' })}
                </Typography>
                {moveInDate &&
                (mode === 'ALLOCATE' || mode === 'RESERVE' || mode === 'MOVE_IN')
                  ? reviewRow(t('occupancy.section.moveInDate'), moveInDate)
                  : null}
                {expectedExitDate
                  ? reviewRow(
                      t('occupancy.section.expectedMoveOut', {
                        defaultValue: 'Expected move-out',
                      }),
                      expectedExitDate,
                    )
                  : null}
              </Box>
            ) : null}
          </Stack>
        );
      }
      default:
        return null;
    }
  };

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t(getWizardTitleKey(mode))}
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
                mb: 2,
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                px: 0,
                overflowX: 'auto',
                '& .MuiStepConnector-root': { top: 12 },
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
            {showStayChoice ? (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={t('occupancy.section.stayTypeSelected', {
                  label: t(stayChoiceLabelKey(stayChoice), {
                    defaultValue: stayChoiceDefaultLabel(stayChoice),
                  }),
                  defaultValue: `Stay Type: ${stayChoiceDefaultLabel(stayChoice)}`,
                })}
                sx={{ mb: 2, alignSelf: 'flex-start', fontWeight: 700 }}
              />
            ) : null}
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
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary, fontWeight: 700 }}>
              {formatOccupancyInventoryTitle(
                {
                  bedName: effectiveTarget?.bedName,
                  roomName: effectiveTarget?.roomName,
                  unitName: effectiveTarget?.unitName,
                  buildingName: effectiveTarget?.buildingName,
                  displayPathShort: effectiveTarget?.displayPathShort,
                },
                t,
              )}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {effectiveTarget?.displayPath ??
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
            {isLast
              ? mode === 'VACATE'
                ? t('occupancy.vacate.confirm', { defaultValue: 'Vacate' })
                : mode === 'RESERVE'
                  ? t('occupancy.actions.reserve', { defaultValue: 'Reserve' })
                  : mode === 'MOVE_IN'
                    ? t('occupancy.actions.moveIn', { defaultValue: 'Move in' })
                    : mode === 'TRANSFER'
                      ? t('occupancy.actions.transfer', { defaultValue: 'Transfer' })
                      : t('occupancy.actions.allocate', { defaultValue: 'Allocate' })
              : t('common.continue')}
          </Button>
        </StickyFooter>

      <OccupancySuccessDialog
        open={successPayload != null}
        operation={successPayload?.operation ?? 'ALLOCATE'}
        memberName={successPayload?.memberName ?? ''}
        locationLabel={successPayload?.locationLabel ?? ''}
        stayTypeLabel={successPayload?.stayTypeLabel}
        onViewDetails={() => {
          const payload = successPayload;
          setSuccessPayload(null);
          if (payload?.memberId) {
            navigate(spaceMemberPath(spaceId, payload.memberId));
            return;
          }
          navigate(exitPath);
        }}
        onDone={() => {
          setSuccessPayload(null);
          navigate(exitPath);
        }}
      />
      {cancellationDialog}
    </PageContainer>
  );
}
