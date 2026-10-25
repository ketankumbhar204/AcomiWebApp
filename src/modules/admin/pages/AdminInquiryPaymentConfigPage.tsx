import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Copy, Eye, Image, Info, Lightbulb, Mail, Save, Trash2, Upload } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import { inquiryCreditsAdminApi } from '@/modules/admin/api/inquiryCreditsAdminApi';
import { FileImageViewer } from '@/shared/components/files/FileImageViewer';
import { getErrorMessage } from '@/shared/api/errors';
import {
  fetchDisplayableFileUrl,
  revokeDisplayableFileUrl,
  uploadLocalFile,
} from '@/shared/services/fileUploadService';
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

const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' },
} as const;

function FieldLabel({ children }: { children: string }) {
  return (
    <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.75, color: '#0F172A' }}>
      {children}
    </Typography>
  );
}

function InstantContactFields({
  enabled,
  onEnabledChange,
  dailyLimit,
  onDailyLimitChange,
}: {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  dailyLimit: number;
  onDailyLimitChange: (value: number) => void;
}) {
  return (
    <>
      <FormControlLabel
        sx={{ alignItems: 'flex-start', ml: 0 }}
        control={
          <Switch checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} />
        }
        label={
          <Box>
            <Typography sx={{ fontWeight: 700 }}>Free contact viewing</Typography>
            <Typography variant="caption" color="text.secondary">
              Shows the owner or vendor contact on the listing itself. This is separate from
              enquiries and from paid credits.
            </Typography>
          </Box>
        }
      />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { sm: 'flex-end' }, mt: 2 }}>
        <Box sx={{ width: { xs: '100%', sm: 220 }, flexShrink: 0 }}>
          <FieldLabel>Free instant contact views per day</FieldLabel>
          <TextField
            type="number"
            size="small"
            fullWidth
            disabled={!enabled}
            value={dailyLimit}
            onChange={(event) => {
              const next = event.target.value;
              if (next.trim() === '') {
                onDailyLimitChange(0);
                return;
              }
              const parsed = Number(next);
              if (!Number.isFinite(parsed)) return;
              onDailyLimitChange(Math.max(0, Math.trunc(parsed)));
            }}
            sx={fieldSx}
            slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' } }}
          />
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            gap: 1,
            alignItems: 'flex-start',
            bgcolor: '#F3F7FF',
            borderRadius: '10px',
            px: 1.5,
            py: 1.25,
          }}>
          <Typography variant="caption" color="text.secondary">
            Instant views shown on the listing. 0 hides the option. Enquiry delivery and credit
            packages below are unchanged.
          </Typography>
        </Box>
      </Stack>
    </>
  );
}

function PackageEditor({
  title,
  hint,
  footer,
  packages,
  onChange,
}: {
  title: string;
  hint: string;
  footer: string;
  packages: DraftPackage[];
  onChange: (key: string, field: keyof DraftPackage, value: string | number | boolean) => void;
}) {
  return (
    <Box
      sx={{
        mt: 2,
        p: 1.75,
        borderRadius: '12px',
        bgcolor: '#E8F8EF',
        border: '1px solid #D3F0E0',
      }}>
      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: 12.5 }}>
        {hint}
      </Typography>
      {packages.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          No package seeded for this channel yet. Run the latest backend migration.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {packages.map((pkg) => (
            <Box key={pkg._key}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                sx={{ alignItems: { xs: 'stretch', sm: 'flex-end' } }}>
                <Box sx={{ flex: 1.6, minWidth: 0 }}>
                  <FieldLabel>Package name</FieldLabel>
                  <TextField
                    size="small"
                    fullWidth
                    value={pkg.name}
                    onChange={(e) => onChange(pkg._key, 'name', e.target.value)}
                    sx={fieldSx}
                  />
                </Box>
                <Box sx={{ flex: 0.7, minWidth: 0 }}>
                  <FieldLabel>Credits</FieldLabel>
                  <TextField
                    type="number"
                    size="small"
                    fullWidth
                    value={pkg.credits}
                    onChange={(e) => onChange(pkg._key, 'credits', e.target.value)}
                    sx={fieldSx}
                    slotProps={{ htmlInput: { min: 1 } }}
                  />
                </Box>
                <Box sx={{ flex: 0.7, minWidth: 0 }}>
                  <FieldLabel>Price (₹)</FieldLabel>
                  <TextField
                    type="number"
                    size="small"
                    fullWidth
                    value={pkg.priceAmount}
                    onChange={(e) => onChange(pkg._key, 'priceAmount', e.target.value)}
                    sx={fieldSx}
                    slotProps={{ htmlInput: { min: 0 } }}
                  />
                </Box>
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
                  sx={{ flexShrink: 0, m: 0, mb: 0.5 }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: { sm: 'right' } }}>
                {footer}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export function AdminInquiryPaymentConfigPage() {
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  const [qrFileId, setQrFileId] = useState<string | null>(null);
  const [qrCleared, setQrCleared] = useState(false);
  const [resolvedQr, setResolvedQr] = useState<{ fileId: string; url: string | null } | null>(null);
  const [packages, setPackages] = useState<DraftPackage[]>([]);

  const [webFreeDailyLimit, setWebFreeDailyLimit] = useState(5);
  const [viewHereDailyLimit, setViewHereDailyLimit] = useState(5);
  const [webViewHereEnabled, setWebViewHereEnabled] = useState(true);
  const [androidViewHereEnabled, setAndroidViewHereEnabled] = useState(true);
  const [androidViewHereDailyLimit, setAndroidViewHereDailyLimit] = useState(5);
  const [androidBillingMode, setAndroidBillingMode] =
    useState<AndroidInquiryBillingMode>('FREE');
  const [androidFreeDailyLimit, setAndroidFreeDailyLimit] = useState(5);
  const [androidHourlyRateLimit, setAndroidHourlyRateLimit] = useState(20);

  const [qrUploading, setQrUploading] = useState(false);
  const [qrViewerOpen, setQrViewerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrObjectUrlRef = useRef<string | null>(null);

  function loadConfig() {
    setLoading(true);
    setLoadError(null);
    inquiryCreditsAdminApi
      .getPaymentConfig()
      .then((cfg) => {
        applyConfig(cfg);
        setLoaded(true);
      })
      .catch((err) => {
        setLoadError(getErrorMessage(err, 'Unable to load payment configuration.'));
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadConfig();
    // Initial fetch only. Retry uses loadConfig directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyConfig(cfg: InquiryPaymentConfig) {
    setEnabled(cfg.enabled);
    setUpiId(cfg.upiId ?? '');
    setWhatsappNumber(cfg.whatsappNumber ?? '');
    setInstructions(cfg.instructions ?? '');
    setQrFileId(cfg.qrFileId ?? null);
    setQrCleared(false);
    setPackages(cfg.packages.map(packageToDraft));
    setWebFreeDailyLimit(cfg.webFreeDailyLimit ?? 5);
    setViewHereDailyLimit(cfg.viewHereDailyLimit ?? 5);
    setWebViewHereEnabled(cfg.webViewHereEnabled !== false);
    setAndroidViewHereEnabled(cfg.androidViewHereEnabled !== false);
    setAndroidViewHereDailyLimit(cfg.androidViewHereDailyLimit ?? 5);
    setAndroidBillingMode(cfg.androidBillingMode ?? 'FREE');
    setAndroidFreeDailyLimit(cfg.androidFreeDailyLimit ?? 5);
    setAndroidHourlyRateLimit(cfg.androidHourlyRateLimit ?? 20);
  }

  useEffect(() => {
    if (!qrFileId) {
      revokeDisplayableFileUrl(qrObjectUrlRef.current);
      qrObjectUrlRef.current = null;
      return;
    }
    let cancelled = false;
    void fetchDisplayableFileUrl(qrFileId)
      .then((url) => {
        if (cancelled) {
          revokeDisplayableFileUrl(url);
          return;
        }
        revokeDisplayableFileUrl(qrObjectUrlRef.current);
        qrObjectUrlRef.current = url.startsWith('blob:') ? url : null;
        setResolvedQr({ fileId: qrFileId, url });
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedQr({ fileId: qrFileId, url: null });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [qrFileId]);

  const qrPreviewUrl = qrFileId && resolvedQr?.fileId === qrFileId ? resolvedQr.url : null;

  useEffect(() => {
    return () => {
      revokeDisplayableFileUrl(qrObjectUrlRef.current);
    };
  }, []);

  async function handleQrFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrUploading(true);
    try {
      const fileId = await uploadLocalFile(file, { purpose: 'INQUIRY_PAYMENT_QR' });
      setQrFileId(fileId);
      setQrCleared(false);
      await inquiryCreditsAdminApi.updatePaymentConfig({ qrFileId: fileId });
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
    if (saving || !loaded) return;
    setSaving(true);
    try {
      await inquiryCreditsAdminApi.updatePaymentConfig({
        enabled,
        upiId: upiId.trim() || null,
        whatsappNumber: whatsappNumber.trim() || null,
        qrFileId: qrFileId || null,
        clearQr: qrCleared && !qrFileId ? true : undefined,
        instructions: instructions.trim() || null,
        webFreeDailyLimit: Number(webFreeDailyLimit),
        viewHereDailyLimit: Math.max(0, Math.trunc(Number(viewHereDailyLimit) || 0)),
        webViewHereEnabled,
        androidViewHereEnabled,
        androidViewHereDailyLimit: Math.max(0, Math.trunc(Number(androidViewHereDailyLimit) || 0)),
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

  async function copyValue(value: string) {
    const text = value.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      enqueueSnackbar('Copied.', { variant: 'success' });
    } catch {
      enqueueSnackbar('Unable to copy.', { variant: 'error' });
    }
  }

  if (loading && !loaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError && !loaded) {
    return (
      <Box sx={{ py: 6, maxWidth: 480 }}>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>Unable to load payment configuration</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {loadError}
        </Typography>
        <Button variant="contained" onClick={loadConfig} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Retry
        </Button>
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

      <Stack spacing={2}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
            gap: 2,
          }}>
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #E6EAF0' }}>
            <CardContent>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <Switch
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  color="success"
                />
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Enable credit purchases</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    On: free daily limit then ₹9 / 30 UPI + WhatsApp screenshot flow. Off: no daily
                    limit and no paywall on web or mobile.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
          <Box
            sx={{
              borderRadius: '16px',
              bgcolor: '#E8F8EF',
              border: '1px solid #D3F0E0',
              p: 2,
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-start',
            }}>
            <Lightbulb size={18} color="#16A34A" />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 14 }}>How it works</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Add UPI, QR, and WhatsApp below. Users can purchase credits after using their free
                daily limit. Admin approves the request.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #E6EAF0' }}>
          <CardContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1.35fr 0.85fr' },
                gap: 3,
              }}>
              <Box>
                <Typography sx={{ fontWeight: 700 }}>Payment details</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Configure UPI and payment instructions for credit purchases.
                </Typography>
                <FieldLabel>UPI ID</FieldLabel>
                <TextField
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="yourupi@bank"
                  sx={fieldSx}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            aria-label="Copy UPI ID"
                            disabled={!upiId.trim()}
                            onClick={() => void copyValue(upiId)}>
                            <Copy size={16} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, mb: 2 }}>
                  Users will see this UPI ID to make payments.
                </Typography>
                <FieldLabel>WhatsApp number for payment screenshots</FieldLabel>
                <TextField
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="9198XXXXXXXX"
                  sx={fieldSx}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            aria-label="Copy WhatsApp number"
                            disabled={!whatsappNumber.trim()}
                            onClick={() => void copyValue(whatsappNumber)}>
                            <Copy size={16} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, mb: 2 }}>
                  Users will send the payment screenshot to this number. Include the country code,
                  for example 9198XXXXXXXX.
                </Typography>
                <FieldLabel>Payment instructions (shown to seekers)</FieldLabel>
                <TextField
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  placeholder="Transfer the amount to the UPI ID above, then enter your UTR below."
                  sx={fieldSx}
                />
                <Stack direction="row" sx={{ mt: 0.75, justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    These instructions will be visible to users on the payment screen.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {instructions.length}/500
                  </Typography>
                </Stack>
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Payment QR code</Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => void handleQrFileChange(e)}
                />
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 88,
                      height: 88,
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: qrPreviewUrl ? '#E6EAF0' : 'divider',
                      borderStyle: qrPreviewUrl ? 'solid' : 'dashed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      bgcolor: '#fff',
                      flexShrink: 0,
                    }}>
                    {qrPreviewUrl ? (
                      <Box
                        component="button"
                        type="button"
                        onClick={() => setQrViewerOpen(true)}
                        aria-label="Open payment QR"
                        sx={{
                          border: 0,
                          p: 0.5,
                          m: 0,
                          width: '100%',
                          height: '100%',
                          bgcolor: 'transparent',
                          cursor: 'zoom-in',
                          display: 'block',
                        }}>
                        <Box
                          component="img"
                          src={qrPreviewUrl}
                          alt="QR preview"
                          sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                        />
                      </Box>
                    ) : (
                      <Image size={28} color="#CBD5E1" />
                    )}
                  </Box>
                  <Stack spacing={1} sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      {qrFileId && qrPreviewUrl ? (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Eye size={14} />}
                          onClick={() => setQrViewerOpen(true)}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '10px',
                          }}>
                          View QR
                        </Button>
                      ) : null}
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={qrUploading ? <CircularProgress size={14} /> : <Upload size={14} />}
                        disabled={qrUploading}
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: '10px',
                          color: '#16A34A',
                          borderColor: '#86EFAC',
                        }}>
                        {qrUploading ? 'Uploading…' : qrPreviewUrl ? 'Replace QR' : 'Upload QR'}
                      </Button>
                      {qrFileId ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Trash2 size={14} />}
                          onClick={() => {
                            setQrFileId(null);
                            setQrCleared(true);
                            setQrViewerOpen(false);
                          }}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                          Remove
                        </Button>
                      ) : null}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {qrFileId
                        ? 'Supported formats: PNG or JPG. Max size: 5 MB.'
                        : 'No payment QR uploaded yet. Supported formats: PNG or JPG. Max size: 5 MB.'}
                    </Typography>
                  </Stack>
                </Stack>
                <Box
                  sx={{
                    mt: 2,
                    display: 'flex',
                    gap: 1,
                    alignItems: 'flex-start',
                    bgcolor: '#F3F7FF',
                    borderRadius: '10px',
                    px: 1.5,
                    py: 1.25,
                  }}>
                  <Info size={16} color="#3B82F6" />
                  <Typography variant="caption" color="text.secondary">
                    This QR code will be shown to users on the payment screen.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 2,
          }}>
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #E6EAF0' }}>
            <CardContent>
              <Typography sx={{ fontWeight: 700 }}>Email / Website / Web App</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Instant contact views and email enquiries use separate daily limits. Instant views
                do not use email enquiry credits.
              </Typography>
              <InstantContactFields
                enabled={webViewHereEnabled}
                onEnabledChange={setWebViewHereEnabled}
                dailyLimit={viewHereDailyLimit}
                onDailyLimitChange={setViewHereDailyLimit}
              />
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ alignItems: { sm: 'flex-end' }, mt: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: 220 }, flexShrink: 0 }}>
                  <FieldLabel>Free email enquiries per day</FieldLabel>
                  <TextField
                    type="number"
                    size="small"
                    fullWidth
                    value={webFreeDailyLimit}
                    onChange={(e) => setWebFreeDailyLimit(Number(e.target.value))}
                    sx={fieldSx}
                    slotProps={{ htmlInput: { min: 0 } }}
                  />
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    gap: 1,
                    alignItems: 'flex-start',
                    bgcolor: '#F3F7FF',
                    borderRadius: '10px',
                    px: 1.5,
                    py: 1.25,
                  }}>
                  <Mail size={16} color="#3B82F6" />
                  <Typography variant="caption" color="text.secondary">
                    After the free limit, users need to purchase enquiry credits using the package
                    below.
                  </Typography>
                </Box>
              </Stack>
              <PackageEditor
                title="Credit package — email / web"
                hint="Used when seekers enquire from the website (email delivery). Wallet credits are shared."
                footer="This package will be shown to users on web."
                packages={emailPackages}
                onChange={updatePkg}
              />
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #E6EAF0' }}>
            <CardContent>
              <Typography sx={{ fontWeight: 700 }}>Mobile App</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Instant contact views and mobile enquiries use separate daily limits. Instant views
                do not use mobile enquiry credits.
              </Typography>
              <InstantContactFields
                enabled={androidViewHereEnabled}
                onEnabledChange={setAndroidViewHereEnabled}
                dailyLimit={androidViewHereDailyLimit}
                onDailyLimitChange={setAndroidViewHereDailyLimit}
              />
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: 'stretch', mt: 2 }}>
                <FormControl size="small" sx={{ flex: 1.1, minWidth: 0 }}>
                  <FieldLabel>Billing mode</FieldLabel>
                  <Select
                    value={androidBillingMode}
                    onChange={(e) =>
                      setAndroidBillingMode(e.target.value as AndroidInquiryBillingMode)
                    }
                    sx={{ borderRadius: '10px', bgcolor: '#fff' }}>
                    <MenuItem value="FREE">Free (rate limit only)</MenuItem>
                    <MenuItem value="CREDITS">Credits (after free quota)</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <FieldLabel>Free mobile enquiries per day</FieldLabel>
                  <TextField
                    type="number"
                    size="small"
                    fullWidth
                    disabled={androidBillingMode === 'FREE'}
                    value={androidFreeDailyLimit}
                    onChange={(e) => setAndroidFreeDailyLimit(Number(e.target.value))}
                    sx={fieldSx}
                    slotProps={{ htmlInput: { min: 0 } }}
                  />
                </Box>
                <Box sx={{ flex: 0.8, minWidth: 0 }}>
                  <FieldLabel>Hourly rate limit</FieldLabel>
                  <TextField
                    type="number"
                    size="small"
                    fullWidth
                    value={androidHourlyRateLimit}
                    onChange={(e) => setAndroidHourlyRateLimit(Number(e.target.value))}
                    sx={fieldSx}
                    slotProps={{ htmlInput: { min: 1 } }}
                  />
                </Box>
              </Stack>
              {androidBillingMode === 'FREE' ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                  The free enquiry count is only used when billing mode is Credits. The hourly rate
                  limit still applies.
                </Typography>
              ) : null}
              <PackageEditor
                title="Credit package — mobile app"
                hint="Shown on Android when billing mode is Credits and purchases are enabled. Creating new packages is not supported yet."
                footer="This package will be shown to users in the mobile app."
                packages={mobilePackages}
                onChange={updatePkg}
              />
            </CardContent>
          </Card>
        </Box>
      </Stack>
      <FileImageViewer
        open={qrViewerOpen}
        onClose={() => setQrViewerOpen(false)}
        fileId={qrFileId}
        imageUrl={qrPreviewUrl}
        title="Payment QR code"
        downloadFilename="payment-qr.png"
      />
    </Box>
  );
}
