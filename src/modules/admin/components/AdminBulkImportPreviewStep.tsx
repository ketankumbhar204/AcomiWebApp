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
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { colors } from '@/shared/theme/colors';
import {
  previewCellInputValue,
  selectOptionsWithCurrent,
} from '@/modules/admin/utils/bulkImportPreviewEdit';
import {
  PROPERTY_BULK_IMPORT_FIELDS,
  effectivePreviewStatus,
  previewErrorAppliesToField,
  remainingPreviewErrors,
  remainingPreviewNotices,
  type PropertyBulkImportFieldKey,
  type PropertyBulkImportFieldOverrides,
  type PropertyBulkImportMapping,
  type PropertyBulkImportPreviewResponse,
  type PropertyBulkImportPreviewRow,
} from '@/shared/types/adminBulkImport';

const INITIAL_ROWS = 20;
const SCROLL_CHUNK = 8;

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

type StatusFilter = 'ALL' | 'VALID' | 'WARNING' | 'INVALID' | 'BLANK' | 'DUPLICATE';
export type DuplicateDecision = 'KEEP' | 'SKIP';

type Props = {
  preview: PropertyBulkImportPreviewResponse;
  mapping: PropertyBulkImportMapping;
  busy: boolean;
  fieldOverrides: PropertyBulkImportFieldOverrides;
  onFieldOverrideChange: (
    rowNumber: number,
    field: PropertyBulkImportFieldKey,
    value: string | null,
  ) => void;
  duplicateDecisions: Record<string, DuplicateDecision>;
  onDuplicateDecisionChange: (rowNumber: number, decision: DuplicateDecision) => void;
  onDuplicateDecisionBulkChange: (decision: DuplicateDecision) => void;
  onBack: () => void;
  onImport: () => void;
};

function correctionOptions(
  field: PropertyBulkImportFieldKey,
  t: (key: string) => string,
): Array<{ value: string; label: string }> | null {
  if (field === 'FOOD_INCLUDED') {
    return [
      { value: 'Yes', label: t('admin.propertyBulk.correctYes') },
      { value: 'No', label: t('admin.propertyBulk.correctNo') },
    ];
  }
  if (field === 'GENDER') {
    return [
      { value: 'Gents', label: t('admin.propertyBulk.correctGents') },
      { value: 'Ladies', label: t('admin.propertyBulk.correctLadies') },
      { value: 'Both', label: t('admin.propertyBulk.correctBoth') },
    ];
  }
  if (field === 'PROPERTY_TYPE') {
    return [
      { value: 'PG', label: t('admin.propertyBulk.correctPg') },
      { value: 'Hostel', label: t('admin.propertyBulk.correctHostel') },
      { value: 'Co-living', label: t('admin.propertyBulk.correctColiving') },
      { value: 'Rental', label: t('admin.propertyBulk.correctRental') },
      { value: 'Mess', label: t('admin.propertyBulk.correctMess') },
      { value: 'Corporate Stay', label: t('admin.propertyBulk.correctCorporateStay') },
    ];
  }
  if (field === 'TEST_LEAD') {
    return [
      { value: 'Yes', label: t('admin.propertyBulk.correctYes') },
      { value: 'No', label: t('admin.propertyBulk.correctNo') },
    ];
  }
  return null;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function duplicateSourceLabel(
  source: string | undefined,
  t: (key: string) => string,
): string {
  return source === 'IN_FILE'
    ? t('admin.propertyBulk.duplicateInFile')
    : t('admin.propertyBulk.duplicateExisting');
}

function duplicateSummary(row: PropertyBulkImportPreviewRow, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const parts = [duplicateSourceLabel(row.duplicateMatch?.source, t)];
  if (row.duplicateMatch?.source === 'IN_FILE' && row.duplicateMatch.matchedRowNumber) {
    parts.push(t('admin.propertyBulk.duplicateMatchedRow', { row: row.duplicateMatch.matchedRowNumber }));
  }
  if (row.duplicateMatch?.reason) parts.push(row.duplicateMatch.reason);
  if (row.duplicateMatch?.matchedName) parts.push(row.duplicateMatch.matchedName);
  if (row.duplicateMatch?.matchedReference) parts.push(row.duplicateMatch.matchedReference);
  return parts.join(' · ');
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
  fieldOverrides,
  onFieldOverrideChange,
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
  const [visibleCount, setVisibleCount] = useState(INITIAL_ROWS);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);
  const visibleCountRef = useRef(INITIAL_ROWS);
  const filteredLengthRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const appendTimerRef = useRef<number | null>(null);
  const pendingContinueRef = useRef(false);
  const scheduleAppendRef = useRef<() => void>(() => {});
  visibleCountRef.current = visibleCount;

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

  const errorsByColumn = useMemo(() => {
    const columnErrors = new Map<string, { invalid: number; warning: number; normalized: number }>();
    const bump = (label: string, kind: 'invalid' | 'warning' | 'normalized') => {
      const current = columnErrors.get(label) ?? { invalid: 0, warning: 0, normalized: 0 };
      current[kind] += 1;
      columnErrors.set(label, current);
    };
    for (const row of preview.rows) {
      const seen = new Set<string>();
      for (const err of remainingPreviewErrors(row, fieldOverrides)) {
        const match = columns.find((col) => previewErrorAppliesToField(err.field, col.field));
        const label = match?.header ?? err.field ?? 'Row';
        if (seen.has(`invalid:${label}`)) continue;
        seen.add(`invalid:${label}`);
        bump(label, 'invalid');
      }
      for (const notice of remainingPreviewNotices(row, fieldOverrides)) {
        const match = columns.find((col) => previewErrorAppliesToField(notice.field, col.field));
        const label = match?.header ?? notice.field ?? 'Row';
        const kind = notice.level === 'WARNING' ? 'warning' : 'normalized';
        if (seen.has(`${kind}:${label}`)) continue;
        seen.add(`${kind}:${label}`);
        bump(label, kind);
      }
    }
    return [...columnErrors.entries()].sort(
      (a, b) =>
        b[1].invalid + b[1].warning - (a[1].invalid + a[1].warning) || a[0].localeCompare(b[0]),
    );
  }, [preview.rows, fieldOverrides, columns]);

  const filteredRows = useMemo(() => {
    return preview.rows.filter((row) => {
      const status = effectivePreviewStatus(row, fieldOverrides);
      if (errorsOnly && status !== 'INVALID') return false;
      if (statusFilter !== 'ALL' && status !== statusFilter) return false;
      return rowMatchesSearch(row, search.trim());
    });
  }, [preview.rows, errorsOnly, statusFilter, search, fieldOverrides]);
  filteredLengthRef.current = filteredRows.length;

  const visibleRows = filteredRows.slice(0, visibleCount);
  const hasMore = visibleCount < filteredRows.length;
  const errorColumns = useMemo(() => {
    const fields = new Set<PropertyBulkImportFieldKey>();
    for (const row of visibleRows) {
      for (const err of remainingPreviewErrors(row, fieldOverrides)) {
        const match = columns.find((col) => previewErrorAppliesToField(err.field, col.field));
        if (match) fields.add(match.field);
      }
    }
    return fields;
  }, [visibleRows, fieldOverrides, columns]);
  const showingFrom = filteredRows.length === 0 ? 0 : 1;
  const showingTo = visibleRows.length;

  const finishLoading = useCallback(() => {
    if (appendTimerRef.current != null) {
      window.clearTimeout(appendTimerRef.current);
      appendTimerRef.current = null;
    }
    pendingContinueRef.current = false;
    loadingMoreRef.current = false;
    setLoadingMore(false);
  }, []);

  scheduleAppendRef.current = () => {
    if (appendTimerRef.current != null || !loadingMoreRef.current) return;
    appendTimerRef.current = window.setTimeout(() => {
      appendTimerRef.current = null;
      if (!loadingMoreRef.current) return;
      if (visibleCountRef.current >= filteredLengthRef.current) {
        finishLoading();
        return;
      }
      pendingContinueRef.current = true;
      setVisibleCount((current) => {
        const next = Math.min(current + SCROLL_CHUNK, filteredLengthRef.current);
        visibleCountRef.current = next;
        return next;
      });
    }, 48);
  };

  useEffect(() => {
    return () => {
      if (appendTimerRef.current != null) window.clearTimeout(appendTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (appendTimerRef.current != null) {
      window.clearTimeout(appendTimerRef.current);
      appendTimerRef.current = null;
    }
    pendingContinueRef.current = false;
    loadingMoreRef.current = false;
    visibleCountRef.current = INITIAL_ROWS;
    setVisibleCount(INITIAL_ROWS);
    setLoadingMore(false);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [search, statusFilter, errorsOnly]);

  useEffect(() => {
    if (!pendingContinueRef.current) return;
    let follow = 0;
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      follow = window.requestAnimationFrame(() => {
        if (cancelled || !loadingMoreRef.current) return;
        pendingContinueRef.current = false;
        const root = scrollRef.current;
        const node = sentinelRef.current;
        const exhausted = visibleCountRef.current >= filteredLengthRef.current;
        const near =
          root != null &&
          node != null &&
          node.getBoundingClientRect().top <= root.getBoundingClientRect().bottom + 64;
        if (exhausted || !near) {
          finishLoading();
          return;
        }
        scheduleAppendRef.current();
      });
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      if (follow) window.cancelAnimationFrame(follow);
    };
  }, [visibleCount, finishLoading]);

  useEffect(() => {
    const node = sentinelRef.current;
    const root = scrollRef.current;
    if (!node || !root || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (loadingMoreRef.current) return;
        if (visibleCountRef.current >= filteredLengthRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        scheduleAppendRef.current();
      },
      { root, rootMargin: '64px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, filteredRows.length]);

  const allPageSelected =
    visibleRows.length > 0 && visibleRows.every((row) => selected.has(row.rowNumber));
  const somePageSelected = visibleRows.some((row) => selected.has(row.rowNumber));

  const keptDuplicates = useMemo(
    () =>
      Object.entries(duplicateDecisions)
        .filter(([, decision]) => decision === 'KEEP')
        .map(([rowNumber]) => Number(rowNumber)),
    [duplicateDecisions],
  );
  const skippedDuplicates = Math.max(0, duplicateCount - keptDuplicates.length);
  const correctedCount = useMemo(
    () =>
      preview.rows.filter(
        (row) => row.status === 'INVALID' && effectivePreviewStatus(row, fieldOverrides) === 'VALID',
      ).length,
    [preview.rows, fieldOverrides],
  );
  const clearedWarnings = useMemo(
    () =>
      preview.rows.filter(
        (row) => row.status === 'WARNING' && effectivePreviewStatus(row, fieldOverrides) === 'VALID',
      ).length,
    [preview.rows, fieldOverrides],
  );
  const displayValid = preview.valid + correctedCount + clearedWarnings;
  const displayWarning = Math.max(0, (preview.warning ?? 0) - clearedWarnings);
  const displayInvalid = Math.max(0, preview.invalid - correctedCount);
  const reviewSkippedImportable = useMemo(
    () =>
      preview.rows.filter((row) => {
        if (row.status === 'DUPLICATE') return false;
        if (duplicateDecisions[String(row.rowNumber)] !== 'SKIP') return false;
        const status = effectivePreviewStatus(row, fieldOverrides);
        return status === 'VALID' || status === 'WARNING';
      }).length,
    [preview.rows, duplicateDecisions, fieldOverrides],
  );
  const importCount = Math.max(
    0,
    displayValid + displayWarning + keptDuplicates.length - reviewSkippedImportable,
  );
  const hasDuplicates = duplicateCount > 0;
  const canImport = importCount > 0;

  function toggleAllPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const row of visibleRows) next.delete(row.rowNumber);
      } else {
        for (const row of visibleRows) next.add(row.rowNumber);
      }
      return next;
    });
  }

  const toggleRow = useCallback((rowNumber: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  }, []);

  function selectStatus(next: StatusFilter) {
    setStatusFilter((current) => (current === next && next !== 'ALL' ? 'ALL' : next));
    setErrorsOnly(false);
  }

  const validPct = pct(displayValid, preview.totalRows);
  const invalidPct = pct(displayInvalid, preview.totalRows);
  const blankPct = pct(preview.blank, preview.totalRows);
  const duplicatePct = pct(duplicateCount, preview.totalRows);

  const bannerTone: 'duplicate' | 'ready' | 'partial' | 'empty' = hasDuplicates
    ? 'duplicate'
    : !canImport
      ? 'empty'
      : displayInvalid === 0
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
            lg: 'repeat(6, minmax(0, 1fr))',
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
          selected={!errorsOnly && statusFilter === 'ALL'}
          onClick={() => selectStatus('ALL')}
        />
        <SummaryCard
          label={t('admin.propertyBulk.summaryValid')}
          value={displayValid}
          percent={validPct}
          icon={<Check size={18} />}
          iconBg={colors.mintSubtle}
          iconColor={colors.success}
          cardBg={colors.mintSubtle}
          selected={!errorsOnly && statusFilter === 'VALID'}
          onClick={() => selectStatus('VALID')}
        />
        <SummaryCard
          label={t('admin.propertyBulk.summaryWarning')}
          value={displayWarning}
          icon={<AlertTriangle size={18} />}
          iconBg="#FEF3C7"
          iconColor="#B45309"
          cardBg="#FFFBEB"
          selected={!errorsOnly && statusFilter === 'WARNING'}
          onClick={() => selectStatus('WARNING')}
        />
        <SummaryCard
          label={t('admin.propertyBulk.summaryDuplicate')}
          value={duplicateCount}
          percent={duplicatePct}
          icon={<Copy size={18} />}
          iconBg="#FEF3C7"
          iconColor="#B45309"
          cardBg="#FFFBEB"
          selected={!errorsOnly && statusFilter === 'DUPLICATE'}
          onClick={() => selectStatus('DUPLICATE')}
        />
        <SummaryCard
          label={t('admin.propertyBulk.summaryInvalid')}
          value={displayInvalid}
          percent={invalidPct}
          icon={<X size={18} />}
          iconBg="#FEE2E2"
          iconColor="#DC2626"
          cardBg="#FEF2F2"
          selected={!errorsOnly && statusFilter === 'INVALID'}
          onClick={() => selectStatus('INVALID')}
        />
        <SummaryCard
          label={t('admin.propertyBulk.summaryBlank')}
          value={preview.blank}
          percent={blankPct}
          icon={<AlertTriangle size={18} />}
          iconBg="#FFEDD5"
          iconColor="#D97706"
          cardBg="#FFF7ED"
          selected={!errorsOnly && statusFilter === 'BLANK'}
          onClick={() => selectStatus('BLANK')}
        />
      </Box>
      {(preview.normalized ?? 0) > 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('admin.propertyBulk.summaryNormalized', { count: preview.normalized })}
        </Typography>
      ) : null}

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
                  ? t('admin.propertyBulk.bannerAllValidBody', { count: displayValid })
                  : t('admin.propertyBulk.bannerPartialBody', {
                      valid: displayValid,
                      invalid: displayInvalid,
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
            {errorsByColumn.length > 0 ? (
              <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                  {t('admin.propertyBulk.previewErrorsByColumn')}
                </Typography>
                {errorsByColumn.map(([label, counts]) => {
                  const parts = [
                    counts.invalid > 0 ? `${counts.invalid} invalid` : '',
                    counts.warning > 0 ? `${counts.warning} warnings` : '',
                    counts.normalized > 0 ? `${counts.normalized} normalized` : '',
                  ].filter(Boolean);
                  return (
                    <Chip
                      key={label}
                      size="small"
                      label={`${label} ${parts.join(' · ')}`}
                      color={counts.invalid > 0 ? 'error' : 'warning'}
                      variant="outlined"
                    />
                  );
                })}
              </Stack>
            ) : null}
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <TextField
              size="small"
              placeholder={t('admin.propertyBulk.searchRows')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
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
                }}
                sx={{ borderRadius: 2, bgcolor: colors.surface }}
              >
                <MenuItem value="ALL">{t('admin.propertyBulk.filterAll')}</MenuItem>
                <MenuItem value="VALID">{t('admin.propertyBulk.filterValid')}</MenuItem>
                <MenuItem value="WARNING">{t('admin.propertyBulk.filterWarning')}</MenuItem>
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

        <Box sx={{ position: 'relative' }}>
        <TableContainer
          ref={scrollRef}
          sx={{
            maxHeight: 480,
            border: `1px solid ${colors.border}`,
            borderRadius: 2,
            overflowAnchor: 'none',
          }}
        >
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
                    sx={{
                      bgcolor: errorColumns.has(col.field) ? '#FEE2E2' : colors.surfaceSecondary,
                      color: errorColumns.has(col.field) ? '#B91C1C' : 'inherit',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col.header}
                  </TableCell>
                ))}
                <TableCell
                  sx={{
                    width: 220,
                    maxWidth: 220,
                    bgcolor: visibleRows.some((row) => remainingPreviewErrors(row, fieldOverrides).length > 0)
                      ? '#FEE2E2'
                      : colors.surfaceSecondary,
                    color: visibleRows.some((row) => remainingPreviewErrors(row, fieldOverrides).length > 0)
                      ? '#B91C1C'
                      : 'inherit',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('admin.propertyBulk.columns.errors')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">{t('admin.propertyBulk.noPreviewRows')}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row, index) => (
                  <BulkPreviewRow
                    key={row.rowNumber}
                    row={row}
                    index={index}
                    columns={columns}
                    fieldOverrides={fieldOverrides}
                    decision={
                      duplicateDecisions[String(row.rowNumber)] ??
                      (row.status === 'DUPLICATE' ? 'SKIP' : 'KEEP')
                    }
                    checked={selected.has(row.rowNumber)}
                    busy={busy}
                    onToggle={toggleRow}
                    onDecision={onDuplicateDecisionChange}
                    onFieldOverride={onFieldOverrideChange}
                  />
                ))
              )}
              {hasMore ? (
                <TableRow ref={sentinelRef}>
                  <TableCell colSpan={columns.length + 5} sx={{ py: loadingMore ? 1.75 : 0.5, textAlign: 'center', borderBottom: 0 }}>
                    {loadingMore ? (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: 'center', justifyContent: 'center', minHeight: 28 }}
                      >
                        <CircularProgress size={18} sx={{ color: colors.primary }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {t('common.loading')}
                        </Typography>
                      </Stack>
                    ) : null}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
        {loadingMore ? (
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              bottom: 36,
              transform: 'translateX(-50%)',
              zIndex: 4,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.75,
              py: 0.75,
              borderRadius: 999,
              bgcolor: 'rgba(255,255,255,0.96)',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 6px 18px rgba(15, 23, 42, 0.12)',
            }}
          >
            <CircularProgress size={16} sx={{ color: colors.primary }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              {t('common.loading')}
            </Typography>
          </Box>
        ) : null}
        </Box>

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


const BulkPreviewRow = memo(function BulkPreviewRow({
  row,
  index,
  columns,
  fieldOverrides,
  decision,
  checked,
  busy,
  onToggle,
  onDecision,
  onFieldOverride,
}: {
  row: PropertyBulkImportPreviewRow;
  index: number;
  columns: Array<{ field: PropertyBulkImportFieldKey; header: string }>;
  fieldOverrides: PropertyBulkImportFieldOverrides;
  decision: DuplicateDecision;
  checked: boolean;
  busy: boolean;
  onToggle: (rowNumber: number) => void;
  onDecision: (rowNumber: number, decision: DuplicateDecision) => void;
  onFieldOverride: (
    rowNumber: number,
    field: PropertyBulkImportFieldKey,
    value: string | null,
  ) => void;
}) {
  const { t } = useTranslation();
  const isDuplicate = row.status === 'DUPLICATE';
  const status = effectivePreviewStatus(row, fieldOverrides);
  const visibleErrors = remainingPreviewErrors(row, fieldOverrides);
  const visibleNotices = remainingPreviewNotices(row, fieldOverrides);
  return (
    <TableRow
      hover
      sx={{
        bgcolor: isDuplicate
          ? decision === 'KEEP'
            ? '#ECFDF5'
            : '#FFFBEB'
          : decision === 'SKIP'
            ? '#FFFBEB'
          : status === 'VALID' && row.status === 'INVALID'
            ? '#ECFDF5'
          : index % 2 === 1
            ? colors.surfaceSecondary
            : colors.surface,
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          size="small"
          checked={checked}
          onChange={() => onToggle(row.rowNumber)}
        />
      </TableCell>
      <TableCell>{row.rowNumber}</TableCell>
      <TableCell>
        <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
          <StatusChip status={status} />
          {isDuplicate ? (
            <Chip
              size="small"
              label={duplicateSourceLabel(row.duplicateMatch?.source, t)}
              sx={{
                height: 20,
                fontSize: 11,
                fontWeight: 600,
                bgcolor: row.duplicateMatch?.source === 'IN_FILE' ? '#EEF2FF' : '#FEE2E2',
                color: row.duplicateMatch?.source === 'IN_FILE' ? '#3730A3' : '#991B1B',
              }}
            />
          ) : null}
        </Stack>
      </TableCell>
      <TableCell sx={{ minWidth: 200, position: 'relative', zIndex: 1 }}>
        {isDuplicate ? (
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Button
                type="button"
                size="small"
                variant={decision === 'SKIP' ? 'contained' : 'outlined'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDecision(row.rowNumber, 'SKIP');
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
                  onDecision(row.rowNumber, 'KEEP');
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
            <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 280 }}>
              {duplicateSummary(row, t)}
            </Typography>
          </Stack>
        ) : (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Button
              type="button"
              size="small"
              variant={decision === 'SKIP' ? 'contained' : 'outlined'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDecision(row.rowNumber, 'SKIP');
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
                onDecision(row.rowNumber, 'KEEP');
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
          </Stack>
        )}
      </TableCell>
      {columns.map((col) => {
        const raw = row.values?.[col.field] ?? '';
        const normalized = row.normalizedValues?.[col.field];
        const rowOverrides = fieldOverrides[String(row.rowNumber)];
        const hasOverride = !!rowOverrides && Object.prototype.hasOwnProperty.call(rowOverrides, col.field);
        const override = hasOverride ? (rowOverrides?.[col.field] ?? '') : undefined;
        const fieldNotices = visibleNotices.filter((notice) =>
          previewErrorAppliesToField(notice.field, col.field),
        );
        const fieldWarning = fieldNotices.some((notice) => notice.level === 'WARNING');
        const fieldStillInvalid = visibleErrors.some((err) =>
          previewErrorAppliesToField(err.field, col.field),
        );
        const baseOptions = correctionOptions(col.field, t);
        const control = baseOptions ? 'select' : 'text';
        const inputValue = previewCellInputValue(raw, normalized, override, control);
        const options = baseOptions
          ? selectOptionsWithCurrent(baseOptions, inputValue)
          : null;
        const noticeTitle = fieldNotices
          .map((notice) => {
            const interpreted = notice.normalizedValue
              ? `Interpreted as ${notice.normalizedValue}. `
              : '';
            return `${interpreted}${notice.message}`;
          })
          .join(' ');
        const originalHint =
          raw.trim() && raw.trim() !== inputValue.trim() ? raw : '';
        const title = [noticeTitle, originalHint].filter(Boolean).join(' ');
        return (
          <TableCell
            key={`${row.rowNumber}-${col.field}`}
            sx={{
              maxWidth: 240,
              minWidth: 168,
              whiteSpace: 'normal',
              overflow: 'visible',
              bgcolor: fieldStillInvalid ? '#FEF2F2' : fieldWarning ? '#FFFBEB' : undefined,
              boxShadow: fieldStillInvalid
                ? 'inset 0 0 0 1px #FECACA'
                : fieldWarning
                  ? 'inset 0 0 0 1px #FDE68A'
                  : undefined,
              verticalAlign: 'top',
            }}
            title={title || undefined}
          >
            {options ? (
              <CorrectionSelect
                value={inputValue}
                disabled={busy}
                error={fieldStillInvalid}
                warning={fieldWarning && !fieldStillInvalid}
                placeholder={t('admin.propertyBulk.correctValue')}
                options={options}
                onCommit={(next) =>
                  onFieldOverride(row.rowNumber, col.field, next)
                }
              />
            ) : (
              <CorrectionTextField
                value={inputValue}
                disabled={busy}
                error={fieldStillInvalid}
                warning={fieldWarning && !fieldStillInvalid}
                placeholder={t('admin.propertyBulk.correctEnter')}
                onCommit={(next) =>
                  onFieldOverride(row.rowNumber, col.field, next)
                }
              />
            )}
          </TableCell>
        );
      })}
      <TableCell
        sx={{
          width: 220,
          maxWidth: 220,
          verticalAlign: 'middle',
          color: visibleErrors.length ? '#B91C1C' : 'text.secondary',
        }}
      >
        {visibleErrors.length === 0 && visibleNotices.length === 0
          ? '—'
          : (
            <Tooltip
              title={[
                ...visibleErrors.map((err) => `${err.field}: ${err.message}`),
                ...visibleNotices.map((notice) => notice.message),
              ].join('\n')}
              arrow
              enterTouchDelay={0}
            >
              <Typography
                variant="caption"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.35,
                  maxHeight: '2.7em',
                  wordBreak: 'break-word',
                  color: visibleErrors.length ? '#B91C1C' : '#B45309',
                  cursor: 'default',
                }}
              >
                {[
                  ...visibleErrors.map((err) => `${err.field}: ${err.message}`),
                  ...visibleNotices.map((notice) => notice.message),
                ].join('; ')}
              </Typography>
            </Tooltip>
          )}
      </TableCell>
    </TableRow>
  );
});

function commitIfChanged(
  draftValue: string,
  committedValue: string,
  onCommit: (value: string | null) => void,
) {
  const next = draftValue.trim();
  const current = committedValue.trim();
  if (next === current) return;
  onCommit(next);
}

function CorrectionSelect({
  value,
  disabled,
  error,
  warning,
  placeholder,
  options,
  onCommit,
}: {
  value: string;
  disabled?: boolean;
  error?: boolean;
  warning?: boolean;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onCommit: (value: string | null) => void;
}) {
  const [draft, setDraft] = useState(value);
  const draftRef = useRef(value);
  const committedRef = useRef(value);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  useEffect(() => {
    setDraft(value);
    draftRef.current = value;
    committedRef.current = value;
  }, [value]);

  useEffect(() => {
    return () => {
      commitIfChanged(draftRef.current, committedRef.current, (next) => onCommitRef.current(next));
    };
  }, []);

  function commit() {
    const draftValue = draftRef.current;
    commitIfChanged(draftValue, committedRef.current, onCommit);
    committedRef.current = draftValue.trim();
  }

  return (
    <FormControl size="small" fullWidth error={error}>
      <Select
        displayEmpty
        value={options.some((option) => option.value === draft) || draft === '' ? draft : ''}
        disabled={disabled}
        error={error}
        onChange={(event) => {
          const next = String(event.target.value);
          draftRef.current = next;
          setDraft(next);
        }}
        onClose={commit}
        onBlur={commit}
        MenuProps={{ disableScrollLock: true }}
        sx={{
          fontSize: 13,
          bgcolor: '#fff',
          borderRadius: 1.5,
          ...(warning
            ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#FCD34D' } }
            : {}),
        }}
      >
        <MenuItem value="">{placeholder}</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function CorrectionTextField({
  value,
  disabled,
  error,
  warning,
  placeholder,
  onCommit,
}: {
  value: string;
  disabled?: boolean;
  error?: boolean;
  warning?: boolean;
  placeholder: string;
  onCommit: (value: string | null) => void;
}) {
  const [draft, setDraft] = useState(value);
  const draftRef = useRef(value);
  const valueRef = useRef(value);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  draftRef.current = draft;
  valueRef.current = value;

  useEffect(() => {
    setDraft(value);
    draftRef.current = value;
  }, [value]);

  useEffect(() => {
    return () => {
      commitIfChanged(draftRef.current, valueRef.current, (next) => onCommitRef.current(next));
    };
  }, []);

  function commit() {
    commitIfChanged(draft, value, onCommit);
  }

  return (
    <TextField
      size="small"
      fullWidth
      error={error}
      value={draft}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(event) => {
        draftRef.current = event.target.value;
        setDraft(event.target.value);
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          (event.target as HTMLInputElement).blur();
        }
      }}
      sx={{
        '& .MuiInputBase-root': { bgcolor: '#fff', borderRadius: 1.5 },
        '& .MuiInputBase-input': { fontSize: 13, py: 0.75 },
        ...(warning
          ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#FCD34D' } }
          : {}),
      }}
    />
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
  selected = false,
  onClick,
}: {
  label: string;
  value: number;
  percent?: number;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  cardBg?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <Paper
      component="button"
      type="button"
      elevation={0}
      onClick={onClick}
      aria-pressed={selected}
      sx={{
        p: 2,
        borderRadius: 3,
        border: `2px solid ${selected ? iconColor : colors.border}`,
        bgcolor: cardBg,
        textAlign: 'left',
        cursor: 'pointer',
        font: 'inherit',
        color: 'inherit',
        width: '100%',
        boxShadow: selected ? `0 0 0 3px ${iconColor}22` : 'none',
        '&:hover': { borderColor: iconColor },
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
  if (normalized === 'WARNING') {
    return (
      <Chip
        size="small"
        label={t('admin.propertyBulk.statusWarning')}
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
