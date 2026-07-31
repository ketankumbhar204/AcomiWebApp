import { useMemo } from 'react';
import type { SpaceType } from '@/shared/types/space';
import { evaluateSpaceLifecycle } from './evaluate';
import type {
  LifecycleEvaluationResult,
  LifecycleState,
  MilestoneId,
  MilestoneStatus,
  PredicateContext,
  RecommendedAction,
  SetupProgressSnapshot,
} from './types';

export type UseSpaceLifecycleResult = {
  evaluation: LifecycleEvaluationResult | null;
  lifecycle: LifecycleState | null;
  progress: SetupProgressSnapshot | null;
  completedMilestones: MilestoneStatus[];
  pendingMilestones: MilestoneStatus[];
  nextRecommendedAction: RecommendedAction | null;
  completedMilestoneIds: MilestoneId[];
  pendingMilestoneIds: MilestoneId[];
};

type UseSpaceLifecycleArgs = {
  spaceType: SpaceType | null | undefined;
  context: PredicateContext | null;
  enabled?: boolean;
};

/** Pure evaluation — no network I/O. */
export function useSpaceLifecycle({
  spaceType,
  context,
  enabled = true,
}: UseSpaceLifecycleArgs): UseSpaceLifecycleResult {
  const evaluation = useMemo(() => {
    if (!enabled || !spaceType || !context) {
      return null;
    }
    return evaluateSpaceLifecycle({
      spaceType,
      context: { ...context, spaceType },
    });
  }, [context, enabled, spaceType]);

  return useMemo(() => {
    if (!evaluation) {
      return {
        evaluation: null,
        lifecycle: null,
        progress: null,
        completedMilestones: [],
        pendingMilestones: [],
        nextRecommendedAction: null,
        completedMilestoneIds: [],
        pendingMilestoneIds: [],
      };
    }

    const completedMilestones = evaluation.statuses.filter((s) => s.applies && s.done);
    const pendingMilestones = evaluation.statuses.filter(
      (s) => s.applies && !s.done && s.kind !== 'derived',
    );

    return {
      evaluation,
      lifecycle: evaluation.lifecycle,
      progress: evaluation.progress,
      completedMilestones,
      pendingMilestones,
      nextRecommendedAction: evaluation.recommendation,
      completedMilestoneIds: evaluation.progress.completedMilestoneIds,
      pendingMilestoneIds: evaluation.progress.pendingMilestoneIds,
    };
  }, [evaluation]);
}
