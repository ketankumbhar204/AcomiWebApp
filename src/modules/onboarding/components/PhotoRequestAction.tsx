import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  buildPhotoRequestMessage,
  firstWhatsAppPhone,
  hasActualListingPhotos,
  photoRequestActionLabel,
  photoRequestTitle,
  whatsAppChatUrl,
  type PhotoRequestKind,
} from '@/shared/utils/photoRequest';

type PhotoRequestActionProps = {
  kind: PhotoRequestKind;
  name: string;
  spaceType?: string | null;
  location?: string | null;
  photoUrls?: ReadonlyArray<string | null | undefined> | null;
  phones?: ReadonlyArray<string | null | undefined> | null;
  contactAuthorized: boolean;
  onNeedContact?: () => void;
};

export function PhotoRequestAction({
  kind,
  name,
  spaceType,
  location,
  photoUrls,
  phones,
  contactAuthorized,
  onNeedContact,
}: PhotoRequestActionProps) {
  const { t } = useTranslation();
  const hasPhotos = hasActualListingPhotos(photoUrls);
  const phone = contactAuthorized ? firstWhatsAppPhone(phones) : null;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const label = photoRequestActionLabel(hasPhotos);
  const title = photoRequestTitle(hasPhotos);

  function openRequest() {
    if (!contactAuthorized) {
      onNeedContact?.();
      return;
    }
    setMessage(buildPhotoRequestMessage({ kind, hasPhotos, name, spaceType, location }));
    setNotice('');
    setOpen(true);
  }

  async function openWhatsApp() {
    const url = phone ? whatsAppChatUrl(phone, message) : null;
    if (!url) {
      setNotice(
        t('spaces.findPlace.photoRequestUnavailable', {
          defaultValue: 'This contact number can’t be opened in WhatsApp.',
        }),
      );
      return;
    }
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (popup) {
      setOpen(false);
      return;
    }
    try {
      await navigator.clipboard.writeText(`${message}\n+${phone}`);
      setNotice(
        t('spaces.findPlace.photoRequestCopied', {
          defaultValue: 'WhatsApp didn’t open. The message and number were copied so you can paste them.',
        }),
      );
    } catch {
      setNotice(
        t('spaces.findPlace.photoRequestBlocked', {
          defaultValue: 'WhatsApp didn’t open. Allow pop-ups, or copy the message and contact number from this screen.',
        }),
      );
    }
  }

  return (
    <>
      <Button
        onClick={openRequest}
        variant="outlined"
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
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="photo-request-title"
      >
        <DialogTitle id="photo-request-title" sx={{ fontWeight: 700 }}>
          {title}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>{name}</Typography>
          {phone ? (
            <TextField
              id="photo-request-message"
              label={t('spaces.findPlace.photoRequestMessage', { defaultValue: 'Message' })}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              multiline
              minRows={5}
              fullWidth
            />
          ) : (
            <Typography color="text.secondary">
              {t('spaces.findPlace.photoRequestUnavailable', {
                defaultValue: 'This contact number can’t be opened in WhatsApp.',
              })}
            </Typography>
          )}
          {notice ? (
            <Typography sx={{ mt: 1.5, fontSize: 13 }} color="text.secondary">
              {notice}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none' }}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          {phone ? (
            <Button
              variant="contained"
              onClick={() => void openWhatsApp()}
              disabled={!message.trim()}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {t('spaces.findPlace.openWhatsApp', { defaultValue: 'Open WhatsApp' })}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </>
  );
}
