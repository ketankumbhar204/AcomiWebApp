import type { HealthFactor } from './types';
import { colors } from '@/shared/theme/colors';
import type { HealthCategoryId } from './healthWeights';
import type { RecommendedAction, SetupNavigationTarget } from '../types';

export type HealthNavAction =
  | { kind: 'setupTarget'; target: SetupNavigationTarget }
  | { kind: 'pendingActions' }
  | { kind: 'paymentsUnderReview' }
  | { kind: 'vacantBeds' }
  | { kind: 'occupiedBeds' };

/**
 * Maps a health factor / suggestion id to an in-app destination.
 * Ported from mobile — does not invent new recommendation logic.
 */
export function resolveHealthFactorAction(
  factor: HealthFactor,
  recommendation: RecommendedAction | null,
): HealthNavAction | null {
  switch (factor.id) {
    case 'ops.occupancy':
      return { kind: 'vacantBeds' };
    case 'attention.payments':
    case 'attention.reviewPayments':
      return { kind: 'paymentsUnderReview' };
    case 'attention.pending':
    case 'attention.resolvePending':
      return { kind: 'pendingActions' };
    case 'setup.progress':
    case 'setup.completeRemaining':
      return {
        kind: 'setupTarget',
        target: recommendation?.navigationTarget ?? 'QUICK_SETUP',
      };
    case 'ops.needProperty':
      return { kind: 'setupTarget', target: 'ACCOMMODATION_HOME' };
    case 'ops.needResidents':
    case 'ops.needCustomers':
      return { kind: 'setupTarget', target: 'ADD_MEMBER' };
    case 'ops.needMenuLibrary':
      return { kind: 'setupTarget', target: 'MENU_LIBRARY' };
    default:
      if (factor.id.startsWith('setup.rec.') && recommendation) {
        return { kind: 'setupTarget', target: recommendation.navigationTarget };
      }
      return null;
  }
}

export function categoryAccent(category: HealthCategoryId): {
  accent: string;
  soft: string;
} {
  switch (category) {
    case 'setup':
      return { accent: colors.success, soft: `${colors.success}18` };
    case 'operations':
      return { accent: colors.info, soft: `${colors.info}18` };
    case 'attention':
      return { accent: colors.warning, soft: `${colors.warning}18` };
    default:
      return { accent: colors.teal, soft: `${colors.teal}18` };
  }
}

export function bandAccent(band: string): string {
  switch (band) {
    case 'excellent':
    case 'healthy':
      return colors.success;
    case 'needsImprovement':
      return colors.warning;
    case 'atRisk':
      return '#EA580C';
    case 'critical':
      return colors.danger;
    default:
      return colors.teal;
  }
}
