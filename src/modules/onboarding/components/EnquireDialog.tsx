import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  Mail,
  Smartphone,
} from 'lucide-react';
import { enquiryApi } from '@/shared/api/enquiryApi';
import { inquiryCreditsApi, needsInquiryPayment, isUnlimitedQuota, paidCreditsOf } from '@/shared/api/inquiryCreditsApi';
import { enquiryErrorMessage } from '@/shared/api/enquiryErrors';
import { ApiError } from '@/shared/api/errors';
import type { UserResponse } from '@/shared/types/auth';
import type { OwnerContactResponse, SpaceEnquiryResponse } from '@/shared/types/enquiry';
import type { InquiryQuota } from '@/shared/types/inquiryCredits';
import { openAcomiAndroidApp } from '@/shared/utils/openAcomiAndroidApp';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import { colors } from '@/shared/theme/colors';
import { useAuthStore } from '@/store/authStore';
import { inquirySentViaFromEnquiry, markContactViewed, markInquiredListing } from '@/shared/hooks/useAlreadyInquired';
import { ContactMethodChooser } from './ContactMethodChooser';
import { beginEnquirySend, endEnquirySend, showEnquiryToast } from '@/modules/onboarding/enquiryFeedback';
import { InquiryLimitDialog } from './InquiryLimitDialog';
import { contactWasEmailed } from '@/modules/onboarding/utils/enquiryContactDelivery';
import { env } from '@/shared/config/env';

type EnquireDialogProps = {
  open: boolean;
  spaceId: string;
  spaceName: string;
  ownedByCurrentUser: boolean;
  onClose: () => void;
  onOpen?: () => void;
  onViewedHere?: (contact: OwnerContactResponse) => void;
};

type EnquireResume = {
  spaceId: string;
  step: Step;
  error: string | null;
  submitted: SpaceEnquiryResponse | null;
};

let enquireResume: EnquireResume | null = null;

type Step =
  | 'choose'
  | 'submitting'
  | 'ready'
  | 'pending'
  | 'already'
  | 'email'
  | 'emailSent'
  | 'error'
  | 'own'
  | 'limit';

function savedEnquiryEmails(user: UserResponse | null | undefined): string[] {
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const value of user?.enquiryEmails ?? []) {
    const email = value?.trim().toLowerCase();
    if (email && !seen.has(email)) {
      seen.add(email);
      emails.push(email);
    }
  }
  const profile = user?.email?.trim().toLowerCase();
  if (profile && !seen.has(profile)) {
    emails.push(profile);
  }
  return emails;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function resultStepFromEnquiry(created: SpaceEnquiryResponse): Step {
  if (created.reusedExisting) {
    return 'already';
  }
  if (created.status === 'SHARED') {
    return contactWasEmailed(created) ? 'emailSent' : 'ready';
  }
  return 'pending';
}

const ghostButtonSx = {
  textTransform: 'none' as const,
  fontWeight: 700,
  color: colors.textSecondary,
  '&:hover': { bgcolor: colors.surfaceSecondary },
};

export function EnquireDialog({
  open,
  spaceId,
  spaceName,
  ownedByCurrentUser,
  onClose,
  onOpen,
  onViewedHere,
}: EnquireDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const savedEmails = useMemo(() => savedEnquiryEmails(user), [user]);
  const [step, setStep] = useState<Step>(ownedByCurrentUser ? 'own' : 'choose');
  const [pendingIntent, setPendingIntent] = useState<'app' | 'email' | 'view' | null>(null);
  const [email, setEmail] = useState(savedEmails[0] ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SpaceEnquiryResponse | null>(null);
  const [packageOffer, setPackageOffer] = useState<{ amount: string; credits: number } | null>(null);
  const [quota, setQuota] = useState<InquiryQuota | null>(null);
  const submittingRef = useRef(false);
  const openedForRef = useRef<string | null>(null);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const creditsFooter = useMemo(() => {
    if (!quota || isUnlimitedQuota(quota)) return null;
    const paid = paidCreditsOf(quota);
    if (quota.freeRemainingToday <= 0 && paid > 0) {
      return t('spaces.findPlace.enquire.creditsFooterPaid', { count: paid });
    }
    if (packageOffer) {
      return t('spaces.findPlace.enquire.creditsFooterPackage', {
        remaining: quota.freeRemainingToday,
        limit: quota.dailyFreeLimit,
        amount: packageOffer.amount,
        credits: packageOffer.credits,
      });
    }
    return t('spaces.findPlace.enquire.creditsFooterFallback', {
      remaining: quota.freeRemainingToday,
      limit: quota.dailyFreeLimit,
    });
  }, [packageOffer, quota, t]);

  async function refreshQuota() {
    try {
      const next = await inquiryCreditsApi.getQuota();
      setQuota(next);
      return next;
    } catch {
      return null;
    }
  }

  async function onResetLocalQuota(target: 'EMAIL' | 'VIEW_HERE' = 'EMAIL') {
    try {
      const next = await inquiryCreditsApi.resetQuota(target);
      setQuota(next);
      setLimitDialogOpen(false);
      setStep('choose');
    } catch {
      /* local-only helper */
    }
  }

  useEffect(() => {
    if (!open) {
      setPackageOffer(null);
      setQuota(null);
      return;
    }
    let cancelled = false;
    void Promise.all([inquiryCreditsApi.getPaymentConfig(), inquiryCreditsApi.getQuota()])
      .then(([config, nextQuota]) => {
        if (cancelled) return;
        setQuota(nextQuota);
        const pkg = config.packages
          .filter((p) => p.enabled)
          .sort((a, b) => a.displayOrder - b.displayOrder)[0];
        if (pkg) {
          const amount =
            pkg.currency === 'INR' ? `₹${pkg.priceAmount}` : `${pkg.currency} ${pkg.priceAmount}`;
          setPackageOffer({ amount, credits: pkg.credits });
        } else {
          setPackageOffer(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPackageOffer(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (step === 'email' && needsInquiryPayment(quota)) {
      setLimitDialogOpen(true);
      setStep('limit');
    }
  }, [step, quota]);

  function sentToast(address: string, already: boolean) {
    showEnquiryToast({
      title: already
        ? t('spaces.findPlace.enquire.alreadyTitleShort')
        : t('spaces.findPlace.enquire.sentToastTitle', { defaultValue: 'Enquiry sent!' }),
      body: address
        ? t('spaces.findPlace.enquire.sentToastBody', {
            email: address,
            defaultValue: 'Check your email inbox, we have sent owner contact details to {{email}}.',
          })
        : t('spaces.findPlace.enquire.sentToastBodyNoEmail', {
            defaultValue: 'Check your email inbox. We have sent the owner contact details.',
          }),
    });
  }

  function rememberEnquiry(created: SpaceEnquiryResponse) {
    markInquiredListing(queryClient, created.spaceId || spaceId, inquirySentViaFromEnquiry(created), {
      sentToEmail: contactWasEmailed(created) ? created.requesterEmail : null,
      sentAt: created.emailDeliveredAt || created.contactEmailSentAt || created.requestedAt,
    });
  }

  function reopen(step: Step, error: string | null, submittedEnquiry: SpaceEnquiryResponse | null) {
    enquireResume = { spaceId, step, error, submitted: submittedEnquiry };
    setDismissed(false);
    onOpen?.();
  }

  function hideForBackgroundSend() {
    beginEnquirySend(spaceId);
    setDismissed(true);
    onClose();
  }

  async function submit(options?: {
    emailOverride?: string;
    deliveryChannel?: 'APP' | 'EMAIL' | 'VIEW_HERE';
    stayOpen?: boolean;
  }) {
    if (submittingRef.current) {
      return;
    }
    const provided = options?.emailOverride?.trim();
    if (provided === '') {
      setDismissed(false);
      setError(t('spaces.findPlace.enquire.submitError'));
      setStep('email');
      return;
    }
    if (provided && !isValidEmail(provided)) {
      setDismissed(false);
      setError(t('spaces.findPlace.enquire.emailInvalid'));
      setStep('email');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    const stayOpen = options?.stayOpen === true || options?.deliveryChannel === 'VIEW_HERE';
    if (!stayOpen) {
      hideForBackgroundSend();
    } else {
      setStep('submitting');
    }
    try {
      const created = await enquiryApi.create(spaceId, {
        ...(provided ? { email: provided } : {}),
        ...(options?.deliveryChannel ? { deliveryChannel: options.deliveryChannel } : {}),
      });
      setSubmitted(created);
      if (options?.deliveryChannel === 'VIEW_HERE') {
        markContactViewed(queryClient, created.spaceId || spaceId, created.deliveredAt || created.requestedAt);
        setDismissed(true);
        onViewedHere?.(created.ownerContact ?? { available: false });
        void refreshQuota();
        onClose();
        return;
      }
      rememberEnquiry(created);
      void refreshUser();
      if (!created.reusedExisting) {
        void refreshQuota();
      }
      const nextStep = resultStepFromEnquiry(created);
      if (nextStep === 'emailSent' || (created.reusedExisting && contactWasEmailed(created))) {
        sentToast(created.requesterEmail, Boolean(created.reusedExisting));
        if (stayOpen) {
          setDismissed(false);
          setStep('emailSent');
        }
        return;
      }
      if (stayOpen) {
        setDismissed(false);
        setStep(nextStep);
        return;
      }
      reopen(nextStep, null, created);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.errorCode === 'VIEW_HERE_LIMIT_REACHED' || err.errorCode === 'VIEW_HERE_DISABLED')
      ) {
        void refreshQuota();
        setDismissed(false);
        setStep('choose');
        return;
      }
      if (err instanceof ApiError && err.errorCode === 'SELF_ENQUIRY_NOT_ALLOWED') {
        reopen('own', null, null);
        return;
      }
      if (
        err instanceof ApiError &&
        (err.errorCode === 'WEB_FREE_LIMIT_REACHED' || err.errorCode === 'INQUIRY_CREDITS_REQUIRED')
      ) {
        reopen('limit', null, null);
        return;
      }
      if (err instanceof ApiError && err.errorCode === 'REQUESTER_EMAIL_REQUIRED') {
        reopen('email', null, null);
        return;
      }
      const message = enquiryErrorMessage(
        err,
        t('spaces.findPlace.enquire.submitError'),
        t('spaces.findPlace.enquire.listingUnavailable'),
      );
      reopen(provided ? 'email' : 'error', message, null);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      endEnquirySend(spaceId);
    }
  }

  async function sendDetailsByEmail() {
    if (submittingRef.current || !submitted) {
      return;
    }
    const value = email.trim();
    if (!isValidEmail(value)) {
      setError(t('spaces.findPlace.enquire.emailInvalid'));
      return;
    }
    const existing = submitted;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    hideForBackgroundSend();
    try {
      const updated = await enquiryApi.deliverContactByEmail(existing.enquiryId, value);
      setSubmitted(updated);
      rememberEnquiry(updated);
      void refreshUser();
      void refreshQuota();
      if (updated.status === 'SHARED' && contactWasEmailed(updated)) {
        sentToast(updated.requesterEmail || value, false);
        return;
      }
      reopen(updated.status === 'SHARED' ? 'ready' : 'pending', null, updated);
    } catch (err) {
      reopen(
        'email',
        enquiryErrorMessage(
          err,
          t('spaces.findPlace.enquire.submitError'),
          t('spaces.findPlace.enquire.listingUnavailable'),
        ),
        existing,
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      endEnquirySend(spaceId);
    }
  }

  useLayoutEffect(() => {
    if (!open) {
      openedForRef.current = null;
      setDismissed(false);
      setError(null);
      setSubmitting(false);
      submittingRef.current = false;
      setSubmitted(null);
      setLimitDialogOpen(false);
      return;
    }
    const resume = enquireResume?.spaceId === spaceId ? enquireResume : null;
    if (resume) {
      enquireResume = null;
      openedForRef.current = `${spaceId}:${user?.id ?? ''}`;
      setDismissed(false);
      setSubmitted(resume.submitted);
      setError(resume.error);
      setStep(resume.step);
      setLimitDialogOpen(resume.step === 'limit');
      return;
    }
    const key = `${spaceId}:${user?.id ?? ''}:${ownedByCurrentUser ? 'own' : 'choose'}`;
    if (openedForRef.current === key) {
      return;
    }
    openedForRef.current = key;
    setEmail(savedEmails[0] ?? user?.email?.trim() ?? '');
    setPendingIntent(null);
    setDismissed(false);
    setStep(ownedByCurrentUser ? 'own' : 'choose');
  }, [open, ownedByCurrentUser, spaceId, user?.id, user?.email, savedEmails]);

  function resetAndClose() {
    submittingRef.current = false;
    setSubmitting(false);
    endEnquirySend(spaceId);
    setError(null);
    setPendingIntent(null);
    setDismissed(false);
    setStep(ownedByCurrentUser ? 'own' : 'choose');
    onClose();
  }

  function openEmailStep() {
    if (needsInquiryPayment(quota)) {
      setLimitDialogOpen(true);
      setStep('limit');
      return;
    }
    setError(null);
    setEmail(savedEmails[0] ?? user?.email?.trim() ?? email);
    setStep('email');
  }

  function continueWithPaidCredits() {
    setLimitDialogOpen(false);
    setError(null);
    setEmail(savedEmails[0] ?? user?.email?.trim() ?? email);
    setStep('email');
  }

  const detailsReady = submitted?.status === 'SHARED';
  const alreadyPending = step === 'already' && submitted?.status !== 'SHARED';
  const busy = submitting || step === 'submitting';

  const busyOverlay = busy ? (
    <Box
      role="status"
      aria-live="polite"
      aria-busy
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(255,255,255,0.95)',
        px: 3,
        textAlign: 'center',
      }}
    >
      <CircularProgress size={32} />
      <Typography sx={{ mt: 2, fontWeight: 700 }}>
        {pendingIntent === 'view'
          ? t('spaces.findPlace.enquire.viewingShort', { defaultValue: 'Opening contact details...' })
          : t('spaces.findPlace.enquire.submittingShort')}
      </Typography>
      <Typography sx={{ mt: 0.5, fontSize: 13, color: 'text.secondary' }}>
        {pendingIntent === 'view'
          ? t('spaces.findPlace.enquire.viewingBody', {
              defaultValue: 'Please wait while we load the owner’s contact details.',
            })
          : pendingIntent === 'email'
            ? t('spaces.findPlace.enquire.sendingEmailBody', {
                defaultValue: 'Please wait while we send owner contact details to your email.',
              })
            : t('spaces.findPlace.enquire.sendingAppBody', {
                defaultValue: 'Please wait while we send your enquiry to ACOMI.',
              })}
      </Typography>
      <Button onClick={resetAndClose} sx={{ ...ghostButtonSx, mt: 2 }}>
        {t('common.cancel', { defaultValue: 'Cancel' })}
      </Button>
    </Box>
  ) : null;

  return (
    <>
      <InquiryLimitDialog
        open={limitDialogOpen}
        onClose={() => {
          setLimitDialogOpen(false);
          onClose();
        }}
        onQuotaReset={env.isDevelopment ? () => void onResetLocalQuota() : undefined}
        freeUsedToday={quota?.freeUsedToday}
        availableCredits={paidCreditsOf(quota)}
        onContinueWithCredits={
          paidCreditsOf(quota) > 0 ? continueWithPaidCredits : undefined
        }
      />
      <Dialog
        open={open && !dismissed && !limitDialogOpen}
        onClose={resetAndClose}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              position: 'relative',
              m: { xs: 1.5, sm: 2 },
              maxHeight: { xs: 'calc(100dvh - 24px)', sm: '90vh' },
              overflow: 'auto',
            },
          },
        }}
      >
        {step === 'choose' ? (
          <DialogContent sx={{ pt: 3, pb: 2 }}>
            <ContactMethodChooser
              quota={quota}
              packageOffer={packageOffer}
              disabled={submitting}
              onApp={() => {
                setPendingIntent('app');
                void submit({ deliveryChannel: 'APP', stayOpen: true });
              }}
              onViewHere={() => {
                setPendingIntent('view');
                void submit({ deliveryChannel: 'VIEW_HERE', stayOpen: true });
              }}
              onEmail={() => {
                setPendingIntent('email');
                openEmailStep();
              }}
            />
            <Button fullWidth onClick={resetAndClose} sx={{ ...ghostButtonSx, mt: 1.5 }}>
              {t('spaces.findPlace.enquire.done', { defaultValue: 'Done' })}
            </Button>
            {env.isDevelopment ? (
              <>
                <Button fullWidth onClick={() => void onResetLocalQuota('EMAIL')} disabled={submitting} sx={{ ...ghostButtonSx, mt: 0.5 }}>
                  {t('spaces.findPlace.enquire.limitResetQuota', {
                    defaultValue: "Reset today's email limit (local only)",
                  })}
                </Button>
                <Button fullWidth onClick={() => void onResetLocalQuota('VIEW_HERE')} disabled={submitting} sx={{ ...ghostButtonSx, mt: 0.5 }}>
                  {t('spaces.findPlace.enquire.limitResetViewHere', {
                    defaultValue: "Reset today's view here limit (local only)",
                  })}
                </Button>
              </>
            ) : null}
          </DialogContent>
        ) : step === 'own' ? (
          <>
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
              {t('spaces.findPlace.enquire.ownTitle')}
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center', pt: 0 }}>
              <Typography color="text.secondary">{t('spaces.findPlace.enquire.ownBody')}</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button fullWidth onClick={resetAndClose} sx={dashContainedButtonSx}>
                {t('spaces.findPlace.enquire.done')}
              </Button>
            </DialogActions>
          </>
        ) : step === 'error' ? (
          <>
            <DialogContent sx={{ pt: 4, pb: 2, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  mx: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: colors.errorTint,
                  color: colors.danger,
                }}
              >
                <AlertCircle size={24} />
              </Box>
              <DialogTitle sx={{ px: 0, pt: 2, pb: 1 }}>
                {t('spaces.findPlace.enquire.submitError')}
              </DialogTitle>
              {error ? (
                <Typography color="error" sx={{ fontSize: 13 }} role="alert">
                  {error}
                </Typography>
              ) : null}
            </DialogContent>
            <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 3, pb: 3 }}>
              <Button
                fullWidth
                onClick={() => setStep('choose')}
                sx={dashContainedButtonSx}
              >
                {t('common.retry')}
              </Button>
              <Button fullWidth onClick={resetAndClose} sx={ghostButtonSx}>
                {t('common.cancel')}
              </Button>
            </DialogActions>
          </>
        ) : step === 'email' ? (
          <>
            <DialogContent sx={{ pt: 4, pb: 1, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  mx: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: colors.mintSubtle,
                  color: colors.primary,
                }}
              >
                <Mail size={24} />
              </Box>
              <DialogTitle sx={{ px: 0, pt: 2, pb: 0.5 }}>
                {t('spaces.findPlace.enquire.emailTitleShort')}
              </DialogTitle>
              <Typography color="text.secondary" sx={{ fontSize: 14, mb: 2 }}>
                {detailsReady
                  ? t('spaces.findPlace.enquire.emailBodyReady')
                  : t('spaces.findPlace.enquire.emailBodyPending')}
              </Typography>
              <Box
                component="form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (submitted) {
                    void sendDetailsByEmail();
                  } else {
                    void submit({ emailOverride: email, deliveryChannel: 'EMAIL', stayOpen: true });
                  }
                }}
                sx={{ textAlign: 'left' }}
              >
                <TextField
                  fullWidth
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  disabled={submitting}
                  onChange={(event) => setEmail(event.target.value)}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
                {error ? (
                  <Typography
                    role="alert"
                    sx={{
                      mt: 1.5,
                      px: 1.5,
                      py: 1,
                      borderRadius: 1.5,
                      bgcolor: '#FEF2F2',
                      color: '#B91C1C',
                      fontSize: 12,
                    }}
                  >
                    {error}
                  </Typography>
                ) : null}
                <Button
                  type="submit"
                  fullWidth
                  disabled={submitting}
                  sx={{ ...dashContainedButtonSx, mt: 2 }}
                >
                  {t('spaces.findPlace.enquire.sendDetails')}
                </Button>
                <Typography
                  sx={{
                    mt: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.75,
                    fontSize: 12,
                    color: 'text.secondary',
                  }}
                >
                  <Lock size={14} />
                  {t('spaces.findPlace.enquire.emailTrust')}
                </Typography>
                <Button
                  type="button"
                  fullWidth
                  disabled={submitting}
                  onClick={() =>
                    setStep(submitted ? resultStepFromEnquiry(submitted) : 'pending')
                  }
                  sx={{ ...ghostButtonSx, mt: 1 }}
                >
                  {t('spaces.findPlace.enquire.back')}
                </Button>
              </Box>
            </DialogContent>
          </>
        ) : step === 'emailSent' ? (
          <>
            <DialogContent sx={{ pt: 4, pb: 2, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  mx: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: colors.mintSubtle,
                  color: colors.primary,
                }}
              >
                <CheckCircle2 size={24} />
              </Box>
              <DialogTitle sx={{ px: 0, pt: 2, pb: 0.5 }}>
                {t('spaces.findPlace.enquire.emailSentTitle')}
              </DialogTitle>
              <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                {t('spaces.findPlace.enquire.emailSentBody')}
              </Typography>
              {submitted?.requesterEmail ? (
                <Typography sx={{ mt: 2, fontWeight: 700, wordBreak: 'break-all', fontSize: 13 }}>
                  {submitted.requesterEmail}
                </Typography>
              ) : null}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button fullWidth onClick={resetAndClose} sx={ghostButtonSx}>
                {t('spaces.findPlace.enquire.done')}
              </Button>
            </DialogActions>
          </>
        ) : step === 'ready' || step === 'pending' || step === 'already' ? (
          <>
            <DialogContent sx={{ pt: 4, pb: 1, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  mx: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor:
                    step === 'pending' || alreadyPending ? '#F0F9FF' : colors.mintSubtle,
                  color: step === 'pending' || alreadyPending ? '#0284C7' : colors.primary,
                }}
              >
                {step === 'pending' || alreadyPending ? (
                  <Clock size={24} />
                ) : (
                  <CheckCircle2 size={24} />
                )}
              </Box>

              <DialogTitle sx={{ px: 0, pt: 2, pb: 0.5 }}>
                {step === 'already'
                  ? t('spaces.findPlace.enquire.alreadyTitleShort')
                  : detailsReady
                    ? t('spaces.findPlace.enquire.readyTitle')
                    : t('spaces.findPlace.enquire.pendingTitleShort')}
              </DialogTitle>
              <Typography color="text.secondary" sx={{ fontSize: 14, mb: 2 }}>
                {step === 'already'
                  ? alreadyPending
                    ? t('spaces.findPlace.enquire.alreadyPendingBodyShort')
                    : contactWasEmailed(submitted)
                      ? t('spaces.findPlace.enquire.alreadyEmailedBodyShort')
                      : t('spaces.findPlace.enquire.alreadyReadyBodyShort')
                  : detailsReady
                    ? t('spaces.findPlace.enquire.readyBody')
                    : t('spaces.findPlace.enquire.pendingBodyShort')}
              </Typography>

              {step === 'already' && spaceName ? (
                <Box
                  sx={{
                    mb: 2,
                    bgcolor: colors.surfaceSecondary,
                    borderRadius: 2,
                    px: 2,
                    py: 1.25,
                    fontWeight: 700,
                    fontSize: 13,
                    color: colors.tealDark,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  {spaceName}
                  <Box
                    component="span"
                    sx={{
                      bgcolor: '#FEF3C7',
                      color: '#92400E',
                      borderRadius: 999,
                      px: 1,
                      py: 0.25,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {alreadyPending
                      ? t('spaces.enquiries.status.PENDING')
                      : t('spaces.enquiries.status.SHARED')}
                  </Box>
                </Box>
              ) : null}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, textAlign: 'left' }}>
                <Button
                  type="button"
                  fullWidth
                  onClick={() => openAcomiAndroidApp({ enquiryId: submitted?.enquiryId })}
                  sx={{
                    justifyContent: 'flex-start',
                    gap: 1.5,
                    px: 1.75,
                    py: 1.5,
                    borderRadius: 3,
                    border: `1px solid ${colors.primary}40`,
                    bgcolor: colors.mintSubtle,
                    color: colors.tealDark,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: colors.primary,
                      bgcolor: colors.mintSubtle,
                    },
                  }}
                >
                  <Smartphone size={20} color={colors.primary} />
                  <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
                      {step === 'already'
                        ? t('spaces.findPlace.enquire.viewInAcomi')
                        : detailsReady
                          ? t('spaces.findPlace.enquire.appCtaReady')
                          : t('spaces.findPlace.enquire.appCtaPending')}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.3 }}>
                      {t('spaces.findPlace.enquire.appHint')}
                    </Typography>
                  </Box>
                  <ExternalLink size={16} color={colors.primary} style={{ opacity: 0.7 }} />
                </Button>

                {step !== 'already' ? (
                  <>
                    <Typography
                      sx={{
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'text.secondary',
                      }}
                    >
                      {t('spaces.findPlace.enquire.or')}
                    </Typography>
                    <Button
                      type="button"
                      fullWidth
                      onClick={openEmailStep}
                      sx={{
                        justifyContent: 'flex-start',
                        gap: 1.5,
                        px: 1.75,
                        py: 1.5,
                        borderRadius: 3,
                        border: `1px solid ${colors.border}`,
                        bgcolor: colors.white,
                        color: colors.tealDark,
                        textTransform: 'none',
                        '&:hover': { borderColor: `${colors.primary}66` },
                      }}
                    >
                      <Box sx={{ position: 'relative', flexShrink: 0, width: 28, height: 28 }}>
                        <Mail size={22} color={colors.textSecondary} style={{ marginTop: 3 }} />
                        {quota != null && !isUnlimitedQuota(quota) ? (
                          <Box
                            aria-hidden
                            sx={{
                              position: 'absolute',
                              top: -4,
                              right: -6,
                              minWidth: 18,
                              height: 18,
                              px: 0.5,
                              borderRadius: 999,
                              bgcolor:
                                quota.freeRemainingToday > 0 || paidCreditsOf(quota) > 0
                                  ? '#DC2626'
                                  : colors.textSecondary,
                              color: '#fff',
                              fontSize: 10,
                              fontWeight: 800,
                              display: 'grid',
                              placeItems: 'center',
                              lineHeight: 1,
                            }}
                          >
                            {quota.freeRemainingToday > 0
                              ? quota.freeRemainingToday
                              : paidCreditsOf(quota)}
                          </Box>
                        ) : null}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
                          {detailsReady
                            ? t('spaces.findPlace.enquire.emailCtaReady')
                            : t('spaces.findPlace.enquire.emailCtaPending')}
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.25,
                            fontSize: 13,
                            fontWeight: 800,
                            color:
                              quota != null &&
                              !isUnlimitedQuota(quota) &&
                              quota.freeRemainingToday <= 0 &&
                              paidCreditsOf(quota) <= 0
                                ? '#B45309'
                                : '#C2410C',
                            lineHeight: 1.3,
                          }}
                        >
                          {quota != null && !isUnlimitedQuota(quota)
                            ? quota.freeRemainingToday > 0
                              ? t('spaces.findPlace.enquire.emailQuotaRemaining', {
                                  count: quota.freeRemainingToday,
                                })
                              : paidCreditsOf(quota) > 0
                                ? t('spaces.findPlace.enquire.emailQuotaPaid', {
                                    count: paidCreditsOf(quota),
                                  })
                                : t('spaces.findPlace.enquire.emailQuotaExhausted')
                            : null}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.3 }}>
                          {detailsReady
                            ? t('spaces.findPlace.enquire.emailHintReady')
                            : t('spaces.findPlace.enquire.emailHintPending')}
                        </Typography>
                      </Box>
                      <ExternalLink size={16} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                    </Button>
                  </>
                ) : null}
              </Box>

              {creditsFooter && step !== 'already' ? (
                <Typography
                  sx={{ mt: 2, textAlign: 'center', fontSize: 11, color: 'text.secondary' }}
                >
                  {creditsFooter}
                </Typography>
              ) : null}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
              <Button fullWidth onClick={resetAndClose} sx={ghostButtonSx}>
                {t('spaces.findPlace.enquire.done')}
              </Button>
              {env.isDevelopment ? (
                <Button fullWidth onClick={() => void onResetLocalQuota('EMAIL')} sx={ghostButtonSx}>
                  {t('spaces.findPlace.enquire.limitResetQuota', {
                    defaultValue: "Reset today's email limit (local only)",
                  })}
                </Button>
              ) : null}
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>{t('spaces.findPlace.enquire.submittingShort')}</DialogTitle>
            <DialogContent />
          </>
        )}
        {busyOverlay}
      </Dialog>
    </>
  );
}
