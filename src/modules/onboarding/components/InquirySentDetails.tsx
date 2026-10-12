import { useState } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { showEnquiryToast } from '@/modules/onboarding/enquiryFeedback';
import { enquiryApi } from '@/shared/api/enquiryApi';
import { enquiryErrorMessage } from '@/shared/api/enquiryErrors';
import { markInquiredListing, useInquiryRecord } from '@/shared/hooks/useAlreadyInquired';

function formatSentAt(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function InquirySentDetails({ listingId }: { listingId: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const record = useInquiryRecord(listingId);
  const [busy, setBusy] = useState(false);
  const email = record?.sentToEmail?.trim() || '';
  const when = formatSentAt(record?.sentAt);
  const appOnly = !email && (record?.sentVia === 'APP' || record?.sentVia === 'BOTH');
  const alreadySent = t('spaces.findPlace.inquiryAlreadySent', { defaultValue: 'Inquiry already sent' });
  const statusLine = [
    alreadySent,
    email || (appOnly ? t('spaces.findPlace.inquirySentInApp', { defaultValue: 'Sent in the ACOMI app' }) : null),
    when,
  ]
    .filter(Boolean)
    .join(' : ');

  async function sendAgain() {
    if (busy) return;
    setBusy(true);
    try {
      const created = await enquiryApi.sendAgain(listingId);
      const address = created.requesterEmail?.trim() || email;
      const sentAt =
        created.emailDeliveredAt || created.contactEmailSentAt || created.requestedAt || new Date().toISOString();
      markInquiredListing(queryClient, listingId, 'EMAIL', { sentToEmail: address || null, sentAt });
      showEnquiryToast({
        title: t('spaces.findPlace.enquire.sentToastTitle', { defaultValue: 'Enquiry sent!' }),
        body: address
          ? t('spaces.findPlace.enquire.sentToastBody', {
              email: address,
              defaultValue: 'Check your email inbox, we have sent owner contact details to {{email}}.',
            })
          : t('spaces.findPlace.enquire.sentToastBodyNoEmail', {
              defaultValue: 'Check your email inbox. We have sent the owner contact details.',
            }),
      });
    } catch (err) {
      showEnquiryToast({
        tone: 'error',
        title: t('spaces.findPlace.enquire.submitError'),
        body: enquiryErrorMessage(err, t('spaces.findPlace.enquire.submitError'), t('spaces.findPlace.enquire.listingUnavailable')),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box
      sx={{
        mt: 1,
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        borderRadius: '999px',
        border: '1px solid #FDBA74',
        bgcolor: '#FFEDD5',
        py: '4px',
        pl: '10px',
        pr: '4px',
      }}
    >
      <Box
        sx={{
          minWidth: 0,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: '#C2410C',
          fontSize: '12.5px',
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        {statusLine}
      </Box>
      <Button
        type="button"
        disabled={busy}
        onClick={() => void sendAgain()}
        sx={{
          ml: 'auto',
          flexShrink: 0,
          alignSelf: 'center',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 32,
          minHeight: 32,
          minWidth: 0,
          px: '12px',
          py: 0,
          borderRadius: '999px',
          border: '1px solid #C2410C',
          bgcolor: '#fff',
          color: '#C2410C',
          fontSize: '12.5px',
          fontWeight: 600,
          lineHeight: 1,
          textTransform: 'none',
          whiteSpace: 'nowrap',
          boxShadow: 'none',
          '&:hover': { bgcolor: '#FFF7ED', boxShadow: 'none' },
        }}
      >
        {busy ? <CircularProgress size={14} sx={{ mr: '6px', color: '#C2410C' }} /> : null}
        {t('spaces.findPlace.sendInquiryAgain', { defaultValue: 'Resend inquiry' })}
      </Button>
    </Box>
  );
}
