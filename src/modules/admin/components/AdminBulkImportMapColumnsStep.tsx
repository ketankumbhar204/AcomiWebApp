import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
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
  Typography,
} from '@mui/material';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Lightbulb,
  Minus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminTestLeadOption } from '@/modules/admin/components/AdminTestLeadOption';
import { colors } from '@/shared/theme/colors';
import {
  PROPERTY_BULK_IMPORT_FIELDS,
  type PropertyBulkImportAnalyzeResponse,
  type PropertyBulkImportFieldKey,
  type PropertyBulkImportMapping,
} from '@/shared/types/adminBulkImport';

const UNMAPPED = '';

/** Fields treated as listing-info (not structural inventory). */
const LISTING_INFO_FIELDS = new Set<PropertyBulkImportFieldKey>(['SHARING', 'FOOD_INCLUDED']);

type SuggestionKind = 'exact' | 'listing' | 'unused';

type ExcelRowMapping = {
  header: string;
  field: PropertyBulkImportFieldKey | null;
  kind: SuggestionKind;
};

type Props = {
  analyze: PropertyBulkImportAnalyzeResponse;
  mapping: PropertyBulkImportMapping;
  markAsTestLead: boolean;
  busy: boolean;
  onMappingChange: (next: PropertyBulkImportMapping) => void;
  onMarkAsTestLeadChange: (checked: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
};

function invertMapping(mapping: PropertyBulkImportMapping): Map<string, PropertyBulkImportFieldKey> {
  const byHeader = new Map<string, PropertyBulkImportFieldKey>();
  for (const field of PROPERTY_BULK_IMPORT_FIELDS) {
    const header = mapping[field];
    if (header) byHeader.set(header, field);
  }
  return byHeader;
}

function classifyRow(
  header: string,
  field: PropertyBulkImportFieldKey | null,
  suggested: PropertyBulkImportAnalyzeResponse['suggestedMapping'],
): SuggestionKind {
  if (!field) return 'unused';
  if (LISTING_INFO_FIELDS.has(field)) return 'listing';
  if (suggested[field] === header) return 'exact';
  return 'listing';
}

export function AdminBulkImportMapColumnsStep({
  analyze,
  mapping,
  markAsTestLead,
  busy,
  onMappingChange,
  onMarkAsTestLeadChange,
  onBack,
  onContinue,
}: Props) {
  const { t } = useTranslation();

  const rows: ExcelRowMapping[] = useMemo(() => {
    const byHeader = invertMapping(mapping);
    return analyze.headers.map((header) => {
      const field = byHeader.get(header) ?? null;
      return {
        header,
        field,
        kind: classifyRow(header, field, analyze.suggestedMapping),
      };
    });
  }, [analyze.headers, analyze.suggestedMapping, mapping]);

  const stats = useMemo(() => {
    let exact = 0;
    let listing = 0;
    let unused = 0;
    for (const row of rows) {
      if (row.kind === 'exact') exact += 1;
      else if (row.kind === 'listing') listing += 1;
      else unused += 1;
    }
    const mapped = exact + listing;
    const total = rows.length;
    return { exact, listing, unused, mapped, total };
  }, [rows]);

  const usedFields = useMemo(() => {
    const used = new Set<PropertyBulkImportFieldKey>();
    for (const field of PROPERTY_BULK_IMPORT_FIELDS) {
      if (mapping[field]) used.add(field);
    }
    return used;
  }, [mapping]);

  function handleExcelFieldChange(header: string, fieldValue: string) {
    const next = { ...mapping };
    // Clear any field currently mapped to this Excel column.
    for (const field of PROPERTY_BULK_IMPORT_FIELDS) {
      if (next[field] === header) next[field] = null;
    }
    if (fieldValue && fieldValue !== UNMAPPED) {
      const field = fieldValue as PropertyBulkImportFieldKey;
      next[field] = header;
    }
    onMappingChange(next);
  }

  function handleAutoMap() {
    const next: PropertyBulkImportMapping = PROPERTY_BULK_IMPORT_FIELDS.reduce((acc, field) => {
      const value = analyze.suggestedMapping[field];
      acc[field] = value && value.trim().length > 0 ? value : null;
      return acc;
    }, {} as PropertyBulkImportMapping);
    onMappingChange(next);
  }

  function handleReset() {
    onMappingChange(
      PROPERTY_BULK_IMPORT_FIELDS.reduce((acc, field) => {
        acc[field] = null;
        return acc;
      }, {} as PropertyBulkImportMapping),
    );
  }

  const progressPct = stats.total === 0 ? 0 : Math.round((stats.mapped / stats.total) * 100);

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
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
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' }, mb: 2 }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {t('admin.propertyBulk.mapCardTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.propertyBulk.mapCardHint')}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <Button
                size="small"
                startIcon={<Sparkles size={16} />}
                onClick={handleAutoMap}
                disabled={busy}
                sx={{ color: colors.teal, fontWeight: 600 }}
              >
                {t('admin.propertyBulk.autoMap')}
              </Button>
              <Button
                size="small"
                startIcon={<RefreshCw size={16} />}
                onClick={handleReset}
                disabled={busy}
                sx={{ color: 'text.secondary', fontWeight: 600 }}
              >
                {t('admin.propertyBulk.resetMapping')}
              </Button>
            </Stack>
          </Stack>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40, color: 'text.secondary', fontWeight: 600 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <span>{t('admin.propertyBulk.excelColumn')}</span>
                      <Chip
                        size="small"
                        label={t('admin.propertyBulk.columnCount', { count: analyze.headers.length })}
                        sx={{
                          height: 22,
                          bgcolor: '#E8F1FF',
                          color: '#1D4ED8',
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 220 }}>
                    {t('admin.propertyBulk.mapToAcomi')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>
                    {t('admin.propertyBulk.suggestion')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => {
                  const unmapped = row.kind === 'unused';
                  return (
                  <TableRow
                    key={row.header}
                    sx={{
                      bgcolor: unmapped
                        ? '#FFF7ED'
                        : index % 2 === 1
                          ? colors.surfaceSecondary
                          : colors.surface,
                      boxShadow: unmapped ? 'inset 4px 0 0 #F59E0B' : undefined,
                      '&:hover': {
                        bgcolor: unmapped ? '#FFEDD5' : colors.mintSubtle,
                      },
                    }}
                  >
                    <TableCell sx={{ color: unmapped ? '#B45309' : 'text.secondary', fontWeight: unmapped ? 700 : 400 }}>
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: unmapped ? '#9A3412' : 'inherit',
                        }}
                      >
                        {row.header}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          displayEmpty
                          value={row.field ?? UNMAPPED}
                          onChange={(event) =>
                            handleExcelFieldChange(row.header, String(event.target.value))
                          }
                          disabled={busy}
                          error={unmapped}
                          sx={{
                            borderRadius: 2,
                            bgcolor: colors.surface,
                            ...(unmapped
                              ? {
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#F59E0B',
                                    borderWidth: 1.5,
                                  },
                                }
                              : {}),
                          }}
                        >
                          <MenuItem value={UNMAPPED}>
                            <em>{t('admin.propertyBulk.selectField')}</em>
                          </MenuItem>
                          {PROPERTY_BULK_IMPORT_FIELDS.map((field) => {
                            const takenByOther = usedFields.has(field) && row.field !== field;
                            return (
                              <MenuItem key={field} value={field} disabled={takenByOther}>
                                {t(`admin.propertyBulk.fields.${field}`)}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <SuggestionBadge kind={row.kind} />
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Stack spacing={2}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: `1px solid ${colors.border}`,
              bgcolor: colors.surface,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              {t('admin.propertyBulk.mappingStatus')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box sx={{ position: 'relative', width: 148, height: 148 }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={148}
                  thickness={4.5}
                  sx={{ color: '#E5E7EB', position: 'absolute', inset: 0 }}
                />
                <CircularProgress
                  variant="determinate"
                  value={progressPct}
                  size={148}
                  thickness={4.5}
                  sx={{
                    color: colors.primary,
                    position: 'absolute',
                    inset: 0,
                    [`& .MuiCircularProgress-circle`]: { strokeLinecap: 'round' },
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: 28, lineHeight: 1.1 }}>
                    {stats.mapped}/{stats.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', px: 1 }}>
                    {t('admin.propertyBulk.columnsMappedLabel')}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Stack spacing={1}>
              <StatusLegendRow
                icon={<Check size={14} />}
                color={colors.primary}
                label={t('admin.propertyBulk.exactMatches', { count: stats.exact })}
              />
              <StatusLegendRow
                icon={<Info size={14} />}
                color="#2563EB"
                label={t('admin.propertyBulk.mappedWithSuggestions', { count: stats.listing })}
              />
              <StatusLegendRow
                icon={<Minus size={14} />}
                color="#6B7280"
                label={t('admin.propertyBulk.unmappedCount', { count: stats.unused })}
              />
            </Stack>
          </Paper>

          <Alert
            severity={stats.unused === 0 ? 'success' : 'warning'}
            sx={{
              borderRadius: 2,
              bgcolor: stats.unused === 0 ? colors.mintSubtle : '#FFF7ED',
              border: `1px solid ${stats.unused === 0 ? `${colors.primary}33` : '#F59E0B66'}`,
              '& .MuiAlert-message': { width: '100%' },
            }}
          >
            {stats.unused === 0
              ? t('admin.propertyBulk.allMappedReady')
              : t('admin.propertyBulk.unmappedHighlight', { count: stats.unused })}
          </Alert>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: '#EFF6FF',
              border: '1px solid #BFDBFE',
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <Lightbulb size={18} color="#1D4ED8" />
              <Typography sx={{ fontWeight: 700, color: '#1E3A8A' }}>
                {t('admin.propertyBulk.tipsTitle')}
              </Typography>
            </Stack>
            <Box component="ul" sx={{ m: 0, pl: 2.25, color: '#1E3A8A' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Typography key={n} component="li" variant="body2" sx={{ mb: 0.75 }}>
                  {t(`admin.propertyBulk.tip${n}`)}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Stack>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          pt: 0.5,
        }}
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
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
        >
          <AdminTestLeadOption
            compact
            checked={markAsTestLead}
            onChange={onMarkAsTestLeadChange}
          />
          <Button
            variant="contained"
            endIcon={busy ? undefined : <ArrowRight size={16} />}
            onClick={onContinue}
            disabled={busy}
            sx={{
              borderRadius: 2,
              px: 2.5,
              bgcolor: colors.primary,
              '&:hover': { bgcolor: colors.primaryHover },
              fontWeight: 700,
            }}
          >
            {busy ? <CircularProgress size={20} color="inherit" /> : t('admin.propertyBulk.continuePreview')}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

function SuggestionBadge({ kind }: { kind: SuggestionKind }) {
  const { t } = useTranslation();
  if (kind === 'exact') {
    return (
      <Chip
        size="small"
        icon={<Check size={14} />}
        label={t('admin.propertyBulk.badgeExact')}
        sx={{
          bgcolor: colors.mintSubtle,
          color: '#047857',
          fontWeight: 600,
          '& .MuiChip-icon': { color: '#047857' },
        }}
      />
    );
  }
  if (kind === 'listing') {
    return (
      <Chip
        size="small"
        icon={<Info size={14} />}
        label={t('admin.propertyBulk.badgeListingInfo')}
        sx={{
          bgcolor: '#EFF6FF',
          color: '#1D4ED8',
          fontWeight: 600,
          '& .MuiChip-icon': { color: '#1D4ED8' },
        }}
      />
    );
  }
  return (
    <Chip
      size="small"
      icon={<Minus size={14} />}
      label={t('admin.propertyBulk.badgeUnused')}
      sx={{
        bgcolor: '#FFEDD5',
        color: '#9A3412',
        fontWeight: 700,
        border: '1px solid #F59E0B',
        '& .MuiChip-icon': { color: '#D97706' },
      }}
    />
  );
}

function StatusLegendRow({
  icon,
  color,
  label,
}: {
  icon: ReactNode;
  color: string;
  label: string;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: `${color}22`,
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography variant="body2">{label}</Typography>
    </Stack>
  );
}
