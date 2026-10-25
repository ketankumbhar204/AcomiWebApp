import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Radio,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowLeft, Bell, CheckCircle2, CircleHelp, RefreshCw, Trash2 } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import {
  adminNotificationTestApi,
  type AdminNotificationTestAttempt,
  type AdminNotificationTestPage,
  type AdminNotificationTestType,
} from '@/modules/admin/api/adminNotificationTestApi';
import { getErrorMessage } from '@/shared/api/errors';
import {
  buildTestRequest,
  diagnosticTone,
  historyPlatform,
  nextSendAllowed,
  channelLabel,
  previewTypes,
  resultMessage,
  resultTone,
  statusChecks,
  typeLabel,
  statusHeading,
  toneColor,
  TYPE_PREVIEW_COUNT,
  validateTestSend,
} from '@/modules/admin/notificationTesting/notificationTesting';

const CATEGORY_ORDER = [
  'Payments',
  'Account',
  'Enquiries',
  'Inquiry credits',
  'Members',
  'Occupancy',
  'Meals',
  'Complaints',
];

function requestId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function maskDevice(deviceId: string): string {
  return deviceId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'device';
}

export function AdminNotificationTestingPage() {
  const [page, setPage] = useState<AdminNotificationTestPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<'PUSH' | 'IN_APP'>('PUSH');
  const [target, setTarget] = useState<'ACCOUNT' | 'DEVICES'>('ACCOUNT');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [statusOpen, setStatusOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [result, setResult] = useState<AdminNotificationTestAttempt | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const sendingRef = useRef(false);

  async function load() {
    const next = await adminNotificationTestApi.page();
    setPage(next);
    setType((current) => current || next.types.find((item) => item.safeToTest)?.notificationType || '');
    setCategory((current) => current || next.types[0]?.category || 'Payments');
  }

  useEffect(() => {
    load()
      .catch((err: unknown) => setError(getErrorMessage(err, 'Could not load notification tests.')))
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(
    () => page?.types.find((item) => item.notificationType === type),
    [page, type],
  );

  useEffect(() => {
    if (!selected) return;
    setTitle(selected.defaultTitle);
    setBody(selected.defaultBody);
    setCategory(selected.category);
  }, [selected?.notificationType]);

  const categories = useMemo(() => {
    const present = new Set((page?.types ?? []).map((item) => item.category));
    const ordered = CATEGORY_ORDER.filter((name) => present.has(name));
    for (const name of present) {
      if (!ordered.includes(name)) ordered.push(name);
    }
    return ordered;
  }, [page]);

  const categoryTypes = useMemo(
    () => (page?.types ?? []).filter((item) => item.category === (category || categories[0])),
    [page, category, categories],
  );
  const visibleTypes = previewTypes(categoryTypes, showAllTypes);
  const tone = page ? diagnosticTone(page) : 'blocked';

  function chooseType(item: AdminNotificationTestType) {
    if (!item.safeToTest) return;
    setType(item.notificationType);
  }

  function requestSend() {
    if (!nextSendAllowed(sendingRef.current) || !selected || !page) return;
    const problem = validateTestSend({
      notificationType: selected.notificationType,
      safeToTest: selected.safeToTest,
      title,
      body,
      channel,
      page,
      deviceIds: selectedDevices,
      target,
    });
    if (problem) {
      setError(problem);
      setResult(null);
      return;
    }
    setError('');
    setConfirmSend(true);
  }

  async function confirmSendNow() {
    if (!nextSendAllowed(sendingRef.current) || !selected) return;
    sendingRef.current = true;
    setSending(true);
    setConfirmSend(false);
    setError('');
    setResult(null);
    try {
      const attempt = await adminNotificationTestApi.send(
        buildTestRequest({
          notificationType: selected.notificationType,
          channel,
          title,
          body,
          deviceIds: selectedDevices,
          target,
          clientRequestId: requestId(),
        }),
      );
      setResult(attempt);
      setPage(await adminNotificationTestApi.page());
    } catch (err) {
      setError(getErrorMessage(err, 'Test send failed.'));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  async function removeOne(attemptId: string) {
    setDeletingId(attemptId);
    setActionMessage('');
    try {
      const response = await adminNotificationTestApi.deleteOne(attemptId);
      setActionMessage(response.deletedCount > 0 ? 'Test record deleted.' : 'That test record was already gone.');
      setPage(await adminNotificationTestApi.page());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete that test record.'));
    } finally {
      setDeletingId(null);
    }
  }

  async function clearAll() {
    setClearing(true);
    setActionMessage('');
    try {
      const response = await adminNotificationTestApi.deleteAll();
      setConfirmClear(false);
      setActionMessage(`Deleted ${response.deletedCount} test record${response.deletedCount === 1 ? '' : 's'}.`);
      setPage(await adminNotificationTestApi.page());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not clear test history.'));
    } finally {
      setClearing(false);
    }
  }

  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 760, mx: 'auto', pb: 4 }}>
      <Button
        component={RouterLink}
        to={ROUTES.adminDashboard}
        startIcon={<ArrowLeft size={16} />}
        sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
      >
        Back
      </Button>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="h5" sx={{ flex: 1 }}>Notification Testing</Typography>
        <IconButton aria-label="About notification testing" onClick={() => setHelpOpen(true)}>
          <CircleHelp size={18} />
        </IconButton>
      </Stack>

      <Alert severity="info" icon={<Bell size={16} />}>
        Send a test notification to your admin account only. This does not change payments, members, enquiries, or other business records.
      </Alert>

      {result ? (
        <Alert severity={toneColor(resultTone(result.status))} onClose={() => setResult(null)}>
          <strong>{result.status === 'FCM_ACCEPTED' ? 'Test notification sent' : result.status}</strong>
          <div>{resultMessage(result)} Targeted {result.targetedCount}, accepted {result.acceptedCount}, failed {result.failedCount}.</div>
        </Alert>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {actionMessage ? <Alert severity="success" onClose={() => setActionMessage('')}>{actionMessage}</Alert> : null}

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Button onClick={() => setStatusOpen((open) => !open)} sx={{ flex: 1, justifyContent: 'space-between', textTransform: 'none' }} aria-expanded={statusOpen}>
            Push configuration status
          </Button>
          <Chip size="small" color={toneColor(tone)} label={page ? statusHeading(tone) : '…'} />
          <IconButton aria-label="Refresh status" disabled={loading || sending} onClick={() => void load().catch((err: unknown) => setError(getErrorMessage(err)))}>
            <RefreshCw size={16} />
          </IconButton>
        </Stack>
        <Collapse in={statusOpen}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.75, mt: 1 }}>
            {(page ? statusChecks(page) : []).map((row) => (
              <Stack key={row.label} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <CheckCircle2 size={16} color={row.ok ? '#16a34a' : '#94a3b8'} aria-label={row.ok ? 'Verified' : 'Not verified'} />
                <Typography variant="body2" sx={{ flex: 1 }}>{row.label}</Typography>
                <Typography variant="body2">{row.value}</Typography>
              </Stack>
            ))}
          </Box>
        </Collapse>
      </Box>

      {page && !page.browserPushImplemented ? (
        <Alert severity="warning">Browser push is not implemented yet.</Alert>
      ) : null}

      <Typography variant="subtitle2">1. Select notification type</Typography>
      <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }} role="tablist" aria-label="Notification categories">
        {categories.map((name) => (
          <Chip
            key={name}
            label={name}
            clickable
            color={name === (category || categories[0]) ? 'primary' : 'default'}
            variant={name === (category || categories[0]) ? 'filled' : 'outlined'}
            onClick={() => {
              setCategory(name);
              setShowAllTypes(false);
            }}
          />
        ))}
      </Stack>
      <Stack spacing={0.75}>
        {visibleTypes.map((item) => (
          <Box
            key={item.notificationType}
            role="radio"
            aria-checked={item.notificationType === type}
            onClick={() => chooseType(item)}
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'flex-start',
              border: '1px solid',
              borderColor: item.notificationType === type ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 1.25,
              cursor: item.safeToTest ? 'pointer' : 'not-allowed',
            }}
          >
            <Radio checked={item.notificationType === type} disabled={!item.safeToTest} size="small" tabIndex={-1} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2">{item.name}</Typography>
              <Typography variant="caption" color="text.secondary">{item.description}</Typography>
              <Typography variant="caption" display="block" color="text.secondary">{item.channels.join(' · ')}</Typography>
            </Box>
            <Chip size="small" label={item.safeToTest ? 'Testable' : 'Not testable'} color={item.safeToTest ? 'success' : 'default'} variant="outlined" />
          </Box>
        ))}
      </Stack>
      {categoryTypes.length > TYPE_PREVIEW_COUNT ? (
        <Button onClick={() => setShowAllTypes((value) => !value)}>
          {showAllTypes ? 'Show less' : `Show ${categoryTypes.length - TYPE_PREVIEW_COUNT} more ${category.toLowerCase()} types`}
        </Button>
      ) : null}

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2">2. Message content</Typography>
        <Button
          size="small"
          onClick={() => {
            if (!selected) return;
            setTitle(selected.defaultTitle);
            setBody(selected.defaultBody);
          }}
        >
          Reset
        </Button>
      </Stack>
      <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} fullWidth inputProps={{ maxLength: 120 }} />
      <TextField label="Body" value={body} onChange={(event) => setBody(event.target.value)} fullWidth multiline minRows={2} inputProps={{ maxLength: 300 }} />

      <Typography variant="subtitle2">3. Recipient</Typography>
      <Box
        onClick={() => setTarget('ACCOUNT')}
        sx={{ border: '1px solid', borderColor: target === 'ACCOUNT' ? 'primary.main' : 'divider', borderRadius: 2, p: 1.25 }}
      >
        <Typography variant="body2">{target === 'ACCOUNT' ? '●' : '○'} My admin account</Typography>
        <Typography variant="caption" color="text.secondary">Sends only to this account’s registered devices.</Typography>
        {(page?.registrations ?? []).map((device) => (
          <Typography key={device.deviceTokenId} variant="caption" display="block">
            {device.platform} · {maskDevice(device.deviceId)} · {device.active ? 'Active' : 'Inactive'}
          </Typography>
        ))}
      </Box>
      {(page?.registrations.length ?? 0) > 0 ? (
        <Button size="small" onClick={() => setTarget(target === 'DEVICES' ? 'ACCOUNT' : 'DEVICES')}>
          {target === 'DEVICES' ? 'Use every device on my account' : 'Choose a specific device'}
        </Button>
      ) : null}
      {target === 'DEVICES'
        ? (page?.registrations ?? []).map((device) => (
            <Button
              key={device.deviceTokenId}
              variant={selectedDevices.includes(device.deviceTokenId) ? 'contained' : 'outlined'}
              onClick={() =>
                setSelectedDevices((current) =>
                  current.includes(device.deviceTokenId)
                    ? current.filter((id) => id !== device.deviceTokenId)
                    : [...current, device.deviceTokenId],
                )
              }
            >
              {device.platform} · {maskDevice(device.deviceId)}
            </Button>
          ))
        : null}

      <Typography variant="subtitle2">4. Delivery channel</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button variant={channel === 'PUSH' ? 'contained' : 'outlined'} onClick={() => setChannel('PUSH')} sx={{ flex: 1 }}>
          FCM mobile push
        </Button>
        <Button variant={channel === 'IN_APP' ? 'contained' : 'outlined'} onClick={() => setChannel('IN_APP')} sx={{ flex: 1 }}>
          In-app only
        </Button>
        <Button disabled sx={{ flex: 1 }}>Browser push — not implemented</Button>
      </Stack>

      <Button variant="contained" disabled={sending || loading || !selected} onClick={requestSend} sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, minWidth: { sm: 280 } }}>
        {sending ? 'Sending…' : 'Send Test Notification'}
      </Button>

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2">Recent test notifications</Typography>
        <Button color="error" size="small" disabled={!page?.history.length || clearing} onClick={() => setConfirmClear(true)} startIcon={<Trash2 size={14} />}>
          Clear all
        </Button>
      </Stack>
      {(page?.history ?? []).length === 0 ? (
        <Typography variant="body2" color="text.secondary">No test notifications yet.</Typography>
      ) : (
        (page?.history ?? []).map((item) => (
          <Stack key={item.attemptId} direction="row" spacing={1} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.25, alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2">{typeLabel(page?.types ?? [], item.notificationType)}</Typography>
              <Chip size="small" label={item.status} color={toneColor(resultTone(item.status))} variant="outlined" sx={{ my: 0.5 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                {item.createdAt || '—'} · {channelLabel(item.channel)} · {historyPlatform(item)} · targeted {item.targetedCount} · accepted {item.acceptedCount} · failed {item.failedCount}
                {item.errorDetail ? ` · ${item.errorDetail}` : ''}
              </Typography>
            </Box>
            <IconButton aria-label={`Delete test ${item.notificationType}`} disabled={deletingId === item.attemptId} onClick={() => void removeOne(item.attemptId)}>
              <Trash2 size={16} />
            </IconButton>
          </Stack>
        ))
      )}

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Notification testing</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            A test sends a fixture to this admin account. Firebase acceptance means the request was taken, not that the phone showed a system notification. Browser push is not implemented.
          </Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setHelpOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={confirmSend} onClose={() => setConfirmSend(false)} fullWidth maxWidth="xs">
        <DialogTitle>Send Test Notification</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This sends “{title.trim()}” only to the current admin account’s registered device. It does not notify other users or change business records.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSend(false)}>Cancel</Button>
          <Button variant="contained" disabled={sending} onClick={() => void confirmSendNow()}>Send Test Notification</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmClear} onClose={() => !clearing && setConfirmClear(false)} fullWidth maxWidth="xs">
        <DialogTitle>Clear all test notifications?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This permanently deletes notification test-history records. It does not affect real notifications, payments, members, enquiries, or other business data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClear(false)} disabled={clearing}>Cancel</Button>
          <Button color="error" variant="contained" disabled={clearing} onClick={() => void clearAll()}>
            {clearing ? 'Deleting…' : 'Delete all'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
