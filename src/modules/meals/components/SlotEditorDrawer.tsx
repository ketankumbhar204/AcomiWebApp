import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  List,
  ListItemButton,
  ListItemText,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { LoadingState } from '@/shared/components/LoadingState';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type {
  DailyMenuOptionResponse,
  DailyMenuResponse,
  MealType,
  UpsertDailyMenuRequest,
} from '@/shared/types/meals';
import { useFoodItems, useMealCombos, useMealMutations } from '../hooks/useMeals';

type SlotEditorDrawerProps = {
  open: boolean;
  spaceId: string;
  menuDate: string;
  mealType: MealType | null;
  menu?: DailyMenuResponse | null;
  onClose: () => void;
};

type DraftOption = UpsertDailyMenuRequest['options'][number];

function optionsFromMenu(menu?: DailyMenuResponse | null): DraftOption[] {
  return (menu?.options ?? []).map((o: DailyMenuOptionResponse, index) => ({
    optionId: o.optionId,
    entryType: o.entryType,
    comboId: o.comboId,
    itemId: o.itemId,
    label: o.label,
    sortOrder: o.sortOrder ?? index,
    isAvailable: o.isAvailable,
    isExtra: o.isExtra,
    price: o.price,
    currencyCode: o.currencyCode,
  }));
}

function SlotEditorBody({
  spaceId,
  menuDate,
  mealType,
  menu,
  onClose,
}: {
  spaceId: string;
  menuDate: string;
  mealType: MealType;
  menu?: DailyMenuResponse | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useMealMutations(spaceId);
  const combos = useMealCombos(spaceId);
  const items = useFoodItems(spaceId);
  const [tab, setTab] = useState<'combos' | 'items'>('combos');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState(menu?.notes ?? '');
  const [options, setOptions] = useState<DraftOption[]>(() => optionsFromMenu(menu));

  const selectedComboIds = useMemo(
    () => new Set(options.filter((o) => o.entryType === 'COMBO' && o.comboId).map((o) => o.comboId!)),
    [options],
  );
  const selectedItemIds = useMemo(
    () => new Set(options.filter((o) => o.entryType === 'ITEM' && o.itemId).map((o) => o.itemId!)),
    [options],
  );

  const filteredCombos = combos.combos.filter(
    (c) =>
      c.isActive &&
      (!search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase())),
  );
  const filteredItems = items.items.filter(
    (i) =>
      i.isActive &&
      (!search.trim() || i.name.toLowerCase().includes(search.trim().toLowerCase())),
  );

  const toggleCombo = (comboId: string, name: string) => {
    setOptions((prev) => {
      if (prev.some((o) => o.comboId === comboId)) {
        return prev.filter((o) => o.comboId !== comboId);
      }
      return [
        ...prev,
        {
          entryType: 'COMBO',
          comboId,
          label: name,
          sortOrder: prev.length,
          isAvailable: true,
        },
      ];
    });
  };

  const toggleItem = (itemId: string, name: string) => {
    setOptions((prev) => {
      if (prev.some((o) => o.itemId === itemId)) {
        return prev.filter((o) => o.itemId !== itemId);
      }
      return [
        ...prev,
        {
          entryType: 'ITEM',
          itemId,
          label: name,
          sortOrder: prev.length,
          isAvailable: true,
        },
      ];
    });
  };

  const saving = mutations.upsertDailyMenu.isPending;

  const handleSave = async (publish: boolean) => {
    try {
      const body: UpsertDailyMenuRequest = {
        options: options.map((o, index) => ({ ...o, sortOrder: index })),
        notes: notes.trim() || null,
      };
      await mutations.upsertDailyMenu.mutateAsync({ menuDate, mealType, body });
      if (publish) {
        await mutations.publishDailyMenu.mutateAsync({ menuDate, mealType });
      }
      enqueueSnackbar(
        publish ? t('meals.planning.publishSuccess') : t('meals.planning.saveSuccess'),
        { variant: 'success' },
      );
      onClose();
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t('meals.planning.editSlot', { meal: t(`meals.mealType.${mealType}`) })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {menuDate}
        </Typography>
      </Box>

      <Box sx={{ px: 2, pt: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab value="combos" label={t('meals.library.combos')} />
          <Tab value="items" label={t('meals.library.items')} />
        </Tabs>
        <TextField
          size="small"
          fullWidth
          sx={{ mt: 1.5 }}
          placeholder={t('meals.library.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        {combos.loading || items.loading ? (
          <LoadingState />
        ) : tab === 'combos' ? (
          <List dense>
            {filteredCombos.map((combo) => (
              <ListItemButton key={combo.comboId} onClick={() => toggleCombo(combo.comboId, combo.name)}>
                <Checkbox edge="start" checked={selectedComboIds.has(combo.comboId)} tabIndex={-1} disableRipple />
                <ListItemText
                  primary={combo.name}
                  secondary={combo.items?.map((i) => i.name).join(', ')}
                />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <List dense>
            {filteredItems.map((item) => (
              <ListItemButton key={item.itemId} onClick={() => toggleItem(item.itemId, item.name)}>
                <Checkbox edge="start" checked={selectedItemIds.has(item.itemId)} tabIndex={-1} disableRipple />
                <ListItemText primary={item.name} secondary={item.categoryName} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('meals.planning.selectedCount', { count: options.length })}
        </Typography>
        <TextField
          label={t('meals.planning.notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('meals.menu.notesPlaceholder')}
          fullWidth
          multiline
          minRows={2}
          size="small"
        />
        <FormControlLabel
          sx={{ mt: 1 }}
          control={<Checkbox checked disabled />}
          label={t('meals.planning.draftHint')}
        />
      </Box>

      <StickyFooter>
        <Button onClick={onClose} disabled={saving} sx={dashOutlinedButtonSx}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="outlined"
          onClick={() => void handleSave(false)}
          disabled={saving}
          sx={dashOutlinedButtonSx}
        >
          {t('common.save')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave(true)}
          disabled={saving}
          sx={dashContainedButtonSx}
        >
          {t('meals.planning.saveAndPublish')}
        </Button>
      </StickyFooter>
    </Box>
  );
}

export function SlotEditorDrawer({
  open,
  spaceId,
  menuDate,
  mealType,
  menu,
  onClose,
}: SlotEditorDrawerProps) {
  return (
    <AppDrawer open={open} onClose={onClose} width={480}>
      {open && mealType ? (
        <SlotEditorBody
          key={`${menuDate}-${mealType}-${menu?.dailyMenuId ?? 'new'}`}
          spaceId={spaceId}
          menuDate={menuDate}
          mealType={mealType}
          menu={menu}
          onClose={onClose}
        />
      ) : null}
    </AppDrawer>
  );
}
