import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accommodationApi } from '../api/accommodationApi';
import { occupancyApi } from '../api/occupancyApi';
import type {
  AllocateOccupancyRequest,
  CreateBedRequest,
  CreateBuildingRequest,
  CreateFloorRequest,
  CreateRoomRequest,
  CreateUnitRequest,
  MoveInOccupancyRequest,
  ReserveOccupancyRequest,
  TransferOccupancyRequest,
  UpdateBedRequest,
  UpdateBuildingRequest,
  UpdateFloorRequest,
  UpdateRoomRequest,
  UpdateUnitRequest,
} from '@/shared/types/accommodation';

export function useBuildings(spaceId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ['buildings', spaceId],
    queryFn: () => accommodationApi.getBuildings(spaceId!),
    enabled: Boolean(enabled && spaceId),
    staleTime: 20_000,
  });
  return {
    buildings: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useBuildingSummary(
  spaceId: string | undefined,
  buildingId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['building-summary', spaceId, buildingId],
    queryFn: () => accommodationApi.getBuildingSummary(spaceId!, buildingId!),
    enabled: Boolean(enabled && spaceId && buildingId),
    staleTime: 15_000,
  });
  return {
    summary: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useFloors(
  spaceId: string | undefined,
  buildingId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['floors', spaceId, buildingId],
    queryFn: () => accommodationApi.listFloors(spaceId!, buildingId!),
    enabled: Boolean(enabled && spaceId && buildingId),
    staleTime: 15_000,
  });
  return {
    floors: query.data?.content ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useUnits(
  spaceId: string | undefined,
  buildingId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['units', spaceId, buildingId],
    queryFn: () => accommodationApi.listUnits(spaceId!, buildingId!),
    enabled: Boolean(enabled && spaceId && buildingId),
    staleTime: 15_000,
  });
  return {
    units: query.data?.content ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useUnitsByFloor(
  spaceId: string | undefined,
  buildingId: string | undefined,
  floorId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['units-by-floor', spaceId, buildingId, floorId],
    queryFn: () => accommodationApi.listUnitsByFloor(spaceId!, buildingId!, floorId!),
    enabled: Boolean(enabled && spaceId && buildingId && floorId),
    staleTime: 15_000,
  });
  return {
    units: query.data?.content ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useRoomsByFloor(
  spaceId: string | undefined,
  floorId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['rooms-by-floor', spaceId, floorId],
    queryFn: () => accommodationApi.listRoomsByFloor(spaceId!, floorId!),
    enabled: Boolean(enabled && spaceId && floorId),
    staleTime: 15_000,
  });
  return {
    rooms: query.data?.content ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useRoomsByUnit(
  spaceId: string | undefined,
  unitId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['rooms-by-unit', spaceId, unitId],
    queryFn: () => accommodationApi.listRoomsByUnit(spaceId!, unitId!),
    enabled: Boolean(enabled && spaceId && unitId),
    staleTime: 15_000,
  });
  return {
    rooms: query.data?.content ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useBeds(spaceId: string | undefined, roomId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ['beds', spaceId, roomId],
    queryFn: () => accommodationApi.listBeds(spaceId!, roomId!),
    enabled: Boolean(enabled && spaceId && roomId),
    staleTime: 10_000,
  });
  return {
    beds: query.data?.content ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useBedDetail(
  spaceId: string | undefined,
  bedId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['bed', spaceId, bedId],
    queryFn: () => accommodationApi.getBed(spaceId!, bedId!),
    enabled: Boolean(enabled && spaceId && bedId),
    staleTime: 10_000,
  });
  return {
    bed: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useRoomDetail(
  spaceId: string | undefined,
  roomId: string | undefined,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ['room', spaceId, roomId],
    queryFn: () => accommodationApi.getRoom(spaceId!, roomId!),
    enabled: Boolean(enabled && spaceId && roomId),
    staleTime: 15_000,
  });
  return {
    room: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
  };
}

export function useAccommodationMutations(spaceId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    if (!spaceId) {
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['buildings', spaceId] });
    await queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes('floor') || String(q.queryKey[0]).includes('unit') || String(q.queryKey[0]).includes('room') || String(q.queryKey[0]).includes('bed') || String(q.queryKey[0]).includes('building') });
  };

  return {
    invalidate,
    createBuilding: useMutation({
      mutationFn: (body: CreateBuildingRequest) => accommodationApi.createBuilding(spaceId!, body),
      onSuccess: invalidate,
    }),
    updateBuilding: useMutation({
      mutationFn: ({ buildingId, body }: { buildingId: string; body: UpdateBuildingRequest }) =>
        accommodationApi.updateBuilding(spaceId!, buildingId, body),
      onSuccess: invalidate,
    }),
    createFloor: useMutation({
      mutationFn: ({ buildingId, body }: { buildingId: string; body: CreateFloorRequest }) =>
        accommodationApi.createFloor(spaceId!, buildingId, body),
      onSuccess: invalidate,
    }),
    updateFloor: useMutation({
      mutationFn: ({
        buildingId,
        floorId,
        body,
      }: {
        buildingId: string;
        floorId: string;
        body: UpdateFloorRequest;
      }) => accommodationApi.updateFloor(spaceId!, buildingId, floorId, body),
      onSuccess: invalidate,
    }),
    createUnit: useMutation({
      mutationFn: ({ buildingId, body }: { buildingId: string; body: CreateUnitRequest }) =>
        accommodationApi.createUnit(spaceId!, buildingId, body),
      onSuccess: invalidate,
    }),
    createUnitOnFloor: useMutation({
      mutationFn: ({
        buildingId,
        floorId,
        body,
      }: {
        buildingId: string;
        floorId: string;
        body: CreateUnitRequest;
      }) => accommodationApi.createUnitOnFloor(spaceId!, buildingId, floorId, body),
      onSuccess: invalidate,
    }),
    updateUnit: useMutation({
      mutationFn: ({ unitId, body }: { unitId: string; body: UpdateUnitRequest }) =>
        accommodationApi.updateUnit(spaceId!, unitId, body),
      onSuccess: invalidate,
    }),
    createRoomUnderFloor: useMutation({
      mutationFn: ({ floorId, body }: { floorId: string; body: CreateRoomRequest }) =>
        accommodationApi.createRoomUnderFloor(spaceId!, floorId, body),
      onSuccess: invalidate,
    }),
    createRoomUnderUnit: useMutation({
      mutationFn: ({ unitId, body }: { unitId: string; body: CreateRoomRequest }) =>
        accommodationApi.createRoomUnderUnit(spaceId!, unitId, body),
      onSuccess: invalidate,
    }),
    updateRoom: useMutation({
      mutationFn: ({ roomId, body }: { roomId: string; body: UpdateRoomRequest }) =>
        accommodationApi.updateRoom(spaceId!, roomId, body),
      onSuccess: invalidate,
    }),
    createBed: useMutation({
      mutationFn: ({ roomId, body }: { roomId: string; body: CreateBedRequest }) =>
        accommodationApi.createBed(spaceId!, roomId, body),
      onSuccess: invalidate,
    }),
    updateBed: useMutation({
      mutationFn: ({
        roomId,
        bedId,
        body,
      }: {
        roomId: string;
        bedId: string;
        body: UpdateBedRequest;
      }) => accommodationApi.updateBed(spaceId!, roomId, bedId, body),
      onSuccess: invalidate,
    }),
  };
}

export function useOccupancyMutations(spaceId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    if (!spaceId) {
      return;
    }
    await queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes('bed') || String(q.queryKey[0]).includes('occupanc') || String(q.queryKey[0]).includes('building') });
  };

  return {
    allocate: useMutation({
      mutationFn: (body: AllocateOccupancyRequest) => occupancyApi.allocate(spaceId!, body),
      onSuccess: invalidate,
    }),
    reserve: useMutation({
      mutationFn: (body: ReserveOccupancyRequest) => occupancyApi.reserve(spaceId!, body),
      onSuccess: invalidate,
    }),
    moveIn: useMutation({
      mutationFn: ({
        occupancyId,
        body,
      }: {
        occupancyId: string;
        body?: MoveInOccupancyRequest;
      }) => occupancyApi.moveIn(spaceId!, occupancyId, body),
      onSuccess: invalidate,
    }),
    transfer: useMutation({
      mutationFn: ({
        occupancyId,
        body,
      }: {
        occupancyId: string;
        body: TransferOccupancyRequest;
      }) => occupancyApi.transfer(spaceId!, occupancyId, body),
      onSuccess: invalidate,
    }),
    vacate: useMutation({
      mutationFn: ({ occupancyId, remarks }: { occupancyId: string; remarks?: string }) =>
        occupancyApi.vacate(spaceId!, occupancyId, { remarks }),
      onSuccess: invalidate,
    }),
    cancelReservation: useMutation({
      mutationFn: ({ occupancyId, remarks }: { occupancyId: string; remarks?: string }) =>
        occupancyApi.cancelReservation(spaceId!, occupancyId, { remarks }),
      onSuccess: invalidate,
    }),
  };
}
