import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Download } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import { AdminBulkImportMapColumnsStep } from '@/modules/admin/components/AdminBulkImportMapColumnsStep';
import { AdminBulkImportPreviewStep } from '@/modules/admin/components/AdminBulkImportPreviewStep';
import { adminBulkPropertyPath, ROUTES } from '@/routes/paths';
import { PageHeader } from '@/shared/components/PageHeader';
import { getErrorMessage } from '@/shared/api/errors';
import { colors } from '@/shared/theme/colors';
import {
  PROPERTY_BULK_IMPORT_FIELDS,
  type PropertyBulkImportAnalyzeResponse,
  type PropertyBulkImportMapping,
  type PropertyBulkImportPreviewResponse,
  type PropertyBulkImportResultResponse,
} from '@/shared/types/adminBulkImport';

const STEPS = ['upload', 'map', 'preview', 'import', 'result'] as const;
type StepKey = (typeof STEPS)[number];

function emptyMapping(): PropertyBulkImportMapping {
  return PROPERTY_BULK_IMPORT_FIELDS.reduce((acc, field) => {
    acc[field] = null;
    return acc;
  }, {} as PropertyBulkImportMapping);
}

function mappingFromSuggested(
  suggested: PropertyBulkImportAnalyzeResponse['suggestedMapping'],
): PropertyBulkImportMapping {
  const mapping = emptyMapping();
  for (const field of PROPERTY_BULK_IMPORT_FIELDS) {
    const value = suggested[field];
    mapping[field] = value && value.trim().length > 0 ? value : null;
  }
  return mapping;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildErrorReportCsv(result: PropertyBulkImportResultResponse): string {
  const failed = result.rows.filter(
    (row) =>
      row.status === 'FAILED' ||
      row.status === 'INVALID' ||
      (row.status === 'IMPORTED' && Boolean(row.conversionError)),
  );
  const lines = ['rowNumber,status,reference,spaceId,errors'];
  for (const row of failed) {
    const errors = [
      ...(row.errors ?? []).map((err) => `${err.field ?? 'row'}: ${err.message}`),
      ...(row.conversionError ? [row.conversionError] : []),
    ].join('; ');
    lines.push(
      [
        String(row.rowNumber),
        row.status,
        row.reference ?? '',
        row.spaceId ?? '',
        errors,
      ]
        .map(escapeCsvCell)
        .join(','),
    );
  }
  return lines.join('\n');
}

function statusColor(
  status: string,
): 'success' | 'error' | 'default' | 'warning' | 'info' {
  switch (status) {
    case 'VALID':
    case 'CONVERTED':
      return 'success';
    case 'IMPORTED':
      return 'warning';
    case 'INVALID':
    case 'FAILED':
      return 'error';
    case 'BLANK':
      return 'default';
    case 'SKIPPED':
    case 'DUPLICATE':
      return 'warning';
    default:
      return 'info';
  }
}

export function AdminBulkPropertyImportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [analyze, setAnalyze] = useState<PropertyBulkImportAnalyzeResponse | null>(null);
  const [mapping, setMapping] = useState<PropertyBulkImportMapping>(emptyMapping);
  const [markAsTestLead, setMarkAsTestLead] = useState(false);
  const [preview, setPreview] = useState<PropertyBulkImportPreviewResponse | null>(null);
  const [duplicateDecisions, setDuplicateDecisions] = useState<Record<string, 'KEEP' | 'SKIP'>>(
    {},
  );
  const [result, setResult] = useState<PropertyBulkImportResultResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetWorkflow() {
    setActiveStep(0);
    setFile(null);
    setAnalyze(null);
    setMapping(emptyMapping());
    setMarkAsTestLead(false);
    setPreview(null);
    setDuplicateDecisions({});
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleDownloadTemplate() {
    setBusy(true);
    setError(null);
    try {
      const blob = await adminApi.downloadPropertyBulkImportTemplate();
      downloadBlob(blob, 'property-leads-bulk-import-template.xlsx');
      enqueueSnackbar(t('admin.propertyBulk.templateDownloaded'), { variant: 'success' });
    } catch (err) {
      const message = getErrorMessage(err, t('admin.propertyBulk.templateFailed'));
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function handleAnalyzeSelectedFile(nextFile: File) {
    setBusy(true);
    setError(null);
    setPreview(null);
    setDuplicateDecisions({});
    setResult(null);
    try {
      const data = await adminApi.analyzePropertyBulkImport(nextFile);
      setFile(nextFile);
      setAnalyze(data);
      setMapping(mappingFromSuggested(data.suggestedMapping));
      setMarkAsTestLead(false);
      setActiveStep(1);
      enqueueSnackbar(
        t('admin.propertyBulk.analyzeSuccess', { count: data.dataRowCount }),
        { variant: 'success' },
      );
    } catch (err) {
      const message = getErrorMessage(err, t('admin.propertyBulk.analyzeFailed'));
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.xlsx')) {
      const message = t('admin.propertyBulk.invalidFileType');
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
      event.target.value = '';
      return;
    }
    void handleAnalyzeSelectedFile(selected);
  }

  async function handlePreview() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const data = await adminApi.previewPropertyBulkImport(file, mapping, markAsTestLead);
      const decisions: Record<string, 'KEEP' | 'SKIP'> = {};
      for (const row of data.rows) {
        if (row.status === 'DUPLICATE') {
          decisions[String(row.rowNumber)] = 'SKIP';
        }
      }
      setDuplicateDecisions(decisions);
      setPreview(data);
      setActiveStep(2);
    } catch (err) {
      const message = getErrorMessage(err, t('admin.propertyBulk.previewFailed'));
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    const keepDuplicateRowNumbers = Object.entries(duplicateDecisions)
      .filter(([, decision]) => decision === 'KEEP')
      .map(([rowNumber]) => Number(rowNumber));
    setBusy(true);
    setError(null);
    setActiveStep(3);
    try {
      const data = await adminApi.importPropertyBulkImport(
        file,
        mapping,
        markAsTestLead,
        keepDuplicateRowNumbers,
      );
      setResult(data);
      setActiveStep(4);
      if (data.failed > 0 && data.imported > 0) {
        enqueueSnackbar(
          t('admin.propertyBulk.partialSuccess', {
            imported: data.imported,
            converted: data.converted ?? 0,
            failed: data.failed,
          }),
          { variant: 'warning' },
        );
      } else if (data.imported > 0) {
        enqueueSnackbar(
          t('admin.propertyBulk.importSuccess', {
            imported: data.imported,
            converted: data.converted ?? 0,
          }),
          { variant: 'success' },
        );
      } else {
        enqueueSnackbar(t('admin.propertyBulk.importNone'), { variant: 'info' });
      }
    } catch (err) {
      setActiveStep(2);
      const message = getErrorMessage(err, t('admin.propertyBulk.importFailed'));
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  function handleDownloadErrorReport() {
    if (!result) return;
    const csv = buildErrorReportCsv(result);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'property-bulk-import-errors.csv');
  }

  const currentStep = STEPS[activeStep] as StepKey;

  const stepMeta = useMemo(
    () =>
      STEPS.map((key) => ({
        key,
        label: t(`admin.propertyBulk.steps.${key}`),
        description: t(`admin.propertyBulk.stepDescriptions.${key}`),
      })),
    [t],
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pb: 3 }}>
      <PageHeader
        title={t('admin.propertyBulk.title')}
        description={t('admin.propertyBulk.subtitle')}
        breadcrumbs={[
          { label: t('admin.nav.dashboard'), to: ROUTES.adminDashboard },
          { label: t('admin.nav.properties'), to: ROUTES.adminProperties },
          { label: t('admin.propertyBulk.title'), to: adminBulkPropertyPath() },
        ]}
        actions={
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            disabled={busy}
            onClick={() => void handleDownloadTemplate()}
            sx={{ borderRadius: 2, borderColor: '#93C5FD', color: '#1D4ED8' }}
          >
            {t('admin.propertyBulk.downloadTemplate')}
          </Button>
        }
      />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3,
          border: `1px solid ${colors.border}`,
          bgcolor: colors.surface,
        }}
      >
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            mb: currentStep === 'map' ? 3 : 3,
            '& .MuiStepIcon-root.Mui-completed': { color: colors.primary },
            '& .MuiStepIcon-root.Mui-active': { color: colors.primary },
            '& .MuiStepConnector-line': { borderTopWidth: 2 },
            '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
              borderColor: colors.primary,
            },
          }}
        >
          {stepMeta.map((step) => (
            <Step key={step.key}>
              <StepLabel
                optional={
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                }
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        {currentStep === 'upload' ? (
          <Stack spacing={2}>
            <Alert severity="info">{t('admin.propertyBulk.optionalFieldsHint')}</Alert>
            <Typography color="text.secondary">{t('admin.propertyBulk.uploadHint')}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="contained"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  borderRadius: 2,
                  bgcolor: colors.primary,
                  '&:hover': { bgcolor: colors.primaryHover },
                  fontWeight: 700,
                }}
              >
                {busy ? <CircularProgress size={20} color="inherit" /> : t('admin.propertyBulk.chooseFile')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                hidden
                onChange={handleFileChange}
              />
            </Stack>
            {file ? (
              <Typography variant="body2">
                {t('admin.propertyBulk.selectedFile', { name: file.name })}
              </Typography>
            ) : null}
          </Stack>
        ) : null}

        {currentStep === 'map' && analyze ? (
          <AdminBulkImportMapColumnsStep
            analyze={analyze}
            mapping={mapping}
            markAsTestLead={markAsTestLead}
            busy={busy}
            onMappingChange={setMapping}
            onMarkAsTestLeadChange={setMarkAsTestLead}
            onBack={() => setActiveStep(0)}
            onContinue={() => void handlePreview()}
          />
        ) : null}

        {currentStep === 'preview' && preview ? (
          <AdminBulkImportPreviewStep
            preview={preview}
            mapping={mapping}
            busy={busy}
            duplicateDecisions={duplicateDecisions}
            onDuplicateDecisionChange={(rowNumber, decision) => {
              setDuplicateDecisions((prev) => ({
                ...prev,
                [String(rowNumber)]: decision,
              }));
            }}
            onDuplicateDecisionBulkChange={(decision) => {
              setDuplicateDecisions((prev) => {
                const next = { ...prev };
                for (const row of preview.rows) {
                  if (row.status === 'DUPLICATE') {
                    next[String(row.rowNumber)] = decision;
                  }
                }
                return next;
              });
            }}
            onBack={() => setActiveStep(1)}
            onImport={() => void handleImport()}
          />
        ) : null}

        {currentStep === 'import' ? (
          <Stack spacing={2} sx={{ alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography>{t('admin.propertyBulk.importing')}</Typography>
          </Stack>
        ) : null}

        {currentStep === 'result' && result ? (
          <Stack spacing={2}>
            <Alert
              severity={
                result.failed > 0 && result.imported > 0
                  ? 'warning'
                  : result.imported > 0
                    ? 'success'
                    : 'info'
              }
            >
              {result.failed > 0 && result.imported > 0
                ? t('admin.propertyBulk.resultPartial', {
                    imported: result.imported,
                    converted: result.converted ?? 0,
                    importedOnly: result.importedOnly ?? 0,
                    failed: result.failed,
                    blank: result.blankSkipped,
                    total: result.totalRows,
                  })
                : result.imported > 0
                  ? t('admin.propertyBulk.resultSuccess', {
                      imported: result.imported,
                      converted: result.converted ?? 0,
                      importedOnly: result.importedOnly ?? 0,
                      blank: result.blankSkipped,
                      duplicateSkipped: result.duplicateSkipped ?? 0,
                      total: result.totalRows,
                    })
                  : t('admin.propertyBulk.resultNone', {
                      failed: result.failed,
                      blank: result.blankSkipped,
                      duplicateSkipped: result.duplicateSkipped ?? 0,
                      total: result.totalRows,
                    })}
            </Alert>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip
                color="success"
                label={t('admin.propertyBulk.counts.converted', {
                  count: result.converted ?? 0,
                })}
              />
              <Chip
                color="warning"
                label={t('admin.propertyBulk.counts.importedOnly', {
                  count: result.importedOnly ?? 0,
                })}
              />
              <Chip
                color="error"
                label={t('admin.propertyBulk.counts.failed', { count: result.failed })}
              />
              <Chip label={t('admin.propertyBulk.counts.blankSkipped', { count: result.blankSkipped })} />
              <Chip
                color="warning"
                label={t('admin.propertyBulk.counts.duplicateSkipped', {
                  count: result.duplicateSkipped ?? 0,
                })}
              />
              <Chip label={t('admin.propertyBulk.counts.total', { count: result.totalRows })} />
            </Stack>
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('admin.propertyBulk.columns.row')}</TableCell>
                    <TableCell>{t('admin.propertyBulk.columns.status')}</TableCell>
                    <TableCell>{t('admin.propertyBulk.columns.target')}</TableCell>
                    <TableCell>{t('admin.common.reference')}</TableCell>
                    <TableCell>{t('admin.propertyBulk.columns.space')}</TableCell>
                    <TableCell>{t('admin.propertyBulk.columns.errors')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.rows.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>
                        <Chip size="small" color={statusColor(row.status)} label={row.status} />
                      </TableCell>
                      <TableCell>{row.targetKind ?? '—'}</TableCell>
                      <TableCell>{row.reference ?? '—'}</TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        {row.spaceName || row.spaceId
                          ? `${row.spaceName ?? 'Space'}${row.spaceId ? ` · ${row.spaceId}` : ''}`
                          : '—'}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        {row.conversionError
                          ? row.conversionError
                          : (row.errors ?? []).length === 0
                            ? '—'
                            : (row.errors ?? [])
                                .map((err) => `${err.field ?? 'row'}: ${err.message}`)
                                .join('; ')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flexWrap: 'wrap' }}>
              {result.failed > 0 || (result.importedOnly ?? 0) > 0 ? (
                <Button variant="outlined" onClick={handleDownloadErrorReport}>
                  {t('admin.propertyBulk.downloadErrorReport')}
                </Button>
              ) : null}
              <Button variant="outlined" onClick={resetWorkflow}>
                {t('admin.propertyBulk.importAnother')}
              </Button>
              <Button variant="contained" onClick={() => navigate(ROUTES.adminProperties)}>
                {t('admin.propertyBulk.backToList')}
              </Button>
            </Stack>
          </Stack>
        ) : null}
      </Paper>

      <Button component={RouterLink} to={ROUTES.adminProperties}>
        {t('admin.common.backToList')}
      </Button>
    </Box>
  );
}
