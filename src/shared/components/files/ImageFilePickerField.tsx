import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import type { FilePurpose } from '@/shared/api/filesApi';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { FileUploadUserError, isSupportedImageMime, purposeMaxBytes, purposeMaxMb } from '@/shared/utils/fileLimits';
import { prepareFileForUpload } from '@/shared/utils/optimizeImageFile';
import { FileImageViewer } from './FileImageViewer';

export type ImageFilePickerFieldProps = {
  purpose: FilePurpose;
  label: string;
  hint?: string;
  file: File | null;
  previewUrl?: string | null;
  existingFileId?: string | null;
  onFile: (file: File | null) => void;
  onError?: (message: string | null) => void;
  disabled?: boolean;
  allowRemove?: boolean;
};

export function ImageFilePickerField({
  purpose,
  label,
  hint,
  file,
  previewUrl,
  existingFileId,
  onFile,
  onError,
  disabled,
  allowRemove = true,
}: ImageFilePickerFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setLocalPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const preview = localPreview || previewUrl;
  const hasPhoto = Boolean(file || previewUrl || existingFileId);

  const handlePick = async (selected: File | undefined) => {
    if (!selected) {
      return;
    }
    if (!isSupportedImageMime(selected.type)) {
      onError?.(t('files.unsupportedType', { defaultValue: 'This file type is not supported.' }));
      return;
    }
    setBusy(true);
    try {
      const prepared = await prepareFileForUpload(selected, purpose);
      if (prepared.size > purposeMaxBytes(purpose)) {
        onError?.(
          t('files.tooLarge', {
            defaultValue: 'File size must be {{maxMb}} MB or less.',
            maxMb: purposeMaxMb(purpose),
          }),
        );
        return;
      }
      onFile(prepared);
      onError?.(null);
    } catch (error) {
      if (error instanceof FileUploadUserError) {
        onError?.(error.message);
      } else {
        onError?.(t('files.uploadFailed', { defaultValue: 'Unable to upload the file. Please try again.' }));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={1}>
      <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>{label}</Typography>
      {hint ? (
        <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textSecondary }}>{hint}</Typography>
      ) : null}
      {preview ? (
        <Box
          component="img"
          src={preview}
          alt=""
          onClick={() => setViewerOpen(true)}
          sx={{
            width: 96,
            height: 96,
            objectFit: 'cover',
            borderRadius: `${DASHBOARD_UX.tileRadius}px`,
            border: `1px solid ${s.border}`,
            cursor: 'zoom-in',
          }}
        />
      ) : null}
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button component="label" variant="outlined" disabled={disabled || busy} sx={dashOutlinedButtonSx}>
          {hasPhoto
            ? t('files.replace', { defaultValue: 'Replace photo' })
            : t('files.add', { defaultValue: 'Add photo' })}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              const selected = e.target.files?.[0];
              e.target.value = '';
              void handlePick(selected);
            }}
          />
        </Button>
        {hasPhoto ? (
          <Button size="small" onClick={() => setViewerOpen(true)} sx={dashOutlinedButtonSx}>
            {t('files.view', { defaultValue: 'View photo' })}
          </Button>
        ) : null}
        {allowRemove && hasPhoto ? (
          <Button
            size="small"
            disabled={disabled || busy}
            onClick={() => onFile(null)}
            sx={dashOutlinedButtonSx}
          >
            {t('files.remove', { defaultValue: 'Remove photo' })}
          </Button>
        ) : null}
      </Stack>
      <FileImageViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        fileId={file ? undefined : existingFileId}
        imageUrl={preview}
        title={label}
      />
    </Stack>
  );
}
