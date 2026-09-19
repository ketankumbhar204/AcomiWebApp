import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
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
import type {
  AndroidInquiryBillingMode,
  InquiryClientChannel,
  InquiryPackage,
  InquiryPaymentConfig,
} from '@/shared/types/inquiryCredits';

type DraftPackage = {
  _key: string;
  id: string;
  name: string;
  credits: number;
  priceAmount: number;
  enabled: boolean;
  clientChannel: InquiryClientChannel;
};

function packageToDraft(pkg: InquiryPackage): DraftPackage {
  return {
    _key: pkg.id,
    id: pkg.id,
    name: pkg.name,
    credits: pkg.credits,
    priceAmount: pkg.priceAmount,
    enabled: pkg.enabled,
    clientChannel: pkg.clientChannel ?? 'WEB',
  };
}

function PackageEditor({
  title,
  hint,
  packages,
  onChange,
}: {
  title: string;
  hint: string;
  packages: DraftPackage[];
  onChange: (key: string, field: keyof DraftPackage, value: string | number | boolean) => void;
}) {
  return (
    <Card elevation={0} sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {hint}
        </Typography>
        {packages.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No package seeded for this channel yet. Run the latest backend migration.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {packages.map((pkg) => (
              <Stack
                key={pkg._key}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
                <TextField
                  label="Name"
                  size="small"
                  value={pkg.name}
                  onChange={(e) => onChange(pkg._key, 'name', e.target.value)}
                  sx={{ flex: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
                <TextField
                  label="Credits"
                  type="number"
                  size="small"
                  value={pkg.credits}
                  onChange={(e) => onChange(pkg._key, 'credits', e.target.value)}
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
                <TextField
                  label="Price (₹)"
                  type="number"
                  size="small"
                  value={pkg.priceAmount}
                  onChange={(e) => onChange(pkg._key, 'priceAmount', e.target.value)}
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={pkg.enabled}
                      onChange={(e) => onChange(pkg._key, 'enabled', e.target.checked)}
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
  );
}

export function AdminInquiryPaymentConfigPage() {
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  const [qrFileId, setQrFileId] = useState<string | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [packages, setPackages] = useState<DraftPackage[]>([]);

  const [webFreeDailyLimit, setWebFreeDailyLimit] = useState(5);
  const [androidBillingMode, setAndroidBillingMode] =
    useState<AndroidInquiryBillingMode>('FREE');
  const [androidFreeDailyLimit, setAndroidFreeDailyLimit] = useState(5);
  const [androidHourlyRateLimit, setAndroidHourlyRateLimit] = useState(20);

  const [qrUploading, setQrUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inquiryCreditsAdminApi
      .getPaymentConfig()
      .then((cfg) => applyConfig(cfg))
      .catch(() => {
        /* first-time blank */
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
    setWebFreeDailyLimit(cfg.webFreeDailyLimit ?? 5);
    setAndroidBillingMode(cfg.androidBillingMode ?? 'FREE');
    setAndroidFreeDailyLimit(cfg.androidFreeDailyLimit ?? 5);
    setAndroidHourlyRateLimit(cfg.androidHourlyRateLimit ?? 20);
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

  function updatePkg(key: string, field: keyof DraftPackage, value: string | number | boolean) {
    setPackages((prev) => prev.map((p) => (p._key === key ? { ...p, [field]: value } : p)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await inquiryCreditsAdminApi.updatePaymentConfig({
        enabled,
        upiId: upiId.trim() || null,
        whatsappNumber: whatsappNumber.trim() || null,
        qrFileId: qrFileId || null,
        instructions: instructions.trim() || null,
        webFreeDailyLimit: Number(webFreeDailyLimit),
        androidBillingMode,
        androidFreeDailyLimit: Number(androidFreeDailyLimit),
        androidHourlyRateLimit: Number(androidHourlyRateLimit),
      });

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const emailPackages = packages.filter((p) => p.clientChannel === 'WEB');
  const mobilePackages = packages.filter((p) => p.clientChannel === 'ANDROID');

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 24, md: 28 }, letterSpacing: -0.5 }}>
            Inquiry credits — payment config
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
            Configure payment details and separate credit packages for email/web vs mobile app
            enquiries.
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
          }}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Stack>

      <Stack spacing={2.5}>
        <Card elevation={0} sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
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
                    Master switch for UPI purchase flow. Mobile purchases also require Android billing
                    mode = Credits.
                  </Typography>
                </Box>
              }
            />
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
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

        <Card elevation={0} sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
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
                }}>
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
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                  {qrUploading ? 'Uploading…' : qrPreviewUrl ? 'Replace QR' : 'Upload QR'}
                </Button>
                {qrFileId ? (
                  <Tooltip title="Remove QR image">
                    <Button
                      size="small"
                      startIcon={<Trash2 size={14} />}
                      color="error"
                      onClick={() => {
                        setQrFileId(null);
                        setQrPreviewUrl(null);
                      }}
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}>
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

        <Card elevation={0} sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
              Email / web enquiry access
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Seekers on web (email contact path) get this many free enquiries per day, then use paid
              credits from the email package below.
            </Typography>
            <TextField
              label="Free email enquiries per day"
              type="number"
              size="small"
              value={webFreeDailyLimit}
              onChange={(e) => setWebFreeDailyLimit(Number(e.target.value))}
              sx={{ maxWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </CardContent>
        </Card>

        <PackageEditor
          title="Credit package — email / web"
          hint="Used when seekers enquire from the website (email delivery). Wallet credits are shared."
          packages={emailPackages}
          onChange={updatePkg}
        />

        <Card elevation={0} sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Mobile app enquiry access</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Controls whether in-app enquiries stay free or consume credits after a daily free
              allowance.
            </Typography>
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: 'flex-start' }}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="android-billing-mode">Billing mode</InputLabel>
                <Select
                  labelId="android-billing-mode"
                  label="Billing mode"
                  value={androidBillingMode}
                  onChange={(e) =>
                    setAndroidBillingMode(e.target.value as AndroidInquiryBillingMode)
                  }
                  sx={{ borderRadius: '10px' }}>
                  <MenuItem value="FREE">Free (rate limit only)</MenuItem>
                  <MenuItem value="CREDITS">Credits (after free quota)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Free mobile enquiries per day"
                type="number"
                size="small"
                disabled={androidBillingMode === 'FREE'}
                value={androidFreeDailyLimit}
                onChange={(e) => setAndroidFreeDailyLimit(Number(e.target.value))}
                sx={{ maxWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                slotProps={{ htmlInput: { min: 0 } }}
                helperText={
                  androidBillingMode === 'FREE'
                    ? 'Only used when billing mode is Credits'
                    : undefined
                }
              />
              <TextField
                label="Hourly rate limit"
                type="number"
                size="small"
                value={androidHourlyRateLimit}
                onChange={(e) => setAndroidHourlyRateLimit(Number(e.target.value))}
                sx={{ maxWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </Stack>
          </CardContent>
        </Card>

        <PackageEditor
          title="Credit package — mobile app"
          hint="Shown on Android when billing mode is Credits and purchases are enabled. Creating new packages is not supported yet."
          packages={mobilePackages}
          onChange={updatePkg}
        />
      </Stack>
    </Box>
  );
}
