import { useRef, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { enquiryApi } from '@/shared/api/enquiryApi';
import {
  buildPhotoRequestMessage,
  confirmPhotoRequest,
  hasActualListingPhotos,
  photoRequestActionLabel,
  photoRequestTitle,
  type PhotoRequestKind,
} from '@/shared/utils/photoRequest';

type PhotoRequestActionProps = {
  spaceId: string;
  kind: PhotoRequestKind;
  name: string;
  spaceType?: string | null;
  location?: string | null;
  photoUrls?: ReadonlyArray<string | null | undefined> | null;
};

export function PhotoRequestAction({
  spaceId,
  kind,
  name,
  spaceType,
  location,
  photoUrls,
}: PhotoRequestActionProps) {
  const { t } = useTranslation();
  const hasPhotos = hasActualListingPhotos(photoUrls);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const label = photoRequestActionLabel(hasPhotos);
  const title = photoRequestTitle(kind, hasPhotos);

  function openRequest() {
    setMessage(buildPhotoRequestMessage({ kind, hasPhotos, name, spaceType, location }));
    setNotice('');
    setOpen(true);
  }

  function closeRequest() {
    if (submittingRef.current) return;
    setOpen(false);
  }

  async function confirm() {
    if (submittingRef.current || !message.trim()) return;
    submittingRef.current = true;
    setSubmitting(true);
    setNotice('');
    try {
      const result = await confirmPhotoRequest({
        message,
        request: () => enquiryApi.requestPhotos(spaceId),
        openUrl: async (url) => {
          const popup = window.open(url, '_blank', 'noopener,noreferrer');
          if (!popup) {
            throw new Error('WhatsApp did not open');
          }
        },
      });
      if (result.whatsApp === 'opened') {
        setOpen(false);
        return;
      }
      setNotice(
        result.whatsApp === 'unavailable'
          ? result.notificationPersisted
            ? t('spaces.findPlace.photoRequestUnavailableSaved', {
                defaultValue:
                  'This listing doesn’t have a WhatsApp number we can open. The photo request was saved in ACOMI.',
              })
            : t('spaces.findPlace.photoRequestUnavailable', {
                defaultValue: 'This listing doesn’t have a WhatsApp number we can open.',
              })
          : result.notificationPersisted
            ? t('spaces.findPlace.photoRequestBlockedSaved', {
                defaultValue:
                  'WhatsApp didn’t open. The photo request was saved in ACOMI. You can try again.',
              })
            : t('spaces.findPlace.photoRequestBlocked', {
                defaultValue: 'WhatsApp didn’t open. Allow pop-ups, then try again.',
              }),
      );
    } catch (error) {
      const text = error instanceof Error ? error.message.trim() : '';
      setNotice(
        text ||
          t('spaces.findPlace.photoRequestFailed', {
            defaultValue: 'Couldn’t request photos. WhatsApp was not opened.',
          }),
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        onClick={openRequest}
        variant="outlined"
        data-testid="photo-request-open"
        sx={{
          mt: 1.5,
          alignSelf: 'flex-start',
          borderRadius: '999px',
          textTransform: 'none',
          fontWeight: 700,
          color: '#0F6B4C',
          borderColor: 'rgba(37, 211, 102, 0.45)',
          bgcolor: '#E7F6EE',
        }}
      >
        {label}
      </Button>
      <Dialog open={open} onClose={closeRequest} fullWidth maxWidth="xs" aria-labelledby="photo-request-title">
        <DialogTitle id="photo-request-title" sx={{ fontWeight: 700 }}>
          {title}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>{name}</Typography>
          <Typography sx={{ mb: 1.5, fontSize: 13 }} color="text.secondary">
            {t('spaces.findPlace.photoRequestHint', {
              defaultValue: 'You send this message yourself in WhatsApp. Opening WhatsApp does not send it.',
            })}
          </Typography>
          <TextField
            id="photo-request-message"
            label={t('spaces.findPlace.photoRequestMessage', { defaultValue: 'Message' })}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            multiline
            minRows={5}
            fullWidth
            disabled={submitting}
          />
          {notice ? (
            <Typography sx={{ mt: 1.5, fontSize: 13 }} color="text.secondary">
              {notice}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeRequest} disabled={submitting} sx={{ textTransform: 'none' }}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            variant="contained"
            onClick={() => void confirm()}
            disabled={submitting || !message.trim()}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {t('spaces.findPlace.continueWhatsApp', { defaultValue: 'Continue to WhatsApp' })}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
