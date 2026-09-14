import {
  Box,
  Button,
  Chip,
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
import { CalendarDays, CheckCircle2, Clock, Mail, MailCheck } from 'lucide-react';
import { enquiryApi } from '@/shared/api/enquiryApi';
import { getErrorMessage } from '@/shared/api/errors';
import type { UserResponse } from '@/shared/types/auth';
import type { SpaceEnquiryResponse } from '@/shared/types/enquiry';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { colors } from '@/shared/theme/colors';
import { useAuthStore } from '@/store/authStore';

type EnquireDialogProps = {
  open: boolean;
  spaceId: string;
  spaceName: string;
  ownedByCurrentUser: boolean;
  onClose: () => void;
};

type Step = 'request' | 'sent' | 'own' | 'already';

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

export function EnquireDialog({
  open,
  spaceId,
  spaceName,
  ownedByCurrentUser,
  onClose,
}: EnquireDialogProps) {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const savedEmails = useMemo(() => savedEnquiryEmails(user), [user]);
  const [step, setStep] = useState<Step>(ownedByCurrentUser ? 'own' : 'request');
  const [email, setEmail] = useState(savedEmails[0] ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SpaceEnquiryResponse | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
      submittingRef.current = false;
      setSubmitted(null);
      return;
    }
    setError(null);
    setSubmitting(false);
    submittingRef.current = false;
    setEmail(savedEmails[0] ?? '');
    setStep(ownedByCurrentUser ? 'own' : 'request');
  }, [open, ownedByCurrentUser, spaceId, user?.id]);

  useEffect(() => {
    if (!open || submitting || step === 'sent' || step === 'own' || step === 'already') {
      return;
    }
    if (email.trim()) {
      return;
    }
    if (savedEmails[0]) {
      setEmail(savedEmails[0]);
    }
  }, [email, open, savedEmails, step, submitting]);

  function resetAndClose() {
    if (submittingRef.current) {
      return;
    }
    setError(null);
    setSubmitting(false);
    setStep(ownedByCurrentUser ? 'own' : 'request');
    onClose();
  }

  async function submit() {
    if (submittingRef.current) {
      return;
    }
    const enquiryEmail = email.trim();
    if (!enquiryEmail) {
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const created = await enquiryApi.create(spaceId, { email: enquiryEmail });
      setSubmitted(created);
      setStep(created.reusedExisting ? 'already' : 'sent');
      void refreshUser();
    } catch (err) {
      setError(getErrorMessage(err, t('spaces.findPlace.enquire.submitError')));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const busyOverlay = submitting ? (
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
        bgcolor: 'rgba(255,255,255,0.92)',
        px: 3,
        textAlign: 'center',
      }}
    >
      <CircularProgress size={36} />
      <Typography sx={{ mt: 2, fontWeight: 700 }}>
        {t('spaces.findPlace.enquire.submitting')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {t('spaces.findPlace.enquire.submittingHint')}
      </Typography>
    </Box>
  ) : null;

  if (ownedByCurrentUser || step === 'own') {
    return (
      <Dialog open={open} onClose={resetAndClose} fullWidth maxWidth="sm">
        <DialogTitle>{t('spaces.findPlace.enquire.ownTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('spaces.findPlace.enquire.ownBody')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetAndClose} sx={dashContainedButtonSx}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (step === 'sent' || step === 'already') {
    const alreadyShared = step === 'already' && submitted?.status === 'SHARED';
    const alreadyPending = step === 'already' && !alreadyShared;
    const sharedAtDate = submitted?.sharedAt ? new Date(submitted.sharedAt) : null;
    const sharedOn =
      sharedAtDate && !Number.isNaN(sharedAtDate.getTime())
        ? sharedAtDate.toLocaleString(i18n.language, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : null;
    const sentTo = submitted?.requesterEmail?.trim() || email.trim() || null;
    const title = alreadyShared
      ? t('spaces.findPlace.enquire.alreadySharedTitle')
      : alreadyPending
        ? t('spaces.findPlace.enquire.alreadyPendingTitle')
        : t('spaces.findPlace.enquire.sentTitle');
    const body = alreadyShared
      ? t('spaces.findPlace.enquire.alreadySharedBody')
      : alreadyPending
        ? t('spaces.findPlace.enquire.alreadyPendingBody')
        : t('spaces.findPlace.enquire.sentBody');
    const iconBg = alreadyShared || step === 'sent' ? colors.mintSubtle : '#FFF8E8';
    const iconColor = alreadyShared || step === 'sent' ? colors.primary : '#D97706';
    return (
      <Dialog open={open} onClose={resetAndClose} fullWidth maxWidth="sm">
        <DialogContent sx={{ pt: 4, pb: 2, textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              mx: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: iconBg,
              color: iconColor,
            }}
          >
            {alreadyShared ? (
              <MailCheck size={28} />
            ) : alreadyPending ? (
              <Clock size={28} />
            ) : (
              <CheckCircle2 size={28} />
            )}
          </Box>
          <DialogTitle sx={{ px: 0, pt: 2, pb: 1 }}>{title}</DialogTitle>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {body}
          </Typography>
          <Box
            sx={{
              bgcolor: colors.surfaceSecondary,
              borderRadius: 2,
              px: 2,
              py: 1.5,
              fontWeight: 700,
              color: colors.tealDark,
            }}
          >
            {spaceName}
          </Box>
          {alreadyShared ? (
            <Box
              sx={{
                mt: 1.5,
                textAlign: 'left',
                bgcolor: colors.mintSubtle,
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                px: 2,
                py: 1.5,
              }}
            >
              {sharedOn ? (
                <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                  <CalendarDays size={16} color={colors.primary} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('spaces.findPlace.enquire.emailSentOn')}
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }}>{sharedOn}</Typography>
                  </Box>
                </Box>
              ) : null}
              {sentTo ? (
                <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', mt: sharedOn ? 1.5 : 0 }}>
                  <Mail size={16} color={colors.primary} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('spaces.findPlace.enquire.sentTo')}
                    </Typography>
                    <Typography sx={{ fontWeight: 700, wordBreak: 'break-all' }}>{sentTo}</Typography>
                  </Box>
                </Box>
              ) : null}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                {t('spaces.findPlace.enquire.alreadyNoNewEmail')} {t('spaces.findPlace.enquire.checkInboxHint')}
              </Typography>
            </Box>
          ) : null}
          {alreadyPending ? (
            <Typography
              sx={{
                mt: 1.5,
                textAlign: 'left',
                bgcolor: '#FFF8E8',
                borderRadius: 2,
                px: 2,
                py: 1.5,
                color: '#92400E',
              }}
            >
              {t('spaces.findPlace.enquire.alreadyPendingHint')}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={resetAndClose} fullWidth sx={dashContainedButtonSx}>
            {t('spaces.findPlace.enquire.done')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const selectedSaved = savedEmails.find((value) => value === email.trim().toLowerCase()) ?? null;

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : resetAndClose}
      fullWidth
      maxWidth="sm"
      disableEscapeKeyDown={submitting}
      slotProps={{
        paper: { sx: { position: 'relative', overflow: 'hidden' } },
      }}
    >
      <DialogTitle>{t('spaces.findPlace.enquire.requestTitle')}</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>{spaceName}</Typography>
        <Typography sx={{ mb: 2 }}>{t('spaces.findPlace.enquire.requestBody')}</Typography>
        {savedEmails.length > 0 ? (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              {t('spaces.findPlace.enquire.savedEmails')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {savedEmails.map((saved) => (
                <Chip
                  key={saved}
                  label={saved}
                  clickable={!submitting}
                  disabled={submitting}
                  onClick={() => setEmail(saved)}
                  sx={{
                    fontWeight: 700,
                    bgcolor: saved === selectedSaved ? colors.selected : colors.mintSubtle,
                    border: `1px solid ${saved === selectedSaved ? colors.primary : colors.border}`,
                  }}
                />
              ))}
              <Chip
                label={t('spaces.findPlace.enquire.useDifferentEmail')}
                clickable={!submitting}
                disabled={submitting}
                onClick={() => setEmail('')}
                sx={{
                  fontWeight: 700,
                  bgcolor: selectedSaved == null ? colors.selected : colors.mintSubtle,
                  border: `1px solid ${selectedSaved == null ? colors.primary : colors.border}`,
                }}
              />
            </Box>
          </Box>
        ) : null}
        <TextField
          fullWidth
          type="email"
          label={t('spaces.findPlace.enquire.emailLabel')}
          value={email}
          disabled={submitting}
          onChange={(event) => setEmail(event.target.value)}
        />
        {error ? (
          <Typography color="error" sx={{ mt: 1.5 }}>
            {error}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button disabled={submitting} onClick={resetAndClose} sx={dashOutlinedButtonSx}>
          {t('common.cancel')}
        </Button>
        <Button
          disabled={submitting || !email.trim()}
          onClick={() => void submit()}
          sx={dashContainedButtonSx}
        >
          {submitting ? t('spaces.findPlace.enquire.submitting') : t('spaces.findPlace.enquire.send')}
        </Button>
      </DialogActions>
      {busyOverlay}
    </Dialog>
  );
}
