import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import type { StepIconProps } from '@mui/material/StepIcon';
import type { LucideIcon } from 'lucide-react';
import { BedDouble, Building2, Check, DoorOpen, Layers3 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { FormSection } from '@/shared/components/FormSection';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StickyFooter, StickyFooterClearance } from '@/shared/components/StickyFooter';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { colors } from '@/shared/theme/colors';
import { getErrorMessage } from '@/shared/api/errors';
import { spaceAccommodationPath } from '@/routes/paths';
import type {
  AccommodationSetupRequest,
  PropertyLayoutMode,
  RoomType,
} from '@/shared/types/accommodation';
import { accommodationApi } from '../api/accommodationApi';
import {
  defaultLayoutModeForSpaceType,
  selectableLayoutModes,
} from '../utils/accommodationProfile';
import { PropertyLayoutModePicker } from '../illustrations/PropertyLayoutModePicker';
import { SetupStructurePreview } from '../setup-preview/SetupStructurePreview';
import { computeStructureTotals, expandToEditableStructure } from '../setup-preview/setupStructureModel';
import type { EditableSetupStructure } from '../setup-preview/setupStructureTypes';
import { toSetupStructureInput } from '../setup-preview/toSetupStructureInput';

const STEPS = ['layout', 'building', 'structure', 'preview'] as const;

export function QuickSetupWizardPage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.space?.spaceType ?? 'PG';

  const layoutOptions = selectableLayoutModes(spaceType);
  const [stepIndex, setStepIndex] = useState(0);
  const [layoutMode, setLayoutMode] = useState<PropertyLayoutMode>(
    defaultLayoutModeForSpaceType(spaceType),
  );
  const [buildingName, setBuildingName] = useState('');
  const [buildingCode, setBuildingCode] = useState('');
  const [buildingNameError, setBuildingNameError] = useState<string | null>(null);
  const [validatedBuildingName, setValidatedBuildingName] = useState<string | null>(null);
  const [floorCount, setFloorCount] = useState('3');
  const [includeGround, setIncludeGround] = useState(false);
  const [roomsPerFloor, setRoomsPerFloor] = useState('6');
  const [bedsPerRoom, setBedsPerRoom] = useState('2');
  const [apartmentsPerFloor, setApartmentsPerFloor] = useState('2');
  const [unitCount, setUnitCount] = useState('4');
  const [roomsPerUnit, setRoomsPerUnit] = useState('2');
  const [roomType, setRoomType] = useState<RoomType>('SHARED');
  const [preview, setPreview] = useState<{
    floors: number;
    units: number;
    rooms: number;
    beds: number;
  } | null>(null);
  const [editableStructure, setEditableStructure] = useState<EditableSetupStructure | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);

  useEffect(() => {
    document.title = `${t('accommodation.setup.title')} · ${t('common.appName')}`;
  }, [t]);

  const buildRequest = (): AccommodationSetupRequest => {
    const request: AccommodationSetupRequest = {
      spaceType,
      layoutMode,
      building: {
        name: buildingName.trim(),
        code: buildingCode.trim() || null,
      },
    };

    if (layoutMode === 'CORRIDOR_PG' || layoutMode === 'APARTMENT_PG') {
      request.floors = {
        count: Number(floorCount) || 1,
        includeGroundFloor: includeGround,
        apartmentsPerFloor:
          layoutMode === 'APARTMENT_PG' ? Number(apartmentsPerFloor) || 1 : undefined,
        roomsPerFloor: Number(roomsPerFloor) || 1,
        bedsPerRoom: Number(bedsPerRoom) || 1,
        defaultRoomType: roomType,
        capacityPerRoom: Number(bedsPerRoom) || 1,
      };
    } else {
      request.units = {
        count: Number(unitCount) || 1,
        roomsPerUnit: layoutMode === 'RENTAL' ? 0 : Number(roomsPerUnit) || 1,
        bedsPerRoom: layoutMode === 'RENTAL' ? 0 : Number(bedsPerRoom) || 1,
        defaultRoomType: roomType,
        capacityPerRoom: Number(bedsPerRoom) || 1,
      };
    }
    if (editableStructure) {
      request.structure = toSetupStructureInput({
        ...editableStructure,
        building: {
          name: buildingName.trim(),
          code: buildingCode.trim(),
        },
      });
    }
    return request;
  };

  const isStructurePg = layoutMode === 'CORRIDOR_PG' || layoutMode === 'APARTMENT_PG';
  const previewTotals = editableStructure ? computeStructureTotals(editableStructure) : preview;

  const canAdvance = useMemo(() => {
    const step = STEPS[stepIndex];
    if (step === 'layout') {
      return Boolean(layoutMode);
    }
    if (step === 'building') {
      return Boolean(buildingName.trim()) && !buildingNameError;
    }
    if (step === 'structure') {
      return true;
    }
    return Boolean(editableStructure);
  }, [buildingName, buildingNameError, editableStructure, layoutMode, stepIndex]);

  async function validateBuildingName(name: string): Promise<boolean> {
    const trimmed = name.trim();
    if (!trimmed) {
      setBuildingNameError(t('accommodation.buildings.nameRequired'));
      setValidatedBuildingName(null);
      return false;
    }
    if (validatedBuildingName === trimmed && !buildingNameError) {
      return true;
    }
    try {
      const result = await accommodationApi.checkBuildingAvailability(spaceId, trimmed);
      if (!result.nameAvailable) {
        setBuildingNameError(result.message || t('accommodation.setup.buildingNameTaken'));
        setValidatedBuildingName(trimmed);
        return false;
      }
      setBuildingNameError(null);
      setValidatedBuildingName(trimmed);
      return true;
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, t('common.errors.generic')), { variant: 'error' });
      return false;
    }
  }

  const handleNext = async () => {
    if (busy || creating || creatingRef.current) {
      return;
    }
    const step = STEPS[stepIndex];
    if (step === 'building') {
      setBusy(true);
      try {
        const available = await validateBuildingName(buildingName);
        if (available) {
          setStepIndex((index) => index + 1);
        }
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === 'structure') {
      setBusy(true);
      try {
        const result = await accommodationApi.previewSetup(spaceId, buildRequest());
        const structure = expandToEditableStructure(result.sample ?? [], result.totals, {
          buildingName: buildingName.trim(),
          buildingCode: buildingCode.trim(),
          layoutMode,
          spaceType,
          roomType,
          roomsPerParent:
            layoutMode === 'RENTAL'
              ? 0
              : layoutMode === 'CORRIDOR_PG' || layoutMode === 'APARTMENT_PG'
                ? Number(roomsPerFloor) || 1
                : Number(roomsPerUnit) || 1,
          bedsPerRoom: layoutMode === 'RENTAL' ? 0 : Number(bedsPerRoom) || 1,
          capacityPerRoom: layoutMode === 'RENTAL' ? 0 : Number(bedsPerRoom) || 1,
          includeGroundFloor: includeGround,
        });
        setEditableStructure(structure);
        setPreview(computeStructureTotals(structure));
        setStepIndex((index) => index + 1);
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error, t('accommodation.setup.errors.preview')), {
          variant: 'error',
        });
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === 'preview') {
      if (!editableStructure) {
        return;
      }
      creatingRef.current = true;
      setCreating(true);
      try {
        const key =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `setup-${Date.now()}`;
        await accommodationApi.executeSetup(spaceId, buildRequest(), key);
        enqueueSnackbar(t('accommodation.setup.success'), { variant: 'success' });
        navigate(spaceAccommodationPath(spaceId));
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error, t('accommodation.setup.errors.execute')), {
          variant: 'error',
        });
      } finally {
        creatingRef.current = false;
        setCreating(false);
      }
      return;
    }
    setStepIndex((index) => index + 1);
  };

  if (!permissions.canManageAccommodation) {
    return (
      <PageContainer>
        <Typography>{t('common.errors.forbidden')}</Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('accommodation.setup.title')}
          description={t('accommodation.setup.subtitle')}
          breadcrumbs={[
            { label: t('navigation.rooms'), to: spaceAccommodationPath(spaceId) },
            { label: t('accommodation.setup.title') },
          ]}
        />

        <ContentCard>
          <Box sx={{ px: { xs: 0.5, md: 2 }, py: { xs: 1, md: 2 } }}>
          <Stepper
            activeStep={stepIndex}
            alternativeLabel
            sx={{
              mb: 4,
              '& .MuiStepConnector-root': { top: 16 },
              '& .MuiStepConnector-line': {
                borderTopWidth: 2,
                borderColor: colors.primary,
              },
              '& .MuiStepConnector-root:not(.Mui-active):not(.Mui-completed) .MuiStepConnector-line': {
                borderColor: s.border,
              },
              '& .MuiStepLabel-label': {
                ...DASHBOARD_UX.body,
                mt: 1,
                color: s.textMuted,
                '&.Mui-active, &.Mui-completed': {
                  ...DASHBOARD_UX.link,
                  color: s.textPrimary,
                },
              },
            }}
          >
            {STEPS.map((step) => (
              <Step key={step}>
                <StepLabel slots={{ stepIcon: SetupStepIcon }}>
                  {t(`accommodation.setup.steps.${step}`)}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {STEPS[stepIndex] === 'layout' ? (
            <PropertyLayoutModePicker
              value={layoutMode}
              onChange={setLayoutMode}
              options={layoutOptions}
              variant="featured"
            />
          ) : null}

          {STEPS[stepIndex] === 'building' ? (
            <FormSection title={t(`accommodation.setup.steps.building`)}>
              <TextField
                label={t('accommodation.fields.name')}
                value={buildingName}
                onChange={(event) => {
                  setBuildingName(event.target.value);
                  setBuildingNameError(null);
                  setValidatedBuildingName(null);
                }}
                onBlur={() => {
                  if (buildingName.trim()) {
                    void validateBuildingName(buildingName);
                  }
                }}
                placeholder={t('accommodation.buildings.namePlaceholder')}
                required
                error={Boolean(buildingNameError)}
                helperText={buildingNameError ?? undefined}
                fullWidth
                size="small"
              />
              <TextField
                label={t('accommodation.fields.code')}
                value={buildingCode}
                onChange={(event) => setBuildingCode(event.target.value)}
                placeholder={t('accommodation.buildings.codePlaceholder')}
                fullWidth
                size="small"
              />
            </FormSection>
          ) : null}

          {STEPS[stepIndex] === 'structure' ? (
            <FormSection title={t(`accommodation.setup.steps.structure`)}>
              {isStructurePg ? (
                <>
                  <TextField
                    label={t('accommodation.setup.fields.floorCount')}
                    value={floorCount}
                    onChange={(event) => setFloorCount(event.target.value)}
                    placeholder="e.g. 3"
                    type="number"
                    fullWidth
                    size="small"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeGround}
                        onChange={(event) => setIncludeGround(event.target.checked)}
                      />
                    }
                    label={t('accommodation.setup.fields.includeGround')}
                  />
                  {layoutMode === 'APARTMENT_PG' ? (
                    <TextField
                      label={t('accommodation.setup.fields.apartmentsPerFloor')}
                      value={apartmentsPerFloor}
                      onChange={(event) => setApartmentsPerFloor(event.target.value)}
                      placeholder="e.g. 4"
                      type="number"
                      fullWidth
                      size="small"
                    />
                  ) : null}
                  <TextField
                    label={t('accommodation.setup.fields.roomsPerFloor')}
                    value={roomsPerFloor}
                    onChange={(event) => setRoomsPerFloor(event.target.value)}
                    placeholder="e.g. 8"
                    type="number"
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={t('accommodation.setup.fields.bedsPerRoom')}
                    value={bedsPerRoom}
                    onChange={(event) => setBedsPerRoom(event.target.value)}
                    placeholder="e.g. 2"
                    type="number"
                    fullWidth
                    size="small"
                  />
                </>
              ) : (
                <>
                  <TextField
                    label={t('accommodation.setup.fields.unitCount')}
                    value={unitCount}
                    onChange={(event) => setUnitCount(event.target.value)}
                    placeholder="e.g. 6"
                    type="number"
                    fullWidth
                    size="small"
                  />
                  {layoutMode !== 'RENTAL' ? (
                    <>
                      <TextField
                        label={t('accommodation.setup.fields.roomsPerUnit')}
                        value={roomsPerUnit}
                        onChange={(event) => setRoomsPerUnit(event.target.value)}
                        placeholder="e.g. 2"
                        type="number"
                        fullWidth
                        size="small"
                      />
                      <TextField
                        label={t('accommodation.setup.fields.bedsPerRoom')}
                        value={bedsPerRoom}
                        onChange={(event) => setBedsPerRoom(event.target.value)}
                        placeholder="e.g. 2"
                        type="number"
                        fullWidth
                        size="small"
                      />
                    </>
                  ) : null}
                </>
              )}
              {layoutMode !== 'RENTAL' ? (
                <FormControl fullWidth size="small">
                  <InputLabel>{t('accommodation.roomType.label')}</InputLabel>
                  <Select
                    label={t('accommodation.roomType.label')}
                    value={roomType}
                    onChange={(event) => setRoomType(event.target.value as RoomType)}
                  >
                    <MenuItem value="PRIVATE">{t('accommodation.roomType.PRIVATE')}</MenuItem>
                    <MenuItem value="SHARED">{t('accommodation.roomType.SHARED')}</MenuItem>
                    <MenuItem value="DORMITORY">{t('accommodation.roomType.DORMITORY')}</MenuItem>
                  </Select>
                </FormControl>
              ) : null}
            </FormSection>
          ) : null}

          {STEPS[stepIndex] === 'preview' && previewTotals && editableStructure ? (
            <Stack spacing={3}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <PreviewStatCard
                    icon={Layers3}
                    label={t('accommodation.setup.summary.floors')}
                    value={previewTotals.floors}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <PreviewStatCard
                    icon={Building2}
                    label={t('accommodation.setup.summary.units')}
                    value={previewTotals.units}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <PreviewStatCard
                    icon={DoorOpen}
                    label={t('accommodation.setup.summary.rooms')}
                    value={previewTotals.rooms}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <PreviewStatCard
                    icon={BedDouble}
                    label={t('accommodation.setup.summary.beds')}
                    value={previewTotals.beds}
                  />
                </Grid>
              </Grid>
              <SetupStructurePreview structure={editableStructure} onChange={setEditableStructure} />
            </Stack>
          ) : null}
          </Box>
        </ContentCard>
      </Stack>

      <StickyFooterClearance height={{ xs: 96, md: 80 }} />

      <StickyFooter
        pin="fixed"
        sx={{
          bgcolor: s.surface,
          borderTop: `1px solid ${s.border}`,
          boxShadow: '0 -4px 16px rgba(16, 24, 40, 0.06)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => {
              if (stepIndex === 0) {
                navigate(spaceAccommodationPath(spaceId));
              } else {
                setStepIndex((index) => index - 1);
              }
            }}
            disabled={busy || creating}
            sx={{
              ...dashOutlinedButtonSx,
              minHeight: 44,
              height: 44,
              px: 2.5,
              borderColor: colors.primary,
              color: colors.primary,
              '&:hover': { borderColor: colors.primaryHover, bgcolor: colors.mintSubtle },
            }}
          >
            {stepIndex === 0 ? t('common.cancel') : t('common.back')}
          </Button>
          <Button
            variant="contained"
            disabled={!canAdvance || busy || creating}
            onClick={() => void handleNext()}
            sx={{
              ...dashContainedButtonSx,
              minHeight: 44,
              height: 44,
              minWidth: STEPS[stepIndex] === 'preview' ? 188 : 120,
              px: 2.5,
            }}
          >
            {creating ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <CircularProgress size={18} color="inherit" />
                <span>{t('accommodation.setup.creatingLayout')}</span>
              </Stack>
            ) : STEPS[stepIndex] === 'preview' ? (
              t('accommodation.setup.execute')
            ) : STEPS[stepIndex] === 'structure' ? (
              t('accommodation.setup.preview')
            ) : (
              t('common.continue')
            )}
          </Button>
        </Box>
      </StickyFooter>
    </PageContainer>
  );
}

function SetupStepIcon({ active, completed, icon }: StepIconProps) {
  const filled = Boolean(active || completed);
  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        bgcolor: filled ? colors.primary : colors.border,
        color: filled ? colors.white : colors.textSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 14,
        boxShadow: filled ? '0 0 0 4px rgba(37, 211, 102, 0.16)' : 'none',
      }}
    >
      {completed ? <Check size={16} color={colors.white} strokeWidth={3} /> : icon}
    </Box>
  );
}

function PreviewStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.75,
        height: '100%',
        border: `1px solid ${s.border}`,
        borderRadius: '10px',
        bgcolor: s.surface,
        boxShadow: s.shadow,
      }}
    >
      <Icon size={22} color={colors.primary} strokeWidth={2} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.8125rem', color: s.textSecondary, lineHeight: 1.3 }}>
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: '1.375rem',
            fontWeight: 700,
            color: s.textPrimary,
            lineHeight: 1.3,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}

