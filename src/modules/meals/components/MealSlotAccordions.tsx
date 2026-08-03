import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import type {
  MemberMealActivitySlotDetail,
  MemberMealActivitySlotStatus,
} from '@/shared/types/meals';
import { MEAL_ACTIVITY_SLOT_COLORS } from '../utils/memberMealActivityCalendar';

type MealSlotAccordionsProps = {
  slots: MemberMealActivitySlotDetail[];
  currencyCode?: string | null;
  /** Expand accepted meals with selections by default. */
  defaultExpandAccepted?: boolean;
};

function statusTone(
  status: MemberMealActivitySlotStatus,
): 'success' | 'error' | 'warning' | 'neutral' {
  if (status === 'ACCEPTED') return 'success';
  if (status === 'SKIPPED') return 'error';
  if (status === 'PENDING') return 'warning';
  return 'neutral';
}

function statusLabel(
  status: MemberMealActivitySlotStatus,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (status === 'ACCEPTED') {
    return t('paymentCollection.dayMeals.mealAccepted', { defaultValue: 'Meal accepted' });
  }
  if (status === 'PENDING') return t('meals.activity.statusPending');
  if (status === 'SKIPPED') return t('meals.activity.statusSkipped');
  if (status === 'NO_MENU') return t('meals.activity.statusNoMenu');
  if (status === 'CLOSED') return t('meals.activity.statusClosed', { defaultValue: 'Closed' });
  return t('meals.activity.statusInactive');
}

function selectionLineAmount(
  quantity: number,
  price: number | null | undefined,
  lineTotal: number | null | undefined,
): number | null {
  if (lineTotal != null && Number.isFinite(lineTotal)) return Number(lineTotal);
  if (price != null && Number.isFinite(price)) return Number(price) * Math.max(quantity, 1);
  return null;
}

/**
 * Accordion meal slots showing selected menu items + prices (mobile day-sheet parity).
 */
export function MealSlotAccordions({
  slots,
  currencyCode,
  defaultExpandAccepted = true,
}: MealSlotAccordionsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  if (slots.length === 0) {
    return (
      <Typography sx={{ fontSize: 13, color: s.textMuted }}>
        {t('meals.activity.daySheet.emptyState', {
          defaultValue: 'No meal activity recorded for this date.',
        })}
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75}>
      {slots.map((slot) => {
        const selections = (slot.selections ?? []).filter((row) => row.label.trim().length > 0);
        const hasItems = selections.length > 0;
        const accent = MEAL_ACTIVITY_SLOT_COLORS[slot.status] ?? colors.primaryDark;
        const slotTotal =
          slot.slotTotal != null
            ? Number(slot.slotTotal)
            : selections.reduce((sum, row) => {
                const line = selectionLineAmount(row.quantity, row.price, row.lineTotal);
                return sum + (line ?? 0);
              }, 0);
        const expandByDefault = defaultExpandAccepted && slot.status === 'ACCEPTED' && hasItems;

        return (
          <Accordion
            key={slot.mealType}
            defaultExpanded={expandByDefault}
            disableGutters
            elevation={0}
            sx={{
              border: `1px solid ${s.border}`,
              borderRadius: `${DASHBOARD_UX.tileRadius}px !important`,
              bgcolor: s.surface,
              '&:before': { display: 'none' },
              overflow: 'hidden',
            }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown size={16} color={s.textMuted} />}
              sx={{
                minHeight: 48,
                px: 1.25,
                '& .MuiAccordionSummary-content': {
                  my: 1,
                  alignItems: 'center',
                  gap: 1,
                },
              }}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: 1,
                  bgcolor: `${accent}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: accent }} />
              </Box>
              <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 600, color: s.textPrimary }}>
                {t(`meals.mealType.${slot.mealType}`)}
              </Typography>
              <StatusChip label={statusLabel(slot.status, t)} tone={statusTone(slot.status)} />
            </AccordionSummary>
            <AccordionDetails sx={{ px: 1.25, pt: 0, pb: 1.25 }}>
              {!hasItems ? (
                <Typography sx={{ fontSize: 12, color: s.textMuted }}>
                  {slot.status === 'ACCEPTED'
                    ? t('meals.activity.daySheet.noItems', {
                        defaultValue: 'No menu items recorded for this meal.',
                      })
                    : statusLabel(slot.status, t)}
                </Typography>
              ) : (
                <Stack spacing={0.65}>
                  {selections.map((row, index) => {
                    const qty = row.quantity > 0 ? row.quantity : 1;
                    const line = selectionLineAmount(qty, row.price, row.lineTotal);
                    const code = row.currencyCode || currencyCode || 'INR';
                    return (
                      <Stack
                        key={`${row.label}-${index}`}
                        direction="row"
                        spacing={1}
                        sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography sx={{ fontSize: 13, color: s.textPrimary }}>
                            {row.label}
                            {qty > 1 ? ` × ${qty}` : ''}
                          </Typography>
                          {row.itemDetail ? (
                            <Typography sx={{ fontSize: 11, color: s.textMuted, mt: 0.15 }}>
                              {row.itemDetail}
                            </Typography>
                          ) : null}
                        </Box>
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: s.textPrimary,
                            flexShrink: 0,
                          }}
                        >
                          {line != null ? formatCurrency(line, code) : '—'}
                        </Typography>
                      </Stack>
                    );
                  })}
                  {slotTotal > 0 ? (
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        pt: 0.75,
                        mt: 0.25,
                        borderTop: `1px solid ${s.divider}`,
                      }}
                    >
                      <Typography sx={{ fontSize: 12, color: s.textMuted }}>
                        {t('meals.activity.daySheet.amount', { defaultValue: 'Amount' })}
                      </Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.success }}>
                        {formatCurrency(slotTotal, currencyCode || 'INR')}
                      </Typography>
                    </Stack>
                  ) : null}
                </Stack>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
}
