import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { CheckCircle2, Clock3, Search, XCircle } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { inquiryCreditsAdminApi } from '@/modules/admin/api/inquiryCreditsAdminApi';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { getErrorMessage } from '@/shared/api/errors';
import type {
  AdminInquiryPurchaseSummary,
  InquiryPurchaseResponse,
  InquiryPurchaseStatus,
} from '@/shared/types/inquiryCredits';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const PAGE_SIZE = 10;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function shortId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

type ActionTarget = {
  kind: 'approve' | 'reject';
  item: InquiryPurchaseResponse;
};

function StatusChip({ status }: { status: InquiryPurchaseStatus }) {
  const map: Record<InquiryPurchaseStatus, { label: string; bg: string; fg: string; icon: React.ReactNode }> = {
    PENDING: { label: 'Pending', bg: '#FFEDD5', fg: '#C2410C', icon: <Clock3 size={12} /> },
    APPROVED: { label: 'Approved', bg: '#DCFCE7', fg: '#15803D', icon: <CheckCircle2 size={12} /> },
    REJECTED: { label: 'Rejected', bg: '#FEE2E2', fg: '#B91C1C', icon: <XCircle size={12} /> },
  };
  const { label, bg, fg, icon } = map[status] ?? map.PENDING;
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.25,
        py: 0.35,
        borderRadius: '999px',
        bgcolor: bg,
        color: fg,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export function AdminInquiryPurchaseListPage() {
  const { enqueueSnackbar } = useSnackbar();

  const [rows, setRows] = useState<InquiryPurchaseResponse[]>([]);
  const [summary, setSummary] = useState<AdminInquiryPurchaseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<InquiryPurchaseStatus | ''>('PENDING');

  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
  const [acting, setActing] = useState(false);

  // Debounce search (client-side filter on current page)
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // Reset page on status filter change
  const filterKey = statusFilter;
  const [activeFilterKey, setActiveFilterKey] = useState(filterKey);
  if (activeFilterKey !== filterKey) {
    setActiveFilterKey(filterKey);
    setPage(0);
  }

  // Load summary
  const loadSummary = useCallback(() => {
    inquiryCreditsAdminApi
      .getPurchasesSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Load rows
  const requestKey = `${page}|${statusFilter}`;
  const [activeRequestKey, setActiveRequestKey] = useState(requestKey);
  if (activeRequestKey !== requestKey) {
    setActiveRequestKey(requestKey);
    setLoading(true);
  }

  useEffect(() => {
    let active = true;
    inquiryCreditsAdminApi
      .listPurchases({
        status: statusFilter || undefined,
        page,
        size: PAGE_SIZE,
      })
      .then((result) => {
        if (!active) return;
        setRows(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      })
      .catch(() => {
        if (!active) return;
        setRows([]);
        setTotalPages(0);
        setTotalElements(0);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [page, statusFilter]);

  const visibleRows = useMemo(() => {
    if (!debouncedQ) return rows;
    const q = debouncedQ.toLowerCase();
    return rows.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.userId.toLowerCase().includes(q) ||
        (r.userFullName ?? '').toLowerCase().includes(q) ||
        (r.userMobileNumber ?? '').toLowerCase().includes(q) ||
        r.packageId.toLowerCase().includes(q) ||
        (r.utr ?? '').toLowerCase().includes(q),
    );
  }, [rows, debouncedQ]);

  // ── Actions ──────────────────────────────────────────────────
  async function handleAction() {
    if (!actionTarget || acting) return;
    setActing(true);
    try {
      let updated: InquiryPurchaseResponse;
      if (actionTarget.kind === 'approve') {
        updated = await inquiryCreditsAdminApi.approvePurchase(actionTarget.item.id);
        enqueueSnackbar('Purchase approved — credits added.', { variant: 'success' });
      } else {
        updated = await inquiryCreditsAdminApi.rejectPurchase(actionTarget.item.id);
        enqueueSnackbar('Purchase rejected.', { variant: 'success' });
      }
      // Update row in place
      setRows((prev) =>
        prev.map((r) =>
          r.id === updated.id
            ? {
                ...r,
                status: updated.status,
                verifiedAt: updated.verifiedAt,
                rejectionReason: updated.rejectionReason,
              }
            : r,
        ),
      );
      setActionTarget(null);
      loadSummary();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Action failed. Please try again.'), {
        variant: 'error',
      });
    } finally {
      setActing(false);
    }
  }

  // ── Stat cards ───────────────────────────────────────────────
  const stats = [
    {
      key: 'pending',
      label: 'Pending',
      value: summary?.pendingCount ?? 0,
      bg: '#FFEDD5',
      fg: '#C2410C',
    },
    {
      key: 'approved',
      label: 'Approved',
      value: summary?.approvedCount ?? 0,
      bg: '#DCFCE7',
      fg: '#15803D',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      value: summary?.rejectedCount ?? 0,
      bg: '#FEE2E2',
      fg: '#B91C1C',
    },
  ];

  const showingFrom = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <Box>
      <Stack sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: 24, md: 28 }, letterSpacing: -0.5 }}>
          Credit purchase requests
        </Typography>
        <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
          Review and approve or reject seeker payment requests.
        </Typography>
      </Stack>

      {/* Summary cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        {stats.map((s) => (
          <Card
            key={s.key}
            elevation={0}
            sx={{
              flex: 1,
              borderRadius: '14px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 1px 2px rgb(15 23 42 / 0.04)',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                {s.label}
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: 26, lineHeight: 1.2, color: s.fg }}>
                {s.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Filters */}
      <Card
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: '14px',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
            <TextField
              size="small"
              fullWidth
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Filter by name, mobile, userId, packageId, UTR…"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#94A3B8" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ flex: 1, bgcolor: '#FFFFFF', '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                displayEmpty
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InquiryPurchaseStatus | '')}
                sx={{ borderRadius: '10px' }}
              >
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '14px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px rgb(15 23 42 / 0.04)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAFBFC' }}>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Package</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>UTR</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Requested</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      Loading…
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      No purchase requests found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>
                        {row.userFullName?.trim() || shortId(row.userId)}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {row.userMobileNumber || shortId(row.userId)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{ fontWeight: 600, fontSize: 13.5, fontFamily: 'monospace' }}
                        title={row.packageId}
                      >
                        {shortId(row.packageId)}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {row.credits} credits
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: 13,
                          bgcolor: '#F1F5F9',
                          px: 1,
                          py: 0.4,
                          borderRadius: '6px',
                          display: 'inline-block',
                        }}
                      >
                        {row.utr || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                        ₹{row.amount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13 }}>{formatDate(row.requestedAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={row.status} />
                    </TableCell>
                    <TableCell>
                      {row.status === 'PENDING' ? (
                        <Stack direction="row" spacing={0.75}>
                          <Button
                            size="small"
                            onClick={() => setActionTarget({ kind: 'approve', item: row })}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              bgcolor: '#DCFCE7',
                              color: '#15803D',
                              borderRadius: '8px',
                              px: 1.5,
                              '&:hover': { bgcolor: '#BBF7D0' },
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            onClick={() => setActionTarget({ kind: 'reject', item: row })}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              bgcolor: '#FEE2E2',
                              color: '#B91C1C',
                              borderRadius: '8px',
                              px: 1.5,
                              '&:hover': { bgcolor: '#FECACA' },
                            }}
                          >
                            Reject
                          </Button>
                        </Stack>
                      ) : (
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {row.verifiedAt ? formatDate(row.verifiedAt) : '—'}
                          {row.status === 'REJECTED' && row.rejectionReason
                            ? ` · ${row.rejectionReason}`
                            : ''}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            px: 2,
            py: 1.75,
            borderTop: '1px solid',
            borderColor: 'divider',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Showing {showingFrom}–{showingTo} of {totalElements}
          </Typography>
          {totalPages > 1 ? (
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(_, v) => setPage(v - 1)}
              color="primary"
              shape="rounded"
              sx={{ '& .Mui-selected': { bgcolor: '#22C55E !important', color: '#FFFFFF' } }}
            />
          ) : null}
        </Stack>
      </Card>

      {/* Confirm approve/reject */}
      <ConfirmDialog
        open={actionTarget != null}
        title={
          actionTarget?.kind === 'approve'
            ? `Approve purchase — ${actionTarget.item.userFullName || shortId(actionTarget.item.userId)}?`
            : `Reject purchase — ${actionTarget ? (actionTarget.item.userFullName || shortId(actionTarget.item.userId)) : ''}?`
        }
        description={
          actionTarget
            ? actionTarget.kind === 'approve'
              ? `This will add ${actionTarget.item.credits} credits to the user's account. UTR: ${actionTarget.item.utr || '—'}`
              : `The purchase request for package ${shortId(actionTarget.item.packageId)} (₹${actionTarget.item.amount}) will be rejected.`
            : undefined
        }
        confirmLabel={actionTarget?.kind === 'approve' ? 'Approve' : 'Reject'}
        cancelLabel="Cancel"
        destructive={actionTarget?.kind === 'reject'}
        confirming={acting}
        onConfirm={() => void handleAction()}
        onClose={() => setActionTarget(null)}
      />
    </Box>
  );
}
