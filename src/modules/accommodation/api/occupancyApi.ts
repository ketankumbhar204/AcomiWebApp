import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse, PagedResponse } from '@/shared/types/api';
import type {
  AllocateOccupancyRequest,
  MoveInOccupancyRequest,
  OccupancyResponse,
  OccupancyStatus,
  ReserveOccupancyRequest,
  TransferOccupancyRequest,
  ExtendOccupancyRequest,
  ExtendOccupancyResponse,
} from '@/shared/types/accommodation';
import type { MemberOccupancyListResponse } from '@/shared/types/member';
import type { PaymentSettlementAction } from '@/shared/types/payments';

export type ReservationPaymentSettlementDecision = {
  paymentId: string;
  action: PaymentSettlementAction;
  refundAmount?: number | null;
  retainedAmount?: number | null;
  reason?: string | null;
};

export type CancelReservationRequest = {
  remarks?: string | null;
  settlements?: ReservationPaymentSettlementDecision[] | null;
};

export type ReservationCancellationPreviewPayment = {
  paymentId: string;
  title: string;
  paymentType: string;
  paymentCategory: string;
  amount: number;
  currencyCode?: string | null;
  paymentStatus: string;
  collected: boolean;
  refundableAmount: number;
  alreadyRefundedAmount: number;
  alreadyRetainedAmount: number;
  disposition: string;
  allowedActions: PaymentSettlementAction[];
};

export type ReservationCancellationPreviewResponse = {
  occupancyId: string;
  memberId?: string | null;
  memberName?: string | null;
  payments: ReservationCancellationPreviewPayment[];
  requiresCollectedSettlement: boolean;
};

export const occupancyApi = {
  allocate: (spaceId: string, body: AllocateOccupancyRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<OccupancyResponse>>(`/spaces/${spaceId}/occupancies`, body),
    ),

  reserve: (spaceId: string, body: ReserveOccupancyRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<OccupancyResponse>>(
        `/spaces/${spaceId}/occupancies/reserve`,
        body,
      ),
    ),

  moveIn: (spaceId: string, occupancyId: string, body: MoveInOccupancyRequest = {}) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<OccupancyResponse>>(
        `/spaces/${spaceId}/occupancies/${occupancyId}/move-in`,
        body,
      ),
    ),

  transfer: (spaceId: string, occupancyId: string, body: TransferOccupancyRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<OccupancyResponse>>(
        `/spaces/${spaceId}/occupancies/${occupancyId}/transfer`,
        body,
      ),
    ),

  vacate: (spaceId: string, occupancyId: string, body?: { remarks?: string }) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<OccupancyResponse>>(
        `/spaces/${spaceId}/occupancies/${occupancyId}/vacate`,
        body ?? {},
      ),
    ),

  previewReservationCancellation: (spaceId: string, occupancyId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<ReservationCancellationPreviewResponse>>(
        `/spaces/${spaceId}/occupancies/${occupancyId}/cancellation-settlement`,
      ),
    ),

  cancelReservation: (
    spaceId: string,
    occupancyId: string,
    body?: CancelReservationRequest,
  ) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<OccupancyResponse>>(
        `/spaces/${spaceId}/occupancies/${occupancyId}/cancel-reservation`,
        body ?? {},
      ),
    ),

  extend: (spaceId: string, occupancyId: string, body: ExtendOccupancyRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<ExtendOccupancyResponse>>(
        `/spaces/${spaceId}/occupancies/${occupancyId}/extend`,
        body,
      ),
    ),

  getOccupancy: (spaceId: string, occupancyId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<OccupancyResponse>>(
        `/spaces/${spaceId}/occupancies/${occupancyId}`,
      ),
    ),

  listOccupancies: (
    spaceId: string,
    params?: {
      status?: OccupancyStatus;
      memberId?: string;
      buildingId?: string;
      floorId?: string;
      unitId?: string;
      roomId?: string;
      bedId?: string;
      page?: number;
      size?: number;
    },
  ) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<OccupancyResponse>>>(
        `/spaces/${spaceId}/occupancies`,
        { params: { ...params, page: params?.page ?? 0, size: params?.size ?? 50 } },
      ),
    ),

  getMemberOccupancies: (spaceId: string, memberId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MemberOccupancyListResponse>>(
        `/spaces/${spaceId}/members/${memberId}/occupancies`,
      ),
    ),
};
