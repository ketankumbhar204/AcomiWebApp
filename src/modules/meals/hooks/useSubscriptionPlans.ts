import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionPlansApi } from '../api/subscriptionPlansApi';
import type {
  CreateSubscriptionActivationRequest,
  CreateSubscriptionPlanRequest,
  UpdateSubscriptionPlanRequest,
} from '@/shared/types/subscription';

export function useSubscriptionPlans(spaceId: string, includeInactive = true, enabled = true) {
  return useQuery({
    queryKey: ['subscription-plans', spaceId, includeInactive],
    queryFn: () => subscriptionPlansApi.listPlans(spaceId, { includeInactive }),
    enabled: Boolean(spaceId) && enabled,
  });
}

export function usePendingActivationRequests(spaceId: string, enabled = true) {
  return useQuery({
    queryKey: ['subscription-activation-pending', spaceId],
    queryFn: () => subscriptionPlansApi.listPendingRequests(spaceId),
    enabled: Boolean(spaceId) && enabled,
  });
}

export function useMySubscriptionStatus(spaceId: string, enabled = true) {
  return useQuery({
    queryKey: ['subscription-status-me', spaceId],
    queryFn: () => subscriptionPlansApi.getMyCustomerStatus(spaceId),
    enabled: Boolean(spaceId) && enabled,
  });
}

export function useSubscriptionPlanMutations(spaceId: string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['subscription-plans', spaceId] });
    await queryClient.invalidateQueries({ queryKey: ['subscription-activation-pending', spaceId] });
    await queryClient.invalidateQueries({ queryKey: ['subscription-status-me', spaceId] });
  };

  const createPlan = useMutation({
    mutationFn: (payload: CreateSubscriptionPlanRequest) =>
      subscriptionPlansApi.createPlan(spaceId, payload),
    onSuccess: invalidate,
  });

  const updatePlan = useMutation({
    mutationFn: ({
      planId,
      payload,
    }: {
      planId: string;
      payload: UpdateSubscriptionPlanRequest;
    }) => subscriptionPlansApi.updatePlan(spaceId, planId, payload),
    onSuccess: invalidate,
  });

  const deactivatePlan = useMutation({
    mutationFn: (planId: string) => subscriptionPlansApi.deactivatePlan(spaceId, planId),
    onSuccess: invalidate,
  });

  const approveRequest = useMutation({
    mutationFn: ({ requestId, ownerNotes }: { requestId: string; ownerNotes?: string }) =>
      subscriptionPlansApi.approveActivationRequest(spaceId, requestId, ownerNotes),
    onSuccess: invalidate,
  });

  const rejectRequest = useMutation({
    mutationFn: ({ requestId, ownerNotes }: { requestId: string; ownerNotes?: string }) =>
      subscriptionPlansApi.rejectActivationRequest(spaceId, requestId, ownerNotes),
    onSuccess: invalidate,
  });

  const createActivation = useMutation({
    mutationFn: ({
      memberId,
      payload,
    }: {
      memberId: string;
      payload: CreateSubscriptionActivationRequest;
    }) => subscriptionPlansApi.createActivationRequest(spaceId, memberId, payload),
    onSuccess: invalidate,
  });

  return {
    createPlan,
    updatePlan,
    deactivatePlan,
    approveRequest,
    rejectRequest,
    createActivation,
  };
}
