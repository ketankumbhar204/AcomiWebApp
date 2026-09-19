import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { getErrorMessage } from '@/shared/api/errors';
import type { PricingField } from '../setup-preview/setupPricingAutofill';
import {
  buildSubmittedBedPricing,
  commitBedPricingField,
} from '../utils/commitBedPricing';

export type PendingBedPricing = {
  spaceId: string;
  roomId: string;
  bedId: string;
  bedLabel: string;
  currentRent: number | null;
  currentDeposit: number | null;
  defaultRent: number | null;
  defaultDeposit: number | null;
};

export function useConfirmBedPricingCommit(options?: {
  onSuccess?: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [pending, setPending] = useState<PendingBedPricing | null>(null);
  const [confirming, setConfirming] = useState(false);
  const confirmingRef = useRef(false);
  const pendingRef = useRef<PendingBedPricing | null>(null);
  const onSuccessRef = useRef(options?.onSuccess);
  onSuccessRef.current = options?.onSuccess;

  const request = useCallback(
    (input: {
      spaceId: string;
      roomId: string;
      bedId: string;
      bedLabel: string;
      currentRent: number | null | undefined;
      currentDeposit: number | null | undefined;
      field: PricingField;
      value: number | null;
    }) => {
      if (confirmingRef.current || pendingRef.current) {
        return;
      }
      const currentRent = input.currentRent ?? null;
      const currentDeposit = input.currentDeposit ?? null;
      const submitted = buildSubmittedBedPricing(
        currentRent,
        currentDeposit,
        input.field,
        input.value,
      );
      const next: PendingBedPricing = {
        spaceId: input.spaceId,
        roomId: input.roomId,
        bedId: input.bedId,
        bedLabel: input.bedLabel,
        currentRent,
        currentDeposit,
        defaultRent: submitted.defaultRent,
        defaultDeposit: submitted.defaultDeposit,
      };
      pendingRef.current = next;
      setPending(next);
    },
    [],
  );

  const close = useCallback(() => {
    if (confirmingRef.current) {
      return;
    }
    pendingRef.current = null;
    setPending(null);
  }, []);

  const confirm = useCallback(async () => {
    if (!pending || confirmingRef.current) {
      return;
    }
    confirmingRef.current = true;
    setConfirming(true);
    try {
      await commitBedPricingField({
        spaceId: pending.spaceId,
        roomId: pending.roomId,
        bedId: pending.bedId,
        defaultRent: pending.defaultRent,
        defaultDeposit: pending.defaultDeposit,
      });
      pendingRef.current = null;
      setPending(null);
      enqueueSnackbar(t('accommodation.pricingConfirm.success'), { variant: 'success' });
      await onSuccessRef.current?.();
    } catch (error) {
      pendingRef.current = null;
      setPending(null);
      enqueueSnackbar(getErrorMessage(error, t('accommodation.errors.saveBed')), {
        variant: 'error',
      });
    } finally {
      confirmingRef.current = false;
      setConfirming(false);
    }
  }, [enqueueSnackbar, pending, t]);

  return {
    pending,
    confirming,
    busy: pending != null || confirming,
    request,
    close,
    confirm,
  };
}
