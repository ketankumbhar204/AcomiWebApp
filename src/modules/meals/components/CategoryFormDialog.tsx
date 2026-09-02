import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useMealMutations } from '../hooks/useMeals';

type CategoryFormDialogProps = {
  open: boolean;
  spaceId: string;
  onClose: () => void;
  onCreated?: (categoryId: string) => void;
};

export function CategoryFormDialog({
  open,
  spaceId,
  onClose,
  onCreated,
}: CategoryFormDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useMealMutations(spaceId);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('meals.library.categoryNameRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const created = await mutations.createFoodCategory.mutateAsync({ name: name.trim() });
      enqueueSnackbar(t('meals.library.categoryCreateSuccess'), { variant: 'success' });
      onCreated?.(created.categoryId);
      onClose();
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
        {t('meals.library.addCategory')}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 1.5 }}>
          {t('meals.library.addCategoryHint')}
        </Typography>
        <TextField
          autoFocus
          fullWidth
          size="small"
          label={t('meals.library.categoryNameLabel')}
          placeholder={t('meals.library.categoryNamePlaceholder')}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          error={Boolean(error)}
          helperText={error}
          slotProps={{ htmlInput: { maxLength: 80 } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={dashOutlinedButtonSx}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={submitting}
          onClick={() => void handleSubmit()}
          sx={{
            ...dashContainedButtonSx,
            bgcolor: colors.primaryDark,
            '&:hover': { bgcolor: colors.primaryHover },
          }}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Tiny inline add used inside combo item picker. */
export function InlineCreateCategoryRow({
  spaceId,
  onCreated,
  variant = 'button',
}: {
  spaceId: string;
  onCreated?: (categoryId: string) => void;
  /** `chip` = pill in category rail (planner Items tab). */
  variant?: 'button' | 'chip';
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useMealMutations(spaceId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const save = () => {
    if (!name.trim()) {
      enqueueSnackbar(t('meals.library.categoryNameRequired'), { variant: 'warning' });
      return;
    }
    setBusy(true);
    void mutations.createFoodCategory
      .mutateAsync({ name: name.trim() })
      .then((created) => {
        enqueueSnackbar(t('meals.library.categoryCreateSuccess'), { variant: 'success' });
        onCreated?.(created.categoryId);
        setOpen(false);
        setName('');
      })
      .catch(() => {
        enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
      })
      .finally(() => setBusy(false));
  };

  if (!open) {
    if (variant === 'chip') {
      return (
        <Box
          component="button"
          type="button"
          onClick={() => setOpen(true)}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.35,
            px: 1.1,
            py: 0.45,
            borderRadius: 99,
            border: `1px dashed ${colors.primary}`,
            bgcolor: `${colors.primary}0F`,
            color: colors.primaryDark,
            ...DASHBOARD_UX.badge,
            '&:hover': { bgcolor: `${colors.primary}1A` },
          }}
        >
          + {t('meals.library.category', { defaultValue: 'Category' })}
        </Box>
      );
    }
    return (
      <Button size="small" onClick={() => setOpen(true)} sx={dashOutlinedButtonSx}>
        {t('meals.library.chipAddCategory')}
      </Button>
    );
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        gap: 0.75,
        flexWrap: 'wrap',
        alignItems: 'center',
        px: variant === 'chip' ? 0.5 : 0,
        py: variant === 'chip' ? 0.25 : 0,
        borderRadius: variant === 'chip' ? 99 : 0,
        border: variant === 'chip' ? `1px solid ${colors.primary}` : 'none',
        bgcolor: variant === 'chip' ? s.surface : 'transparent',
      }}
    >
      <TextField
        size="small"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') {
            setOpen(false);
            setName('');
          }
        }}
        placeholder={t('meals.library.categoryNameInlinePlaceholder')}
        sx={{
          width: variant === 'chip' ? 140 : undefined,
          flex: variant === 'chip' ? undefined : '1 1 140px',
          '& .MuiOutlinedInput-root': {
            minHeight: DASHBOARD_UX.buttonHeight,
            height: DASHBOARD_UX.buttonHeight,
            borderRadius: 99,
            ...DASHBOARD_UX.inputText,
          },
        }}
        slotProps={{ htmlInput: { maxLength: 80 } }}
      />
      <Button
        size="small"
        disabled={busy}
        onClick={() => {
          setOpen(false);
          setName('');
        }}
        sx={{ ...dashOutlinedButtonSx, px: 1 }}
      >
        {t('common.cancel')}
      </Button>
      <Button
        size="small"
        variant="contained"
        disabled={busy}
        onClick={save}
        sx={{
          ...dashContainedButtonSx,
          px: 1.25,
          bgcolor: colors.primaryDark,
          '&:hover': { bgcolor: colors.primaryHover },
        }}
      >
        {t('common.save')}
      </Button>
    </Box>
  );
}

export function InlineCreateItemRow({
  spaceId,
  categories,
  defaultCategoryId,
  onCreated,
}: {
  spaceId: string;
  categories: { categoryId: string; name: string }[];
  defaultCategoryId?: string;
  onCreated?: (itemId: string) => void;
}) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useMealMutations(spaceId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && defaultCategoryId) {
      setCategoryId(defaultCategoryId);
    }
  }, [defaultCategoryId, open]);

  if (!open) {
    return (
      <Button size="small" onClick={() => setOpen(true)} sx={dashOutlinedButtonSx}>
        {t('meals.library.chipAddItem')}
      </Button>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
      <TextField
        size="small"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('meals.library.itemNameInlinePlaceholder')}
        sx={{ flex: '1 1 120px' }}
        slotProps={{ htmlInput: { maxLength: 80 } }}
      />
      <TextField
        select
        size="small"
        label={t('meals.library.category')}
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        sx={{ minWidth: { xs: 0, sm: 140 }, flex: '1 1 120px' }}
      >
        {categories.map((c) => (
          <MenuItem key={c.categoryId} value={c.categoryId}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>
      <Button
        size="small"
        disabled={busy}
        onClick={() => {
          setOpen(false);
          setName('');
        }}
        sx={dashOutlinedButtonSx}
      >
        {t('common.cancel')}
      </Button>
      <Button
        size="small"
        variant="contained"
        disabled={busy}
        onClick={() => {
          if (!name.trim() || !categoryId) {
            enqueueSnackbar(t('meals.library.itemRequired'), { variant: 'warning' });
            return;
          }
          setBusy(true);
          void mutations.createFoodItem
            .mutateAsync({
              name: name.trim(),
              categoryId,
              foodType: 'VEG',
            })
            .then((created) => {
              enqueueSnackbar(t('meals.library.itemCreateSuccess'), { variant: 'success' });
              onCreated?.(created.itemId);
              setOpen(false);
              setName('');
            })
            .catch(() => {
              enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
            })
            .finally(() => setBusy(false));
        }}
        sx={{
          ...dashContainedButtonSx,
          bgcolor: colors.primaryDark,
          '&:hover': { bgcolor: colors.primaryHover },
        }}
      >
        {t('common.save')}
      </Button>
    </Box>
  );
}
