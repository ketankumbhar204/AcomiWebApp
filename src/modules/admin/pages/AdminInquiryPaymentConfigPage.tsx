import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Image, Save, Trash2, Upload } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import { inquiryCreditsAdminApi } from '@/modules/admin/api/inquiryCreditsAdminApi';
import { filesApi } from '@/shared/api/filesApi';
import { getErrorMessage } from '@/shared/api/errors';
import { uploadLocalFile } from '@/shared/services/fileUploadService';
import type { InquiryPackage, InquiryPaymentConfig } from '@/shared/types/inquiryCredits';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

type DraftPackage = {
  _key: string;
  id: string;
  name: string;
  credits: number;
  priceAmount: number;
  enabled: boolean;
};

function packageToDraft(pkg: InquiryPackage): DraftPackage {
  return {
    _key: pkg.id,
    id: pkg.id,
    name: pkg.name,
    credits: pkg.credits,
    priceAmount: pkg.priceAmount,
    enabled: pkg.enabled,
  };
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function AdminInquiryPaymentConfigPage() {
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  const [qrFileId, setQrFileId] = useState<string | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [packages, setPackages] = useState<DraftPackage[]>([]);

  // QR upload
  const [qrUploading, setQrUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load config ──────────────────────────────────────────────
  useEffect(() => {
    inquiryCreditsAdminApi
      .getPaymentConfig()
      .then((cfg) => applyConfig(cfg))
      .catch(() => {
        // First-time: config may not exist yet — start blank
      })
      .finally(() => setLoading(false));
  }, []);

  function applyConfig(cfg: InquiryPaymentConfig) {
    setEnabled(cfg.enabled);
    setUpiId(cfg.upiId ?? '');
    setWhatsappNumber(cfg.whatsappNumber ?? '');
    setInstructions(cfg.instructions ?? '');
    setQrFileId(cfg.qrFileId ?? null);
    setPackages(cfg.packages.map(packageToDraft));
    if (cfg.qrUrl) {
      setQrPreviewUrl(cfg.qrUrl);
      return;
    }
    if (cfg.qrFileId) {
      filesApi
        .getContentUrl(cfg.qrFileId)
        .then((r) => setQrPreviewUrl(r.contentUrl))
        .catch(() => setQrPreviewUrl(null));
    } else {
      setQrPreviewUrl(null);
    }
  }

  // ── QR upload ────────────────────────────────────────────────
  async function handleQrFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrUploading(true);
    try {
      const fileId = await uploadLocalFile(file, { purpose: 'INQUIRY_PAYMENT_QR' });
      setQrFileId(fileId);
      const { contentUrl } = await filesApi.getContentUrl(fileId);
      setQrPreviewUrl(contentUrl);
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'QR upload failed. Please try again.'), {
        variant: 'error',
      });
    } finally {
      setQrUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ── Package helpers ──────────────────────────────────────────
  function updatePkg(key: string, field: keyof DraftPackage, value: string | number | boolean) {
    setPackages((prev) =>
      prev.map((p) => (p._key === key ? { ...p, [field]: value } : p)),
    );
  }

  // ── Save ─────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      await inquiryCreditsAdminApi.updatePaymentConfig({
        enabled,
        upiId: upiId.trim() || null,
        whatsappNumber: whatsappNumber.trim() || null,
        qrFileId: qrFileId || null,
        instructions: instructions.trim() || null,
      });

      // MVP: only update existing seeded packages (no create endpoint)
      await Promise.all(
        packages.map((pkg) =>
          inquiryCreditsAdminApi.updatePackage(pkg.id, {
            name: pkg.name,
            credits: Number(pkg.credits),
            priceAmount: Number(pkg.priceAmount),
            enabled: pkg.enabled,
          }),
        ),
      );

      const cfg = await inquiryCreditsAdminApi.getPaymentConfig();
      applyConfig(cfg);
      enqueueSnackbar('Payment configuration saved.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Failed to save configuration.'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  // ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 24, md: 28 }, letterSpacing: -0.5 }}>
            Inquiry credits — payment config
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
            Configure UPI / QR / WhatsApp and credit packages for seekers.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Save size={16} />}
          disabled={saving}
          onClick={() => void handleSave()}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: '#22C55E',
            borderRadius: '10px',
            px: 2.5,
            alignSelf: { xs: 'stretch', sm: 'center' },
            '&:hover': { bgcolor: '#16A34A' },
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Stack>

      <Stack spacing={2.5}>
        {/* Enabled toggle */}
        <Card
          elevation={0}
          sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}
        >
          <CardContent>
            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Enable credit purchases</Typography>
                  <Typography variant="body2" color="text.secondary">
                    When off, seekers cannot see the buy-credits option.
                  </Typography>
                </Box>
              }
            />
          </CardContent>
        </Card>

        {/* UPI & WhatsApp */}
        <Card
          elevation={0}
          sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}
        >
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 2 }}>Payment details</Typography>
            <Stack spacing={2}>
              <TextField
                label="UPI ID"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                fullWidth
                placeholder="yourupi@bank"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <TextField
                label="WhatsApp number (digits only, without +91)"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                fullWidth
                placeholder="9876543210"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <TextField
                label="Instructions (shown to seekers)"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                placeholder="Transfer the amount to the UPI ID above, then enter your UTR below."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* QR code upload */}
        <Card
          elevation={0}
          sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}
        >
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 2 }}>Payment QR code</Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => void handleQrFileChange(e)}
            />
            <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
              <Box
                sx={{
                  width: 140,
                  height: 140,
                  borderRadius: 2,
                  border: '1.5px dashed',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  bgcolor: '#FAFBFC',
                  flexShrink: 0,
                }}
              >
                {qrPreviewUrl ? (
                  <Box
                    component="img"
                    src={qrPreviewUrl}
                    alt="QR preview"
                    sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <Image size={36} color="#CBD5E1" />
                )}
              </Box>
              <Stack spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={qrUploading ? <CircularProgress size={14} /> : <Upload size={14} />}
                  disabled={qrUploading}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}
                >
                  {qrUploading ? 'Uploading…' : qrPreviewUrl ? 'Replace QR' : 'Upload QR'}
                </Button>
                {qrFileId ? (
                  <Tooltip title="Remove QR image">
                    <Button
                      size="small"
                      startIcon={<Trash2 size={14} />}
                      color="error"
                      onClick={() => { setQrFileId(null); setQrPreviewUrl(null); }}
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}
                    >
                      Remove
                    </Button>
                  </Tooltip>
                ) : null}
                <Typography variant="caption" color="text.secondary">
                  PNG or JPG, max 5 MB.
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Packages */}
        <Card
          elevation={0}
          sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}
        >
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 2 }}>Credit packages</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Edit the seeded package(s). Creating new packages is not supported yet.
            </Typography>

            {packages.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No packages found. Seed at least one package on the backend.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {packages.map((pkg) => (
                  <Stack
                    key={pkg._key}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.25}
                    sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
                  >
                    <TextField
                      label="Name"
                      size="small"
                      value={pkg.name}
                      onChange={(e) => updatePkg(pkg._key, 'name', e.target.value)}
                      sx={{ flex: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <TextField
                      label="Credits"
                      type="number"
                      size="small"
                      value={pkg.credits}
                      onChange={(e) => updatePkg(pkg._key, 'credits', e.target.value)}
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      slotProps={{ htmlInput: { min: 1 } }}
                    />
                    <TextField
                      label="Price (₹)"
                      type="number"
                      size="small"
                      value={pkg.priceAmount}
                      onChange={(e) => updatePkg(pkg._key, 'priceAmount', e.target.value)}
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      slotProps={{ htmlInput: { min: 0 } }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={pkg.enabled}
                          onChange={(e) => updatePkg(pkg._key, 'enabled', e.target.checked)}
                          color="success"
                          size="small"
                        />
                      }
                      label="Enabled"
                      sx={{ flexShrink: 0, m: 0 }}
                    />
                  </Stack>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
