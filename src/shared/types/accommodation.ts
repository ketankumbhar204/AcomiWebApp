export type PropertyLayoutMode = 'CORRIDOR_PG' | 'APARTMENT_PG' | 'CO_LIVING' | 'RENTAL';
export type AccommodationStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'MAINTENANCE'
  | 'BLOCKED';
export type RoomType = 'PRIVATE' | 'SHARED' | 'DORMITORY';
export type UnitKind =
  | 'SINGLE_ROOM'
  | 'STUDIO'
  | 'RK'
  | 'BHK_1'
  | 'BHK_2'
  | 'BHK_3'
  | 'FLAT'
  | 'DORMITORY'
  | 'SUITE';
export type BedLabelStyle = 'ALPHA' | 'NUMERIC';

export type BulkCreateRoomsRequest = {
  count: number;
  startRoomNumber?: string;
  roomType: RoomType;
  capacity: number;
  bedsPerRoom: number;
  defaultStatus?: AccommodationStatus;
};

export type BulkCreateRoomsResponse = {
  roomsCreated: number;
  bedsCreated: number;
  roomIds: string[];
};

export type BulkCreateBedsRequest = {
  count: number;
  labelStyle: BedLabelStyle;
};

export type BulkCreateBedsResponse = {
  bedsCreated: number;
  bedIds: string[];
};
export type AllocationTargetType = 'BED' | 'ROOM' | 'UNIT';
export type OccupancyStatus = 'ACTIVE' | 'RESERVED' | 'VACATED';
export type TransferRentPolicy = 'KEEP' | 'APPLY_NEW' | 'CUSTOM';
export type MemberCategory =
  | 'STUDENT'
  | 'WORKING_PROFESSIONAL'
  | 'FAMILY'
  | 'GUEST'
  | 'INTERN';

export type AccommodationActionMetadata = {
  canEdit?: boolean;
  canDeactivate?: boolean;
  canRestore?: boolean;
  canDelete?: boolean;
  deleteReason?: string | null;
};

export type BuildingResponse = {
  buildingId: string;
  spaceId: string;
  name: string;
  code?: string | null;
  layoutMode: PropertyLayoutMode;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  actions?: AccommodationActionMetadata;
};

export type BuildingSummaryResponse = {
  buildingId: string;
  name: string;
  code?: string | null;
  spaceId: string;
  layoutMode: PropertyLayoutMode;
  unitCount?: number;
  visibleUnitCount?: number;
  syntheticUnitCount?: number;
  floors?: number;
  units?: number;
  rooms?: number;
  beds?: number;
  available?: number;
  occupied?: number;
  reserved?: number;
  maintenance?: number;
  blocked?: number;
  active?: boolean;
  actions?: AccommodationActionMetadata;
};

export type FloorResponse = {
  floorId: string;
  buildingId: string;
  name: string;
  floorNumber: number;
  sortOrder?: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  actions?: AccommodationActionMetadata;
};

export type FloorListItemResponse = {
  floorId: string;
  name: string;
  roomCount: number;
  bedCount: number;
  available: number;
  occupied: number;
  active?: boolean;
};

export type UnitResponse = {
  unitId: string;
  buildingId: string;
  floorId?: string | null;
  name: string;
  unitNumber: string;
  status: AccommodationStatus;
  synthetic?: boolean;
  unitKind?: UnitKind | null;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  defaultRent?: number | null;
  defaultDeposit?: number | null;
  actions?: AccommodationActionMetadata;
};

export type UnitListItemResponse = {
  unitId: string;
  name: string;
  roomCount: number;
  bedCount: number;
  availableBeds?: number;
  occupiedBeds?: number;
  status: AccommodationStatus;
  synthetic?: boolean;
  unitKind?: UnitKind | null;
  active?: boolean;
};

export type RoomResponse = {
  roomId: string;
  buildingId?: string | null;
  floorId?: string | null;
  unitId?: string | null;
  name: string;
  roomNumber: string;
  roomType: RoomType;
  capacity: number;
  status: AccommodationStatus;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  defaultRent?: number | null;
  defaultDeposit?: number | null;
  actions?: AccommodationActionMetadata;
};

export type RoomListItemResponse = {
  roomId: string;
  name: string;
  roomType: RoomType;
  bedCount: number;
  availableBeds: number;
  occupiedBeds: number;
  active?: boolean;
};

export type BedOccupantSummary = {
  occupancyId: string;
  memberId: string;
  memberName: string;
  occupancyStatus: OccupancyStatus | string;
};

export type BedResponse = {
  bedId: string;
  roomId: string;
  name: string;
  bedNumber: string;
  status: AccommodationStatus;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  defaultRent?: number | null;
  defaultDeposit?: number | null;
  actions?: AccommodationActionMetadata;
  occupant?: BedOccupantSummary | null;
};

export type BedListItemResponse = {
  bedId: string;
  label: string;
  status: AccommodationStatus;
  active?: boolean;
};

export type BedSpaceListItemResponse = {
  bedId: string;
  label: string;
  status: AccommodationStatus;
  buildingId: string;
  buildingName: string;
  floorId?: string | null;
  floorName?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  roomId: string;
  roomName: string;
};

export type DuplicateBuildingRequest = {
  targetBuildingName: string;
  targetBuildingCode?: string;
};

export type DuplicateBuildingResponse = {
  buildingId: string;
  name: string;
  code: string | null;
  floorsCreated: number;
  unitsCreated: number;
  roomsCreated: number;
  bedsCreated: number;
};

export type DuplicateFloorRequest = {
  targetFloorNumber: number;
  targetName?: string;
  renumberRooms?: boolean;
};

export type DuplicateFloorResponse = {
  floorId: string;
  floorNumber: number;
  roomsCreated: number;
  bedsCreated: number;
};

export type DuplicateRoomRequest = {
  targetRoomNumber?: string;
};

export type DuplicateRoomResponse = {
  roomId: string;
  roomNumber: string;
  bedsCreated: number;
};

export type CreateBuildingRequest = {
  name: string;
  code?: string | null;
  layoutMode: PropertyLayoutMode;
};

export type UpdateBuildingRequest = CreateBuildingRequest;

export type CreateFloorRequest = {
  name: string;
  floorNumber: number;
  sortOrder?: number;
};

export type UpdateFloorRequest = CreateFloorRequest;

export type CreateUnitRequest = {
  name: string;
  unitNumber: string;
  status?: AccommodationStatus;
  unitKind?: UnitKind | null;
};

export type UpdateUnitRequest = CreateUnitRequest & {
  defaultRent?: number | null;
  defaultDeposit?: number | null;
};

export type CreateRoomRequest = {
  name: string;
  roomNumber: string;
  roomType: RoomType;
  capacity: number;
  status?: AccommodationStatus;
};

export type UpdateRoomRequest = CreateRoomRequest & {
  defaultRent?: number | null;
  defaultDeposit?: number | null;
};

export type CreateBedRequest = {
  name: string;
  bedNumber: string;
  status?: AccommodationStatus;
};

export type UpdateBedRequest = CreateBedRequest & {
  defaultRent?: number | null;
  defaultDeposit?: number | null;
};

export type PgHostelSetupConfig = {
  count: number;
  includeGroundFloor?: boolean;
  apartmentsPerFloor?: number;
  roomsPerFloor: number;
  bedsPerRoom: number;
  defaultRoomType: RoomType;
  capacityPerRoom: number;
};

export type UnitSetupConfig = {
  count: number;
  startNumber?: number;
  numberingStep?: number;
  roomsPerUnit?: number;
  bedsPerRoom?: number;
  defaultRoomType?: RoomType;
  capacityPerRoom?: number;
  defaultStatus?: AccommodationStatus;
};

export type AccommodationSetupRequest = {
  spaceType: string;
  layoutMode?: PropertyLayoutMode;
  building: { name: string; code?: string | null };
  floors?: PgHostelSetupConfig;
  units?: UnitSetupConfig;
};

export type AccommodationSetupPreviewResponse = {
  totals: { floors: number; units: number; rooms: number; beds: number };
  sample?: unknown[];
  warnings?: string[];
};

export type AccommodationSetupResultResponse = {
  buildingId: string;
  totals: { floors: number; units: number; rooms: number; beds: number };
  idempotentReplay?: boolean;
};

export type AllocationTargetSearchResponse = {
  targetType: AllocationTargetType;
  targetId: string;
  buildingId?: string;
  buildingName?: string | null;
  floorId?: string | null;
  floorName?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  roomId?: string | null;
  roomName?: string | null;
  bedId?: string | null;
  bedName?: string | null;
  displayPath: string;
  displayPathShort?: string;
  status: AccommodationStatus;
  defaultRent?: number | null;
  defaultDeposit?: number | null;
  selectable: boolean;
  notSelectableReason?: string | null;
};

export type OccupancyChargeLine = {
  code: string;
  label: string;
  amount: number;
};

export type AllocateOccupancyRequest = {
  memberId: string;
  targetType: AllocationTargetType;
  bedId?: string | null;
  roomId?: string | null;
  unitId?: string | null;
  expectedCheckoutDate?: string | null;
  expectedExitDate?: string | null;
  remarks?: string | null;
  rentSnapshot?: number | null;
  depositSnapshot?: number | null;
  foodEnabled?: boolean;
  foodChargeSnapshot?: number | null;
  foodIncludedInRent?: boolean;
  otherCharges?: OccupancyChargeLine[];
  createMealParticipation?: boolean;
};

export type ReserveOccupancyRequest = {
  memberId: string;
  targetType: AllocationTargetType;
  bedId?: string | null;
  roomId?: string | null;
  unitId?: string | null;
  moveInDate: string;
  expectedExitDate?: string | null;
  memberCategory?: MemberCategory | null;
  remarks?: string | null;
};

export type TransferOccupancyRequest = {
  targetType: AllocationTargetType;
  bedId?: string | null;
  roomId?: string | null;
  unitId?: string | null;
  remarks?: string | null;
  rentPolicy?: TransferRentPolicy;
  rentSnapshot?: number | null;
  depositSnapshot?: number | null;
  foodEnabled?: boolean;
  foodChargeSnapshot?: number | null;
  foodIncludedInRent?: boolean;
};

export type MoveInOccupancyRequest = {
  moveInDate?: string | null;
  expectedExitDate?: string | null;
  allowEarlyMoveIn?: boolean;
  agreementSigned?: boolean;
  remarks?: string | null;
  rentSnapshot?: number | null;
  depositSnapshot?: number | null;
  foodEnabled?: boolean;
  foodChargeSnapshot?: number | null;
  foodIncludedInRent?: boolean;
};

export type OccupancyResponse = {
  occupancyId: string;
  spaceId: string;
  memberId: string;
  memberName: string;
  targetType: AllocationTargetType;
  buildingId: string;
  buildingName: string;
  floorId?: string | null;
  floorName?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  roomId?: string | null;
  roomName?: string | null;
  bedId?: string | null;
  bedName?: string | null;
  allocatedAt: string;
  reservedAt?: string | null;
  moveInDate?: string | null;
  actualMoveInAt?: string | null;
  expectedExitDate?: string | null;
  vacatedAt?: string | null;
  status: OccupancyStatus;
  remarks?: string | null;
  rentSnapshot?: number | null;
  depositSnapshot?: number | null;
  foodEnabled?: boolean;
  foodChargeSnapshot?: number | null;
  foodIncludedInRent?: boolean;
  createdAt?: string;
};

export type HierarchySelection =
  | { level: 'space' }
  | { level: 'building'; buildingId: string }
  | { level: 'floor'; buildingId: string; floorId: string }
  | { level: 'unit'; buildingId: string; unitId: string; floorId?: string }
  | { level: 'room'; buildingId: string; roomId: string; floorId?: string; unitId?: string }
  | {
      level: 'bed';
      buildingId: string;
      roomId: string;
      bedId: string;
      floorId?: string;
      unitId?: string;
    };
