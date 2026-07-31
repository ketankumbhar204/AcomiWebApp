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
import { Egg, Leaf, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type {
  FoodCategoryResponse,
  FoodItemResponse,
  FoodType,
} from '@/shared/types/meals';
import { useMealMutations } from '../hooks/useMeals';

const FOOD_TYPES: FoodType[] = ['VEG', 'NON_VEG', 'EGG'];

function itemIcon(foodType?: FoodType | null): LucideIcon {
  switch (foodType) {
    case 'VEG':
      return Leaf;
    case 'EGG':
      return Egg;
    default:
      return UtensilsCrossed;
  }
}

type FoodItemFormDrawerProps = {
  open: boolean;
  mode: 'create' | 'edit';
  spaceId: string;
  item: FoodItemResponse | null;
  categories: FoodCategoryResponse[];
  /** Prefill category on create (e.g. toolbar filter). */
  defaultCategoryId?: string;
  /** When creating from Extras tab. */
  createAsExtra?: boolean;
  onClose: () => void;
};

export function FoodItemFormDrawer({
  open,
  mode,
  spaceId,
  item,
  categories,
  defaultCategoryId = '',
  createAsExtra = false,
  onClose,
}: FoodItemFormDrawerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useMealMutations(spaceId);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [foodType, setFoodType] = useState<FoodType>('VEG');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!open) return;
    if (isEdit && item) {
      setName(item.name);
      setCategoryId(item.categoryId);
      setFoodType(item.foodType ?? 'VEG');
    } else {
      setName('');
      setCategoryId(defaultCategoryId || '');
      setFoodType('VEG');
    }
  }, [defaultCategoryId, isEdit, item, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !categoryId) {
      enqueueSnackbar(t('meals.library.itemRequired'), { variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit && item) {
        await mutations.updateFoodItem.mutateAsync({
          itemId: item.itemId,
          body: {
            name: name.trim(),
            categoryId,
            foodType,
          },
        });
        enqueueSnackbar(t('meals.library.itemUpdateSuccess'), { variant: 'success' });
      } else {
        await mutations.createFoodItem.mutateAsync({
          name: name.trim(),
          categoryId,
          foodType,
          isExtra: createAsExtra ? true : undefined,
        });
        enqueueSnackbar(
          createAsExtra
            ? t('meals.library.extraCreateSuccess')
            : t('meals.library.itemCreateSuccess'),
          { variant: 'success' },
        );
      }
      onClose();
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppDrawer open={open} onClose={onClose} width={440}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            p: `${DASHBOARD_UX.cardPadding}px`,
            borderBottom: `1px solid ${s.border}`,
          }}
        >
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
            {isEdit ? t('meals.library.editItem') : t('meals.library.createItem')}
          </Typography>
        </Box>
        <Box sx={{ p: `${DASHBOARD_UX.cardPadding}px`, flex: 1, overflow: 'auto' }}>
          <Stack spacing={2}>
            <TextField
              label={t('meals.library.itemName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('meals.library.itemNamePlaceholder')}
              fullWidth
              size="small"
              inputProps={{ maxLength: 80 }}
            />
            <FormControl fullWidth size="small">
              <InputLabel>{t('meals.library.category')}</InputLabel>
              <Select
                label={t('meals.library.category')}
                value={categoryId}
                onChange={(e) => setCategoryId(String(e.target.value))}
              >
                {categories.map((c) => (
                  <MenuItem key={c.categoryId} value={c.categoryId}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary, mb: 0.75 }}>
                {t('meals.foodType.label')}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {FOOD_TYPES.map((ft) => {
                  const selected = foodType === ft;
                  const Icon = itemIcon(ft);
                  return (
                    <Button
                      key={ft}
                      size="small"
                      variant={selected ? 'contained' : 'outlined'}
                      startIcon={<Icon size={14} />}
                      onClick={() => setFoodType(ft)}
                      aria-pressed={selected}
                      sx={
                        selected
                          ? {
                              ...dashContainedButtonSx,
                              minHeight: DASHBOARD_UX.buttonHeight,
                              height: DASHBOARD_UX.buttonHeight,
                              bgcolor: colors.primaryDark,
                              '&:hover': { bgcolor: colors.primaryHover },
                            }
                          : {
                              ...dashOutlinedButtonSx,
                              color: s.textPrimary,
                              borderColor: s.border,
                            }
                      }
                    >
                      {t(`meals.foodType.${ft}`)}
                    </Button>
                  );
                })}
              </Stack>
            </Box>
          </Stack>
        </Box>
        <StickyFooter>
          <Button onClick={onClose} disabled={submitting} sx={dashOutlinedButtonSx}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            sx={{
              ...dashContainedButtonSx,
              minHeight: DASHBOARD_UX.buttonHeight,
              height: DASHBOARD_UX.buttonHeight,
              bgcolor: colors.primaryDark,
              '&:hover': { bgcolor: colors.primaryHover },
            }}
          >
            {t('common.save')}
          </Button>
        </StickyFooter>
      </Box>
    </AppDrawer>
  );
}
