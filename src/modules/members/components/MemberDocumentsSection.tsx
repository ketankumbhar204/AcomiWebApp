import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { InfoRow } from '@/shared/components/InfoRow';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageSection } from '@/shared/components/PageSection';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { MemberDocumentType } from '@/shared/types/member';
import { PENDING_UPLOAD_FILE_URL } from '../api/memberApi';
import { useMemberDocuments } from '../hooks/useMemberDetailData';
import { useMemberMutations } from '../hooks/useMembers';

const DOCUMENT_TYPES: MemberDocumentType[] = [
  'AADHAAR',
  'PAN',
  'PASSPORT',
  'DRIVING_LICENSE',
  'STUDENT_ID',
  'OTHER',
];

const PENDING_FILE_URLS = new Set([PENDING_UPLOAD_FILE_URL, 'pending://upload']);

type MemberDocumentsSectionProps = {
  spaceId: string;
  memberId: string;
  canEdit: boolean;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

function isPendingFileUrl(fileUrl: string): boolean {
  return PENDING_FILE_URLS.has(fileUrl);
}

export function MemberDocumentsSection({
  spaceId,
  memberId,
  canEdit,
}: MemberDocumentsSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const { documents, loading } = useMemberDocuments(spaceId, memberId);
  const { addMemberDocument, deleteMemberDocument } = useMemberMutations(spaceId);

  const [addOpen, setAddOpen] = useState(false);
  const [documentType, setDocumentType] = useState<MemberDocumentType | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setDocumentType(null);
    setDocumentNumber('');
    setFormError(null);
    setAddOpen(true);
  };

  const handleAdd = async () => {
    if (!documentType) {
      setFormError(t('membership.documents.typeRequired'));
      return;
    }
    if (!documentNumber.trim()) {
      setFormError(t('membership.documents.numberRequired'));
      return;
    }

    try {
      await addMemberDocument.mutateAsync({
        memberId,
        body: {
          documentType,
          documentNumber: documentNumber.trim(),
          fileUrl: PENDING_UPLOAD_FILE_URL,
        },
      });
      enqueueSnackbar(t('membership.documents.successToast'), { variant: 'success' });
      setAddOpen(false);
      setFormError(null);
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
        variant: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }
    try {
      await deleteMemberDocument.mutateAsync({ memberId, documentId: deleteId });
      setDeleteId(null);
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
        variant: 'error',
      });
    }
  };

  return (
    <>
      <PageSection
        title={t('membership.detailTabs.documents')}
        actions={
          canEdit ? (
            <Button size="small" onClick={openAdd} sx={dashOutlinedButtonSx}>
              {t('membership.documents.add')}
            </Button>
          ) : null
        }
      >
        {loading && documents.length === 0 ? <LoadingState minHeight={80} /> : null}

        {!loading && documents.length === 0 ? (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
            {t('membership.documents.emptyDescription')}
          </Typography>
        ) : null}

        <Stack spacing={1}>
          {documents.map((doc) => (
            <Box
              key={doc.documentId}
              sx={{
                p: `${DASHBOARD_UX.metricPadding}px`,
                border: `1px solid ${s.border}`,
                borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                bgcolor: s.elevated,
                boxShadow: s.shadow,
              }}
            >
              <InfoRow
                label={t('membership.documents.typeLabel')}
                value={t(`membership.documents.types.${doc.documentType}`)}
              />
              <InfoRow
                label={t('membership.documents.numberLabel')}
                value={doc.documentNumber}
              />
              <InfoRow
                label={t('membership.documents.verificationLabel')}
                value={t(`membership.documents.verification.${doc.verificationStatus}`)}
              />
              <InfoRow
                label={t('membership.documents.uploadedLabel')}
                value={formatDate(doc.uploadedAt)}
              />
              <InfoRow
                label={t('membership.documents.fileLabel')}
                value={
                  isPendingFileUrl(doc.fileUrl)
                    ? t('membership.documents.pendingUpload')
                    : doc.fileUrl
                }
              />
              {canEdit ? (
                <Button
                  size="small"
                  color="error"
                  onClick={() => setDeleteId(doc.documentId)}
                  disabled={deleteMemberDocument.isPending}
                  sx={{ ...dashOutlinedButtonSx, mt: 1 }}
                >
                  {t('membership.documents.deleteConfirm')}
                </Button>
              ) : null}
            </Box>
          ))}
        </Stack>
      </PageSection>

      <Dialog
        open={addOpen}
        onClose={() => {
          if (!addMemberDocument.isPending) {
            setAddOpen(false);
          }
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            boxShadow: s.shadowHover,
          },
        }}
      >
        <DialogTitle sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
          {t('membership.documents.add')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary }}>
              {t('membership.documents.typeLabel')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {DOCUMENT_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={t(`membership.documents.types.${type}`)}
                  clickable
                  color={documentType === type ? 'primary' : 'default'}
                  variant={documentType === type ? 'filled' : 'outlined'}
                  onClick={() => setDocumentType(type)}
                />
              ))}
            </Box>
            <TextField
              size="small"
              fullWidth
              label={t('membership.documents.numberLabel')}
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder={t('membership.documents.numberPlaceholder')}
            />
            {formError ? (
              <Typography sx={{ ...DASHBOARD_UX.caption, color: 'error.main' }}>
                {formError}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setAddOpen(false)}
            disabled={addMemberDocument.isPending}
            sx={dashOutlinedButtonSx}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleAdd()}
            disabled={addMemberDocument.isPending}
            sx={dashContainedButtonSx}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('membership.documents.deleteTitle')}
        description={t('membership.documents.deleteMessage')}
        confirmLabel={t('membership.documents.deleteConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        confirming={deleteMemberDocument.isPending}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
}
