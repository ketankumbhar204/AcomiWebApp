import apiClient from '@/shared/api/client';
import { unwrapVoidResponse } from '@/shared/api/apiRequest';

async function postLifecycle(path: string): Promise<void> {
  await unwrapVoidResponse(apiClient.post(path));
}

/** Mirrors mobile `accommodationLifecycleApi` — deactivate / restore / delete. */
export const accommodationLifecycleApi = {
  deactivateBuilding: (spaceId: string, buildingId: string) =>
    postLifecycle(`/spaces/${spaceId}/buildings/${buildingId}/deactivate`),

  restoreBuilding: (spaceId: string, buildingId: string) =>
    postLifecycle(`/spaces/${spaceId}/buildings/${buildingId}/restore`),

  deleteBuilding: (spaceId: string, buildingId: string) =>
    postLifecycle(`/spaces/${spaceId}/buildings/${buildingId}/delete`),

  deactivateFloor: (spaceId: string, floorId: string) =>
    postLifecycle(`/spaces/${spaceId}/floors/${floorId}/deactivate`),

  restoreFloor: (spaceId: string, floorId: string) =>
    postLifecycle(`/spaces/${spaceId}/floors/${floorId}/restore`),

  deleteFloor: (spaceId: string, floorId: string) =>
    postLifecycle(`/spaces/${spaceId}/floors/${floorId}/delete`),

  deactivateUnit: (spaceId: string, unitId: string) =>
    postLifecycle(`/spaces/${spaceId}/units/${unitId}/deactivate`),

  restoreUnit: (spaceId: string, unitId: string) =>
    postLifecycle(`/spaces/${spaceId}/units/${unitId}/restore`),

  deleteUnit: (spaceId: string, unitId: string) =>
    postLifecycle(`/spaces/${spaceId}/units/${unitId}/delete`),

  deactivateRoom: (spaceId: string, roomId: string) =>
    postLifecycle(`/spaces/${spaceId}/rooms/${roomId}/deactivate`),

  restoreRoom: (spaceId: string, roomId: string) =>
    postLifecycle(`/spaces/${spaceId}/rooms/${roomId}/restore`),

  deleteRoom: (spaceId: string, roomId: string) =>
    postLifecycle(`/spaces/${spaceId}/rooms/${roomId}/delete`),

  deactivateBed: (spaceId: string, bedId: string) =>
    postLifecycle(`/spaces/${spaceId}/beds/${bedId}/deactivate`),

  restoreBed: (spaceId: string, bedId: string) =>
    postLifecycle(`/spaces/${spaceId}/beds/${bedId}/restore`),

  deleteBed: (spaceId: string, bedId: string) =>
    postLifecycle(`/spaces/${spaceId}/beds/${bedId}/delete`),
};
