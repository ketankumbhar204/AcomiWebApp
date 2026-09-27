import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { getErrorMessage } from '@/shared/api/errors';
import type { PricingField } from '../setup-preview/setupPricingAutofill';
import {
  buildSubmittedBedPricing,
  buildSubmittedBedPricingValues,
  changedPricingFields,
  commitBedPricingField,
  previewBedPricingScope,
} from '../utils/commitBedPricing';

export type PendingBedPricing = {
  spaceId: string;
  roomId: string;
  bedId: string;
  bedLabel: string;
  field: PricingField;
  changedFields: PricingField[];
  name?: string;
  bedNumber?: string;
  currentRent: number | null;
  currentDeposit: number | null;
  defaultRent: number | null;
  defaultDeposit: number | null;
  affectedBedCount: number | null;
  affectedLocations: string[];
};

export function useConfirmBedPricingCommit(options?: {
  onSuccess?: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [pending, setPending] = useState<PendingBedPricing | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmingRef = useRef(false);
  const pendingRef = useRef<PendingBedPricing | null>(null);
  const requestSeq = useRef(0);
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
      field?: PricingField;
      value?: number | null;
      nextRent?: number | null;
      nextDeposit?: number | null;
      name?: string;
      bedNumber?: string;
    }) => {
      if (confirmingRef.current || pendingRef.current) {
        return;
      }
      const currentRent = input.currentRent ?? null;
      const currentDeposit = input.currentDeposit ?? null;
      const submitted =
        input.nextRent !== undefined || input.nextDeposit !== undefined
          ? buildSubmittedBedPricingValues(
              input.nextRent ?? currentRent,
              input.nextDeposit ?? currentDeposit,
            )
          : buildSubmittedBedPricing(
              currentRent,
              currentDeposit,
              input.field ?? 'defaultRent',
              input.value ?? null,
            );
      const changedFields = changedPricingFields(
        currentRent,
        currentDeposit,
        submitted.defaultRent,
        submitted.defaultDeposit,
      );
      const primaryField = changedFields[0];
      if (!primaryField) {
        return;
      }
      const next: PendingBedPricing = {
        spaceId: input.spaceId,
        roomId: input.roomId,
        bedId: input.bedId,
        bedLabel: input.bedLabel,
        field: primaryField,
        changedFields,
        name: input.name,
        bedNumber: input.bedNumber,
        currentRent,
        currentDeposit,
        defaultRent: submitted.defaultRent,
        defaultDeposit: submitted.defaultDeposit,
        affectedBedCount: null,
        affectedLocations: [],
      };
      pendingRef.current = next;
      setPending(next);
      setError(null);
      const seq = ++requestSeq.current;
      void previewBedPricingScope({
        spaceId: next.spaceId,
        roomId: next.roomId,
        bedId: next.bedId,
        defaultRent: next.defaultRent,
        defaultDeposit: next.defaultDeposit,
      })
        .then((scope) => {
          if (seq !== requestSeq.current || pendingRef.current == null) {
            return;
          }
          const updated = {
            ...pendingRef.current,
            affectedBedCount: scope.affectedBedCount,
            affectedLocations: scope.affectedLocations,
          };
          pendingRef.current = updated;
          setPending(updated);
        })
        .catch(() => {
          if (seq !== requestSeq.current || pendingRef.current == null) {
            return;
          }
          const updated = {
            ...pendingRef.current,
            affectedBedCount: null,
            affectedLocations: [] as string[],
          };
          pendingRef.current = updated;
          setPending(updated);
        });
    },
    [],
  );

  const close = useCallback(() => {
    if (confirmingRef.current) {
      return;
    }
    requestSeq.current += 1;
    pendingRef.current = null;
    setPending(null);
    setError(null);
  }, []);

  const confirm = useCallback(async () => {
    if (!pending || confirmingRef.current) {
      return;
    }
    confirmingRef.current = true;
    setConfirming(true);
    setError(null);
    try {
      await commitBedPricingField({
        spaceId: pending.spaceId,
        roomId: pending.roomId,
        bedId: pending.bedId,
        defaultRent: pending.defaultRent,
        defaultDeposit: pending.defaultDeposit,
        name: pending.name,
        bedNumber: pending.bedNumber,
      });
      pendingRef.current = null;
      setPending(null);
      const count = pending.affectedBedCount;
      enqueueSnackbar(
        count != null && count > 1
          ? t('accommodation.pricingConfirm.successCount', {
              count,
              field:
                pending.field === 'defaultDeposit'
                  ? t('accommodation.setup.fields.deposit')
                  : t('accommodation.setup.fields.rent'),
            })
          : t('accommodation.pricingConfirm.success'),
        { variant: 'success' },
      );
      await onSuccessRef.current?.();
    } catch (caught) {
      setError(
        getErrorMessage(caught, t('accommodation.pricingConfirm.updateFailed')),
      );
    } finally {
      confirmingRef.current = false;
      setConfirming(false);
    }
  }, [enqueueSnackbar, pending, t]);

  return {
    pending,
    confirming,
    error,
    busy: pending != null || confirming,
    request,
    close,
    confirm,
  };
}
