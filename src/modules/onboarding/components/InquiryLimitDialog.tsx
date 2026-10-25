import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  CreditCard,
  Headset,
  Image as ImageIcon,
  Mail,
  Map,
  MessageCircle,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { inquiryCreditsApi } from '@/shared/api/inquiryCreditsApi';
import { getErrorMessage } from '@/shared/api/errors';
import { FileImageViewer } from '@/shared/components/files/FileImageViewer';
import {
  fetchDisplayableFileUrl,
  isApiFileContentUrl,
  revokeDisplayableFileUrl,
} from '@/shared/services/fileUploadService';
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
    <>
      <Tooltip title={copied ? 'Copied' : 'Copy'}>
        <IconButton
          size="small"
          onClick={() => void handleCopy()}
          aria-label={copied ? 'Copied' : 'Copy UPI ID'}
          sx={{ ml: 0.5, p: 0.5 }}
        >
          {copied ? <CheckCircle2 size={15} color={colors.success} /> : <Copy size={15} />}
        </IconButton>
      </Tooltip>
      {copied ? (
        <Typography component="span" sx={{ fontSize: 11, fontWeight: 700, color: colors.primary }}>
          Copied
        </Typography>
      ) : null}
    </>
  );
}

function AndroidMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="#3DDC84"
        d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.43 11.43 0 00-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48A10.81 10.81 0 002 18h20a10.81 10.81 0 00-4.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"
      />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path fill="currentColor" d="M8 5.2v13.6l11-6.8L8 5.2z" />
    </svg>
  );
}

function ChoiceCard({
  selected,
  onSelect,
  icon,
  title,
  body,
  badge,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  body: string;
  badge?: string;
}) {
  return (
    <Box
      component="button"
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.25,
        width: '100%',
        p: 1.5,
        borderRadius: '16px',
        border: '1px solid',
        borderColor: selected ? colors.primary : 'rgba(0,0,0,0.1)',
        bgcolor: selected ? '#F3FBF7' : '#fff',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <Box
        aria-hidden
        sx={{
          mt: 0.4,
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '1px solid',
          borderColor: selected ? colors.primary : 'rgba(0,0,0,0.2)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        {selected ? (
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.primary }} />
        ) : null}
      </Box>
      <Box sx={{ mt: 0.15, flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{title}</Typography>
          {badge ? (
            <Box
              component="span"
              sx={{
                flexShrink: 0,
                borderRadius: '999px',
                bgcolor: '#D8F3E4',
                color: '#0F6B4C',
                px: 1,
                py: 0.25,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {badge}
            </Box>
          ) : null}
        </Box>
        <Typography sx={{ mt: 0.25, fontSize: 12, color: 'text.secondary' }}>{body}</Typography>
      </Box>
    </Box>
  );
}

type PayPurpose = 'enquiry' | 'map' | 'photos';

type Props = {
  open: boolean;
  onClose: () => void;
  onQuotaReset?: () => void;
  availableCredits?: number;
  onContinueWithCredits?: () => void;
  /** Fires when an admin confirms the purchase started from this dialog. */
  onPaymentConfirmed?: () => void;
  /** Fires when the seeker submits a payment request. */
  onPurchaseSubmitted?: (purchaseId: string) => void;
  /** Why the popup opened. Enquiry keeps the existing copy. */
  purpose?: PayPurpose;
  freeUsedToday?: number;
};

type View = 'main' | 'buy';

export function InquiryLimitDialog({
  open,
  onClose,
  onQuotaReset,
  availableCredits = 0,
  onContinueWithCredits,
  onPaymentConfirmed,
  onPurchaseSubmitted,
  purpose = 'enquiry',
}: Props) {
  const { t } = useTranslation();
  const narrow = useMediaQuery('(max-width:767px)');
  const [phoneBrowser] = useState(
    () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
  );
  const mobileBrowser = narrow || phoneBrowser;
  const [view, setView] = useState<View>('main');
  const [choice, setChoice] = useState<'credits' | 'app'>(() =>
    typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      ? 'app'
      : 'credits',
  );
  const [config, setConfig] = useState<InquiryPaymentConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  const [qrViewerOpen, setQrViewerOpen] = useState(false);
  const qrObjectUrlRef = useRef<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<InquiryPackage | null>(null);
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pendingPurchaseId, setPendingPurchaseId] = useState<string | null>(null);
  const [purchaseRejected, setPurchaseRejected] = useState(false);
  const submittingRef = useRef(false);
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setView('main');
      setChoice(mobileBrowser ? 'app' : 'credits');
      setSelectedPkg(null);
      setUtr('');
      setSubmitting(false);
      setSubmitError(null);
      setSubmitted(false);
      setPendingPurchaseId(null);
      setPurchaseRejected(false);
      setConfigError(false);
      submittingRef.current = false;
      confirmedRef.current = false;
      return;
    }
    setView('main');
    setConfigLoading(true);
    setConfigError(false);
    inquiryCreditsApi
      .getPaymentConfig()
      .then((cfg) => {
        setConfig(cfg);
        if (cfg.packages.length > 0) {
          setSelectedPkg(cfg.packages[0] ?? null);
        }
      })
      .catch(() => {
        setConfig(null);
        setConfigError(true);
      })
      .finally(() => setConfigLoading(false));
  }, [open, mobileBrowser]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (config?.qrFileId) {
        setQrFailed(false);
        try {
          const url = await fetchDisplayableFileUrl(config.qrFileId);
          if (cancelled) {
            revokeDisplayableFileUrl(url);
            return;
          }
          revokeDisplayableFileUrl(qrObjectUrlRef.current);
          qrObjectUrlRef.current = url.startsWith('blob:') ? url : null;
          setQrUrl(url);
        } catch {
          if (!cancelled) {
            setQrUrl(null);
            setQrFailed(true);
          }
        }
        return;
      }
      revokeDisplayableFileUrl(qrObjectUrlRef.current);
      qrObjectUrlRef.current = null;
      setQrFailed(false);
      if (config?.qrUrl && !isApiFileContentUrl(config.qrUrl)) {
        setQrUrl(config.qrUrl);
        return;
      }
      setQrUrl(null);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [config?.qrUrl, config?.qrFileId]);

  useEffect(() => {
    if (!open || !submitted || !pendingPurchaseId || purpose === 'enquiry' || !onPaymentConfirmed) {
      return undefined;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const rows = await inquiryCreditsApi.listMyPurchases();
        const row = rows.find((item) => item.id === pendingPurchaseId);
        if (cancelled || !row || confirmedRef.current) return;
        if (row.status === 'APPROVED') {
          confirmedRef.current = true;
          onPaymentConfirmed();
          return;
        }
        if (row.status === 'REJECTED') setPurchaseRejected(true);
      } catch {
        // Keep the request pending until the next check.
      }
    };
    void check();
    const timer = window.setInterval(() => void check(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [onPaymentConfirmed, open, pendingPurchaseId, purpose, submitted]);

  useEffect(() => {
    return () => {
      revokeDisplayableFileUrl(qrObjectUrlRef.current);
    };
  }, []);

  async function handleSubmitPurchase() {
    if (submittingRef.current || !selectedPkg) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const purchase = await inquiryCreditsApi.createPurchase({
        packageId: selectedPkg.id,
        utr: utr.trim() || undefined,
      });
      setPendingPurchaseId(purchase.id);
      setPurchaseRejected(false);
      setSubmitted(true);
      if (purpose !== 'enquiry') onPurchaseSubmitted?.(purchase.id);
    } catch (err) {
      setSubmitError(
        getErrorMessage(err, t('spaces.findPlace.enquire.limitPaymentSubmitError')),
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const primaryPkg = selectedPkg ?? config?.packages[0] ?? null;

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
          <Typography sx={{ mt: 2, fontWeight: 800, fontSize: 20 }}>
            {purchaseRejected
              ? t('spaces.findPlace.enquire.limitPayRejectedTitle', {
                  defaultValue: 'Payment was not confirmed',
                })
              : t('spaces.findPlace.enquire.limitPaySuccessTitle', {
                  defaultValue: 'Payment request submitted',
                })}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: 14 }}>
            {purchaseRejected
              ? t('spaces.findPlace.enquire.limitPayRejectedBody', {
                  defaultValue: 'This payment was not confirmed, so the map and photo request stay closed.',
                })
              : purpose === 'map'
                ? t('spaces.findPlace.enquire.limitMapPendingBody', {
                    defaultValue:
                      'The map stays closed until an admin confirms this payment. It will open as soon as the payment is confirmed.',
                  })
                : purpose === 'photos'
                  ? t('spaces.findPlace.enquire.limitPhotosPendingBody', {
                      defaultValue:
                        'Photo requests stay closed until an admin confirms this payment. You can continue as soon as the payment is confirmed.',
                    })
                  : t('spaces.findPlace.enquire.limitPaySuccessBody', {
                      defaultValue: 'Your enquiry credits will be added after approval.',
                    })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button fullWidth onClick={onClose} sx={dashContainedButtonSx}>
            {t('spaces.findPlace.enquire.limitDismiss')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (view === 'buy' && config) {
    const priceLabel = selectedPkg ? `₹${Number(selectedPkg.priceAmount)}` : '';
    const upiId = config.upiId?.trim() ?? '';
    const instructions = /e2e local payment instructions/i.test(config.instructions?.trim() ?? '')
      ? ''
      : (config.instructions?.trim() ?? '');
    const hasQr = Boolean(qrUrl);
    const hasUpi = upiId.length > 0;
    const qrPending = Boolean(config.qrFileId) && !hasQr && !qrFailed;
    const canPay = Boolean(selectedPkg) && (hasQr || hasUpi || qrPending);
    const waUrl = selectedPkg
      ? waLink(
          config.whatsappNumber,
          `Hi, I paid ${priceLabel} for ${selectedPkg.credits} enquiry credits on ACOMI. Sharing the payment screenshot.`,
        )
      : null;

    const helpHref = waLink(
      config.whatsappNumber,
      t('spaces.findPlace.enquire.limitHelpText', {
        defaultValue: 'Hi, I need help with ACOMI enquiry credits.',
      }),
    );

    return (
      <Dialog
        open={open}
        onClose={submitting ? undefined : onClose}
        fullWidth
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              m: { xs: 0, sm: 2 },
              width: { xs: '100%', sm: 480 },
              maxWidth: { xs: '100%', sm: 480 },
              maxHeight: { xs: '100dvh', sm: '90vh' },
              borderRadius: { xs: '16px 16px 0 0', sm: '20px' },
              alignSelf: { xs: 'flex-end', sm: 'center' },
            },
          },
        }}
      >
        <DialogContent sx={{ px: 2.5, pt: 3, pb: 2.5, textAlign: 'center' }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              mx: 'auto',
              mb: 1.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: '#E7F6EE',
              color: colors.primary,
            }}
          >
            <CreditCard size={20} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 22, lineHeight: 1.25 }}>
            {selectedPkg
              ? t('spaces.findPlace.enquire.limitPayTitle', {
                  count: selectedPkg.credits,
                  defaultValue: 'Get {{count}} enquiry credits',
                })
              : t('spaces.findPlace.enquire.limitPayUnavailableBoth', {
                  defaultValue: 'Payment details are currently unavailable. Please try again later.',
                })}
          </Typography>
          {selectedPkg ? (
            <Typography color="text.secondary" sx={{ mt: 0.75, fontSize: 14 }}>
              {purpose === 'map'
                ? t('spaces.findPlace.enquire.limitMapPaySubtitle', {
                    amount: priceLabel,
                    defaultValue: 'Pay {{amount}}. After the payment is confirmed, you can continue to Google Maps.',
                  })
                : purpose === 'photos'
                  ? t('spaces.findPlace.enquire.limitPhotosPaySubtitle', {
                      amount: priceLabel,
                      defaultValue:
                        'Pay {{amount}}. After the payment is confirmed, you can continue requesting photos.',
                    })
                  : t('spaces.findPlace.enquire.limitPaySubtitle', {
                      count: selectedPkg.credits,
                      amount: priceLabel,
                      defaultValue:
                        'Pay {{amount}} to get {{count}} more email enquiries and continue contacting properties.',
                    })}
            </Typography>
          ) : null}

          {canPay && selectedPkg ? (
            <Box sx={{ mt: 2, borderRadius: '16px', bgcolor: '#E7F6EE', p: 1.75, textAlign: 'left' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: colors.primary }}>
                  {t('spaces.findPlace.enquire.limitPayUsingUpi', { defaultValue: 'Pay using UPI' })}
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: colors.primary }}>
                  {t('spaces.findPlace.enquire.limitPayAmount', {
                    amount: priceLabel,
                    defaultValue: 'Amount: {{amount}}',
                  })}
                </Typography>
              </Box>
              {instructions ? (
                <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary' }}>{instructions}</Typography>
              ) : null}
              <Box
                sx={{
                  mt: 1.5,
                  display: 'grid',
                  gap: 1.5,
                  alignItems: 'center',
                  gridTemplateColumns:
                    !mobileBrowser && hasQr && hasUpi ? 'minmax(0,1fr) auto minmax(0,1.1fr)' : '1fr',
                }}
              >
                {hasQr ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'inline-flex', bgcolor: '#fff', borderRadius: '12px', p: 1 }}>
                      <Box
                        component="button"
                        type="button"
                        onClick={() => setQrViewerOpen(true)}
                        aria-label={t('spaces.findPlace.enquire.limitQrAlt', { defaultValue: 'UPI QR code' })}
                        sx={{ border: 0, p: 0, bgcolor: 'transparent', cursor: 'zoom-in', display: 'block' }}
                      >
                        <Box
                          component="img"
                          src={qrUrl ?? undefined}
                          alt={t('spaces.findPlace.enquire.limitQrAlt', { defaultValue: 'UPI QR code' })}
                          sx={{ width: mobileBrowser ? 180 : 200, height: mobileBrowser ? 180 : 200, objectFit: 'contain', display: 'block' }}
                        />
                      </Box>
                    </Box>
                    <Typography sx={{ mt: 1, fontSize: 12, color: 'text.secondary' }}>
                      {t('spaces.findPlace.enquire.limitPayScan', {
                        defaultValue:
                          'Scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.).',
                      })}
                    </Typography>
                  </Box>
                ) : qrPending ? (
                  <Box
                    sx={{
                      mx: 'auto',
                      width: mobileBrowser ? 180 : 200,
                      height: mobileBrowser ? 180 : 200,
                      borderRadius: '12px',
                      bgcolor: '#fff',
                    }}
                  />
                ) : (
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'center' }}>
                    {t('spaces.findPlace.enquire.limitPayQrUnavailable', {
                      defaultValue: 'QR payment is currently unavailable.',
                    })}
                  </Typography>
                )}
                {hasQr && hasUpi ? (
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>
                    OR
                  </Typography>
                ) : null}
                <Box>
                  {hasUpi ? (
                    <>
                      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                        {t('spaces.findPlace.enquire.limitPayUpiLabel', { defaultValue: 'UPI ID' })}
                      </Typography>
                      <Box
                        sx={{
                          mt: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          bgcolor: '#fff',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '12px',
                          px: 1.5,
                          py: 1,
                        }}
                      >
                        <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 13, wordBreak: 'break-all' }}>
                          {upiId}
                        </Typography>
                        <CopyButton text={upiId} />
                      </Box>
                    </>
                  ) : (
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                      {t('spaces.findPlace.enquire.limitPayUpiUnavailable', {
                        defaultValue: 'UPI payment details are currently unavailable.',
                      })}
                    </Typography>
                  )}
                  {waUrl ? (
                    <Button
                      component="a"
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<MessageCircle size={16} />}
                      fullWidth
                      sx={{
                        mt: 1.5,
                        borderRadius: '999px',
                        border: `1px solid ${colors.primary}`,
                        color: colors.primary,
                        bgcolor: '#fff',
                        textTransform: 'none',
                        fontWeight: 700,
                      }}
                    >
                      {t('spaces.findPlace.enquire.limitWhatsappCta', {
                        defaultValue: 'Send payment screenshot on WhatsApp',
                      })}
                    </Button>
                  ) : null}
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography sx={{ mt: 2, fontSize: 14, color: 'text.secondary' }} role="status">
              {t('spaces.findPlace.enquire.limitPayUnavailableBoth', {
                defaultValue: 'Payment details are currently unavailable. Please try again later.',
              })}
            </Typography>
          )}

          {canPay ? (
            <Box sx={{ mt: 2, textAlign: 'left' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                {t('spaces.findPlace.enquire.limitPayReference', { defaultValue: 'Transaction reference' })}{' '}
                <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                  {t('spaces.findPlace.enquire.limitPayReferenceOptional', { defaultValue: '(optional)' })}
                </Box>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder={t('spaces.findPlace.enquire.limitUtrPlaceholder', {
                  defaultValue: 'e.g. 123456789012',
                })}
                value={utr}
                disabled={submitting}
                onChange={(e) => setUtr(e.target.value)}
                sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              {submitError ? (
                <Typography color="error" variant="body2" sx={{ mt: 1 }} role="alert">
                  {submitError}
                </Typography>
              ) : null}
              <Button
                fullWidth
                disabled={submitting || !selectedPkg}
                onClick={() => void handleSubmitPurchase()}
                sx={{ ...dashContainedButtonSx, mt: 1.5, borderRadius: '999px' }}
              >
                {submitting ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                {t('spaces.findPlace.enquire.limitPaymentSubmit', {
                  defaultValue: "I've paid — Notify admin",
                })}
              </Button>
            </Box>
          ) : null}

          <Button
            fullWidth
            disabled={submitting}
            onClick={() => {
              setView('main');
              setSubmitError(null);
            }}
            sx={{ ...dashOutlinedButtonSx, mt: 1.25, borderRadius: '999px' }}
          >
            {t('spaces.findPlace.enquire.back', { defaultValue: 'Back' })}
          </Button>
          {helpHref ? (
            <Button
              component="a"
              href={helpHref}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<Headset size={16} />}
              sx={{ mt: 1, textTransform: 'none', fontWeight: 700, color: colors.primary }}
            >
              {t('spaces.findPlace.enquire.limitNeedHelp', { defaultValue: 'Need help?' })}
            </Button>
          ) : null}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      scroll="paper"
      slotProps={{
        paper: {
          sx: {
            m: { xs: 1.5, sm: 2 },
            maxHeight: { xs: 'calc(100dvh - 24px)', sm: '90vh' },
          },
        },
      }}
    >
      <DialogContent sx={{ pt: 3.5, pb: 1, textAlign: 'center', px: { xs: 2, sm: 3 } }}>
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
            bgcolor: '#E7F6EE',
            color: colors.primary,
          }}
        >
          {purpose === 'map' ? <Map size={22} /> : purpose === 'photos' ? <ImageIcon size={22} /> : <Mail size={22} />}
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: 22, lineHeight: 1.25 }}>
          {purpose === 'map'
            ? t('spaces.findPlace.enquire.limitMapTitle', { defaultValue: 'Pay to continue to the map' })
            : purpose === 'photos'
              ? t('spaces.findPlace.enquire.limitPhotosTitle', {
                  defaultValue: 'Pay to continue requesting photos',
                })
              : t('spaces.findPlace.enquire.limitUsedTodayTitle', {
                  defaultValue: "You've used today's free enquiry",
                })}
        </Typography>
        <Typography
          color="primary"
          sx={{
            mt: 1.5,
            fontSize: 14,
            fontWeight: 600,
            maxWidth: 340,
            mx: 'auto',
            bgcolor: '#E7F6EE',
            border: `1px solid ${colors.primary}40`,
            borderRadius: '12px',
            px: 1.5,
            py: 1,
          }}
        >
          {purpose === 'map'
            ? t('spaces.findPlace.enquire.limitMapBody', {
                defaultValue:
                  "Today's free enquiry is used. Complete payment to continue to Google Maps.",
              })
            : purpose === 'photos'
              ? t('spaces.findPlace.enquire.limitPhotosBody', {
                  defaultValue:
                    "Today's free enquiry is used. Complete payment to continue requesting photos.",
                })
              : mobileBrowser
                ? t('spaces.findPlace.enquire.limitMobileBody', {
                    defaultValue:
                      'Get unlimited enquiries with the ACOMI Android app, or choose paid email enquiries.',
                  })
                : (
                  <>
                    {t('spaces.findPlace.enquire.limitDesktopBodyLead', {
                      defaultValue: 'You can use the ACOMI mobile app for unlimited',
                    })}
                    <br />
                    {t('spaces.findPlace.enquire.limitDesktopBodyTail', { defaultValue: 'free enquiries.' })}
                  </>
                )}
        </Typography>

        <Box sx={{ mt: 2.5, display: 'grid', gap: 1.25, textAlign: 'left' }}>
          {mobileBrowser ? (
            <ChoiceCard
              selected={choice === 'app'}
              onSelect={() => setChoice('app')}
              icon={<AndroidMark />}
              title={t('spaces.findPlace.enquire.limitUnlimitedTitle', {
                defaultValue: 'Unlimited enquiries',
              })}
              body={t('spaces.findPlace.enquire.limitUnlimitedBody', {
                defaultValue: 'Use the ACOMI Android app for free and enjoy unlimited enquiries.',
              })}
              badge={t('spaces.findPlace.enquire.recommended', { defaultValue: 'Recommended' })}
            />
          ) : null}
          <ChoiceCard
            selected={!mobileBrowser || choice === 'credits'}
            onSelect={() => setChoice('credits')}
            icon={<Mail size={20} color={colors.primary} />}
            title={
              primaryPkg
                ? t('spaces.findPlace.enquire.limitPackageTitle', {
                    count: primaryPkg.credits,
                    amount: `₹${Number(primaryPkg.priceAmount)}`,
                    defaultValue: '{{count}} enquiry credits — {{amount}}',
                  })
                : t('auth.pleaseWait')
            }
            body={
              primaryPkg
                ? purpose === 'map'
                  ? t('spaces.findPlace.enquire.limitPackageBodyMap', {
                      count: primaryPkg.credits,
                      defaultValue:
                        'Get {{count}} enquiry credits. After payment is confirmed, continue to the map.',
                    })
                  : purpose === 'photos'
                    ? t('spaces.findPlace.enquire.limitPackageBodyPhotos', {
                        count: primaryPkg.credits,
                        defaultValue:
                          'Get {{count}} enquiry credits. After payment is confirmed, continue requesting photos.',
                      })
                    : t('spaces.findPlace.enquire.limitPackageBody', {
                        count: primaryPkg.credits,
                        defaultValue: 'Get {{count}} more email enquiries to contact properties.',
                      })
                : ''
            }
          />
        </Box>
        {!configLoading && (configError || (config && !config.enabled)) ? (
          <Typography color="text.secondary" sx={{ mt: 2, fontSize: 13 }} role="status">
            {t('spaces.findPlace.enquire.limitPaymentUnavailable')}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexDirection: 'column', gap: 1 }}>
        <Button
          fullWidth
          disabled={
            (mobileBrowser ? choice : 'credits') === 'credits' &&
            (configLoading || !(config?.enabled && config.packages.length > 0))
          }
          onClick={() => {
            if (mobileBrowser && choice === 'app') {
              openAcomiAndroidApp();
              return;
            }
            setView('buy');
          }}
          startIcon={mobileBrowser && choice === 'app' ? <PlayMark /> : undefined}
          endIcon={<ArrowRight size={16} />}
          sx={{ ...dashContainedButtonSx, borderRadius: '999px' }}
        >
          {mobileBrowser && choice === 'app'
            ? t('spaces.findPlace.enquire.limitGetAppCta', { defaultValue: 'Get the ACOMI app' })
            : primaryPkg
              ? t('spaces.findPlace.enquire.limitGetCreditsCta', {
                  count: primaryPkg.credits,
                  amount: `₹${Number(primaryPkg.priceAmount)}`,
                  defaultValue: 'Get {{count}} credits for {{amount}}',
                })
              : t('auth.pleaseWait')}
        </Button>
        <Button fullWidth onClick={onClose} sx={{ ...dashOutlinedButtonSx, borderRadius: '999px' }}>
          {t('spaces.findPlace.enquire.limitNotNow', { defaultValue: 'Not now' })}
        </Button>
        {availableCredits > 0 && onContinueWithCredits ? (
          <Button fullWidth onClick={onContinueWithCredits} sx={{ textTransform: 'none', fontWeight: 700 }}>
            {purpose === 'map'
              ? t('spaces.findPlace.enquire.limitContinueToMap', { defaultValue: 'Continue to map' })
              : purpose === 'photos'
                ? t('spaces.findPlace.enquire.limitContinueToPhotos', { defaultValue: 'Continue to photos' })
                : t('spaces.findPlace.enquire.limitContinueWithCredits', { count: availableCredits })}
          </Button>
        ) : null}
        {waLink(config?.whatsappNumber, t('spaces.findPlace.enquire.limitHelpText', {
          defaultValue: 'Hi, I need help with ACOMI enquiry credits.',
        })) ? (
          <Button
            component="a"
            href={waLink(config?.whatsappNumber, t('spaces.findPlace.enquire.limitHelpText', {
              defaultValue: 'Hi, I need help with ACOMI enquiry credits.',
            })) ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<Headset size={16} />}
            sx={{ textTransform: 'none', fontWeight: 700, color: colors.primary }}
          >
            {t('spaces.findPlace.enquire.limitNeedHelp', { defaultValue: 'Need help?' })}
          </Button>
        ) : null}
        {onQuotaReset ? (
          <Button fullWidth onClick={onQuotaReset} sx={dashOutlinedButtonSx}>
            {t('spaces.findPlace.enquire.limitResetQuota')}
          </Button>
        ) : null}
      </DialogActions>
      <FileImageViewer
        open={qrViewerOpen}
        onClose={() => setQrViewerOpen(false)}
        fileId={config?.qrFileId}
        imageUrl={qrUrl}
        title={t('spaces.findPlace.enquire.limitQrAlt', { defaultValue: 'UPI QR code' })}
        downloadFilename="payment-qr.png"
      />
    </Dialog>
  );
}
