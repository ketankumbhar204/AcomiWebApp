import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memberApi } from '../api/memberApi';
import type {
  CreateInvitationRequest,
  CreateMemberDocumentRequest,
  CreateMemberRequest,
  UpdateDepositRequest,
  UpdateEmergencyContactRequest,
  UpdateMemberRequest,
  UpdateMemberStatusRequest,
} from '@/shared/types/member';

export function useMembers(spaceId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ['members', spaceId],
    queryFn: () => memberApi.getMembers(spaceId!),
    enabled: Boolean(enabled && spaceId),
    staleTime: 20_000,
  });

  return {
    members: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function usePendingInvitations(spaceId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ['pending-invitations', spaceId],
    queryFn: () => memberApi.getPendingInvitations(spaceId!),
    enabled: Boolean(enabled && spaceId),
    staleTime: 20_000,
  });

  return {
    invitations: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useMemberDetails(
  spaceId: string | undefined,
  memberId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['member', spaceId, memberId],
    queryFn: () => memberApi.getMember(spaceId!, memberId!),
    enabled: Boolean(enabled && spaceId && memberId),
    staleTime: 15_000,
  });

  return {
    member: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useMemberMutations(spaceId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = async (memberId?: string) => {
    if (!spaceId) {
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['members', spaceId] });
    await queryClient.invalidateQueries({ queryKey: ['pending-invitations', spaceId] });
    if (memberId) {
      await queryClient.invalidateQueries({ queryKey: ['member', spaceId, memberId] });
      await queryClient.invalidateQueries({ queryKey: ['member-history', spaceId, memberId] });
      await queryClient.invalidateQueries({ queryKey: ['member-documents', spaceId, memberId] });
    }
  };

  const createMember = useMutation({
    mutationFn: (body: CreateMemberRequest) => memberApi.createMember(spaceId!, body),
    onSuccess: async () => invalidate(),
  });

  const updateMember = useMutation({
    mutationFn: ({ memberId, body }: { memberId: string; body: UpdateMemberRequest }) =>
      memberApi.updateMember(spaceId!, memberId, body),
    onSuccess: async (data) => invalidate(data.memberId),
  });

  const removeMember = useMutation({
    mutationFn: (memberId: string) => memberApi.removeMember(spaceId!, memberId),
    onSuccess: async () => invalidate(),
  });

  const createInvitation = useMutation({
    mutationFn: (body: CreateInvitationRequest) => memberApi.createInvitation(body),
    onSuccess: async () => invalidate(),
  });

  const cancelInvitation = useMutation({
    mutationFn: (invitationId: string) => memberApi.cancelInvitation(invitationId),
    onSuccess: async () => invalidate(),
  });

  const updateMemberStatus = useMutation({
    mutationFn: ({
      memberId,
      body,
    }: {
      memberId: string;
      body: UpdateMemberStatusRequest;
    }) => memberApi.updateMemberStatus(spaceId!, memberId, body),
    onSuccess: async (data) => invalidate(data.memberId),
  });

  const updateEmergencyContact = useMutation({
    mutationFn: ({
      memberId,
      body,
    }: {
      memberId: string;
      body: UpdateEmergencyContactRequest;
    }) => memberApi.updateEmergencyContact(spaceId!, memberId, body),
    onSuccess: async (data) => invalidate(data.memberId),
  });

  const updateDeposit = useMutation({
    mutationFn: ({ memberId, body }: { memberId: string; body: UpdateDepositRequest }) =>
      memberApi.updateDeposit(spaceId!, memberId, body),
    onSuccess: async (data) => invalidate(data.memberId),
  });

  const addMemberDocument = useMutation({
    mutationFn: ({
      memberId,
      body,
    }: {
      memberId: string;
      body: CreateMemberDocumentRequest;
    }) => memberApi.addMemberDocument(spaceId!, memberId, body),
    onSuccess: async (_data, variables) => invalidate(variables.memberId),
  });

  const deleteMemberDocument = useMutation({
    mutationFn: ({
      memberId,
      documentId,
    }: {
      memberId: string;
      documentId: string;
    }) => memberApi.deleteMemberDocument(spaceId!, memberId, documentId),
    onSuccess: async (_data, variables) => invalidate(variables.memberId),
  });

  return {
    createMember,
    updateMember,
    removeMember,
    createInvitation,
    cancelInvitation,
    updateMemberStatus,
    updateEmergencyContact,
    updateDeposit,
    addMemberDocument,
    deleteMemberDocument,
    invalidate,
  };
}
