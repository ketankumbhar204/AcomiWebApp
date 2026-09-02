import apiClient from '@/shared/api/client';
import { unwrapApiResponse, unwrapVoidResponse } from '@/shared/api/apiRequest';
import type { ApiResponse, PagedResponse } from '@/shared/types/api';
import type {
  BuildingAvailabilityResponse,
  AccommodationSetupPreviewResponse,
  AccommodationSetupRequest,
  AccommodationSetupResultResponse,
  AccommodationStatus,
  AllocationTargetSearchResponse,
  AllocationTargetType,
  BedListItemResponse,
  BedResponse,
  BedSpaceListItemResponse,
  BuildingResponse,
  BuildingSummaryResponse,
  BulkCreateBedsRequest,
  BulkCreateBedsResponse,
  BulkCreateRoomsRequest,
  BulkCreateRoomsResponse,
  CreateBedRequest,
  CreateBuildingRequest,
  CreateFloorRequest,
  CreateRoomRequest,
  CreateUnitRequest,
  DuplicateBuildingRequest,
  DuplicateBuildingResponse,
  DuplicateFloorRequest,
  DuplicateFloorResponse,
  DuplicateRoomRequest,
  DuplicateRoomResponse,
  FloorListItemResponse,
  FloorResponse,
  RoomListItemResponse,
  RoomResponse,
  UnitListItemResponse,
  UnitResponse,
  UpdateBedRequest,
  UpdateBuildingRequest,
  UpdateFloorRequest,
  UpdateRoomRequest,
  UpdateUnitRequest,
} from '@/shared/types/accommodation';

export const accommodationApi = {
  getBuildings: (spaceId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<BuildingResponse[]>>(`/spaces/${spaceId}/buildings`),
    ),

  getBuilding: (spaceId: string, buildingId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<BuildingResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}`,
      ),
    ),

  getBuildingSummary: (spaceId: string, buildingId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<BuildingSummaryResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/summary`,
      ),
    ),

  createBuilding: (spaceId: string, body: CreateBuildingRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<BuildingResponse>>(`/spaces/${spaceId}/buildings`, body),
    ),

  updateBuilding: (spaceId: string, buildingId: string, body: UpdateBuildingRequest) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<BuildingResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}`,
        body,
      ),
    ),

  listFloors: (spaceId: string, buildingId: string, params?: { page?: number; size?: number }) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<FloorListItemResponse>>>(
        `/spaces/${spaceId}/buildings/${buildingId}/floors`,
        { params: { view: 'summary', page: params?.page ?? 0, size: params?.size ?? 100 } },
      ),
    ),

  getFloor: (spaceId: string, floorId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<FloorResponse>>(`/spaces/${spaceId}/floors/${floorId}`),
    ),

  createFloor: (spaceId: string, buildingId: string, body: CreateFloorRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<FloorResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/floors`,
        body,
      ),
    ),

  updateFloor: (
    spaceId: string,
    buildingId: string,
    floorId: string,
    body: UpdateFloorRequest,
  ) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<FloorResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/floors/${floorId}`,
        body,
      ),
    ),

  listUnits: (spaceId: string, buildingId: string, params?: { page?: number; size?: number }) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<UnitListItemResponse>>>(
        `/spaces/${spaceId}/buildings/${buildingId}/units`,
        {
          params: {
            view: 'summary',
            includeSynthetic: false,
            page: params?.page ?? 0,
            size: params?.size ?? 100,
          },
        },
      ),
    ),

  listUnitsByFloor: (
    spaceId: string,
    buildingId: string,
    floorId: string,
    params?: { page?: number; size?: number },
  ) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<UnitListItemResponse>>>(
        `/spaces/${spaceId}/buildings/${buildingId}/floors/${floorId}/units`,
        {
          params: {
            view: 'summary',
            includeSynthetic: false,
            page: params?.page ?? 0,
            size: params?.size ?? 100,
          },
        },
      ),
    ),

  getUnit: (spaceId: string, unitId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<UnitResponse>>(`/spaces/${spaceId}/units/${unitId}`),
    ),

  createUnit: (spaceId: string, buildingId: string, body: CreateUnitRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<UnitResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/units`,
        body,
      ),
    ),

  createUnitOnFloor: (
    spaceId: string,
    buildingId: string,
    floorId: string,
    body: CreateUnitRequest,
  ) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<UnitResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/floors/${floorId}/units`,
        body,
      ),
    ),

  updateUnit: (spaceId: string, unitId: string, body: UpdateUnitRequest) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<UnitResponse>>(`/spaces/${spaceId}/units/${unitId}`, body),
    ),

  listRoomsByFloor: (spaceId: string, floorId: string, params?: { page?: number; size?: number }) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<RoomListItemResponse>>>(
        `/spaces/${spaceId}/floors/${floorId}/rooms`,
        { params: { view: 'summary', page: params?.page ?? 0, size: params?.size ?? 100 } },
      ),
    ),

  listRoomsByUnit: (spaceId: string, unitId: string, params?: { page?: number; size?: number }) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<RoomListItemResponse>>>(
        `/spaces/${spaceId}/units/${unitId}/rooms`,
        { params: { view: 'summary', page: params?.page ?? 0, size: params?.size ?? 100 } },
      ),
    ),

  getRoom: (spaceId: string, roomId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<RoomResponse>>(`/spaces/${spaceId}/rooms/${roomId}`),
    ),

  createRoomUnderFloor: (spaceId: string, floorId: string, body: CreateRoomRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<RoomResponse>>(
        `/spaces/${spaceId}/floors/${floorId}/rooms`,
        body,
      ),
    ),

  createRoomUnderUnit: (spaceId: string, unitId: string, body: CreateRoomRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<RoomResponse>>(
        `/spaces/${spaceId}/units/${unitId}/rooms`,
        body,
      ),
    ),

  updateRoom: (spaceId: string, roomId: string, body: UpdateRoomRequest) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<RoomResponse>>(`/spaces/${spaceId}/rooms/${roomId}`, body),
    ),

  listBeds: (spaceId: string, roomId: string, params?: { page?: number; size?: number }) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<BedListItemResponse>>>(
        `/spaces/${spaceId}/rooms/${roomId}/beds`,
        { params: { view: 'summary', page: params?.page ?? 0, size: params?.size ?? 100 } },
      ),
    ),

  getBed: (spaceId: string, bedId: string) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<BedResponse>>(`/spaces/${spaceId}/beds/${bedId}`),
    ),

  createBed: (spaceId: string, roomId: string, body: CreateBedRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<BedResponse>>(
        `/spaces/${spaceId}/rooms/${roomId}/beds`,
        body,
      ),
    ),

  updateBed: (spaceId: string, roomId: string, bedId: string, body: UpdateBedRequest) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<BedResponse>>(
        `/spaces/${spaceId}/rooms/${roomId}/beds/${bedId}`,
        body,
      ),
    ),

  searchBeds: (
    spaceId: string,
    params?: {
      query?: string;
      status?: AccommodationStatus;
      buildingId?: string;
      floorId?: string;
      unitId?: string;
      page?: number;
      size?: number;
    },
  ) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<BedSpaceListItemResponse>>>(
        `/spaces/${spaceId}/beds`,
        {
          params: {
            query: params?.query,
            status: params?.status,
            buildingId: params?.buildingId,
            floorId: params?.floorId,
            unitId: params?.unitId,
            page: params?.page ?? 0,
            size: params?.size ?? 50,
          },
        },
      ),
    ),

  searchAllocationTargets: (
    spaceId: string,
    params?: {
      query?: string;
      targetType?: AllocationTargetType;
      buildingId?: string;
      floorId?: string;
      unitId?: string;
      status?: AccommodationStatus;
      selectableOnly?: boolean;
      page?: number;
      size?: number;
    },
  ) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<AllocationTargetSearchResponse>>>(
        `/spaces/${spaceId}/accommodation/allocation-targets`,
        {
          params: {
            query: params?.query,
            targetType: params?.targetType,
            buildingId: params?.buildingId,
            floorId: params?.floorId,
            unitId: params?.unitId,
            status: params?.status,
            selectableOnly: params?.selectableOnly ?? true,
            page: params?.page ?? 0,
            size: params?.size ?? 30,
          },
        },
      ),
    ),

  previewSetup: (spaceId: string, body: AccommodationSetupRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AccommodationSetupPreviewResponse>>(
        `/spaces/${spaceId}/accommodation/setup/preview`,
        body,
      ),
    ),

  checkBuildingAvailability: (spaceId: string, name: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<BuildingAvailabilityResponse>>(
        `/spaces/${spaceId}/accommodation/setup/building-check`,
        { name },
      ),
    ),

  executeSetup: (spaceId: string, body: AccommodationSetupRequest, idempotencyKey: string) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AccommodationSetupResultResponse>>(
        `/spaces/${spaceId}/accommodation/setup`,
        body,
        { headers: { 'Idempotency-Key': idempotencyKey } },
      ),
    ),

  bulkCreateRoomsUnderFloor: (
    spaceId: string,
    floorId: string,
    body: BulkCreateRoomsRequest,
  ) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<BulkCreateRoomsResponse>>(
        `/spaces/${spaceId}/floors/${floorId}/rooms/bulk`,
        body,
      ),
    ),

  bulkCreateRoomsUnderUnit: (spaceId: string, unitId: string, body: BulkCreateRoomsRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<BulkCreateRoomsResponse>>(
        `/spaces/${spaceId}/units/${unitId}/rooms/bulk`,
        body,
      ),
    ),

  bulkCreateBeds: (spaceId: string, roomId: string, body: BulkCreateBedsRequest) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<BulkCreateBedsResponse>>(
        `/spaces/${spaceId}/rooms/${roomId}/beds/bulk`,
        body,
      ),
    ),

  duplicateBuilding: (
    spaceId: string,
    buildingId: string,
    body: DuplicateBuildingRequest,
  ): Promise<DuplicateBuildingResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<DuplicateBuildingResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/duplicate`,
        body,
      ),
    ),

  duplicateFloor: (
    spaceId: string,
    buildingId: string,
    floorId: string,
    body: DuplicateFloorRequest,
  ): Promise<DuplicateFloorResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<DuplicateFloorResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/floors/${floorId}/duplicate`,
        body,
      ),
    ),

  duplicateRoom: (
    spaceId: string,
    roomId: string,
    body: DuplicateRoomRequest,
  ): Promise<DuplicateRoomResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<DuplicateRoomResponse>>(
        `/spaces/${spaceId}/rooms/${roomId}/duplicate`,
        body,
      ),
    ),

  deactivateBuilding: async (spaceId: string, buildingId: string) => {
    await unwrapVoidResponse(
      apiClient.post(`/spaces/${spaceId}/buildings/${buildingId}/deactivate`),
    );
  },

  deactivateBed: async (spaceId: string, bedId: string) => {
    await unwrapVoidResponse(apiClient.post(`/spaces/${spaceId}/beds/${bedId}/deactivate`));
  },

  restoreBed: async (spaceId: string, bedId: string) => {
    await unwrapVoidResponse(apiClient.post(`/spaces/${spaceId}/beds/${bedId}/restore`));
  },
};
