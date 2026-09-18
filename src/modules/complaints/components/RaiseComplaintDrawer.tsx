import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { FileImageViewer } from '@/shared/components/files/FileImageViewer';
import { FileUploadUserError } from '@/shared/utils/fileLimits';
import { prepareFileForUpload } from '@/shared/utils/optimizeImageFile';
import type { MealType } from '@/shared/types/meals';
import type {
  ComplaintCategory,
  ComplaintPriority,
  CreateComplaintRequest,
} from '@/shared/types/complaints';
import type { SpaceType } from '@/shared/types/space';
import { useComplaintMutations } from '../hooks/useComplaints';
import {
  categoriesForSpaceType,
  categoryLabelKey,
  isFoodCategory,
  priorityLabelKey,
} from '../utils/complaintHelpers';

type RaiseComplaintDrawerProps = {
  open: boolean;
  spaceId: string;
  spaceType?: SpaceType;
  onClose: () => void;
  onCreated: (complaintId: string) => void;
};

const PRIORITIES: ComplaintPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];
const MAX_PHOTOS = 5;

export function RaiseComplaintDrawer({
  open,
  spaceId,
  spaceType,
  onClose,
  onCreated,
}: RaiseComplaintDrawerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useComplaintMutations(spaceId);
  const categories = useMemo(() => categoriesForSpaceType(spaceType), [spaceType]);

  const [category, setCategory] = useState<ComplaintCategory>(categories[0] ?? 'OTHER');
  const [priority, setPriority] = useState<ComplaintPriority>('MEDIUM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mealDate, setMealDate] = useState('');
  const [mealType, setMealType] = useState<MealType>('BREAKFAST');
  const [photos, setPhotos] = useState<File[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const foodRelated = isFoodCategory(category);

  const reset = () => {
    setCategory(categories[0] ?? 'OTHER');
    setPriority('MEDIUM');
    setTitle('');
    setDescription('');
    setMealDate('');
    setMealType('BREAKFAST');
    setPhotos([]);
  };

  const onFiles = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      enqueueSnackbar(t('complaints.errors.maxPhotos'), { variant: 'warning' });
      return;
    }
    void (async () => {
      const selected = Array.from(files).slice(0, remaining);
      const prepared: File[] = [];
      for (const file of selected) {
        try {
          prepared.push(await prepareFileForUpload(file, 'COMPLAINT_ATTACHMENT'));
        } catch (error) {
          enqueueSnackbar(
            error instanceof FileUploadUserError
              ? error.message
              : t('files.uploadFailed', { defaultValue: 'Unable to upload the file. Please try again.' }),
            { variant: 'error' },
          );
        }
      }
      if (prepared.length) {
        setPhotos((prev) => [...prev, ...prepared].slice(0, MAX_PHOTOS));
      }
    })();
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      enqueueSnackbar(t('complaints.errors.requiredFields'), { variant: 'warning' });
      return;
    }
    const body: CreateComplaintRequest & { localFiles?: File[] } = {
      category,
      priority,
      title: title.trim().slice(0, 200),
      description: description.trim(),
      localFiles: photos.length ? photos : undefined,
    };
    if (foodRelated) {
      if (mealDate) {
        body.mealDate = mealDate;
      }
      body.mealType = mealType;
    }
    try {
      const created = await mutations.create.mutateAsync(body);
      enqueueSnackbar(t('complaints.created'), { variant: 'success' });
      reset();
      onCreated(created.complaintId);
      onClose();
    } catch {
      enqueueSnackbar(t('complaints.errors.create'), { variant: 'error' });
    }
  };

  return (
    <AppDrawer open={open} onClose={onClose} width={480}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 2 }}>
          {t('complaints.raiseTitle')}
        </Typography>
        <Stack spacing={1.5} sx={{ flex: 1, overflow: 'auto', pb: 10 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>{t('complaints.fields.category')}</InputLabel>
            <Select
              label={t('complaints.fields.category')}
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
            >
              {categories.map((c) => (
                <MenuItem key={c} value={c}>
                  {t(categoryLabelKey(c))}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>{t('complaints.fields.priority')}</InputLabel>
            <Select
              label={t('complaints.fields.priority')}
              value={priority}
              onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
            >
              {PRIORITIES.map((p) => (
                <MenuItem key={p} value={p}>
                  {t(priorityLabelKey(p))}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label={t('complaints.fields.title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t(`complaints.placeholders.subject.${category}`)}
            slotProps={{ htmlInput: { maxLength: 200 } }}
            fullWidth
            required
          />
          <TextField
            size="small"
            label={t('complaints.fields.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t(`complaints.placeholders.description.${category}`)}
            multiline
            minRows={4}
            fullWidth
            required
          />
          {foodRelated ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                type="date"
                label={t('complaints.fields.mealDate')}
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>{t('complaints.fields.mealType')}</InputLabel>
                <Select
                  label={t('complaints.fields.mealType')}
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType)}
                >
                  {MEAL_TYPES.map((m) => (
                    <MenuItem key={m} value={m}>
                      {t(`complaints.mealType.${m}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          ) : null}
          <Box>
            <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary, mb: 0.5 }}>
              {t('complaints.fields.photos')}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textSecondary, display: 'block', mb: 1 }}>
              {t('complaints.photos.helper')}
            </Typography>
            <Button component="label" variant="outlined" size="small" sx={dashOutlinedButtonSx}>
              {t('complaints.actions.addPhoto')}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(e) => {
                  onFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </Button>
            {photos.length > 0 ? (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 1 }}>
                {photos.map((photo, index) => (
                  <Box
                    key={`${photo.name}-${index}`}
                    component="img"
                    src={URL.createObjectURL(photo)}
                    alt=""
                    onClick={() => setViewerIndex(index)}
                    sx={{
                      width: 72,
                      height: 72,
                      objectFit: 'cover',
                      borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                      border: `1px solid ${s.border}`,
                      cursor: 'zoom-in',
                    }}
                  />
                ))}
              </Stack>
            ) : null}
          </Box>
        </Stack>
        <StickyFooter>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Button onClick={onClose} sx={dashOutlinedButtonSx}>{t('common.cancel')}</Button>
            <Button
              variant="contained"
              onClick={() => void handleSubmit()}
              disabled={mutations.create.isPending}
              sx={dashContainedButtonSx}
            >
              {t('complaints.submit')}
            </Button>
          </Stack>
        </StickyFooter>
      </Box>
      <FileImageViewer
        open={viewerIndex != null}
        onClose={() => setViewerIndex(null)}
        imageUrl={viewerIndex != null && photos[viewerIndex] ? URL.createObjectURL(photos[viewerIndex]) : null}
        title={t('complaints.fields.photos')}
        downloadFilename="complaint-photo.jpg"
      />
    </AppDrawer>
  );
}
