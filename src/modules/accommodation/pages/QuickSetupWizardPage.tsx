import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { FormSection } from '@/shared/components/FormSection';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
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
  const [floorCount, setFloorCount] = useState('3');
  const [includeGround, setIncludeGround] = useState(true);
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
  const [busy, setBusy] = useState(false);

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
    return request;
  };

  const isStructurePg = layoutMode === 'CORRIDOR_PG' || layoutMode === 'APARTMENT_PG';

  const canAdvance = useMemo(() => {
    const step = STEPS[stepIndex];
    if (step === 'layout') {
      return Boolean(layoutMode);
    }
    if (step === 'building') {
      return Boolean(buildingName.trim());
    }
    if (step === 'structure') {
      return true;
    }
    return Boolean(preview);
  }, [buildingName, layoutMode, preview, stepIndex]);

  const handleNext = async () => {
    const step = STEPS[stepIndex];
    if (step === 'structure') {
      setBusy(true);
      try {
        const result = await accommodationApi.previewSetup(spaceId, buildRequest());
        setPreview(result.totals);
        setStepIndex((i) => i + 1);
      } catch {
        enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === 'preview') {
      setBusy(true);
      try {
        const key =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `setup-${Date.now()}`;
        await accommodationApi.executeSetup(spaceId, buildRequest(), key);
        enqueueSnackbar(t('accommodation.setup.success'), { variant: 'success' });
        navigate(spaceAccommodationPath(spaceId));
      } catch {
        enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
      } finally {
        setBusy(false);
      }
      return;
    }
    setStepIndex((i) => i + 1);
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
            { label: t('navigation.accommodation'), to: spaceAccommodationPath(spaceId) },
            { label: t('accommodation.setup.title') },
          ]}
        />

        <ContentCard>
          <Stepper
            activeStep={stepIndex}
            alternativeLabel
            sx={{
              mb: 3,
              '& .MuiStepLabel-label': {
                ...DASHBOARD_UX.body,
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
                <StepLabel>{t(`accommodation.setup.steps.${step}`)}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {STEPS[stepIndex] === 'layout' ? (
            <FormSection title={t(`accommodation.setup.steps.layout`)}>
              <Box sx={{ gridColumn: { md: '1 / -1' }, maxWidth: 560 }}>
                <PropertyLayoutModePicker
                  value={layoutMode}
                  onChange={setLayoutMode}
                  options={layoutOptions}
                />
              </Box>
            </FormSection>
          ) : null}

          {STEPS[stepIndex] === 'building' ? (
            <FormSection title={t(`accommodation.setup.steps.building`)}>
              <TextField
                label={t('accommodation.fields.name')}
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                placeholder={t('accommodation.buildings.namePlaceholder')}
                required
                fullWidth
                size="small"
              />
              <TextField
                label={t('accommodation.fields.code')}
                value={buildingCode}
                onChange={(e) => setBuildingCode(e.target.value)}
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
                    onChange={(e) => setFloorCount(e.target.value)}
                    placeholder="e.g. 3"
                    type="number"
                    fullWidth
                    size="small"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeGround}
                        onChange={(e) => setIncludeGround(e.target.checked)}
                      />
                    }
                    label={t('accommodation.setup.fields.includeGround')}
                  />
                  {layoutMode === 'APARTMENT_PG' ? (
                    <TextField
                      label={t('accommodation.setup.fields.apartmentsPerFloor')}
                      value={apartmentsPerFloor}
                      onChange={(e) => setApartmentsPerFloor(e.target.value)}
                      placeholder="e.g. 4"
                      type="number"
                      fullWidth
                      size="small"
                    />
                  ) : null}
                  <TextField
                    label={t('accommodation.setup.fields.roomsPerFloor')}
                    value={roomsPerFloor}
                    onChange={(e) => setRoomsPerFloor(e.target.value)}
                    placeholder="e.g. 8"
                    type="number"
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={t('accommodation.setup.fields.bedsPerRoom')}
                    value={bedsPerRoom}
                    onChange={(e) => setBedsPerRoom(e.target.value)}
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
                    onChange={(e) => setUnitCount(e.target.value)}
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
                        onChange={(e) => setRoomsPerUnit(e.target.value)}
                        placeholder="e.g. 2"
                        type="number"
                        fullWidth
                        size="small"
                      />
                      <TextField
                        label={t('accommodation.setup.fields.bedsPerRoom')}
                        value={bedsPerRoom}
                        onChange={(e) => setBedsPerRoom(e.target.value)}
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
                    onChange={(e) => setRoomType(e.target.value as RoomType)}
                  >
                    <MenuItem value="PRIVATE">{t('accommodation.roomType.PRIVATE')}</MenuItem>
                    <MenuItem value="SHARED">{t('accommodation.roomType.SHARED')}</MenuItem>
                    <MenuItem value="DORMITORY">{t('accommodation.roomType.DORMITORY')}</MenuItem>
                  </Select>
                </FormControl>
              ) : null}
            </FormSection>
          ) : null}

          {STEPS[stepIndex] === 'preview' && preview ? (
            <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                {t('accommodation.setup.previewHint')}
              </Typography>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatCard dense label={t('accommodation.setup.summary.floors')} value={preview.floors} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatCard dense label={t('accommodation.setup.summary.units')} value={preview.units} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatCard dense label={t('accommodation.setup.summary.rooms')} value={preview.rooms} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatCard dense label={t('accommodation.setup.summary.beds')} value={preview.beds} />
                </Grid>
              </Grid>
            </Stack>
          ) : null}
        </ContentCard>
      </Stack>

      <Box sx={{ mt: 2 }}>
        <StickyFooter>
          <Button
            onClick={() => {
              if (stepIndex === 0) {
                navigate(spaceAccommodationPath(spaceId));
              } else {
                setStepIndex((i) => i - 1);
              }
            }}
            disabled={busy}
            sx={dashOutlinedButtonSx}
          >
            {stepIndex === 0 ? t('common.cancel') : t('common.back')}
          </Button>
          <Button
            variant="contained"
            disabled={!canAdvance || busy}
            onClick={() => void handleNext()}
            sx={dashContainedButtonSx}
          >
            {STEPS[stepIndex] === 'preview'
              ? t('accommodation.setup.execute')
              : STEPS[stepIndex] === 'structure'
                ? t('accommodation.setup.preview')
                : t('common.continue')}
          </Button>
        </StickyFooter>
      </Box>
    </PageContainer>
  );
}
