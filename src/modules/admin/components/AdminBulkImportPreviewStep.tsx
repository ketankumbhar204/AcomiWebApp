import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Filter,
  Grid2x2,
  Info,
  Search,
  X,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { colors } from '@/shared/theme/colors';
import {
  PROPERTY_BULK_IMPORT_FIELDS,
  type PropertyBulkImportFieldKey,
  type PropertyBulkImportMapping,
  type PropertyBulkImportPreviewResponse,
  type PropertyBulkImportPreviewRow,
} from '@/shared/types/adminBulkImport';

const PAGE_SIZE = 10;

const PREFERRED_COLUMN_ORDER: PropertyBulkImportFieldKey[] = [
  'PROPERTY_TYPE',
  'PROPERTY_NAME',
  'MOBILE_NUMBER',
  'ALTERNATE_MOBILE_NUMBER',
  'CONTACT_3',
  'GENDER',
  'SHARING',
  'STARTING_PRICE',
  'AMENITIES',
  'FOOD_INCLUDED',
  'LATITUDE',
  'LONGITUDE',
  'ADDRESS_LINE',
  'OWNER_NAME',
  'CITY',
  'STATE',
  'PINCODE',
  'MAP_URL',
  'TEST_LEAD',
];

type StatusFilter = 'ALL' | 'VALID' | 'INVALID' | 'BLANK' | 'DUPLICATE';
export type DuplicateDecision = 'KEEP' | 'SKIP';

type Props = {
  preview: PropertyBulkImportPreviewResponse;
  mapping: PropertyBulkImportMapping;
  busy: boolean;
  duplicateDecisions: Record<string, DuplicateDecision>;
  onDuplicateDecisionChange: (rowNumber: number, decision: DuplicateDecision) => void;
  onDuplicateDecisionBulkChange: (decision: DuplicateDecision) => void;
  onBack: () => void;
  onImport: () => void;
};

function displayValue(value: string | null | undefined): string {
  if (value == null || String(value).trim() === '') return '—';
  return String(value);
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function duplicateTooltip(row: PropertyBulkImportPreviewRow, fallback: string): string {
  const parts = [
    row.duplicateMatch?.reason,
    row.duplicateMatch?.matchedReference,
    row.duplicateMatch?.matchedName,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : fallback;
}

function rowMatchesSearch(row: PropertyBulkImportPreviewRow, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (String(row.rowNumber).includes(q)) return true;
  if (row.status.toLowerCase().includes(q)) return true;
  if (row.duplicateMatch?.reason?.toLowerCase().includes(q)) return true;
  if (row.duplicateMatch?.matchedName?.toLowerCase().includes(q)) return true;
  for (const value of Object.values(row.values ?? {})) {
    if (String(value ?? '').toLowerCase().includes(q)) return true;
  }
  for (const err of row.errors ?? []) {
    if (`${err.field} ${err.message}`.toLowerCase().includes(q)) return true;
  }
  return false;
}

export function AdminBulkImportPreviewStep({
  preview,
  mapping,
  busy,
  duplicateDecisions,
  onDuplicateDecisionChange,
  onDuplicateDecisionBulkChange,
  onBack,
  onImport,
}: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());

  const duplicateCount = preview.duplicate ?? preview.rows.filter((r) => r.status === 'DUPLICATE').length;

  const columns = useMemo(() => {
    const mapped = PROPERTY_BULK_IMPORT_FIELDS.filter((field) => Boolean(mapping[field]));
    const ordered = PREFERRED_COLUMN_ORDER.filter((field) => mapped.includes(field));
    for (const field of mapped) {
      if (!ordered.includes(field)) ordered.push(field);
    }
    return ordered.map((field) => ({
      field,
      header: mapping[field] ?? t(`admin.propertyBulk.fields.${field}`),
    }));
  }, [mapping, t]);

  const filteredRows = useMemo(() => {
    return preview.rows.filter((row) => {
      if (errorsOnly && row.status !== 'INVALID') return false;
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
      return rowMatchesSearch(row, search.trim());
    });
  }, [preview.rows, errorsOnly, statusFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filteredRows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const showingFrom = filteredRows.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const showingTo = Math.min(filteredRows.length, (safePage + 1) * PAGE_SIZE);

  const allPageSelected =
    pageRows.length > 0 && pageRows.every((row) => selected.has(row.rowNumber));
  const somePageSelected = pageRows.some((row) => selected.has(row.rowNumber));

  const keptDuplicates = useMemo(
    () =>
      Object.entries(duplicateDecisions)
        .filter(([, decision]) => decision === 'KEEP')
        .map(([rowNumber]) => Number(rowNumber)),
    [duplicateDecisions],
  );
  const skippedDuplicates = Math.max(0, duplicateCount - keptDuplicates.length);
  const importCount = preview.valid + keptDuplicates.length;
  const hasDuplicates = duplicateCount > 0;
  const canImport = importCount > 0;

  function toggleAllPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const row of pageRows) next.delete(row.rowNumber);
      } else {
        for (const row of pageRows) next.add(row.rowNumber);
      }
      return next;
    });
  }

  function toggleRow(rowNumber: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  }

  const validPct = pct(preview.valid, preview.totalRows);
  const invalidPct = pct(preview.invalid, preview.totalRows);
  const blankPct = pct(preview.blank, preview.totalRows);
  const duplicatePct = pct(duplicateCount, preview.totalRows);

  const bannerTone: 'duplicate' | 'ready' | 'partial' | 'empty' = hasDuplicates
    ? 'duplicate'
    : !canImport
      ? 'empty'
      : preview.invalid === 0
        ? 'ready'
        : 'partial';

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(5, minmax(0, 1fr))',
          },
          gap: 1.5,
        }}
      >
        <SummaryCard
          label={t('admin.propertyBulk.summaryTotal')}
          value={preview.totalRows}
          icon={<Grid2x2 size={18} />}
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
        />
        <SummaryCard
          label={t('admin.propertyBulk.summaryValid')}
          value={preview.valid}
          percent={validPct}
          icon={<Check size={18} />}
          iconBg={colors.mintSubtle}
          iconColor={colors.success}
          cardBg={colors.mintSubtle}
        />
        <SummaryCard
          label={t('admin.propertyBulk.summaryDuplicate')}
          value={duplicateCount}
          percent={duplicatePct}
          icon={<Copy size={18} />}
          iconBg="#FEF3C7"
          iconColor="#B45309"
          cardBg="#FFFBEB"
        />
        <SummaryCard
          label={t('admin.propertyBulk.summaryInvalid')}
          value={preview.invalid}
          percent={invalidPct}
          icon={<X size={18} />}
          iconBg="#FEE2E2"
          iconColor="#DC2626"
          cardBg="#FEF2F2"
        />
        <SummaryCard
          label={t('admin.propertyBulk.summaryBlank')}
          value={preview.blank}
          percent={blankPct}
          icon={<AlertTriangle size={18} />}
          iconBg="#FFEDD5"
          iconColor="#D97706"
          cardBg="#FFF7ED"
        />
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: `1px solid ${
            bannerTone === 'empty'
              ? '#FECACA'
              : bannerTone === 'duplicate'
                ? '#FDE68A'
                : `${colors.primary}44`
          }`,
          bgcolor:
            bannerTone === 'empty'
              ? '#FEF2F2'
              : bannerTone === 'duplicate'
                ? '#FFFBEB'
                : colors.mintSubtle,
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-start',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            bgcolor:
              bannerTone === 'empty'
                ? '#FECACA'
                : bannerTone === 'duplicate'
                  ? '#FDE68A'
                  : colors.primary,
            color: bannerTone === 'ready' ? '#fff' : '#92400E',
          }}
        >
          {bannerTone === 'empty' ? (
            <X size={20} color="#991B1B" />
          ) : bannerTone === 'duplicate' ? (
            <AlertTriangle size={20} />
          ) : (
            <CheckCircle2 size={22} color="#fff" />
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, mb: 0.25 }}>
            {bannerTone === 'duplicate'
              ? t('admin.propertyBulk.bannerDuplicateTitle', { count: duplicateCount })
              : bannerTone === 'empty'
                ? t('admin.propertyBulk.bannerNoneValidTitle')
                : bannerTone === 'ready'
                  ? t('admin.propertyBulk.bannerAllValidTitle')
                  : t('admin.propertyBulk.bannerPartialTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {bannerTone === 'duplicate'
              ? t('admin.propertyBulk.bannerDuplicateBody', {
                  keep: keptDuplicates.length,
                  skip: skippedDuplicates,
                  importCount,
                })
              : bannerTone === 'empty'
                ? t('admin.propertyBulk.bannerNoneValidBody')
                : bannerTone === 'ready'
                  ? t('admin.propertyBulk.bannerAllValidBody', { count: preview.valid })
                  : t('admin.propertyBulk.bannerPartialBody', {
                      valid: preview.valid,
                      invalid: preview.invalid,
                    })}
          </Typography>
          {hasDuplicates ? (
            <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: 'wrap' }}>
              <Button
                type="button"
                size="small"
                variant={skippedDuplicates === duplicateCount ? 'contained' : 'outlined'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDuplicateDecisionBulkChange('SKIP');
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  ...(skippedDuplicates === duplicateCount
                    ? { bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' } }
                    : {}),
                }}
              >
                {t('admin.propertyBulk.skipAllDuplicates')}
              </Button>
              <Button
                type="button"
                size="small"
                variant={keptDuplicates.length === duplicateCount ? 'contained' : 'outlined'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDuplicateDecisionBulkChange('KEEP');
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  ...(keptDuplicates.length === duplicateCount
                    ? { bgcolor: colors.primary, '&:hover': { bgcolor: colors.primaryHover } }
                    : {}),
                }}
              >
                {t('admin.propertyBulk.keepAllDuplicates')}
              </Button>
            </Stack>
          ) : null}
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          border: `1px solid ${colors.border}`,
          bgcolor: colors.surface,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-start' }, mb: 2 }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('admin.propertyBulk.previewCardTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('admin.propertyBulk.previewCardHintDuplicates')}
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <TextField
              size="small"
              placeholder={t('admin.propertyBulk.searchRows')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: { sm: 200 }, bgcolor: colors.surface, borderRadius: 2 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setErrorsOnly(false);
                  setPage(0);
                }}
                sx={{ borderRadius: 2, bgcolor: colors.surface }}
              >
                <MenuItem value="ALL">{t('admin.propertyBulk.filterAll')}</MenuItem>
                <MenuItem value="VALID">{t('admin.propertyBulk.filterValid')}</MenuItem>
                <MenuItem value="DUPLICATE">{t('admin.propertyBulk.filterDuplicate')}</MenuItem>
                <MenuItem value="INVALID">{t('admin.propertyBulk.filterInvalid')}</MenuItem>
                <MenuItem value="BLANK">{t('admin.propertyBulk.filterBlank')}</MenuItem>
              </Select>
            </FormControl>
            <Button
              size="small"
              variant={errorsOnly ? 'contained' : 'outlined'}
              startIcon={<Filter size={16} />}
              onClick={() => {
                setErrorsOnly((v) => !v);
                setStatusFilter('ALL');
                setPage(0);
              }}
              sx={{
                borderRadius: 2,
                whiteSpace: 'nowrap',
                ...(errorsOnly
                  ? {
                      bgcolor: '#DC2626',
                      '&:hover': { bgcolor: '#B91C1C' },
                    }
                  : {}),
              }}
            >
              {t('admin.propertyBulk.viewErrorsOnly')}
            </Button>
          </Stack>
        </Stack>

        <TableContainer sx={{ maxHeight: 480, border: `1px solid ${colors.border}`, borderRadius: 2 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ bgcolor: colors.surfaceSecondary }}>
                  <Checkbox
                    size="small"
                    checked={allPageSelected}
                    indeterminate={somePageSelected && !allPageSelected}
                    onChange={toggleAllPage}
                  />
                </TableCell>
                <TableCell sx={{ bgcolor: colors.surfaceSecondary, fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ bgcolor: colors.surfaceSecondary, fontWeight: 700 }}>
                  {t('admin.propertyBulk.columns.status')}
                </TableCell>
                <TableCell sx={{ bgcolor: colors.surfaceSecondary, fontWeight: 700 }}>
                  {t('admin.propertyBulk.columns.decision')}
                </TableCell>
                {columns.map((col) => (
                  <TableCell
                    key={col.field}
                    sx={{ bgcolor: colors.surfaceSecondary, fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    {col.header}
                  </TableCell>
                ))}
                <TableCell sx={{ bgcolor: colors.surfaceSecondary, fontWeight: 700 }}>
                  {t('admin.propertyBulk.columns.errors')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">{t('admin.propertyBulk.noPreviewRows')}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row, index) => {
                  const isDuplicate = row.status === 'DUPLICATE';
                  const decision = duplicateDecisions[String(row.rowNumber)] ?? 'SKIP';
                  return (
                    <TableRow
                      key={row.rowNumber}
                      hover
                      sx={{
                        bgcolor: isDuplicate
                          ? decision === 'KEEP'
                            ? '#ECFDF5'
                            : '#FFFBEB'
                          : index % 2 === 1
                            ? colors.surfaceSecondary
                            : colors.surface,
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selected.has(row.rowNumber)}
                          onChange={() => toggleRow(row.rowNumber)}
                        />
                      </TableCell>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>
                        <StatusChip status={row.status} />
                      </TableCell>
                      <TableCell sx={{ minWidth: 160, position: 'relative', zIndex: 1 }}>
                        {isDuplicate ? (
                          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                            <Button
                              type="button"
                              size="small"
                              variant={decision === 'SKIP' ? 'contained' : 'outlined'}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDuplicateDecisionChange(row.rowNumber, 'SKIP');
                              }}
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                ...(decision === 'SKIP'
                                  ? { bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' } }
                                  : {}),
                              }}
                            >
                              {t('admin.propertyBulk.skipDuplicate')}
                            </Button>
                            <Button
                              type="button"
                              size="small"
                              variant={decision === 'KEEP' ? 'contained' : 'outlined'}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDuplicateDecisionChange(row.rowNumber, 'KEEP');
                              }}
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 700,
                                ...(decision === 'KEEP'
                                  ? {
                                      bgcolor: colors.primary,
                                      '&:hover': { bgcolor: colors.primaryHover },
                                    }
                                  : {}),
                              }}
                            >
                              {t('admin.propertyBulk.keepDuplicate')}
                            </Button>
                            <Tooltip
                              title={duplicateTooltip(
                                row,
                                t('admin.propertyBulk.duplicateUnknownReason'),
                              )}
                              arrow
                              enterTouchDelay={0}
                            >
                              <IconButton
                                type="button"
                                size="small"
                                aria-label={t('admin.propertyBulk.duplicateUnknownReason')}
                                sx={{ color: '#B45309' }}
                              >
                                <Info size={16} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      {columns.map((col) => (
                        <TableCell
                          key={`${row.rowNumber}-${col.field}`}
                          sx={{
                            maxWidth: 220,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={displayValue(row.values?.[col.field])}
                        >
                          {displayValue(row.values?.[col.field])}
                        </TableCell>
                      ))}
                      <TableCell
                        sx={{ maxWidth: 260, color: row.errors?.length ? '#B91C1C' : 'text.secondary' }}
                      >
                        {(row.errors ?? []).length === 0
                          ? '—'
                          : (row.errors ?? []).map((err) => `${err.field}: ${err.message}`).join('; ')}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mt: 1.5 }}
        >
          <Typography variant="body2" color="text.secondary">
            {t('admin.propertyBulk.showingRows', {
              from: showingFrom,
              to: showingTo,
              total: filteredRows.length,
            })}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Button
              size="small"
              variant="outlined"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              sx={{ minWidth: 36, px: 1 }}
            >
              ‹
            </Button>
            <Box
              sx={{
                minWidth: 36,
                height: 32,
                borderRadius: 1,
                display: 'grid',
                placeItems: 'center',
                bgcolor: colors.primary,
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {safePage + 1}
            </Box>
            <Button
              size="small"
              variant="outlined"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              sx={{ minWidth: 36, px: 1 }}
            >
              ›
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowLeft size={16} />}
          onClick={onBack}
          disabled={busy}
          sx={{ borderRadius: 2, px: 2.5 }}
        >
          {t('admin.propertyBulk.back')}
        </Button>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
          <Button
            variant="outlined"
            disabled={busy || !canImport}
            onClick={() => onImport()}
            sx={{ borderRadius: 2, px: 2.5, fontWeight: 600 }}
          >
            {t('admin.propertyBulk.importValidCount', { count: importCount })}
          </Button>
          <Button
            variant="contained"
            endIcon={busy ? undefined : <ArrowRight size={16} />}
            disabled={busy || !canImport}
            onClick={() => onImport()}
            sx={{
              borderRadius: 2,
              px: 2.5,
              bgcolor: colors.primary,
              '&:hover': { bgcolor: colors.primaryHover },
              fontWeight: 700,
            }}
          >
            {busy ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t('admin.propertyBulk.continueImport')
            )}
          </Button>
        </Stack>
      </Stack>

      {!canImport ? (
        <Alert severity="warning">
          {hasDuplicates
            ? t('admin.propertyBulk.noRowsAfterSkip')
            : t('admin.propertyBulk.noValidRows')}
        </Alert>
      ) : null}
    </Stack>
  );
}

function SummaryCard({
  label,
  value,
  percent,
  icon,
  iconBg,
  iconColor,
  cardBg = colors.surface,
}: {
  label: string;
  value: number;
  percent?: number;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  cardBg?: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: `1px solid ${colors.border}`,
        bgcolor: cardBg,
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: iconBg,
            color: iconColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
            {label}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 28, lineHeight: 1 }}>{value}</Typography>
            {percent != null ? (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {percent}%
              </Typography>
            ) : null}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

function StatusChip({ status }: { status: string }) {
  const { t } = useTranslation();
  const normalized = status.toUpperCase();
  if (normalized === 'VALID') {
    return (
      <Chip
        size="small"
        label={t('admin.propertyBulk.statusValid')}
        sx={{ bgcolor: colors.mintSubtle, color: '#047857', fontWeight: 700 }}
      />
    );
  }
  if (normalized === 'DUPLICATE') {
    return (
      <Chip
        size="small"
        label={t('admin.propertyBulk.statusDuplicate')}
        sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 700 }}
      />
    );
  }
  if (normalized === 'INVALID') {
    return (
      <Chip
        size="small"
        label={t('admin.propertyBulk.statusInvalid')}
        sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 700 }}
      />
    );
  }
  return (
    <Chip
      size="small"
      label={t('admin.propertyBulk.statusBlank')}
      sx={{ bgcolor: '#F3F4F6', color: '#6B7280', fontWeight: 700 }}
    />
  );
}
