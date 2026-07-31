import { Button, Stack, TextField, Typography, useTheme } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { PageSection } from '@/shared/components/PageSection';
import { LoadingState } from '@/shared/components/LoadingState';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { memberApi } from '../api/memberApi';
import { useMemberNotes } from '../hooks/useMemberDetailData';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';

type MemberNotesSectionProps = {
  spaceId: string;
  memberId: string;
};

export function MemberNotesSection({ spaceId, memberId }: MemberNotesSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const permissions = useSpacePermissions(spaceId);
  const { notes, loading } = useMemberNotes(spaceId, memberId);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!note.trim()) {
      return;
    }
    setSaving(true);
    try {
      await memberApi.addMemberNote(spaceId, memberId, { note: note.trim() });
      setNote('');
      await queryClient.invalidateQueries({ queryKey: ['member-notes', spaceId, memberId] });
      enqueueSnackbar(t('membership.workspace.noteAdded'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageSection title={t('membership.detailTabs.notes')}>
      {loading ? <LoadingState minHeight={80} /> : null}
      <Stack spacing={1} sx={{ mb: 1.5 }}>
        {notes.map((entry) => (
          <Stack
            key={entry.noteId}
            sx={{
              p: `${DASHBOARD_UX.metricPadding}px`,
              border: `1px solid ${s.border}`,
              borderRadius: `${DASHBOARD_UX.tileRadius}px`,
              bgcolor: s.elevated,
              boxShadow: s.shadow,
            }}
          >
            <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textPrimary }}>
              {entry.createdByName}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>{entry.note}</Typography>
            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
              {new Date(entry.createdAt).toLocaleString()}
            </Typography>
          </Stack>
        ))}
      </Stack>
      {permissions.canManageMembers ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            size="small"
            fullWidth
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('membership.workspace.notePlaceholder')}
          />
          <Button
            variant="outlined"
            onClick={() => void handleAdd()}
            disabled={saving}
            sx={dashOutlinedButtonSx}
          >
            {t('membership.workspace.addNote')}
          </Button>
        </Stack>
      ) : null}
    </PageSection>
  );
}
