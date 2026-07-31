import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse, PagedResponse } from '@/shared/types/api';

export type OccupancyStatus = 'ACTIVE' | 'RESERVED' | 'VACATED';

export type OccupancyListItem = {
  occupancyId: string;
  spaceId?: string;
  memberId: string;
  memberName: string;
  status: OccupancyStatus | string;
  buildingName?: string | null;
  floorName?: string | null;
  unitName?: string | null;
  roomName?: string | null;
  bedName?: string | null;
  bedId?: string | null;
  moveInDate?: string | null;
  actualMoveInAt?: string | null;
  createdAt?: string;
};

export type BedSpaceListItem = {
  bedId: string;
  label: string;
  status: string;
  buildingId?: string;
  buildingName?: string | null;
  floorId?: string | null;
  floorName?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  roomId?: string;
  roomName?: string | null;
};

export const dashboardDrilldownApi = {
  listOccupancies: async (
    spaceId: string,
    params?: { status?: string; page?: number; size?: number },
  ): Promise<PagedResponse<OccupancyListItem>> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<OccupancyListItem>>>(
        `/spaces/${spaceId}/occupancies`,
        {
          params: {
            status: params?.status,
            page: params?.page ?? 0,
            size: params?.size ?? 500,
          },
        },
      ),
    );
  },

  listBeds: async (
    spaceId: string,
    params?: { status?: string; page?: number; size?: number },
  ): Promise<PagedResponse<BedSpaceListItem>> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<BedSpaceListItem>>>(`/spaces/${spaceId}/beds`, {
        params: {
          status: params?.status,
          page: params?.page ?? 0,
          size: params?.size ?? 500,
        },
      }),
    );
  },
};
