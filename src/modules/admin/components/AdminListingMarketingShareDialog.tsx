import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Phone, Share2, X } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/modules/admin/api/adminApi';
import {
  buildMessageForTemplate,
  customTemplateToSelectable,
  templatesForListing,
  type ListingMarketingKind,
  type ListingMarketingTemplate,
  type ListingMarketingTemplateKey,
} from '@/modules/admin/marketing/listingMarketingTemplates';
import {
  MARKETING_MEDIA_ACCEPT,
  MARKETING_MEDIA_MAX_FILES,
  marketingMediaKind,
  marketingMediaMaxMb,
  prepareMarketingSystemShare,
  validateMarketingMediaAddition,
  type MarketingMediaValidationCode,
  type MarketingShareCapabilityReport,
} from '@/modules/admin/marketing/marketingMediaLimits';

type MarketingShareDeliveryMode = 'manual' | 'system_share';
import type {
  AdminUpdateListingMarketingRequest,
  ListingMarketingOutcome,
} from '@/shared/types/admin';
import type { SpaceType } from '@/shared/types/space';
import { colors } from '@/shared/theme/colors';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import { firstWhatsAppPhone, whatsAppChatUrl, whatsAppPhoneDigits } from '@/shared/utils/photoRequest';

const CUSTOM_PHONE_VALUE = '__custom__';

export type AdminListingMarketingTarget =
  | { kind: 'property-registration'; id: string }
  | { kind: 'mess-registration'; id: string }
  | { kind: 'space'; id: string };

export type AdminListingMarketingShareDialogProps = {
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  target: AdminListingMarketingTarget;
  listingKind: ListingMarketingKind;
  spaceType?: SpaceType | null;
  name: string;
  ownerName?: string | null;
  location?: string | null;
  address?: string | null;
  rentOrPrice?: string | null;
  sharing?: string | null;
  amenities?: string | null;
  foodIncluded?: string | null;
  genderPolicy?: string | null;
  description?: string | null;
  phones: Array<string | null | undefined>;
  mode?: 'share' | 'call';
};

type SelectedMedia = {
  id: string;
  file: File;
  previewUrl: string | null;
  kind: 'image' | 'video';
};

function uniquePhones(phones: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const phone of phones) {
    const digits = whatsAppPhoneDigits(phone);
    if (!digits || seen.has(digits)) continue;
    seen.add(digits);
    result.push(phone!.trim());
  }
  return result;
}

async function persistMarketing(
  target: AdminListingMarketingTarget,
  payload: AdminUpdateListingMarketingRequest,
) {
  if (target.kind === 'property-registration') {
    return adminApi.updatePropertyRegistrationMarketing(target.id, payload);
  }
  if (target.kind === 'mess-registration') {
    return adminApi.updateMessRegistrationMarketing(target.id, payload);
  }
  return adminApi.updateSpaceMarketing(target.id, payload);
}

function revokePreviews(items: SelectedMedia[]) {
  for (const item of items) {
    if (item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }
}

export function AdminListingMarketingShareDialog({
  open,
  onClose,
  onUpdated,
  target,
  listingKind,
  spaceType,
  name,
  ownerName,
  location,
  address,
  rentOrPrice,
  sharing,
  amenities,
  foodIncluded,
  genderPolicy,
  description,
  phones,
  mode = 'share',
}: AdminListingMarketingShareDialogProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const availablePhones = useMemo(() => uniquePhones(phones), [phones]);
  const [customTemplates, setCustomTemplates] = useState<ListingMarketingTemplate[]>([]);
  const templates = useMemo(
    () => templatesForListing(listingKind, spaceType, customTemplates),
    [listingKind, spaceType, customTemplates],
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [templateKey, setTemplateKey] = useState<ListingMarketingTemplateKey>(
    templates[0]?.key ?? 'general_property',
  );
  const [message, setMessage] = useState('');
  const [messageDirty, setMessageDirty] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [callConfirmOpen, setCallConfirmOpen] = useState(false);
  const [media, setMedia] = useState<SelectedMedia[]>([]);
  const [mediaFallback, setMediaFallback] = useState(false);
  const [systemShareViaDownload, setSystemShareViaDownload] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<MarketingShareDeliveryMode>('manual');

  const messageFields = useMemo(
    () => ({
      name,
      spaceType: spaceType ?? (listingKind === 'MESS' ? 'MESS' : null),
      ownerName,
      location,
      address,
      rentOrPrice,
      sharing,
      amenities,
      foodIncluded,
      genderPolicy,
      description,
    }),
    [
      name,
      spaceType,
      listingKind,
      ownerName,
      location,
      address,
      rentOrPrice,
      sharing,
      amenities,
      foodIncluded,
      genderPolicy,
      description,
    ],
  );

  const resolvedPhone = useMemo(() => {
    if (selectedPhone === CUSTOM_PHONE_VALUE) {
      const digits = normalizeIndianMobileDigits(customPhone);
      return isValidIndianMobile(digits) ? digits : '';
    }
    return selectedPhone || firstWhatsAppPhone(availablePhones) || '';
  }, [selectedPhone, customPhone, availablePhones]);

  const hasUsablePhone = Boolean(whatsAppPhoneDigits(resolvedPhone));

  const clearMedia = () => {
    setMedia((prev) => {
      revokePreviews(prev);
      return [];
    });
  };

  const templateLabel = (template: ListingMarketingTemplate) => {
    if (template.builtin) {
      return t(`admin.marketing.templates.${template.key}`);
    }
    return template.name?.trim() || t('admin.marketing.custom');
  };

  const applySelectedTemplate = (key: ListingMarketingTemplateKey, list: ListingMarketingTemplate[]) => {
    const template = list.find((item) => item.key === key) ?? list[0];
    if (!template) return;
    setTemplateKey(template.key);
    setMessage(buildMessageForTemplate(template, messageFields));
    setMessageDirty(false);
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    // Reset compose chrome when the dialog opens for a listing.
    /* eslint-disable react-hooks/set-state-in-effect -- intentional dialog reset on open */
    setSelectedPhone(availablePhones[0] ?? CUSTOM_PHONE_VALUE);
    setCustomPhone('');
    setConfirmOpen(false);
    setCallConfirmOpen(false);
    setMediaFallback(false);
    setMessageDirty(false);
    setDeliveryMode('manual');
    clearMedia();
    /* eslint-enable react-hooks/set-state-in-effect */

    const bootstrap = async () => {
      let customs: ListingMarketingTemplate[] = [];
      if (mode === 'share') {
        try {
          const rows = await adminApi.listListingMarketingTemplates({ activeOnly: true });
          customs = rows.map(customTemplateToSelectable);
        } catch {
          customs = [];
        }
      }
      if (cancelled) return;
      setCustomTemplates(customs);
      const merged = templatesForListing(listingKind, spaceType, customs);
      const first = merged[0];
      const nextKey = first?.key ?? 'general_property';
      setTemplateKey(nextKey);
      if (first) {
        setMessage(buildMessageForTemplate(first, messageFields));
      } else {
        setMessage('');
      }
      setMessageDirty(false);
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    mode,
    availablePhones,
    listingKind,
    spaceType,
    messageFields,
  ]);

  const validationMessage = (code: MarketingMediaValidationCode) => {
    switch (code) {
      case 'TOO_MANY':
        return t('admin.marketing.media.tooMany', { max: MARKETING_MEDIA_MAX_FILES });
      case 'UNSUPPORTED':
        return t('admin.marketing.media.unsupported');
      case 'IMAGE_TOO_LARGE':
        return t('admin.marketing.media.imageTooLarge', {
          maxMb: marketingMediaMaxMb('image'),
        });
      case 'VIDEO_TOO_LARGE':
        return t('admin.marketing.media.videoTooLarge', {
          maxMb: marketingMediaMaxMb('video'),
        });
      default:
        return t('admin.marketing.media.shareFailed');
    }
  };

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const candidates = Array.from(fileList).map((file) => ({
      name: file.name,
      mime: file.type,
      size: file.size,
      file,
    }));
    const validation = validateMarketingMediaAddition(
      media.length,
      candidates.map(({ name: n, mime, size }) => ({ name: n, mime, size })),
    );
    if (!validation.ok) {
      enqueueSnackbar(validationMessage(validation.code), { variant: 'warning' });
      return;
    }
    const next: SelectedMedia[] = [];
    for (const item of candidates) {
      const kind = marketingMediaKind(item.mime);
      if (!kind) continue;
      next.push({
        id: `${item.file.name}-${item.file.size}-${item.file.lastModified}-${Math.random()}`,
        file: item.file,
        previewUrl: kind === 'image' ? URL.createObjectURL(item.file) : null,
        kind,
      });
    }
    setMedia((prev) => [...prev, ...next]);
    setMediaFallback(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (id: string) => {
    setMedia((prev) => {
      const targetItem = prev.find((item) => item.id === id);
      if (targetItem?.previewUrl) {
        URL.revokeObjectURL(targetItem.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleClose = () => {
    if (busy) return;
    clearMedia();
    setMediaFallback(false);
    setSystemShareViaDownload(false);
    onClose();
  };

  const saveOutcome = async (outcome: ListingMarketingOutcome, channel: 'WHATSAPP' | 'CALL') => {
    setBusy(true);
    try {
      const payload: AdminUpdateListingMarketingRequest = {
        activity: {
          channel,
          outcome,
          templateKey: mode === 'share' ? templateKey : undefined,
          messageSnapshot: mode === 'share' ? message : undefined,
        },
      };
      if (outcome === 'SHARED_CONFIRMED') {
        payload.marketingStatus = 'SHARED';
        payload.whatsappAvailability = 'AVAILABLE';
      }
      if (outcome === 'WHATSAPP_UNAVAILABLE') {
        payload.whatsappAvailability = 'UNAVAILABLE';
      }
      await persistMarketing(target, payload);
      enqueueSnackbar(t('admin.marketing.saved'), { variant: 'success' });
      onUpdated?.();
      handleClose();
    } catch {
      enqueueSnackbar(t('admin.marketing.saveFailed'), { variant: 'error' });
    } finally {
      setBusy(false);
      setConfirmOpen(false);
      setCallConfirmOpen(false);
    }
  };

  const openWhatsApp = async () => {
    if (deliveryMode === 'system_share') {
      if (media.length === 0) {
        enqueueSnackbar(t('admin.marketing.deliverySystemShareNeedsMedia'), { variant: 'warning' });
        return;
      }
      const files = media.map((item) => item.file);
      setBusy(true);
      try {
        // Copy caption first — file share must omit text so WhatsApp Desktop shows “Send message to”.
        if (message.trim() && navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(message.trim());
          } catch {
            // Clipboard is best-effort.
          }
        }

        const logShareCapability = (
          capability: MarketingShareCapabilityReport,
          mode: 'web_share' | 'download_share',
        ) => {
          // Safe diagnostics only — no file contents or personal data.
          console.info('[acomi.marketing.share]', {
            mode,
            hasShare: capability.hasShare,
            hasCanShare: capability.hasCanShare,
            canShareFiles: capability.canShareFiles,
            canShareFilesAndText: capability.canShareFilesAndText,
            canShareText: capability.canShareText,
            fileCount: capability.fileCount,
            fileMimeTypes: capability.fileMimeTypes,
            attemptedPayload: capability.attemptedPayload,
            platform: capability.platform,
            userAgentBrand: capability.userAgentBrand,
            shareErrorName: capability.shareErrorName,
            shareErrorMessage: capability.shareErrorMessage,
            fallbackReason: capability.fallbackReason,
          });
        };

        // Prefer navigator.share({ files, text? }) when canShare allows it.
        const prep = await prepareMarketingSystemShare(files, message);
        if (prep.mode === 'download_share') {
          logShareCapability(prep.capability, 'download_share');
          setMediaFallback(false);
          setSystemShareViaDownload(true);
          enqueueSnackbar(t('admin.marketing.systemShareDownloadHint'), { variant: 'info' });
          setConfirmOpen(true);
          return;
        }
        logShareCapability(prep.capability, 'web_share');
        const result = prep.result;
        if (result === 'cancelled') {
          enqueueSnackbar(t('admin.marketing.systemShareCancelled'), { variant: 'info' });
          return;
        }
        if (result === 'unsupported') {
          enqueueSnackbar(t('admin.marketing.systemShareUnsupported'), { variant: 'warning' });
          return;
        }
        if (result === 'failed') {
          enqueueSnackbar(t('admin.marketing.media.shareFailed'), { variant: 'error' });
          return;
        }
        setMediaFallback(false);
        setSystemShareViaDownload(false);
        enqueueSnackbar(
          result === 'partial'
            ? t('admin.marketing.systemSharePartial')
            : t('admin.marketing.systemShareOpened'),
          { variant: 'info' },
        );
        setConfirmOpen(true);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (selectedPhone === CUSTOM_PHONE_VALUE && !hasUsablePhone) {
      enqueueSnackbar(t('admin.marketing.invalidCustomPhone'), { variant: 'warning' });
      return;
    }
    const phone = resolvedPhone;
    const url = whatsAppChatUrl(phone, message);
    if (!url) {
      enqueueSnackbar(t('admin.marketing.noPhone'), { variant: 'warning' });
      return;
    }
    setBusy(true);
    try {
      await persistMarketing(target, {
        activity: {
          channel: 'WHATSAPP',
          outcome: 'WHATSAPP_OPENED',
          templateKey,
          messageSnapshot: message,
        },
      });

      // Manual mode: open the exact selected owner chat with text only.
      // Attachments (if any) are added manually in WhatsApp with the paperclip.
      window.open(url, '_blank', 'noopener,noreferrer');
      if (media.length > 0) {
        setMediaFallback(true);
        enqueueSnackbar(t('admin.marketing.media.fallbackNotice'), { variant: 'info' });
      } else {
        setMediaFallback(false);
      }
      setConfirmOpen(true);
    } catch {
      enqueueSnackbar(t('admin.marketing.saveFailed'), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const openDialer = async () => {
    if (selectedPhone === CUSTOM_PHONE_VALUE && !hasUsablePhone) {
      enqueueSnackbar(t('admin.marketing.invalidCustomPhone'), { variant: 'warning' });
      return;
    }
    const digits = whatsAppPhoneDigits(resolvedPhone);
    if (!digits) {
      enqueueSnackbar(t('admin.marketing.noPhone'), { variant: 'warning' });
      return;
    }
    const national = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
    setBusy(true);
    try {
      await persistMarketing(target, {
        activity: {
          channel: 'CALL',
          outcome: 'CALL_ATTEMPTED',
        },
      });
      window.open(`tel:+${digits.startsWith('91') ? digits : `91${national}`}`, '_self');
      setCallConfirmOpen(true);
    } catch {
      enqueueSnackbar(t('admin.marketing.saveFailed'), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={busy ? undefined : handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {mode === 'call' ? t('admin.marketing.callOwner') : t('admin.marketing.shareTitle')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack spacing={1.25}>
              <FormControl size="small" fullWidth>
                <InputLabel id="marketing-phone-label">{t('admin.marketing.contactNumber')}</InputLabel>
                <Select
                  labelId="marketing-phone-label"
                  label={t('admin.marketing.contactNumber')}
                  value={selectedPhone || CUSTOM_PHONE_VALUE}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSelectedPhone(next);
                    if (next !== CUSTOM_PHONE_VALUE) {
                      setCustomPhone('');
                    }
                  }}>
                  {availablePhones.map((phone) => (
                    <MenuItem key={phone} value={phone}>
                      {phone}
                    </MenuItem>
                  ))}
                  <MenuItem value={CUSTOM_PHONE_VALUE}>{t('admin.marketing.otherNumber')}</MenuItem>
                </Select>
              </FormControl>
              {selectedPhone === CUSTOM_PHONE_VALUE ? (
                <TextField
                  size="small"
                  label={t('admin.marketing.customNumber')}
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="9876543210"
                  slotProps={{ htmlInput: { inputMode: 'tel', maxLength: 15 } }}
                  helperText={t('admin.marketing.customNumberHint')}
                  error={Boolean(customPhone.trim()) && !hasUsablePhone}
                  fullWidth
                />
              ) : null}
              {availablePhones.length === 0 && selectedPhone !== CUSTOM_PHONE_VALUE ? (
                <Typography variant="caption" sx={{ color: colors.danger }}>
                  {t('admin.marketing.noPhone')}
                </Typography>
              ) : null}
            </Stack>

            {mode === 'share' ? (
              <>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: colors.textSecondary }}>
                    {t('admin.marketing.deliveryMode')}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 1 }}>
                    {(
                      [
                        ['manual', t('admin.marketing.deliveryManual')],
                        ['system_share', t('admin.marketing.deliverySystemShare')],
                      ] as const
                    ).map(([value, label]) => (
                      <Button
                        key={value}
                        size="small"
                        variant={deliveryMode === value ? 'contained' : 'outlined'}
                        disabled={busy}
                        onClick={() => {
                          setDeliveryMode(value);
                          setMediaFallback(false);
                        }}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          ...(deliveryMode === value ? {} : dashOutlinedButtonSx),
                        }}>
                        {label}
                      </Button>
                    ))}
                  </Stack>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mt: 1 }}>
                    {deliveryMode === 'system_share'
                      ? t('admin.marketing.deliverySystemShareHint')
                      : t('admin.marketing.deliveryManualHint')}
                  </Typography>
                </Box>

                <FormControl size="small" fullWidth>
                  <InputLabel id="marketing-template-label">
                    {t('admin.marketing.selectTemplate')}
                  </InputLabel>
                  <Select
                    labelId="marketing-template-label"
                    label={t('admin.marketing.selectTemplate')}
                    value={templateKey}
                    onChange={(e) => {
                      const nextKey = e.target.value as ListingMarketingTemplateKey;
                      setTemplateKey(nextKey);
                      if (messageDirty) {
                        enqueueSnackbar(t('admin.marketing.templateEditedHint'), {
                          variant: 'info',
                        });
                        return;
                      }
                      applySelectedTemplate(nextKey, templates);
                    }}>
                    {templates.map((template) => (
                      <MenuItem key={template.key} value={template.key}>
                        {templateLabel(template)}
                        {!template.builtin
                          ? ` · ${t('admin.marketing.custom')}`
                          : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={busy || templates.length === 0}
                    onClick={() => applySelectedTemplate(templateKey, templates)}
                    sx={dashOutlinedButtonSx}>
                    {t('admin.marketing.applyTemplate')}
                  </Button>
                  {messageDirty ? (
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                      {t('admin.marketing.templateEditedHint')}
                    </Typography>
                  ) : null}
                </Stack>
                <TextField
                  label={t('admin.marketing.editMessage')}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setMessageDirty(true);
                  }}
                  multiline
                  minRows={8}
                  fullWidth
                  helperText={t('admin.marketing.media.messageBoxNote')}
                />
                {media.length > 0 ? (
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 1.5,
                      border: `1px solid ${colors.border}`,
                      bgcolor: colors.section ?? '#F8FAFC',
                    }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: colors.textSecondary }}>
                      {t('admin.marketing.media.attachedForShare', { count: media.length })}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1, flexWrap: 'wrap' }}>
                      {media.map((item) =>
                        item.kind === 'image' && item.previewUrl ? (
                          <Box
                            key={item.id}
                            component="img"
                            src={item.previewUrl}
                            alt={item.file.name}
                            title={item.file.name}
                            sx={{
                              width: 56,
                              height: 56,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: `1px solid ${colors.border}`,
                            }}
                          />
                        ) : (
                          <Box
                            key={item.id}
                            title={item.file.name}
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: 1,
                              bgcolor: '#EEF2FF',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 10,
                              fontWeight: 800,
                              color: '#3730A3',
                              border: `1px solid ${colors.border}`,
                              textAlign: 'center',
                              px: 0.5,
                            }}>
                            {t('admin.marketing.media.videoBadge')}
                          </Box>
                        ),
                      )}
                    </Stack>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mt: 1 }}>
                      {deliveryMode === 'system_share'
                        ? t('admin.marketing.deliverySystemShareHint')
                        : t('admin.marketing.media.whatsappTextOnlyLimit')}
                    </Typography>
                  </Box>
                ) : null}

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75 }}>
                    {t('admin.marketing.media.title')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>
                    {t('admin.marketing.media.helper', {
                      maxFiles: MARKETING_MEDIA_MAX_FILES,
                      imageMb: marketingMediaMaxMb('image'),
                      videoMb: marketingMediaMaxMb('video'),
                    })}
                  </Typography>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={MARKETING_MEDIA_ACCEPT}
                    multiple
                    hidden
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                  <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={busy || media.length >= MARKETING_MEDIA_MAX_FILES}
                      onClick={() => fileInputRef.current?.click()}
                      sx={dashOutlinedButtonSx}>
                      {t('admin.marketing.media.add')}
                    </Button>
                    {media.length > 0 ? (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={busy}
                        onClick={clearMedia}
                        sx={dashOutlinedButtonSx}>
                        {t('admin.marketing.media.clearAll')}
                      </Button>
                    ) : null}
                  </Stack>
                  {media.length === 0 ? (
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                      {deliveryMode === 'system_share'
                        ? t('admin.marketing.deliverySystemShareNeedsMedia')
                        : t('admin.marketing.media.optional')}
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {media.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1,
                            borderRadius: 1.5,
                            border: `1px solid ${colors.border}`,
                            bgcolor: colors.surface,
                          }}>
                          {item.kind === 'image' && item.previewUrl ? (
                            <Box
                              component="img"
                              src={item.previewUrl}
                              alt=""
                              sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 1,
                                bgcolor: '#EEF2FF',
                                display: 'grid',
                                placeItems: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#3730A3',
                              }}>
                              {t('admin.marketing.media.videoBadge')}
                            </Box>
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                              {item.file.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                              {item.kind === 'image'
                                ? t('admin.marketing.media.imageLabel')
                                : t('admin.marketing.media.videoLabel')}{' '}
                              · {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            disabled={busy}
                            onClick={() => {
                              const href = item.previewUrl ?? URL.createObjectURL(item.file);
                              const a = document.createElement('a');
                              a.href = href;
                              a.download = item.file.name;
                              a.click();
                              if (!item.previewUrl) {
                                URL.revokeObjectURL(href);
                              }
                            }}
                            sx={dashOutlinedButtonSx}>
                            {t('admin.marketing.media.download')}
                          </Button>
                          <IconButton
                            size="small"
                            aria-label={t('admin.marketing.media.remove')}
                            onClick={() => removeMedia(item.id)}
                            disabled={busy}>
                            <X size={16} />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  )}
                  <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mt: 1 }}>
                    {deliveryMode === 'system_share'
                      ? t('admin.marketing.deliverySystemShareHint')
                      : t('admin.marketing.media.shareHint')}
                  </Typography>
                  {mediaFallback && deliveryMode === 'manual' ? (
                    <Box
                      sx={{
                        mt: 1.25,
                        p: 1.25,
                        borderRadius: 1.5,
                        bgcolor: '#FFF7ED',
                        border: '1px solid #FED7AA',
                      }}>
                      <Typography variant="caption" sx={{ color: '#9A3412' }}>
                        {t('admin.marketing.media.fallbackNotice')}
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                {t('admin.marketing.callHint')}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={busy} sx={dashOutlinedButtonSx}>
            {t('admin.marketing.cancel')}
          </Button>
          {mode === 'call' ? (
            <Button
              variant="contained"
              startIcon={<Phone size={16} />}
              disabled={busy || !hasUsablePhone}
              onClick={() => void openDialer()}
              sx={{ textTransform: 'none', fontWeight: 700 }}>
              {t('admin.marketing.callOwner')}
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<Share2 size={16} />}
              disabled={
                busy ||
                (deliveryMode === 'manual'
                  ? !hasUsablePhone || !message.trim()
                  : media.length === 0)
              }
              onClick={() => void openWhatsApp()}
              sx={{ textTransform: 'none', fontWeight: 700 }}>
              {deliveryMode === 'system_share'
                ? t('admin.marketing.shareOnWhatsAppSystem')
                : t('admin.marketing.shareOnWhatsApp')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={busy ? undefined : () => setConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{t('admin.marketing.confirmSharing')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            {t('admin.marketing.confirmSharingHint')}
          </Typography>
          {media.length > 0 ? (
            <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 1.5, bgcolor: '#FFF7ED', border: '1px solid #FED7AA' }}>
              <Typography
                variant="caption"
                sx={{ color: '#9A3412', display: 'block', mb: 0.75, whiteSpace: 'pre-line' }}>
                {deliveryMode === 'system_share'
                  ? t(
                      systemShareViaDownload
                        ? 'admin.marketing.systemShareDownloadHint'
                        : 'admin.marketing.systemShareOpened',
                    )
                  : mediaFallback
                    ? t('admin.marketing.media.fallbackNotice')
                    : t('admin.marketing.media.mediaStepNotice', { phone: resolvedPhone })}
              </Typography>
              {media.map((item) => (
                <Typography key={item.id} variant="caption" sx={{ display: 'block', color: '#9A3412' }}>
                  • {item.file.name}
                </Typography>
              ))}
              <Button
                size="small"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    for (const item of media) {
                      const href = item.previewUrl ?? URL.createObjectURL(item.file);
                      const a = document.createElement('a');
                      a.href = href;
                      a.download = item.file.name;
                      a.rel = 'noopener';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      if (!item.previewUrl) {
                        URL.revokeObjectURL(href);
                      }
                      await new Promise((resolve) => setTimeout(resolve, 250));
                    }
                    enqueueSnackbar(t('admin.marketing.media.downloadsStarted'), {
                      variant: 'success',
                    });
                  })();
                }}
                sx={{ ...dashOutlinedButtonSx, mt: 1 }}>
                {t('admin.marketing.media.shareMediaAgain')}
              </Button>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button disabled={busy} onClick={() => setConfirmOpen(false)} sx={dashOutlinedButtonSx}>
            {t('admin.marketing.cancel')}
          </Button>
          <Button
            disabled={busy}
            onClick={() => void saveOutcome('WHATSAPP_UNAVAILABLE', 'WHATSAPP')}
            sx={dashOutlinedButtonSx}>
            {t('admin.marketing.markUnavailable')}
          </Button>
          <Button
            variant="contained"
            disabled={busy}
            onClick={() => void saveOutcome('SHARED_CONFIRMED', 'WHATSAPP')}
            sx={{ textTransform: 'none', fontWeight: 700 }}>
            {t('admin.marketing.markShared')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={callConfirmOpen}
        onClose={busy ? undefined : () => setCallConfirmOpen(false)}
        fullWidth
        maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{t('admin.marketing.confirmCall')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            {t('admin.marketing.confirmCallHint')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button
            disabled={busy}
            onClick={() => void saveOutcome('SKIPPED', 'CALL')}
            sx={dashOutlinedButtonSx}>
            {t('admin.marketing.notContacted')}
          </Button>
          <Button
            variant="contained"
            disabled={busy}
            onClick={() => void saveOutcome('CONTACTED_BY_PHONE', 'CALL')}
            sx={{ textTransform: 'none', fontWeight: 700 }}>
            {t('admin.marketing.contactedByPhone')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

