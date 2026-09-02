import { Alert, Button, InputAdornment, Stack, TextField } from '@mui/material';
import { Phone, User } from 'lucide-react';
import { useState } from 'react';
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
  const [owner, setOwner] = useState(ownerName ?? '');
  const [primary, setPrimary] = useState(mobileNumber ?? '');
  const [alternate, setAlternate] = useState(alternateMobileNumber ?? '');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    if (primary.trim() && !isValidIndianMobile(primary)) {
      setError('Enter a valid 10-digit primary mobile number, or leave it unchanged.');
      return;
    }
    if (alternate.trim() && !isValidIndianMobile(alternate)) {
      setError('Enter a valid 10-digit alternate mobile number, or leave it blank.');
      return;
    }
    if (
      primary.trim() &&
      alternate.trim() &&
      normalizeIndianMobileDigits(primary) === normalizeIndianMobileDigits(alternate)
    ) {
      setError('Alternate mobile number must be different from the primary mobile number.');
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
        label="Owner name"
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
        label="Primary mobile number"
        value={primary}
        onChange={(e) => setPrimary(normalizeIndianMobileDigits(e.target.value))}
        placeholder="10-digit number"
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
        label="Alternate mobile number"
        value={alternate}
        onChange={(e) => setAlternate(normalizeIndianMobileDigits(e.target.value))}
        placeholder="Optional 10-digit number"
        helperText="Optional. Leave blank to remove the alternate number."
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
          {saving ? 'Saving…' : 'Save contact'}
        </Button>
        <Button size="small" disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  );
}
