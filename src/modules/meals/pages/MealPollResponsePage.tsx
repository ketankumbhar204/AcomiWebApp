import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { LoadingState } from '@/shared/components/LoadingState';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { StatusChip } from '@/shared/components/StatusChip';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { spaceMealsPath } from '@/routes/paths';
import type {
  MealPollPaymentChoice,
  MealType,
  SubmitMealPollSelection,
} from '@/shared/types/meals';
import { mealsApi } from '../api/mealsApi';
import { useMealPolls } from '../hooks/useMeals';
import { todayIsoDate } from '../utils/mealDates';

export function MealPollResponsePage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const permissions = useSpacePermissions(spaceId);
  const menuDate = searchParams.get('date') || todayIsoDate();
  const polls = useMealPolls(spaceId, menuDate, permissions.canViewMeals);
  const [selections, setSelections] = useState<Partial<Record<MealType, string>>>({});
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<MealPollPaymentChoice>('PAY_LATER');
  const [proofBase64, setProofBase64] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${t('meals.poll.respondTitle')} · ${t('common.appName')}`;
  }, [t]);

  const isPayPerMeal = polls.pollDay?.myMealBillingType !== 'PREPAID_BALANCE';
  const showPayment =
    isPayPerMeal && (polls.pollDay?.myPaymentChargedAmount ?? 0) >= 0 && Boolean(polls.pollDay);

  const effectiveSelections = useMemo(() => {
    if (touched) {
      return selections;
    }
    const next: Partial<Record<MealType, string>> = {};
    for (const poll of polls.pollDay?.polls ?? []) {
      if (poll.mySelectedOptionId) {
        next[poll.mealType] = poll.mySelectedOptionId;
      }
    }
    return { ...next, ...selections };
  }, [polls.pollDay, selections, touched]);

  const handleSubmit = async () => {
    const payload: SubmitMealPollSelection[] = [];
    for (const poll of polls.pollDay?.polls ?? []) {
      if (poll.status !== 'OPEN') {
        continue;
      }
      const optionId = effectiveSelections[poll.mealType];
      if (!optionId) {
        continue;
      }
      payload.push({ mealType: poll.mealType, selectedOptionId: optionId });
    }
    if (payload.length === 0) {
      enqueueSnackbar(t('meals.poll.selectRequired'), { variant: 'warning' });
      return;
    }
    if (showPayment && paymentChoice === 'MARK_AS_PAID' && !proofBase64) {
      enqueueSnackbar(t('meals.customerPlans.proofOrReferenceRequired'), { variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      await mealsApi.submitMealPollResponses(
        spaceId,
        menuDate,
        payload,
        showPayment ? paymentChoice : undefined,
        showPayment && paymentChoice === 'MARK_AS_PAID' ? proofBase64 || undefined : undefined,
      );
      enqueueSnackbar(t('meals.poll.submitSuccess'), { variant: 'success' });
      void polls.reload();
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%', maxWidth: 640 }}>
        <PageHeader
          title={t('meals.poll.respondTitle')}
          description={menuDate}
          breadcrumbs={[
            { label: t('navigation.meals'), to: spaceMealsPath(spaceId) },
            { label: t('meals.poll.respondTitle') },
          ]}
        />

        {polls.loading ? (
          <LoadingState />
        ) : (
          <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
            {(polls.pollDay?.polls ?? []).map((poll) => (
              <ContentCard key={poll.id}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                    {poll.mealType}
                  </Typography>
                  <StatusChip label={poll.status} />
                </Stack>
                {poll.status !== 'OPEN' ? (
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                    {t('meals.poll.closed', { defaultValue: 'Poll closed' })}
                  </Typography>
                ) : (
                  <FormControl>
                    <RadioGroup
                      value={effectiveSelections[poll.mealType] ?? ''}
                      onChange={(e) => {
                        setTouched(true);
                        setSelections((prev) => ({
                          ...prev,
                          [poll.mealType]: e.target.value,
                        }));
                      }}
                    >
                      {(poll.options ?? []).map((option) => (
                        <FormControlLabel
                          key={option.id}
                          value={option.id}
                          control={<Radio />}
                          label={option.label}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}
              </ContentCard>
            ))}

            {showPayment ? (
              <ContentCard>
                <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1 }}>
                  {t('meals.poll.paymentTitle', { defaultValue: 'Payment' })}
                </Typography>
                {polls.pollDay?.myPaymentStatus ? (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    {polls.pollDay.myPaymentStatus}
                  </Alert>
                ) : null}
                <RadioGroup
                  value={paymentChoice}
                  onChange={(e) => setPaymentChoice(e.target.value as MealPollPaymentChoice)}
                >
                  <FormControlLabel
                    value="PAY_LATER"
                    control={<Radio />}
                    label={t('meals.poll.payLater', { defaultValue: 'Pay later' })}
                  />
                  <FormControlLabel
                    value="MARK_AS_PAID"
                    control={<Radio />}
                    label={t('meals.poll.markAsPaid', { defaultValue: 'Mark as paid' })}
                  />
                </RadioGroup>
                {paymentChoice === 'MARK_AS_PAID' ? (
                  <Button variant="outlined" component="label" sx={{ ...dashOutlinedButtonSx, mt: 1 }}>
                    {proofBase64
                      ? t('meals.customerPlans.removeScreenshot')
                      : t('meals.subscriptionPlans.viewPaymentProof')}
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file || proofBase64) {
                          setProofBase64(null);
                          e.target.value = '';
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          const result = String(reader.result ?? '');
                          setProofBase64(result.includes(',') ? result.split(',')[1]! : result);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </Button>
                ) : null}
              </ContentCard>
            ) : null}
          </Stack>
        )}
      </Stack>

      <StickyFooter>
        <Button
          variant="contained"
          disabled={submitting}
          onClick={() => void handleSubmit()}
          sx={dashContainedButtonSx}
        >
          {submitting ? t('common.pleaseWait') : t('meals.poll.submit')}
        </Button>
      </StickyFooter>
    </PageContainer>
  );
}
