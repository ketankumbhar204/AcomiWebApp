import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import type { LucideIcon } from 'lucide-react';
import {
  BedDouble,
  Building2,
  ChevronDown,
  DoorOpen,
  Grid2x2,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { parseOptionalMoney, propagateBedPricing } from './setupPricingAutofill';
import { deleteBed, deleteFloor, deleteRoom, deleteUnit } from './setupStructureMutations';
import type {
  EditableBed,
  EditableFloor,
  EditableRoom,
  EditableSetupStructure,
  EditableUnit,
  StructureKind,
} from './setupStructureTypes';

type SetupStructurePreviewProps = {
  structure: EditableSetupStructure;
  onChange: (structure: EditableSetupStructure) => void;
};

type ViewOption = 'all' | 'floors' | 'rooms';

function moneyText(value: number | null | undefined): string {
  return value == null ? '' : String(value);
}

function mapBed(
  structure: EditableSetupStructure,
  bedId: string,
  mapper: (bed: EditableBed) => EditableBed,
): EditableSetupStructure {
  const mapRooms = (rooms: EditableSetupStructure['floors'][number]['rooms']) =>
    rooms.map((room) => ({
      ...room,
      beds: room.beds.map((bed) => (bed.id === bedId ? mapper(bed) : bed)),
    }));
  const mapUnits = (units: EditableSetupStructure['units']) =>
    units.map((unit) => ({ ...unit, rooms: mapRooms(unit.rooms) }));

  if (structure.kind === 'building_units') {
    return { ...structure, units: mapUnits(structure.units) };
  }
  return {
    ...structure,
    floors: structure.floors.map((floor) =>
      structure.kind === 'floors_with_units'
        ? { ...floor, units: mapUnits(floor.units) }
        : { ...floor, rooms: mapRooms(floor.rooms) },
    ),
  };
}

function collectIds(structure: EditableSetupStructure) {
  const floors: string[] = [];
  const units: string[] = [];
  const rooms: string[] = [];

  if (structure.kind === 'building_units') {
    for (const unit of structure.units) {
      units.push(unit.id);
      for (const room of unit.rooms) {
        rooms.push(room.id);
      }
    }
    return { floors, units, rooms };
  }

  for (const floor of structure.floors) {
    floors.push(floor.id);
    if (structure.kind === 'floors_with_units') {
      for (const unit of floor.units) {
        units.push(unit.id);
        for (const room of unit.rooms) {
          rooms.push(room.id);
        }
      }
    } else {
      for (const room of floor.rooms) {
        rooms.push(room.id);
      }
    }
  }
  return { floors, units, rooms };
}

function floorCounts(floor: EditableFloor, kind: StructureKind) {
  if (kind === 'floors_with_units') {
    const rooms = floor.units.reduce((sum, unit) => sum + unit.rooms.length, 0);
    const beds = floor.units.reduce(
      (sum, unit) => sum + unit.rooms.reduce((roomSum, room) => roomSum + room.beds.length, 0),
      0,
    );
    return { units: floor.units.length, rooms, beds };
  }
  return {
    units: 0,
    rooms: floor.rooms.length,
    beds: floor.rooms.reduce((sum, room) => sum + room.beds.length, 0),
  };
}

function unitCounts(unit: EditableUnit) {
  return {
    rooms: unit.rooms.length,
    beds: unit.rooms.reduce((sum, room) => sum + room.beds.length, 0),
  };
}

function toggleId(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

function formatBedName(label: string, t: (key: string, opts?: Record<string, string>) => string) {
  if (/^(bed|lower|middle|upper|top|bottom)\b/i.test(label.trim())) {
    return label;
  }
  return t('accommodation.setup.bedLabel', { label });
}

const accordionSx = {
  border: `1px solid ${colors.border}`,
  borderRadius: '10px !important',
  boxShadow: '0 2px 10px rgba(16, 24, 40, 0.05)',
  '&:before': { display: 'none' },
  overflow: 'hidden',
  bgcolor: 'background.paper',
} as const;

export function SetupStructurePreview({ structure, onChange }: SetupStructurePreviewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const ids = useMemo(() => collectIds(structure), [structure]);
  const [viewOption, setViewOption] = useState<ViewOption>('all');
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const firstFloor = ids.floors[0];
    const firstUnit = ids.units[0];
    const firstRoom = ids.rooms[0];
    if (firstFloor) {
      initial.add(firstFloor);
    }
    if (firstUnit) {
      initial.add(firstUnit);
    }
    if (firstRoom) {
      initial.add(firstRoom);
    }
    return initial;
  });

  function updateBedValue(bedId: string, field: 'defaultRent' | 'defaultDeposit', raw: string) {
    const parsed = parseOptionalMoney(raw);
    onChange(mapBed(structure, bedId, (bed) => ({ ...bed, [field]: parsed })));
  }

  function commitBedField(bedId: string, field: 'defaultRent' | 'defaultDeposit', raw: string) {
    const parsed = parseOptionalMoney(raw);
    const withValue = mapBed(structure, bedId, (bed) => ({ ...bed, [field]: parsed }));
    onChange(propagateBedPricing(withValue, bedId, field));
  }

  function expandAll() {
    setExpanded(new Set([...ids.floors, ...ids.units, ...ids.rooms]));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  function applyViewOption(next: ViewOption) {
    setViewOption(next);
    if (next === 'floors') {
      setExpanded(new Set());
      return;
    }
    if (next === 'rooms') {
      setExpanded(new Set([...ids.floors, ...ids.units]));
      return;
    }
    const all = new Set([...ids.floors, ...ids.units, ...ids.rooms]);
    setExpanded(all);
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { md: 'flex-start' }, justifyContent: 'space-between' }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
            {t('accommodation.setup.structurePreview')}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textSecondary, mt: 0.5 }}>
            {t('accommodation.setup.previewHint')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 148 }}>
            <InputLabel id="setup-view-options-label">{t('accommodation.setup.viewOptions')}</InputLabel>
            <Select
              labelId="setup-view-options-label"
              label={t('accommodation.setup.viewOptions')}
              value={viewOption}
              onChange={(event) => applyViewOption(event.target.value as ViewOption)}
            >
              <MenuItem value="all">{t('accommodation.setup.viewAllLevels')}</MenuItem>
              <MenuItem value="rooms">{t('accommodation.setup.viewRooms')}</MenuItem>
              <MenuItem value="floors">{t('accommodation.setup.viewFloors')}</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" size="small" onClick={expandAll} sx={toolbarButtonSx}>
            {t('accommodation.setup.expandAll')}
          </Button>
          <Button variant="outlined" size="small" onClick={collapseAll} sx={toolbarButtonSx}>
            {t('accommodation.setup.collapseAll')}
          </Button>
        </Stack>
      </Stack>

      {structure.kind === 'building_units'
        ? structure.units.map((unit) => (
            <UnitAccordion
              key={unit.id}
              unit={unit}
              expanded={expanded}
              onToggle={(id) => setExpanded((current) => toggleId(current, id))}
              onDeleteUnit={() => onChange(deleteUnit(structure, null, unit.id))}
              onDeleteRoom={(roomId) => onChange(deleteRoom(structure, null, unit.id, roomId))}
              onDeleteBed={(roomId, bedId) =>
                onChange(deleteBed(structure, null, unit.id, roomId, bedId))
              }
              onChangeBed={updateBedValue}
              onCommitBed={commitBedField}
            />
          ))
        : structure.floors.map((floor) => (
            <FloorAccordion
              key={floor.id}
              floor={floor}
              kind={structure.kind}
              expanded={expanded}
              onToggle={(id) => setExpanded((current) => toggleId(current, id))}
              onDeleteFloor={() => onChange(deleteFloor(structure, floor.id))}
              onDeleteUnit={(unitId) => onChange(deleteUnit(structure, floor.id, unitId))}
              onDeleteRoom={(unitId, roomId) =>
                onChange(deleteRoom(structure, floor.id, unitId, roomId))
              }
              onDeleteBed={(unitId, roomId, bedId) =>
                onChange(deleteBed(structure, floor.id, unitId, roomId, bedId))
              }
              onChangeBed={updateBedValue}
              onCommitBed={commitBedField}
            />
          ))}
    </Stack>
  );
}

const toolbarButtonSx = {
  textTransform: 'none',
  fontWeight: 600,
  borderColor: colors.primary,
  color: colors.primary,
  borderRadius: '8px',
  px: 1.5,
  '&:hover': {
    borderColor: colors.primaryHover,
    bgcolor: colors.mintSubtle,
  },
} as const;

function NodeHeader({
  icon: Icon,
  title,
  subtitle,
  onDelete,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', width: '100%', pr: 0.5 }}>
      <Icon size={20} color={colors.primary} strokeWidth={2} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: s.textPrimary, lineHeight: 1.3 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: s.textSecondary, mt: 0.15 }}>{subtitle}</Typography>
      </Box>
      <Button
        color="error"
        size="small"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        sx={{ textTransform: 'none', fontWeight: 600, minWidth: 0, px: 1 }}
      >
        {t('accommodation.setup.editor.delete')}
      </Button>
    </Stack>
  );
}

function FloorAccordion({
  floor,
  kind,
  expanded,
  onToggle,
  onDeleteFloor,
  onDeleteUnit,
  onDeleteRoom,
  onDeleteBed,
  onChangeBed,
  onCommitBed,
}: {
  floor: EditableFloor;
  kind: StructureKind;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onDeleteFloor: () => void;
  onDeleteUnit: (unitId: string) => void;
  onDeleteRoom: (unitId: string | null, roomId: string) => void;
  onDeleteBed: (unitId: string | null, roomId: string, bedId: string) => void;
  onChangeBed: (bedId: string, field: 'defaultRent' | 'defaultDeposit', raw: string) => void;
  onCommitBed: (bedId: string, field: 'defaultRent' | 'defaultDeposit', raw: string) => void;
}) {
  const { t } = useTranslation();
  const counts = floorCounts(floor, kind);
  const subtitle =
    counts.units > 0
      ? t('accommodation.setup.floorCountLineWithUnits', counts)
      : t('accommodation.setup.floorCountLine', counts);

  return (
    <Accordion
      disableGutters
      expanded={expanded.has(floor.id)}
      onChange={() => onToggle(floor.id)}
      sx={{ ...accordionSx, mb: 1.5 }}
    >
      <AccordionSummary
        expandIcon={<ChevronDown size={20} color={colors.primary} strokeWidth={2.2} />}
        sx={summarySx}
      >
        <NodeHeader icon={Building2} title={floor.name} subtitle={subtitle} onDelete={onDeleteFloor} />
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
        <Stack spacing={1.5}>
          {kind === 'floors_with_units'
            ? floor.units.map((unit) => (
                <UnitAccordion
                  key={unit.id}
                  unit={unit}
                  expanded={expanded}
                  onToggle={onToggle}
                  onDeleteUnit={() => onDeleteUnit(unit.id)}
                  onDeleteRoom={(roomId) => onDeleteRoom(unit.id, roomId)}
                  onDeleteBed={(roomId, bedId) => onDeleteBed(unit.id, roomId, bedId)}
                  onChangeBed={onChangeBed}
                  onCommitBed={onCommitBed}
                />
              ))
            : floor.rooms.map((room) => (
                <RoomAccordion
                  key={room.id}
                  room={room}
                  expanded={expanded.has(room.id)}
                  onToggle={() => onToggle(room.id)}
                  onDeleteRoom={() => onDeleteRoom(null, room.id)}
                  onDeleteBed={(bedId) => onDeleteBed(null, room.id, bedId)}
                  onChangeBed={onChangeBed}
                  onCommitBed={onCommitBed}
                />
              ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function UnitAccordion({
  unit,
  expanded,
  onToggle,
  onDeleteUnit,
  onDeleteRoom,
  onDeleteBed,
  onChangeBed,
  onCommitBed,
}: {
  unit: EditableUnit;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onDeleteUnit: () => void;
  onDeleteRoom: (roomId: string) => void;
  onDeleteBed: (roomId: string, bedId: string) => void;
  onChangeBed: (bedId: string, field: 'defaultRent' | 'defaultDeposit', raw: string) => void;
  onCommitBed: (bedId: string, field: 'defaultRent' | 'defaultDeposit', raw: string) => void;
}) {
  const { t } = useTranslation();
  const counts = unitCounts(unit);
  const subtitle =
    counts.rooms > 0
      ? t('accommodation.setup.unitCountLine', counts)
      : t('accommodation.setup.roomCountLine', { count: counts.beds });

  return (
    <Accordion
      disableGutters
      expanded={expanded.has(unit.id)}
      onChange={() => onToggle(unit.id)}
      sx={accordionSx}
    >
      <AccordionSummary
        expandIcon={<ChevronDown size={20} color={colors.primary} strokeWidth={2.2} />}
        sx={summarySx}
      >
        <NodeHeader
          icon={counts.rooms > 0 ? Grid2x2 : DoorOpen}
          title={unit.name}
          subtitle={subtitle}
          onDelete={onDeleteUnit}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 0, pb: 1.5 }}>
        <Stack spacing={1.25}>
          {unit.rooms.map((room) => (
            <RoomAccordion
              key={room.id}
              room={room}
              expanded={expanded.has(room.id)}
              onToggle={() => onToggle(room.id)}
              onDeleteRoom={() => onDeleteRoom(room.id)}
              onDeleteBed={(bedId) => onDeleteBed(room.id, bedId)}
              onChangeBed={onChangeBed}
              onCommitBed={onCommitBed}
            />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function RoomAccordion({
  room,
  expanded,
  onToggle,
  onDeleteRoom,
  onDeleteBed,
  onChangeBed,
  onCommitBed,
}: {
  room: EditableRoom;
  expanded: boolean;
  onToggle: () => void;
  onDeleteRoom: () => void;
  onDeleteBed: (bedId: string) => void;
  onChangeBed: (bedId: string, field: 'defaultRent' | 'defaultDeposit', raw: string) => void;
  onCommitBed: (bedId: string, field: 'defaultRent' | 'defaultDeposit', raw: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Accordion disableGutters expanded={expanded} onChange={onToggle} sx={accordionSx}>
      <AccordionSummary
        expandIcon={<ChevronDown size={20} color={colors.primary} strokeWidth={2.2} />}
        sx={summarySx}
      >
        <NodeHeader
          icon={DoorOpen}
          title={room.name}
          subtitle={t('accommodation.setup.roomCountLine', { count: room.beds.length })}
          onDelete={onDeleteRoom}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 0, pb: 1.5 }}>
        <Stack spacing={0.5} divider={<Box sx={{ borderBottom: `1px solid ${colors.border}` }} />}>
          {room.beds.map((bed) => (
            <BedRow
              key={bed.id}
              bed={bed}
              onDelete={() => onDeleteBed(bed.id)}
              onChangeBed={onChangeBed}
              onCommitBed={onCommitBed}
            />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function BedRow({
  bed,
  onDelete,
  onChangeBed,
  onCommitBed,
}: {
  bed: EditableBed;
  onDelete: () => void;
  onChangeBed: (bedId: string, field: 'defaultRent' | 'defaultDeposit', raw: string) => void;
  onCommitBed: (bedId: string, field: 'defaultRent' | 'defaultDeposit', raw: string) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      sx={{ alignItems: { xs: 'stretch', sm: 'center' }, py: 1.25 }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: { sm: 120 } }}>
        <BedDouble size={20} color={colors.primary} strokeWidth={2} />
        <Typography sx={{ fontWeight: 600, color: s.textPrimary, fontSize: '0.9rem' }}>
          {formatBedName(bed.label, t)}
        </Typography>
      </Stack>
      <TextField
        label={t('accommodation.setup.fields.rentInr')}
        size="small"
        type="number"
        value={moneyText(bed.defaultRent)}
        onChange={(event) => onChangeBed(bed.id, 'defaultRent', event.target.value)}
        onBlur={(event) => onCommitBed(bed.id, 'defaultRent', event.target.value)}
        placeholder={t('accommodation.setup.enterRent')}
        slotProps={{ htmlInput: { min: 0, step: 1 } }}
        sx={moneyFieldSx}
      />
      <TextField
        label={t('accommodation.setup.fields.depositInr')}
        size="small"
        type="number"
        value={moneyText(bed.defaultDeposit)}
        onChange={(event) => onChangeBed(bed.id, 'defaultDeposit', event.target.value)}
        onBlur={(event) => onCommitBed(bed.id, 'defaultDeposit', event.target.value)}
        placeholder={t('accommodation.setup.enterDeposit')}
        slotProps={{ htmlInput: { min: 0, step: 1 } }}
        sx={moneyFieldSx}
      />
      <IconButton
        color="error"
        onClick={onDelete}
        aria-label={t('accommodation.setup.deleteBed')}
        sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
      >
        <Trash2 size={18} />
      </IconButton>
    </Stack>
  );
}

const summarySx = {
  minHeight: 64,
  px: 2,
  '& .MuiAccordionSummary-content': { my: 1.25, mr: 1 },
} as const;

const moneyFieldSx = {
  flex: 1,
  minWidth: { xs: '100%', sm: 160 },
  '& input[type=number]': { MozAppearance: 'textfield' },
  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
} as const;
