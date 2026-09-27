import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '@/shared/api/errors';
import { spaceMemberPath, spaceOccupancyWizardPath } from '@/routes/paths';
import type { AccommodationStatus } from '@/shared/types/accommodation';
import { accommodationApi } from '../api/accommodationApi';
import {
  hasBedPricingChange,
  isBedDraftUnchanged,
  type BedInteractionDraft,
} from '../utils/bedInteractionDraft';
import { formatBedDisplayLabel } from '../utils/formatBedDisplayLabel';
import { updateBedNumberOnly } from '../utils/commitBedPricing';
import { useConfirmBedPricingCommit } from './useConfirmBedPricingCommit';

export type PersistedBedTarget = {
  bedId: string;
  roomId: string;
  buildingId?: string;
  floorId?: string | null;
  unitId?: string | null;
  label: string;
  bedNumber: string;
  status?: AccommodationStatus;
  rent?: number | null;
  deposit?: number | null;
  locationLine?: string;
  occupancyId?: string | null;
  memberId?: string | null;
  inactive?: boolean;
};

export function usePersistedBedInteraction(options: {
  spaceId: string;
  canEditStructure: boolean;
  canManageOccupancy?: boolean;
  returnTo?: string;
  onSuccess?: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [target, setTarget] = useState<PersistedBedTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const onSuccessRef = useRef(options.onSuccess);
  onSuccessRef.current = options.onSuccess;

  const pricingCommit = useConfirmBedPricingCommit({
    onSuccess: async () => {
      setTarget(null);
      await onSuccessRef.current?.();
    },
  });

  const open = useCallback(
    (next: PersistedBedTarget) => {
      setTarget(next);
      const needsOccupant =
        (next.status === 'OCCUPIED' || next.status === 'RESERVED') && !next.occupancyId;
      const needsPricing = next.rent == null && next.deposit == null;
      if (!needsOccupant && !needsPricing) {
        return;
      }
      void accommodationApi
        .getBed(options.spaceId, next.bedId)
        .then((detail) => {
          setTarget((current) =>
            current?.bedId === next.bedId
              ? {
                  ...current,
                  occupancyId: current.occupancyId ?? detail.occupant?.occupancyId,
                  memberId: current.memberId ?? detail.occupant?.memberId,
                  rent: current.rent ?? detail.defaultRent,
                  deposit: current.deposit ?? detail.defaultDeposit,
                  bedNumber: detail.bedNumber || current.bedNumber,
                  inactive: detail.active === false,
                  status: detail.status ?? current.status,
                }
              : current,
          );
        })
        .catch(() => undefined);
    },
    [options.spaceId],
  );

  const close = useCallback(() => {
    if (!pricingCommit.confirming) {
      setTarget(null);
    }
  }, [pricingCommit.confirming]);

  const save = useCallback(
    async (draft: BedInteractionDraft) => {
      if (!target || !options.canEditStructure || target.inactive) {
        return;
      }
      const current: BedInteractionDraft = {
        bedNumber: target.bedNumber,
        rent: target.rent ?? null,
        deposit: target.deposit ?? null,
      };
      if (isBedDraftUnchanged(current, draft)) {
        return;
      }
      const nextNumber = draft.bedNumber.trim();
      if (!nextNumber) {
        enqueueSnackbar(t('accommodation.beds.validationError', { defaultValue: 'Enter a bed number' }), {
          variant: 'warning',
        });
        return;
      }

      if (!hasBedPricingChange(current, draft)) {
        setSaving(true);
        try {
          await updateBedNumberOnly({
            spaceId: options.spaceId,
            roomId: target.roomId,
            bedId: target.bedId,
            bedNumber: nextNumber,
          });
          enqueueSnackbar(t('accommodation.beds.updateSuccess', { defaultValue: 'Bed updated' }), {
            variant: 'success',
          });
          setTarget(null);
          await onSuccessRef.current?.();
        } catch (err) {
          enqueueSnackbar(getErrorMessage(err, t('accommodation.errors.saveBed', { defaultValue: 'Could not save bed' })), {
            variant: 'error',
          });
        } finally {
          setSaving(false);
        }
        return;
      }

      pricingCommit.request({
        spaceId: options.spaceId,
        roomId: target.roomId,
        bedId: target.bedId,
        bedLabel: formatBedDisplayLabel(target.label || nextNumber, t),
        currentRent: target.rent,
        currentDeposit: target.deposit,
        nextRent: draft.rent,
        nextDeposit: draft.deposit,
        name: nextNumber,
        bedNumber: nextNumber,
      });
    },
    [enqueueSnackbar, options.canEditStructure, options.spaceId, pricingCommit, t, target],
  );

  const openWizard = useCallback(
    (mode: 'ALLOCATE' | 'RESERVE' | 'MOVE_IN' | 'TRANSFER' | 'VACATE') => {
      if (!target) {
        return;
      }
      setTarget(null);
      navigate(
        spaceOccupancyWizardPath(options.spaceId, mode, {
          bedId: target.bedId,
          roomId: target.roomId,
          unitId: target.unitId ?? undefined,
          buildingId: target.buildingId,
          occupancyId: target.occupancyId ?? undefined,
          memberId: target.memberId ?? undefined,
          returnTo: options.returnTo,
        }),
      );
    },
    [navigate, options.returnTo, options.spaceId, target],
  );

  const viewHistory = useCallback(() => {
    if (!target?.memberId) {
      return;
    }
    setTarget(null);
    navigate(spaceMemberPath(options.spaceId, target.memberId));
  }, [navigate, options.spaceId, target]);

  return {
    target,
    open,
    close,
    save,
    saving,
    pricingCommit,
    canEditStructure: options.canEditStructure,
    canManageOccupancy: options.canManageOccupancy === true,
    openWizard,
    viewHistory,
  };
}
