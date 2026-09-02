import type { SetupStructureInput } from '@/shared/types/accommodation';
import type { EditableSetupStructure } from './setupStructureTypes';

function moneyOrNull(value: number | null | undefined): number | null | undefined {
  return value == null ? undefined : value;
}

export function toSetupStructureInput(structure: EditableSetupStructure): SetupStructureInput {
  const mapBeds = (beds: EditableSetupStructure['floors'][number]['rooms'][number]['beds']) =>
    beds.map(bed => ({
      name: bed.label,
      number: bed.number || bed.label,
      defaultRent: moneyOrNull(bed.defaultRent),
      defaultDeposit: moneyOrNull(bed.defaultDeposit),
    }));

  const mapRooms = (rooms: EditableSetupStructure['floors'][number]['rooms']) =>
    rooms.map(room => ({
      name: room.name,
      number: room.number,
      capacity: room.capacity,
      beds: mapBeds(room.beds),
    }));

  const mapUnits = (units: EditableSetupStructure['units']) =>
    units.map(unit => ({
      name: unit.name,
      number: unit.number,
      rooms: mapRooms(unit.rooms),
    }));

  if (structure.kind === 'building_units') {
    return { units: mapUnits(structure.units) };
  }

  return {
    floors: structure.floors.map(floor => ({
      name: floor.name,
      number: floor.number,
      units: structure.kind === 'floors_with_units' ? mapUnits(floor.units) : [],
      rooms: structure.kind === 'floors_with_rooms' ? mapRooms(floor.rooms) : [],
    })),
  };
}
