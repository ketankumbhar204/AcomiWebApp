import { useTranslation } from 'react-i18next';
import type { usePersistedBedInteraction } from '../hooks/usePersistedBedInteraction';
import { formatBedDisplayLabel } from '../utils/formatBedDisplayLabel';
import { BedInteractionDialog } from './BedInteractionDialog';
import { BedPricingConfirmDialog } from './BedPricingConfirmDialog';

export function PersistedBedInteractionHost({
  interaction,
}: {
  interaction: ReturnType<typeof usePersistedBedInteraction>;
}) {
  const { t } = useTranslation();
  const {
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

  return (
    <>
      <BedInteractionDialog
        open={target != null}
        mode="persisted"
        label={target ? formatBedDisplayLabel(target.label || target.bedNumber, t) : ''}
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
                onAllocate: () => openWizard('ALLOCATE'),
                onReserve: () => openWizard('RESERVE'),
                onMoveIn: () => openWizard('MOVE_IN'),
                onCancel: () => openWizard('VACATE'),
                onTransfer: () => openWizard('TRANSFER'),
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
    </>
  );
}
