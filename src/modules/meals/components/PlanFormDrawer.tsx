import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { SubscriptionPlanResponse } from '@/shared/types/subscription';

type PlanFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  initial?: SubscriptionPlanResponse | null;
  submitting?: boolean;
  onSubmit: (values: {
    name: string;
    mealsIncluded: number;
    price: number;
    validityDays: number;
    carryForwardUnused: boolean;
    description?: string;
    active?: boolean;
  }) => Promise<void>;
};

export function PlanFormDrawer({
  open,
  onClose,
  initial,
  submitting,
  onSubmit,
}: PlanFormDrawerProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? '');
  const [meals, setMeals] = useState(String(initial?.mealsIncluded ?? ''));
  const [price, setPrice] = useState(String(initial?.price ?? ''));
  const [validity, setValidity] = useState(String(initial?.validityDays ?? ''));
  const [carryForward, setCarryForward] = useState(initial?.carryForwardUnused ?? false);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [active, setActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  // Remount via key from parent when initial changes.
  const formKey = initial?.planId ?? 'create';

  return (
    <AppDrawer
      key={formKey}
      open={open}
      onClose={onClose}
      title={
        isEdit
          ? t('meals.subscriptionPlans.editTitle')
          : t('meals.subscriptionPlans.createTitle')
      }
      width={480}
    >
      <Stack spacing={2} sx={{ p: 2 }}>
        <Alert severity="info">{t('meals.subscriptionPlans.formSubtitle')}</Alert>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <TextField
          label={t('meals.subscriptionPlans.nameLabel')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('meals.subscriptionPlans.namePlaceholder')}
          required
          fullWidth
        />
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          }}
        >
          <TextField
            label={t('meals.subscriptionPlans.mealsLabel')}
            value={meals}
            onChange={(e) => setMeals(e.target.value)}
            placeholder="e.g. 60"
            required
            fullWidth
            type="number"
          />
          <TextField
            label={t('meals.subscriptionPlans.priceLabel')}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 4500"
            required
            fullWidth
            type="number"
          />
          <TextField
            label={t('meals.subscriptionPlans.validityLabel')}
            value={validity}
            onChange={(e) => setValidity(e.target.value)}
            placeholder="e.g. 30"
            required
            fullWidth
            type="number"
          />
        </Box>
        <TextField
          label={t('meals.subscriptionPlans.descriptionLabel')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('meals.subscriptionPlans.descriptionPlaceholder')}
          fullWidth
          multiline
          minRows={2}
        />
        <FormControlLabel
          control={
            <Checkbox checked={carryForward} onChange={(e) => setCarryForward(e.target.checked)} />
          }
          label={t('meals.subscriptionPlans.carryForward')}
        />
        {isEdit ? (
          <FormControlLabel
            control={<Checkbox checked={active} onChange={(e) => setActive(e.target.checked)} />}
            label={t('meals.subscriptionPlans.statusActive')}
          />
        ) : null}
      </Stack>
      <StickyFooter>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="outlined" onClick={onClose} disabled={submitting} sx={dashOutlinedButtonSx}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={submitting}
            sx={dashContainedButtonSx}
            onClick={() => {
              if (!name.trim()) {
                setError(t('meals.subscriptionPlans.nameRequired'));
                return;
              }
              const mealsIncluded = Number(meals);
              const priceNum = Number(price);
              const validityDays = Number(validity);
              if (!Number.isFinite(mealsIncluded) || mealsIncluded <= 0) {
                setError(t('meals.subscriptionPlans.mealsRequired'));
                return;
              }
              if (!Number.isFinite(priceNum) || priceNum < 0) {
                setError(t('meals.subscriptionPlans.priceRequired'));
                return;
              }
              if (!Number.isFinite(validityDays) || validityDays <= 0) {
                setError(t('meals.subscriptionPlans.validityRequired'));
                return;
              }
              setError(null);
              void onSubmit({
                name: name.trim(),
                mealsIncluded,
                price: priceNum,
                validityDays,
                carryForwardUnused: carryForward,
                description: description.trim() || undefined,
                active: isEdit ? active : undefined,
              });
            }}
          >
            {submitting ? t('common.pleaseWait') : t('common.save')}
          </Button>
        </Stack>
      </StickyFooter>
    </AppDrawer>
  );
}
