import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  MessageCircle,
  Smartphone,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { inquiryCreditsApi } from '@/shared/api/inquiryCreditsApi';
import { getErrorMessage } from '@/shared/api/errors';
import { filesApi } from '@/shared/api/filesApi';
import { openAcomiAndroidApp } from '@/shared/utils/openAcomiAndroidApp';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { colors } from '@/shared/theme/colors';
import type { InquiryPackage, InquiryPaymentConfig } from '@/shared/types/inquiryCredits';

function waLink(
  number: string | null | undefined,
  message?: string | null,
): string | null {
  if (!number) return null;
  const digits = number.replace(/\D/g, '');
  if (!digits) return null;
  const full = digits.startsWith('91') && digits.length === 12 ? digits : `91${digits}`;
  const base = `https://wa.me/${full}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }
  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy'}>
      <IconButton size="small" onClick={() => void handleCopy()} sx={{ ml: 0.5, p: 0.5 }}>
        {copied ? <CheckCircle2 size={15} color={colors.success} /> : <Copy size={15} />}
      </IconButton>
    </Tooltip>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
};

type View = 'main' | 'buy';

export function InquiryLimitDialog({ open, onClose }: Props) {
  const [view, setView] = useState<View>('main');
  const [config, setConfig] = useState<InquiryPaymentConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<InquiryPackage | null>(null);
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setView('main');
      setSelectedPkg(null);
      setUtr('');
      setSubmitting(false);
      setSubmitError(null);
      setSubmitted(false);
      submittingRef.current = false;
      return;
    }
    setConfigLoading(true);
    inquiryCreditsApi
      .getPaymentConfig()
      .then((cfg) => {
        setConfig(cfg);
        if (cfg.packages.length > 0) {
          setSelectedPkg(cfg.packages[0] ?? null);
        }
      })
      .catch(() => setConfig(null))
      .finally(() => setConfigLoading(false));
  }, [open]);

  useEffect(() => {
    if (config?.qrUrl) {
      setQrUrl(config.qrUrl);
      return;
    }
    if (!config?.qrFileId) {
      setQrUrl(null);
      return;
    }
    filesApi
      .getContentUrl(config.qrFileId)
      .then((r) => setQrUrl(r.contentUrl))
      .catch(() => setQrUrl(null));
  }, [config?.qrUrl, config?.qrFileId]);

  async function handleSubmitPurchase() {
    if (submittingRef.current || !selectedPkg || !utr.trim()) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await inquiryCreditsApi.createPurchase({
        packageId: selectedPkg.id,
        utr: utr.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Unable to submit request. Please try again.'));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const primaryPkg = selectedPkg ?? config?.packages[0] ?? null;
  const creditsLabel = primaryPkg
    ? `Get ${primaryPkg.credits} more enquiries`
    : 'Get 30 more enquiries';
  const priceLabel = primaryPkg ? `₹${primaryPkg.priceAmount}` : '₹9';
  const buyCtaLabel = primaryPkg
    ? `Get ${primaryPkg.credits} enquiries · ₹${primaryPkg.priceAmount}`
    : 'Get 30 enquiries · ₹9';

  if (submitted) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
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
          <Typography sx={{ mt: 2, fontWeight: 800, fontSize: 20 }}>Request submitted!</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: 14 }}>
            Credits will be added after payment verification.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button fullWidth onClick={onClose} sx={dashContainedButtonSx}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (view === 'buy' && config) {
    const waMessage = selectedPkg
      ? [
          'ACOMI Inquiry Credit Payment',
          `Package: ${selectedPkg.name} (${selectedPkg.credits} credits)`,
          `Amount: ₹${selectedPkg.priceAmount}`,
          utr.trim() ? `UTR: ${utr.trim()}` : null,
          'Please find payment screenshot attached.',
        ]
          .filter(Boolean)
          .join('\n')
      : null;
    const waUrl = waLink(config.whatsappNumber, waMessage);
    const canSubmit = Boolean(selectedPkg && utr.trim());

    return (
      <Dialog
        open={open}
        onClose={submitting ? undefined : onClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Get more enquiries</DialogTitle>
        <DialogContent dividers>
          {config.packages.length > 0 ? (
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                Select package
              </Typography>
              <Select
                fullWidth
                size="small"
                value={selectedPkg?.id ?? ''}
                onChange={(e) => {
                  const pkg = config.packages.find((p) => p.id === e.target.value);
                  setSelectedPkg(pkg ?? null);
                }}
                sx={{ mt: 1, borderRadius: '10px' }}
              >
                {config.packages.map((pkg) => (
                  <MenuItem key={pkg.id} value={pkg.id}>
                    {pkg.name} — {pkg.credits} credits · ₹{pkg.priceAmount}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          ) : null}

          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            Pay via UPI
          </Typography>

          {config.upiId ? (
            <Box
              sx={{
                mt: 1,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                bgcolor: colors.surfaceSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                px: 2,
                py: 1.25,
              }}
            >
              <Typography sx={{ fontWeight: 700, flex: 1, fontSize: 15 }}>{config.upiId}</Typography>
              <CopyButton text={config.upiId} />
            </Box>
          ) : null}

          {qrUrl ? (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Box
                component="img"
                src={qrUrl}
                alt="Payment QR code"
                sx={{ maxWidth: 200, borderRadius: 2, border: `1px solid ${colors.border}` }}
              />
            </Box>
          ) : null}

          {waUrl ? (
            <Box sx={{ mb: 2 }}>
              <Button
                component="a"
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<MessageCircle size={16} />}
                fullWidth
                variant="outlined"
                sx={{
                  ...dashOutlinedButtonSx,
                  borderColor: '#25D366',
                  color: '#25D366',
                  '&:hover': { bgcolor: '#F0FDF4', borderColor: '#25D366' },
                }}
              >
                Message us on WhatsApp
              </Button>
            </Box>
          ) : null}

          {config.instructions ? (
            <Box
              sx={{
                mb: 2,
                bgcolor: colors.infoTint,
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                px: 2,
                py: 1.5,
              }}
            >
              <Typography variant="body2" sx={{ color: colors.info, whiteSpace: 'pre-wrap' }}>
                {config.instructions}
              </Typography>
            </Box>
          ) : null}

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            Enter UTR / transaction reference
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. 406123456789"
            value={utr}
            disabled={submitting}
            onChange={(e) => setUtr(e.target.value)}
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          {submitError ? (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {submitError}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={submitting}
            onClick={() => {
              setView('main');
              setSubmitError(null);
            }}
            sx={dashOutlinedButtonSx}
          >
            Back
          </Button>
          <Button
            disabled={submitting || !canSubmit}
            onClick={() => void handleSubmitPurchase()}
            sx={dashContainedButtonSx}
          >
            {submitting ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
            Submit payment request
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogContent sx={{ pt: 3.5, pb: 1, textAlign: 'center' }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            mx: 'auto',
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: '#FEF2F2',
            color: '#DC2626',
          }}
        >
          <AlertCircle size={24} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: 20, lineHeight: 1.25 }}>
          Your 5 free enquiries are used
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75, fontSize: 14 }}>
          Choose how to continue.
        </Typography>

        <Box
          sx={{
            mt: 2.5,
            display: 'grid',
            gap: 1.25,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            textAlign: 'left',
          }}
        >
          <Button
            type="button"
            onClick={() => openAcomiAndroidApp()}
            sx={{
              display: 'block',
              p: 1.75,
              borderRadius: 3,
              border: `1px solid ${colors.primary}40`,
              bgcolor: colors.mintSubtle,
              color: colors.tealDark,
              textTransform: 'none',
              textAlign: 'left',
              '&:hover': { borderColor: colors.primary, bgcolor: colors.mintSubtle },
            }}
          >
            <Smartphone size={20} color={colors.primary} />
            <Typography sx={{ mt: 1, fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>
              Unlimited enquiries in ACOMI
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 12, color: 'text.secondary' }}>
              Free on Android
            </Typography>
            <Typography
              sx={{
                mt: 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: 12,
                fontWeight: 700,
                color: colors.primary,
              }}
            >
              Get the ACOMI App <ExternalLink size={12} />
            </Typography>
          </Button>

          <Button
            type="button"
            disabled={configLoading || !(config?.enabled && config.packages.length > 0)}
            onClick={() => setView('buy')}
            sx={{
              display: 'block',
              p: 1.75,
              borderRadius: 3,
              border: '1px solid #FECACA',
              bgcolor: '#FEF2F2',
              color: colors.tealDark,
              textTransform: 'none',
              textAlign: 'left',
              '&:hover': { borderColor: '#F87171', bgcolor: '#FEF2F2' },
            }}
          >
            <CreditCard size={20} color="#DC2626" />
            <Typography sx={{ mt: 1, fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>
              {creditsLabel}
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 12, color: 'text.secondary' }}>
              {priceLabel}
            </Typography>
            <Typography sx={{ mt: 1, fontSize: 12, fontWeight: 700, color: '#DC2626' }}>
              {configLoading ? 'Loading…' : buyCtaLabel}
            </Typography>
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button fullWidth onClick={onClose} sx={dashOutlinedButtonSx}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
