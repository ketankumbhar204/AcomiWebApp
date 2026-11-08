import type { SpaceType } from '@/shared/types/space';
import { hasConcreteAllocationTarget } from './accommodationStaySupport';
import type { OccupancyWizardMode, OccupancyWizardStep } from './types';

export type OccupancyWizardParams = {
  spaceId: string;
  mode: OccupancyWizardMode;
  memberId?: string;
  bedId?: string;
  roomId?: string;
  unitId?: string;
  buildingId?: string;
  occupancyId?: string;
};

export type WizardStepOptions = {
  /** @deprecated Stay type is always shown for lodging flows; kept for call-site compat. */
  shortStayEnabled?: boolean;
  /** Needed so CO_LIVING roomId can skip the target step. */
  spaceType?: SpaceType | null;
};

export function getWizardSteps(
  mode: OccupancyWizardMode,
  params: Pick<
    OccupancyWizardParams,
    'memberId' | 'bedId' | 'roomId' | 'unitId' | 'occupancyId'
  >,
  options: WizardStepOptions = {},
): OccupancyWizardStep[] {
  const hasMember = Boolean(params.memberId);
  const hasTarget = hasConcreteAllocationTarget(options.spaceType ?? null, params);

  switch (mode) {
    case 'ALLOCATE': {
      // Stay type first (after optional target) so pricing/dates follow the chosen kind.
      const steps: OccupancyWizardStep[] = [];
      if (!hasTarget) {
        steps.push('target');
      }
      steps.push('stay_type');
      if (!hasMember) {
        steps.push('member');
      }
      steps.push('stay_details', 'contract', 'review');
      return steps;
    }
    case 'RESERVE': {
      const steps: OccupancyWizardStep[] = [];
      if (!hasTarget) {
        steps.push('target');
      }
      steps.push('stay_type');
      if (!hasMember) {
        steps.push('member');
      }
      // Dates then pricing so Reserve captures stay-type-specific rent/deposit without activating.
      steps.push('reserve_dates', 'contract', 'review');
      return steps;
    }
    case 'MOVE_IN': {
      return ['stay_type', 'stay_details', 'contract', 'review'];
    }
    case 'TRANSFER': {
      // Preserve source → destination selection; stay type before destination pricing.
      const steps: OccupancyWizardStep[] = [];
      if (!hasMember) {
        steps.push('member');
      }
      steps.push(
        'transfer_current',
        'target',
        'stay_type',
        'stay_details',
        'contract',
        'review',
      );
      return steps;
    }
    case 'VACATE': {
      const steps: OccupancyWizardStep[] = [];
      if (!hasMember) {
        steps.push('member');
      }
      steps.push('vacate_confirm');
      return steps;
    }
    default:
      return [];
  }
}

export function getWizardTitleKey(mode: OccupancyWizardMode): string {
  switch (mode) {
    case 'ALLOCATE':
      return 'occupancyWizard.title.allocate';
    case 'RESERVE':
      return 'occupancyWizard.title.reserve';
    case 'MOVE_IN':
      return 'occupancyWizard.title.moveIn';
    case 'TRANSFER':
      return 'occupancyWizard.title.transfer';
    case 'VACATE':
      return 'occupancyWizard.title.vacate';
    default:
      return 'occupancyWizard.title.default';
  }
}

export function getWizardStepTitleKey(step: OccupancyWizardStep): string {
  switch (step) {
    case 'member':
      return 'occupancyWizard.steps.member';
    case 'target':
      return 'occupancyWizard.steps.target';
    case 'stay_type':
      return 'occupancyWizard.steps.stayType';
    case 'stay_details':
      return 'occupancyWizard.steps.stayDetails';
    case 'contract':
      return 'occupancyWizard.steps.contract';
    case 'reserve_dates':
      return 'occupancyWizard.steps.reserveDates';
    case 'transfer_current':
      return 'occupancyWizard.steps.transferCurrent';
    case 'vacate_confirm':
      return 'occupancyWizard.steps.vacate';
    case 'review':
      return 'occupancyWizard.steps.review';
    default:
      return 'occupancyWizard.steps.review';
  }
}
