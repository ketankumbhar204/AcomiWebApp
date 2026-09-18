import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { Download, RefreshCw, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import {
  downloadAuthorizedFile,
  fetchSignedContentUrlWithRetry,
} from '@/shared/services/fileUploadService';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

export type FileImageViewerProps = {
  open: boolean;
  onClose: () => void;
  fileId?: string | null;
  imageUrl?: string | null;
  title?: string;
  downloadFilename?: string;
  canEdit?: boolean;
  onReplace?: () => void;
  onRemove?: () => void;
};

export function FileImageViewer({
  open,
  onClose,
  fileId,
  imageUrl,
  title,
  downloadFilename,
  canEdit = false,
  onReplace,
  onRemove,
}: FileImageViewerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open) {
      setSrc(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (fileId) {
          const url = await fetchSignedContentUrlWithRetry(fileId);
          if (!cancelled) {
            setSrc(url);
          }
          return;
        }
        if (imageUrl) {
          if (!cancelled) {
            setSrc(imageUrl);
          }
          return;
        }
        if (!cancelled) {
          setError(t('files.previewUnavailable', { defaultValue: 'No photo to display.' }));
        }
      } catch {
        if (!cancelled) {
          setError(t('files.downloadFailed', { defaultValue: 'Unable to download the file. Please try again.' }));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, fileId, imageUrl, t]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (fileId) {
        await downloadAuthorizedFile(fileId, downloadFilename ?? 'photo.jpg');
        return;
      }
      if (!src) {
        throw new Error('missing');
      }
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error('download');
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = downloadFilename ?? 'photo.jpg';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      enqueueSnackbar(
        t('files.downloadFailed', { defaultValue: 'Unable to download the file. Please try again.' }),
        { variant: 'error' },
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${s.border}`,
        }}
      >
        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
          {title ?? t('files.viewerTitle', { defaultValue: 'Photo' })}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Button
            size="small"
            startIcon={<Download size={14} />}
            onClick={() => void handleDownload()}
            disabled={loading || Boolean(error) || downloading || (!fileId && !src)}
            sx={dashOutlinedButtonSx}
          >
            {t('files.download', { defaultValue: 'Download' })}
          </Button>
          {canEdit ? (
            <>
              <Button
                size="small"
                startIcon={<RefreshCw size={14} />}
                onClick={onReplace}
                disabled={loading}
                sx={dashOutlinedButtonSx}
              >
                {t('files.replace', { defaultValue: 'Replace photo' })}
              </Button>
              <Button
                size="small"
                startIcon={<Trash2 size={14} />}
                onClick={onRemove}
                disabled={loading || !fileId}
                sx={dashOutlinedButtonSx}
              >
                {t('files.remove', { defaultValue: 'Remove photo' })}
              </Button>
            </>
          ) : null}
          <IconButton onClick={onClose} aria-label={t('common.close')} size="small">
            <X size={18} />
          </IconButton>
        </Stack>
      </Box>
      <DialogContent sx={{ minHeight: 280, display: 'grid', placeItems: 'center', bgcolor: s.elevated }}>
        {loading ? <CircularProgress size={28} /> : null}
        {error ? (
          <Typography sx={{ ...DASHBOARD_UX.body, color: 'error.main' }}>{error}</Typography>
        ) : null}
        {!loading && !error && src ? (
          <Box
            component="img"
            src={src}
            alt={title ?? ''}
            sx={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              borderRadius: `${DASHBOARD_UX.tileRadius}px`,
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
