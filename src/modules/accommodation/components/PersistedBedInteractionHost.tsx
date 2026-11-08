import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { occupancyApi } from '../api/occupancyApi';
import { resolveOccupancyStayKind } from '../utils/stayFinancialDisplay';
import type { usePersistedBedInteraction } from '../hooks/usePersistedBedInteraction';
import { formatBedDisplayLabel } from '../utils/formatBedDisplayLabel';
import { defaultMonthlyRenewalEndDate } from '../utils/extendStay';
import { useReservationCancellationDialog } from '../hooks/useReservationCancellationDialog';
import { BedInteractionDialog } from './BedInteractionDialog';
import { BedPricingConfirmDialog } from './BedPricingConfirmDialog';
import { ExtendStayDialog } from './ExtendStayDialog';
import { ReviseOpenEndedRentDialog } from './ReviseOpenEndedRentDialog';

export function PersistedBedInteractionHost({
  interaction,
}: {
  interaction: ReturnType<typeof usePersistedBedInteraction>;
}) {
  const { t } = useTranslation();
  const [extendSession, setExtendSession] = useState<{
    occupancyId: string;
    variant: 'extend' | 'renewal';
    initialExpectedExitDate?: string;
  } | null>(null);
  const [reviseSession, setReviseSession] = useState<{
    occupancyId: string;
    currentDailyRent?: number | null;
  } | null>(null);
  const bedOccupancy = useQuery({
    queryKey: ['occupancy', interaction.spaceId, interaction.target?.occupancyId],
    queryFn: () =>
      occupancyApi.getOccupancy(interaction.spaceId, interaction.target!.occupancyId!),
    enabled: Boolean(interaction.target?.occupancyId),
  });
  const extendOccupancy = useQuery({
    queryKey: ['occupancy', interaction.spaceId, extendSession?.occupancyId],
    queryFn: () => occupancyApi.getOccupancy(interaction.spaceId, extendSession!.occupancyId),
    enabled: Boolean(extendSession?.occupancyId),
  });
  const {
    spaceId,
    target,
    close,
    save,
    saving,
    pricingCommit,
    canEditStructure,
    canManageOccupancy,
    openWizard,
    viewHistory,
  } = interaction;

  const stayKind = bedOccupancy.data
    ? resolveOccupancyStayKind(bedOccupancy.data)
    : null;
  const { openCancelReservation, cancellationDialog } = useReservationCancellationDialog(
    spaceId,
    () => {
      void bedOccupancy.refetch();
    },
  );

  return (
    <>
      <BedInteractionDialog
        open={target != null}
        mode="persisted"
        label={target ? formatBedDisplayLabel(target.label || target.bedNumber, t) : ''}
        spaceId={spaceId}
        bedId={target?.bedId}
        name={target?.name ?? target?.label}
        bedNumber={target?.bedNumber ?? ''}
        locationLine={target?.locationLine}
        status={target?.status}
        rent={target?.rent}
        deposit={target?.deposit}
        canEdit={canEditStructure && target?.inactive !== true}
        saving={saving || pricingCommit.busy}
        occupancy={
          target && canManageOccupancy
            ? {
                status: target.status,
                occupancyId: target.occupancyId,
                memberId: target.memberId,
                canManage: canManageOccupancy,
                stayKind,
                onAllocate: () => openWizard('ALLOCATE'),
                onReserve: () => openWizard('RESERVE'),
                onMoveIn: () => openWizard('MOVE_IN'),
                onCancel: () => openCancelReservation(target.occupancyId),
                onTransfer: () => openWizard('TRANSFER'),
                onExtend: () => {
                  if (target.occupancyId) {
                    setExtendSession({ occupancyId: target.occupancyId, variant: 'extend' });
                  }
                },
                onReviseOpenEnded: () => {
                  if (target.occupancyId) {
                    setReviseSession({
                      occupancyId: target.occupancyId,
                      currentDailyRent: bedOccupancy.data?.rentSnapshot,
                    });
                  }
                },
                onRenewMonthly:
                  stayKind !== 'OPEN_ENDED' && stayKind !== 'SHORT'
                    ? () => {
                        if (target.occupancyId) {
                          setExtendSession({
                            occupancyId: target.occupancyId,
                            variant: 'renewal',
                            initialExpectedExitDate: defaultMonthlyRenewalEndDate(
                              bedOccupancy.data?.expectedExitDate ?? null,
                            ),
                          });
                        }
                      }
                    : undefined,
                onVacate: () => openWizard('VACATE'),
                onViewHistory: target.memberId ? viewHistory : undefined,
              }
            : undefined
        }
        onClose={close}
        onSave={(draft) => {
          void save(draft);
        }}
      />
      <BedPricingConfirmDialog
        pending={pricingCommit.pending}
        confirming={pricingCommit.confirming}
        error={pricingCommit.error}
        onConfirm={() => void pricingCommit.confirm()}
        onClose={pricingCommit.close}
      />
      <ExtendStayDialog
        open={extendSession != null}
        spaceId={spaceId}
        occupancyId={extendSession?.occupancyId ?? null}
        variant={extendSession?.variant ?? 'extend'}
        stayKind={
          extendOccupancy.data ? resolveOccupancyStayKind(extendOccupancy.data) : undefined
        }
        initialExpectedExitDate={extendSession?.initialExpectedExitDate ?? ''}
        onClose={() => setExtendSession(null)}
      />
      <ReviseOpenEndedRentDialog
        open={reviseSession != null}
        spaceId={spaceId}
        occupancyId={reviseSession?.occupancyId ?? null}
        currentDailyRent={reviseSession?.currentDailyRent}
        onClose={() => setReviseSession(null)}
      />
      {cancellationDialog}
    </>
  );
}
