import { Alert, Button, InputAdornment, Stack, TextField } from '@mui/material';
import { Phone, User } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import type { AdminUpdateRegistrationContactRequest } from '@/shared/types/admin';

type AdminRegistrationContactEditorProps = {
  ownerName: string;
  mobileNumber: string;
  alternateMobileNumber?: string | null;
  saving: boolean;
  onSave: (payload: AdminUpdateRegistrationContactRequest) => void;
  onCancel: () => void;
};

const fieldSx = { '& .MuiInputBase-root': { bgcolor: 'background.paper' } };

export function AdminRegistrationContactEditor({
  ownerName,
  mobileNumber,
  alternateMobileNumber,
  saving,
  onSave,
  onCancel,
}: AdminRegistrationContactEditorProps) {
  const { t } = useTranslation();
  const [owner, setOwner] = useState(ownerName ?? '');
  const [primary, setPrimary] = useState(mobileNumber ?? '');
  const [alternate, setAlternate] = useState(alternateMobileNumber ?? '');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    if (primary.trim() && !isValidIndianMobile(primary)) {
      setError(t('admin.contactEditor.errors.primaryMobile'));
      return;
    }
    if (alternate.trim() && !isValidIndianMobile(alternate)) {
      setError(t('admin.contactEditor.errors.alternateMobile'));
      return;
    }
    if (
      primary.trim() &&
      alternate.trim() &&
      normalizeIndianMobileDigits(primary) === normalizeIndianMobileDigits(alternate)
    ) {
      setError(t('admin.contactEditor.errors.alternateDifferent'));
      return;
    }

    const payload: AdminUpdateRegistrationContactRequest = {
      alternateMobileNumber: alternate.trim() ? normalizeIndianMobileDigits(alternate) : null,
    };
    if (owner.trim()) payload.ownerName = owner.trim();
    if (primary.trim()) payload.mobileNumber = normalizeIndianMobileDigits(primary);
    onSave(payload);
  }

  return (
    <Stack spacing={1.5} sx={{ maxWidth: 420 }}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <TextField
        label={t('admin.contactEditor.ownerName')}
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
        fullWidth
        size="small"
        sx={fieldSx}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <User size={16} />
              </InputAdornment>
            ),
          },
        }}
      />
      <TextField
        label={t('admin.contactEditor.primaryMobile')}
        value={primary}
        onChange={(e) => setPrimary(normalizeIndianMobileDigits(e.target.value))}
        placeholder={t('admin.common.primaryMobilePlaceholder')}
        fullWidth
        size="small"
        sx={fieldSx}
        slotProps={{
          htmlInput: { maxLength: 10, inputMode: 'numeric' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Phone size={16} />
              </InputAdornment>
            ),
          },
        }}
      />
      <TextField
        label={t('admin.contactEditor.alternateMobile')}
        value={alternate}
        onChange={(e) => setAlternate(normalizeIndianMobileDigits(e.target.value))}
        placeholder={t('admin.common.alternateMobilePlaceholder')}
        helperText={t('admin.contactEditor.alternateHint')}
        fullWidth
        size="small"
        sx={fieldSx}
        slotProps={{
          htmlInput: { maxLength: 10, inputMode: 'numeric' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Phone size={16} />
              </InputAdornment>
            ),
          },
        }}
      />
      <Stack direction="row" spacing={1}>
        <Button variant="contained" size="small" disabled={saving} onClick={handleSubmit}>
          {saving ? t('admin.common.saving') : t('admin.contactEditor.save')}
        </Button>
        <Button size="small" disabled={saving} onClick={onCancel}>
          {t('admin.common.cancel')}
        </Button>
      </Stack>
    </Stack>
  );
}
