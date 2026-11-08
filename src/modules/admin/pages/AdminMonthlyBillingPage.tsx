import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { getErrorMessage } from '@/shared/api/errors';
import {
  monthlyBillingAdminApi,
  type MonthlyBillingMonitor,
} from '@/modules/admin/api/monthlyBillingAdminApi';

function formatWhen(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function AdminMonthlyBillingPage() {
  const [monitor, setMonitor] = useState<MonthlyBillingMonitor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const next = await monthlyBillingAdminApi.snapshot();
    setMonitor(next);
  }, []);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((cause: unknown) => setError(getErrorMessage(cause)))
      .finally(() => setLoading(false));
  }, [load]);

  async function run(action: 'run' | 'retry') {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const next = action === 'run'
        ? await monthlyBillingAdminApi.run()
        : await monthlyBillingAdminApi.retryFailed();
      setMonitor(next);
      setSuccess(
        action === 'run'
          ? 'Due billing finished. A second run does not create another payment for the same period.'
          : 'Failed notifications were retried. Retry does not create another payment.',
      );
    } catch (cause: unknown) {
      setError(getErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button variant="contained" disabled={busy} onClick={() => void run('run')}>
          Run due billing
        </Button>
        <Button variant="outlined" disabled={busy} onClick={() => void run('retry')}>
          Retry failed notifications
        </Button>
      </Stack>
      {loading ? <Alert severity="info">Loading billing runs…</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}
      <Alert severity="info">
        Firebase acceptance means the provider took the message. It does not mean the phone displayed it.
        Retrying a notification does not create another payment. Mess and Tiffin packs are not calendar-month charges.
      </Alert>
      {monitor ? (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Chip label={`Last success ${formatWhen(monitor.lastSuccessfulFinishedAt)}`} />
          <Chip label={`Queued ${monitor.notificationsPending}`} />
          <Chip label={`FCM accepted ${monitor.notificationsAcceptedByFirebase}`} />
          <Chip label={`Failed ${monitor.notificationsFailed}`} />
          <Chip label={`Skipped ${monitor.notificationsSkipped}`} />
        </Stack>
      ) : null}
      <Typography variant="subtitle1">Runs</Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Run</TableCell>
              <TableCell>Month</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Eligible rent</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Skipped</TableCell>
              <TableCell>Failed</TableCell>
              <TableCell>Notices queued</TableCell>
              <TableCell>Skip reasons</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && !error && monitor && monitor.runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>No billing runs yet.</TableCell>
              </TableRow>
            ) : null}
            {(monitor?.runs ?? []).map((run) => (
              <TableRow key={run.id}>
                <TableCell>{run.id}</TableCell>
                <TableCell>{run.billingMonth}</TableCell>
                <TableCell>{run.status}</TableCell>
                <TableCell>{run.eligibleAccommodation}</TableCell>
                <TableCell>{run.paymentsCreated}</TableCell>
                <TableCell>{run.paymentsSkipped}</TableCell>
                <TableCell>{run.paymentsFailed}</TableCell>
                <TableCell>{run.notificationsQueued}</TableCell>
                <TableCell>{run.skipSummary || run.errorMessage || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Typography variant="subtitle1">Recent customer notifications</Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Attempts</TableCell>
              <TableCell>Last error</TableCell>
              <TableCell>FCM accepted</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && !error && monitor && monitor.recentNotifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>No customer notifications yet.</TableCell>
              </TableRow>
            ) : null}
            {(monitor?.recentNotifications ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.billingMonth}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.attemptCount}</TableCell>
                <TableCell>{row.lastError || '—'}</TableCell>
                <TableCell>{formatWhen(row.fcmAcceptedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Stack>
  );
}
