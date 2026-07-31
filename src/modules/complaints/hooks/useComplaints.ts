import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { complaintsApi } from '../api/complaintsApi';
import type {
  AddComplaintAttachmentRequest,
  AddComplaintCommentRequest,
  AssignComplaintRequest,
  CreateComplaintRequest,
  ListComplaintsParams,
  ReopenComplaintRequest,
  UpdateComplaintResolutionRequest,
  UpdateComplaintStatusRequest,
} from '@/shared/types/complaints';

export function useComplaintsList(
  spaceId: string | undefined,
  params?: ListComplaintsParams,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['complaints-list', spaceId, params],
    queryFn: () => complaintsApi.list(spaceId!, params),
    enabled: Boolean(enabled && spaceId),
    staleTime: 15_000,
  });

  return {
    data: query.data ?? null,
    complaints: query.data?.complaints ?? [],
    totalCount: query.data?.totalCount ?? 0,
    openCount: query.data?.openCount ?? 0,
    inProgressCount: query.data?.inProgressCount ?? 0,
    resolvedCount: query.data?.resolvedCount ?? 0,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useComplaintDetail(
  spaceId: string | undefined,
  complaintId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['complaint', spaceId, complaintId],
    queryFn: () => complaintsApi.get(spaceId!, complaintId!),
    enabled: Boolean(enabled && spaceId && complaintId),
    staleTime: 10_000,
  });

  return {
    complaint: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useComplaintMutations(spaceId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      predicate: (q) => String(q.queryKey[0]).includes('complaint'),
    });
  };

  return {
    create: useMutation({
      mutationFn: (body: CreateComplaintRequest) => complaintsApi.create(spaceId!, body),
      onSuccess: invalidate,
    }),
    updateStatus: useMutation({
      mutationFn: ({
        complaintId,
        body,
      }: {
        complaintId: string;
        body: UpdateComplaintStatusRequest;
      }) => complaintsApi.updateStatus(spaceId!, complaintId, body),
      onSuccess: invalidate,
    }),
    addComment: useMutation({
      mutationFn: ({
        complaintId,
        body,
      }: {
        complaintId: string;
        body: AddComplaintCommentRequest;
      }) => complaintsApi.addComment(spaceId!, complaintId, body),
      onSuccess: invalidate,
    }),
    addAttachment: useMutation({
      mutationFn: ({
        complaintId,
        body,
      }: {
        complaintId: string;
        body: AddComplaintAttachmentRequest;
      }) => complaintsApi.addAttachment(spaceId!, complaintId, body),
      onSuccess: invalidate,
    }),
    reopen: useMutation({
      mutationFn: ({
        complaintId,
        body,
      }: {
        complaintId: string;
        body?: ReopenComplaintRequest;
      }) => complaintsApi.reopen(spaceId!, complaintId, body),
      onSuccess: invalidate,
    }),
    assign: useMutation({
      mutationFn: ({
        complaintId,
        body,
      }: {
        complaintId: string;
        body: AssignComplaintRequest;
      }) => complaintsApi.assign(spaceId!, complaintId, body),
      onSuccess: invalidate,
    }),
    updateResolution: useMutation({
      mutationFn: ({
        complaintId,
        body,
      }: {
        complaintId: string;
        body: UpdateComplaintResolutionRequest;
      }) => complaintsApi.updateResolution(spaceId!, complaintId, body),
      onSuccess: invalidate,
    }),
  };
}
