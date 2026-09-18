import apiClient from '@/shared/api/client';
import { unwrapApiResponse } from '@/shared/api/apiRequest';
import type { ApiResponse } from '@/shared/types/api';
import type { EntityPhotoKind } from '@/shared/files/entityPhoto';

type PhotoBody = { fileId: string };

function pathFor(kind: EntityPhotoKind, spaceId: string, entityId: string): string {
  switch (kind) {
    case 'space':
      return `/spaces/${spaceId}/photo`;
    case 'building':
      return `/spaces/${spaceId}/buildings/${entityId}/photo`;
    case 'floor':
      return `/spaces/${spaceId}/floors/${entityId}/photo`;
    case 'unit':
      return `/spaces/${spaceId}/units/${entityId}/photo`;
    case 'room':
      return `/spaces/${spaceId}/rooms/${entityId}/photo`;
    case 'bed':
      return `/spaces/${spaceId}/beds/${entityId}/photo`;
    case 'menuItem':
      return `/spaces/${spaceId}/food-items/${entityId}/photo`;
    case 'combo':
      return `/spaces/${spaceId}/meal-combos/${entityId}/photo`;
    default:
      return `/spaces/${spaceId}/photo`;
  }
}

export const entityPhotoApi = {
  replace: async (kind: EntityPhotoKind, spaceId: string, entityId: string, fileId: string) => {
    await unwrapApiResponse(
      apiClient.put<ApiResponse<unknown>>(pathFor(kind, spaceId, entityId), { fileId } satisfies PhotoBody),
    );
  },

  remove: async (kind: EntityPhotoKind, spaceId: string, entityId: string) => {
    await unwrapApiResponse(apiClient.delete<ApiResponse<unknown>>(pathFor(kind, spaceId, entityId)));
  },
};
