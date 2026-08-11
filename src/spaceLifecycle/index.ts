/**
 * Space Lifecycle Engine — pure domain evaluation for setup milestones + Space Health.
 * Ported from React Native Amico (same calculator / predicates).
 */

export type {
  EvaluateSpaceLifecycleInput,
  LifecycleEvaluationResult,
  LifecycleState,
  MilestoneDefinition,
  MilestoneId,
  MilestoneKind,
  MilestoneStatus,
  PredicateContext,
  ProfileMilestone,
  RecommendedAction,
  SetupNavigationTarget,
  SetupProfile,
  SetupProgressSnapshot,
} from './types';

export { ALL_MILESTONE_IDS, getMilestoneDefinition, MILESTONE_CATALOG } from './milestones';
export {
  allSetupProfiles,
  hasProfileMilestone,
  LIFECYCLE_SPACE_TYPES,
  setupProfileForSpaceType,
} from './profiles';
export {
  evaluateMilestonePredicate,
  isDeliveryReady,
  isMealsReady,
  isPropertyReady,
  isResidentsReady,
  isSpaceCreated,
  needsPropertyStructure,
} from './predicates';
export { recommendNextAction } from './recommendation';
export { deriveLifecycleState } from './lifecycle';
export { evaluateSpaceLifecycle } from './evaluate';
export { emptyPredicateContext } from './compat';

export {
  ATTENTION_PENDING_SATURATION,
  HEALTH_BANDS,
  HEALTH_CATEGORY_WEIGHTS,
  OPERATIONS_OCCUPANCY_FULL_AT,
  SETUP_INCOMPLETE_SCORE_CAP,
  buildHealthSignals,
  calculateSpaceHealth,
  isHealthScoreAvailable,
  resolveHealthBand,
  useSpaceHealth,
  bandAccent,
  categoryAccent,
  resolveHealthFactorAction,
} from './health';
export type {
  CalculateSpaceHealthInput,
  HealthBandId,
  HealthCategoryBreakdown,
  HealthCategoryId,
  HealthFactor,
  HealthFactorTone,
  HealthNavAction,
  HealthOperationalExtras,
  HealthSignals,
  SpaceHealthResult,
  UseSpaceHealthArgs,
  UseSpaceHealthResult,
} from './health';

export { useSpaceLifecycle } from './useSpaceLifecycle';
export type { UseSpaceLifecycleResult } from './useSpaceLifecycle';

export { mapSetupNavigationTarget } from './navigation';
export type { SetupNavDestination } from './navigation';
export { navigateHealthAction } from './navigateHealthAction';
