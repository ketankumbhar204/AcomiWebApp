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
} from '@/shared/types/accommodation';
import type { MemberOccupancyListResponse } from '@/shared/types/member';

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

  cancelReservation: (spaceId: string, occupancyId: string, body?: { remarks?: string }) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<OccupancyResponse>>(
        `/spaces/${spaceId}/occupancies/${occupancyId}/cancel-reservation`,
        body ?? {},
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
