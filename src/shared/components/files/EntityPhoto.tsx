import { Box, Button, CircularProgress, Stack, Typography, useTheme } from '@mui/material';
import { Camera, Pencil } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { FileImageViewer } from '@/shared/components/files/FileImageViewer';
import { entityPhotoApi } from '@/shared/api/entityPhotoApi';
import { ENTITY_PHOTO_PURPOSE, type EntityPhotoKind } from '@/shared/files/entityPhoto';
import { mapFileUploadError, uploadLocalFile, fetchSignedContentUrlWithRetry } from '@/shared/services/fileUploadService';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

export type EntityPhotoProps = {
  spaceId: string;
  entityId: string;
  kind: EntityPhotoKind;
  fileId?: string | null;
  canEdit: boolean;
  fallback: ReactNode;
  title?: string;
  onChanged?: (nextFileId: string | null) => void;
  height?: number | string;
  compact?: boolean;
  label?: string;
  hint?: string;
};

export function EntityPhoto({
  spaceId,
  entityId,
  kind,
  fileId,
  canEdit,
  fallback,
  title,
  onChanged,
  height,
  compact = false,
  label,
  hint,
}: EntityPhotoProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localFileId, setLocalFileId] = useState<string | null | undefined>(fileId);

  useEffect(() => {
    setLocalFileId(fileId);
  }, [fileId]);

  const activeFileId = localFileId;

  useEffect(() => {
    let cancelled = false;
    if (!activeFileId) {
      setPreviewUrl(null);
      return;
    }
    void fetchSignedContentUrlWithRetry(activeFileId)
      .then((url) => {
        if (!cancelled) {
          setPreviewUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewUrl(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeFileId]);

  const pickFile = () => {
    if (!canEdit || busyRef.current) {
      return;
    }
    inputRef.current?.click();
  };

  const handleTap = (event: { stopPropagation: () => void; preventDefault: () => void }) => {
    event.stopPropagation();
    event.preventDefault();
    if (activeFileId) {
      setViewerOpen(true);
      return;
    }
    if (canEdit) {
      pickFile();
    }
  };

  const handleSelected = async (file: File | undefined) => {
    if (!file || busyRef.current) {
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      const uploadedId = await uploadLocalFile(file, {
        purpose: ENTITY_PHOTO_PURPOSE[kind],
        spaceId,
      });
      await entityPhotoApi.replace(kind, spaceId, entityId, uploadedId);
      setLocalFileId(uploadedId);
      onChanged?.(uploadedId);
    } catch (error) {
      enqueueSnackbar(mapFileUploadError(error), { variant: 'error' });
    } finally {
      busyRef.current = false;
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!canEdit || busyRef.current) {
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      await entityPhotoApi.remove(kind, spaceId, entityId);
      setViewerOpen(false);
      setLocalFileId(null);
      onChanged?.(null);
    } catch (error) {
      enqueueSnackbar(mapFileUploadError(error), { variant: 'error' });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const interactive = Boolean(activeFileId) || canEdit;
  const compactSize = compact ? (typeof height === 'number' ? height : 32) : undefined;
  const frameAriaLabel = activeFileId
    ? t('files.view', { defaultValue: 'View photo' })
    : canEdit
      ? t('files.add', { defaultValue: 'Add photo' })
      : undefined;
  const compactEditAriaLabel = activeFileId
    ? t('files.replace', { defaultValue: 'Replace photo' })
    : t('files.add', { defaultValue: 'Add photo' });

  const frame = (
    <Box
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? handleTap : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                handleTap(event);
              }
            }
          : undefined
      }
      aria-label={frameAriaLabel}
      sx={{
        position: 'relative',
        cursor: interactive ? 'pointer' : 'default',
        width: compact ? compactSize : '100%',
        height: compact ? compactSize : undefined,
        minHeight: compact ? compactSize : height,
        borderRadius: compact ? '50%' : `${DASHBOARD_UX.tileRadius}px`,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        bgcolor: compact ? s.elevated : undefined,
      }}
    >
      {activeFileId && previewUrl ? (
        <Box
          component="img"
          src={previewUrl}
          alt={title ?? ''}
          sx={{
            width: '100%',
            height: compact ? compactSize : (height ?? 160),
            objectFit: 'cover',
            display: 'block',
            bgcolor: s.elevated,
          }}
        />
      ) : (
        fallback
      )}
      {busy ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(15, 23, 42, 0.35)',
          }}
        >
          <CircularProgress size={compact ? 14 : 22} />
        </Box>
      ) : null}
      {canEdit && !busy && !compact ? (
        <Box
          component="span"
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            pickFile();
          }}
          sx={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: 'rgba(15, 23, 42, 0.72)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.28)',
          }}
        >
          <Camera size={16} color="#fff" strokeWidth={2.2} />
        </Box>
      ) : null}
      {canEdit && !busy && compact ? (
        <Box
          component="span"
          role="button"
          aria-label={compactEditAriaLabel}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            pickFile();
          }}
          sx={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 16,
            height: 16,
            borderRadius: '50%',
            bgcolor: 'rgba(15, 23, 42, 0.82)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.28)',
          }}
        >
          <Pencil size={9} color="#fff" strokeWidth={2.4} />
        </Box>
      ) : null}
    </Box>
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        hidden
        onChange={(event) => void handleSelected(event.target.files?.[0])}
      />
      {label ? (
        <Stack spacing={1}>
          <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>{label}</Typography>
          {hint ? (
            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textSecondary }}>{hint}</Typography>
          ) : null}
          {frame}
          {canEdit ? (
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button
                type="button"
                variant="outlined"
                onClick={(event) => {
                  event.stopPropagation();
                  pickFile();
                }}
                sx={dashOutlinedButtonSx}
              >
                {activeFileId
                  ? t('files.replace', { defaultValue: 'Replace photo' })
                  : t('files.add', { defaultValue: 'Add photo' })}
              </Button>
              {activeFileId ? (
                <Button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleRemove();
                  }}
                  sx={dashOutlinedButtonSx}
                >
                  {t('files.remove', { defaultValue: 'Remove photo' })}
                </Button>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      ) : (
        frame
      )}
      <FileImageViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        fileId={activeFileId}
        title={title}
        canEdit={canEdit}
        onReplace={() => {
          setViewerOpen(false);
          pickFile();
        }}
        onRemove={() => void handleRemove()}
      />
    </>
  );
}
