import { Box, Button, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useTheme } from '@mui/material/styles';
import { fetchSignedContentUrlWithRetry } from '@/shared/services/fileUploadService';
import { FileImageViewer } from './FileImageViewer';

export type StoredImagePreviewProps = {
  fileId?: string | null;
  imageUrl?: string | null;
  alt?: string;
  title?: string;
  downloadFilename?: string;
  maxHeight?: number;
  width?: number | string;
  height?: number | string;
};

export function StoredImagePreview({
  fileId,
  imageUrl,
  alt,
  title,
  downloadFilename,
  maxHeight = 180,
  width = '100%',
  height,
}: StoredImagePreviewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const [open, setOpen] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(imageUrl ?? null);

  useEffect(() => {
    setResolvedUrl(imageUrl ?? null);
    if (imageUrl || !fileId) {
      return;
    }
    let cancelled = false;
    void fetchSignedContentUrlWithRetry(fileId)
      .then((url) => {
        if (!cancelled) {
          setResolvedUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedUrl(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fileId, imageUrl]);

  const src = resolvedUrl || undefined;

  if (!fileId && !src) {
    return null;
  }

  return (
    <>
      <Stack spacing={0.75}>
        <Box
          component="img"
          src={src}
          alt={alt ?? ''}
          onClick={() => setOpen(true)}
          sx={{
            width,
            height: height ?? 'auto',
            maxHeight,
            objectFit: 'contain',
            borderRadius: `${DASHBOARD_UX.tileRadius}px`,
            border: `1px solid ${s.border}`,
            bgcolor: s.elevated,
            cursor: 'zoom-in',
          }}
        />
        <Button size="small" onClick={() => setOpen(true)} sx={{ alignSelf: 'flex-start', ...dashOutlinedButtonSx }}>
          {t('files.view', { defaultValue: 'View photo' })}
        </Button>
      </Stack>
      <FileImageViewer
        open={open}
        onClose={() => setOpen(false)}
        fileId={fileId}
        imageUrl={src}
        title={title}
        downloadFilename={downloadFilename}
      />
    </>
  );
}
