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
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { inquiryCreditsApi } from '@/shared/api/inquiryCreditsApi';
import { ApiError, getErrorMessage } from '@/shared/api/errors';
import type { UserResponse } from '@/shared/types/auth';
import type { SpaceEnquiryResponse } from '@/shared/types/enquiry';
import { openAcomiAndroidApp } from '@/shared/utils/openAcomiAndroidApp';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import { colors } from '@/shared/theme/colors';
import { useAuthStore } from '@/store/authStore';
import { InquiryLimitDialog } from './InquiryLimitDialog';
import { contactWasEmailed } from '@/modules/onboarding/utils/enquiryContactDelivery';

type EnquireDialogProps = {
  open: boolean;
  spaceId: string;
  spaceName: string;
  ownedByCurrentUser: boolean;
  onClose: () => void;
};

type Step =
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
}: EnquireDialogProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const savedEmails = useMemo(() => savedEnquiryEmails(user), [user]);
  const [step, setStep] = useState<Step>(ownedByCurrentUser ? 'own' : 'submitting');
  const [email, setEmail] = useState(savedEmails[0] ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SpaceEnquiryResponse | null>(null);
  const [creditsFooter, setCreditsFooter] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const autoSubmitKeyRef = useRef<string | null>(null);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setCreditsFooter(null);
      return;
    }
    let cancelled = false;
    void inquiryCreditsApi
      .getPaymentConfig()
      .then((config) => {
        if (cancelled) return;
        const pkg = config.packages
          .filter((p) => p.enabled)
          .sort((a, b) => a.displayOrder - b.displayOrder)[0];
        if (pkg) {
          const amount =
            pkg.currency === 'INR' ? `₹${pkg.priceAmount}` : `${pkg.currency} ${pkg.priceAmount}`;
          setCreditsFooter(
            t('spaces.findPlace.enquire.creditsFooterPackage', {
              amount,
              credits: pkg.credits,
            }),
          );
        } else {
          setCreditsFooter(t('spaces.findPlace.enquire.creditsFooterFallback'));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCreditsFooter(t('spaces.findPlace.enquire.creditsFooterFallback'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, t]);

  async function submit(options?: { emailOverride?: string }) {
    if (submittingRef.current) {
      return;
    }
    const provided = options?.emailOverride?.trim();
    if (provided === '') {
      setError(t('spaces.findPlace.enquire.submitError'));
      setStep('email');
      return;
    }
    if (provided && !isValidEmail(provided)) {
      setError(t('spaces.findPlace.enquire.emailInvalid'));
      setStep('email');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    setStep('submitting');
    try {
      // Empty payload → backend uses authenticated account email.
      const created = await enquiryApi.create(spaceId, provided ? { email: provided } : {});
      setSubmitted(created);
      setStep(resultStepFromEnquiry(created));
      void refreshUser();
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'SELF_ENQUIRY_NOT_ALLOWED') {
        setStep('own');
        return;
      }
      if (
        err instanceof ApiError &&
        (err.errorCode === 'WEB_FREE_LIMIT_REACHED' || err.errorCode === 'INQUIRY_CREDITS_REQUIRED')
      ) {
        setLimitDialogOpen(true);
        setStep('limit');
        return;
      }
      if (err instanceof ApiError && err.errorCode === 'REQUESTER_EMAIL_REQUIRED') {
        setStep('email');
        setError(null);
        return;
      }
      setError(getErrorMessage(err, t('spaces.findPlace.enquire.submitError')));
      setStep(provided ? 'email' : 'error');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
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
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await enquiryApi.deliverContactByEmail(submitted.enquiryId, value);
      setSubmitted(updated);
      setStep(updated.status === 'SHARED' && contactWasEmailed(updated) ? 'emailSent' : 'pending');
      void refreshUser();
    } catch (err) {
      setError(getErrorMessage(err, t('spaces.findPlace.enquire.submitError')));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
      submittingRef.current = false;
      setSubmitted(null);
      setLimitDialogOpen(false);
      autoSubmitKeyRef.current = null;
      return;
    }
    setEmail(savedEmails[0] ?? user?.email?.trim() ?? '');
    if (ownedByCurrentUser) {
      setStep('own');
      return;
    }
    const key = `${spaceId}:${user?.id ?? ''}`;
    if (autoSubmitKeyRef.current === key) {
      return;
    }
    autoSubmitKeyRef.current = key;
    void submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- submit once per open+space+user
  }, [open, ownedByCurrentUser, spaceId, user?.id]);

  function resetAndClose() {
    if (submittingRef.current) {
      return;
    }
    setError(null);
    setSubmitting(false);
    setStep(ownedByCurrentUser ? 'own' : 'submitting');
    onClose();
  }

  function openEmailStep() {
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
        {t('spaces.findPlace.enquire.submittingShort')}
      </Typography>
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
      />
      <Dialog
        open={open && !limitDialogOpen}
        onClose={busy ? undefined : resetAndClose}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: { sx: { position: 'relative', overflow: 'hidden' } },
        }}
      >
        {step === 'own' ? (
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
                onClick={() => {
                  autoSubmitKeyRef.current = null;
                  void submit();
                }}
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
                    void submit({ emailOverride: email });
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
                      <Mail size={20} color={colors.textSecondary} />
                      <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
                          {detailsReady
                            ? t('spaces.findPlace.enquire.emailCtaReady')
                            : t('spaces.findPlace.enquire.emailCtaPending')}
                        </Typography>
                      </Box>
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
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button fullWidth onClick={resetAndClose} sx={ghostButtonSx}>
                {t('spaces.findPlace.enquire.done')}
              </Button>
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
