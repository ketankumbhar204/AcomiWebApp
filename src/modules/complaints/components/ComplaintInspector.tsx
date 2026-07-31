import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  FolderOpen,
  Paperclip,
  Send,
} from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { SidePanel } from '@/shared/components/SidePanel';
import { StatusChip } from '@/shared/components/StatusChip';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useMembers } from '@/modules/members/hooks/useMembers';
import type { ComplaintStatus } from '@/shared/types/complaints';
import { useComplaintDetail, useComplaintMutations } from '../hooks/useComplaints';
import {
  categoryLabelKey,
  complaintPriorityTone,
  complaintStatusTone,
  formatComplaintDateTime,
  priorityLabelKey,
  statusLabelKey,
  timelineEventLabelKey,
} from '../utils/complaintHelpers';

type ComplaintInspectorProps = {
  spaceId: string;
  complaintId: string | null;
  canManage: boolean;
  onClose: () => void;
  framed?: boolean;
};

function InspectorCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Box
      sx={{
        p: `${DASHBOARD_UX.metricPadding}px`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1,
        }}
      >
        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>{title}</Typography>
        {action}
      </Box>
      {children}
    </Box>
  );
}

function DetailGrid({
  items,
}: {
  items: Array<{ label: string; value?: string | number | null }>;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const visible = items.filter((item) => item.value != null && item.value !== '');
  if (visible.length === 0) return null;
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1.25,
      }}
    >
      {visible.map((item) => (
        <Box key={item.label} sx={{ minWidth: 0 }}>
          <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
            {item.label}
          </Typography>
          <Typography
            sx={{ ...DASHBOARD_UX.body, fontWeight: 600, color: s.textPrimary, mt: 0.15 }}
            noWrap
          >
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export function ComplaintInspector({
  spaceId,
  complaintId,
  canManage,
  onClose,
  framed = true,
}: ComplaintInspectorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const detail = useComplaintDetail(spaceId, complaintId ?? undefined, Boolean(complaintId));
  const mutations = useComplaintMutations(spaceId);
  const members = useMembers(spaceId, canManage);
  const [comment, setComment] = useState('');
  const [internalNote, setInternalNote] = useState(false);
  const [resolution, setResolution] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const assigneeOptions = useMemo(
    () =>
      members.members.filter((m) => Boolean(m.membershipId)).map((m) => ({
        id: m.membershipId!,
        name: m.fullName,
      })),
    [members.members],
  );

  if (!complaintId) {
    return (
      <SidePanel title={t('complaints.inspector.title')} onClose={onClose} framed={framed}>
        <EmptyState
          icon={
            <IconBadge accent={colors.primaryDark}>
              <FolderOpen />
            </IconBadge>
          }
          title={t('complaints.inspector.selectTitle')}
          description={t('complaints.inspector.selectBody')}
        />
      </SidePanel>
    );
  }

  if (detail.loading && !detail.complaint) {
    return (
      <SidePanel title={t('complaints.inspector.title')} onClose={onClose} framed={framed}>
        <LoadingState />
      </SidePanel>
    );
  }

  const complaint = detail.complaint;
  if (!complaint) {
    return (
      <SidePanel title={t('complaints.inspector.title')} onClose={onClose} framed={framed}>
        <EmptyState title={t('complaints.inspector.notFound')} />
      </SidePanel>
    );
  }

  const status = complaint.status;
  const attachments = complaint.attachments ?? [];
  const comments = complaint.comments ?? [];
  const timeline = complaint.timeline ?? [];
  const canAddAttachment = status !== 'CLOSED' && status !== 'CANCELLED' && attachments.length < 5;

  const run = async (fn: () => Promise<unknown>, successKey: string) => {
    try {
      await fn();
      enqueueSnackbar(t(successKey), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('complaints.errors.action'), { variant: 'error' });
    }
  };

  const postComment = () => {
    const body = comment.trim();
    if (!body) {
      return;
    }
    void run(
      async () => {
        await mutations.addComment.mutateAsync({
          complaintId: complaint.complaintId,
          body: { body, internal: canManage ? internalNote : false },
        });
        setComment('');
        requestAnimationFrame(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
      },
      'complaints.commentAdded',
    );
  };

  const onPickPhoto = (file: File | null) => {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      void run(
        () =>
          mutations.addAttachment.mutateAsync({
            complaintId: complaint.complaintId,
            body: {
              imageBase64: base64 ?? '',
              fileName: file.name,
              contentType: file.type || undefined,
            },
          }),
        'complaints.updated',
      );
    };
    reader.readAsDataURL(file);
  };

  const footerActions = (
    <Stack spacing={1}>
      {canManage && (status === 'OPEN' || status === 'IN_PROGRESS') ? (
        <>
          <TextField
            size="small"
            label={t('complaints.fields.resolution')}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder={t('complaints.placeholders.resolution')}
            multiline
            minRows={2}
            fullWidth
          />
          {status === 'OPEN' ? (
            <Button
              variant="outlined"
              onClick={() =>
                void run(
                  () =>
                    mutations.updateStatus.mutateAsync({
                      complaintId: complaint.complaintId,
                      body: { status: 'IN_PROGRESS' satisfies ComplaintStatus },
                    }),
                  'complaints.updated',
                )
              }
              disabled={mutations.updateStatus.isPending}
              sx={dashOutlinedButtonSx}
            >
              {t('complaints.actions.start')}
            </Button>
          ) : null}
          <Button
            variant="contained"
            onClick={() => {
              if (!resolution.trim()) {
                enqueueSnackbar(t('complaints.errors.requiredFields'), { variant: 'warning' });
                return;
              }
              void run(
                () =>
                  mutations.updateResolution.mutateAsync({
                    complaintId: complaint.complaintId,
                    body: { resolutionSummary: resolution.trim(), markResolved: true },
                  }),
                'complaints.updated',
              );
            }}
            disabled={mutations.updateResolution.isPending}
            sx={{
              ...dashContainedButtonSx,
              bgcolor: colors.primaryDark,
              '&:hover': { bgcolor: colors.primaryHover },
            }}
          >
            {t('complaints.actions.resolve')}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() =>
              void run(
                () =>
                  mutations.updateStatus.mutateAsync({
                    complaintId: complaint.complaintId,
                    body: { status: 'CANCELLED' },
                  }),
                'complaints.updated',
              )
            }
            disabled={mutations.updateStatus.isPending}
            sx={dashOutlinedButtonSx}
          >
            {t('complaints.actions.cancel')}
          </Button>
        </>
      ) : null}
      {canManage && status === 'RESOLVED' ? (
        <Button
          variant="contained"
          onClick={() =>
            void run(
              () =>
                mutations.updateStatus.mutateAsync({
                  complaintId: complaint.complaintId,
                  body: { status: 'CLOSED' },
                }),
              'complaints.updated',
            )
          }
          disabled={mutations.updateStatus.isPending}
          sx={{
            ...dashContainedButtonSx,
            bgcolor: colors.primaryDark,
            '&:hover': { bgcolor: colors.primaryHover },
          }}
        >
          {t('complaints.actions.close')}
        </Button>
      ) : null}
      {complaint.canReopen ? (
        <Button
          variant="outlined"
          onClick={() =>
            void run(
              () => mutations.reopen.mutateAsync({ complaintId: complaint.complaintId }),
              'complaints.reopened',
            )
          }
          disabled={mutations.reopen.isPending}
          sx={dashOutlinedButtonSx}
        >
          {t('complaints.actions.reopen')}
        </Button>
      ) : null}
    </Stack>
  );

  return (
    <SidePanel
      title={complaint.title}
      subtitle={complaint.createdByMemberName ?? undefined}
      onClose={onClose}
      footer={footerActions}
      framed={framed}
    >
      <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <StatusChip
            label={t(statusLabelKey(status))}
            tone={complaintStatusTone(status)}
          />
          <StatusChip
            label={t(priorityLabelKey(complaint.priority))}
            tone={complaintPriorityTone(complaint.priority)}
          />
          <StatusChip label={t(categoryLabelKey(complaint.category))} tone="neutral" />
        </Stack>

        <InspectorCard title={t('complaints.detailTitle')}>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 1.25 }}>
            {complaint.description}
          </Typography>
          <DetailGrid
            items={[
              {
                label: t('complaints.fields.reporter'),
                value: complaint.createdByMemberName,
              },
              {
                label: t('complaints.fields.assigned'),
                value: complaint.assignedToName ?? t('complaints.unassigned'),
              },
              {
                label: t('complaints.fields.updated'),
                value: formatComplaintDateTime(complaint.updatedAt),
              },
              {
                label: t('complaints.fields.resolution'),
                value: complaint.resolutionSummary,
              },
              {
                label: t('complaints.fields.meal'),
                value: complaint.mealDate
                  ? `${complaint.mealDate}${
                      complaint.mealType
                        ? ` · ${t(`complaints.mealType.${complaint.mealType}`)}`
                        : ''
                    }`
                  : null,
              },
            ]}
          />
        </InspectorCard>

        {canManage ? (
          <InspectorCard title={t('complaints.fields.assign')}>
            <FormControl size="small" fullWidth>
              <InputLabel>{t('complaints.fields.assign')}</InputLabel>
              <Select
                label={t('complaints.fields.assign')}
                value={complaint.assignedToMembershipId ?? ''}
                onChange={(e) => {
                  const value = String(e.target.value);
                  void run(
                    () =>
                      mutations.assign.mutateAsync({
                        complaintId: complaint.complaintId,
                        body: { assigneeMembershipId: value || null },
                      }),
                    'complaints.updated',
                  );
                }}
              >
                <MenuItem value="">{t('complaints.unassigned')}</MenuItem>
                {assigneeOptions.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </InspectorCard>
        ) : null}

        <InspectorCard
          title={t('complaints.fields.photos')}
          action={
            canAddAttachment ? (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
                />
                <Button
                  size="small"
                  startIcon={<Paperclip size={14} />}
                  onClick={() => fileRef.current?.click()}
                  sx={dashOutlinedButtonSx}
                >
                  {t('complaints.actions.addPhoto')}
                </Button>
              </>
            ) : undefined
          }
        >
          {attachments.length === 0 ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
              {t('complaints.photos.empty')}
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {attachments.map((att) => (
                <Box
                  key={att.attachmentId}
                  component="img"
                  src={att.storageUrl}
                  alt={att.fileName ?? t('complaints.fields.photos')}
                  sx={{
                    width: 88,
                    height: 88,
                    objectFit: 'cover',
                    borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                    border: `1px solid ${s.border}`,
                  }}
                />
              ))}
            </Stack>
          )}
        </InspectorCard>

        <InspectorCard title={t('complaints.comments')}>
          {comments.length === 0 ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted, mb: 1 }}>
              {t('complaints.commentsEmpty')}
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ mb: 1.5, maxHeight: 220, overflow: 'auto' }}>
              {comments.map((c) => (
                <Box
                  key={c.commentId}
                  sx={{
                    p: 1.25,
                    borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                    border: `1px solid ${s.border}`,
                    bgcolor: c.internal ? s.elevated : s.surface,
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                    <Typography sx={{ ...DASHBOARD_UX.smallCaption, fontWeight: 600, color: s.textPrimary }}>
                      {c.authorName ?? t('complaints.operator')}
                      {c.internal ? ` · ${t('complaints.internal')}` : ''}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                      {formatComplaintDateTime(c.createdAt)}
                    </Typography>
                  </Stack>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.5 }}>
                    {c.body}
                  </Typography>
                </Box>
              ))}
              <div ref={commentsEndRef} />
            </Stack>
          )}
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            label={t('complaints.fields.comment')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('complaints.placeholders.comment')}
          />
          {canManage ? (
            <FormControlLabel
              control={
                <Checkbox
                  checked={internalNote}
                  onChange={(e) => setInternalNote(e.target.checked)}
                  size="small"
                />
              }
              label={t('complaints.fields.internalNote')}
              sx={{ mt: 0.5 }}
            />
          ) : null}
          <Button
            size="small"
            variant="contained"
            startIcon={<Send size={14} />}
            sx={{
              ...dashContainedButtonSx,
              mt: 1,
              bgcolor: colors.primaryDark,
              '&:hover': { bgcolor: colors.primaryHover },
            }}
            onClick={postComment}
            disabled={!comment.trim() || mutations.addComment.isPending}
          >
            {t('complaints.actions.addComment')}
          </Button>
        </InspectorCard>

        <InspectorCard title={t('complaints.timeline')}>
          {timeline.length === 0 ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
              {t('complaints.timelineEmpty')}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {[...timeline]
                .sort(
                  (a, b) =>
                    new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
                )
                .map((event) => (
                  <Box
                    key={event.eventId}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      p: 1.25,
                      borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                      border: `1px solid ${s.border}`,
                      bgcolor: s.elevated,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: colors.primaryDark,
                        mt: 0.6,
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{ ...DASHBOARD_UX.body, fontWeight: 600, color: s.textPrimary }}
                      >
                        {t(timelineEventLabelKey(event.eventType))}
                      </Typography>
                      <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                        {formatComplaintDateTime(event.performedAt)}
                      </Typography>
                      {event.remarks ? (
                        <Typography
                          sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.5 }}
                        >
                          {event.remarks}
                        </Typography>
                      ) : null}
                    </Box>
                  </Box>
                ))}
            </Stack>
          )}
        </InspectorCard>
      </Stack>
    </SidePanel>
  );
}
