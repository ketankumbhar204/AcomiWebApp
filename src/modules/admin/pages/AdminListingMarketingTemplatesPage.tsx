import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/modules/admin/api/adminApi';
import {
  LISTING_MARKETING_PLACEHOLDERS,
  insertListingMarketingPlaceholder,
  unsupportedListingMarketingPlaceholders,
} from '@/modules/admin/marketing/listingMarketingPlaceholders';
import {
  buildMessageForTemplate,
  type ListingMarketingTemplate,
} from '@/modules/admin/marketing/listingMarketingTemplates';
import { getErrorMessage } from '@/shared/api/errors';
import type {
  AdminListingMarketingTemplate,
  AdminUpsertListingMarketingTemplateRequest,
  ListingMarketingTemplateApplicability,
} from '@/shared/types/admin';
import { colors } from '@/shared/theme/colors';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

type Draft = {
  name: string;
  description: string;
  body: string;
  applicability: ListingMarketingTemplateApplicability;
  active: boolean;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  description: '',
  body: '',
  applicability: 'PROPERTY',
  active: true,
};

const SAMPLE_FIELDS = {
  name: 'Sunrise PG',
  ownerName: 'Ravi',
  spaceType: 'PG',
  location: 'Wakad, Pune',
  address: '123 Main Road, Wakad',
  rentOrPrice: '₹8,000 / month',
  sharing: '2 sharing',
  amenities: 'WiFi, Laundry',
  foodIncluded: 'Breakfast + Dinner',
  genderPolicy: 'Male',
  description: 'Near IT park',
};

function toDraft(row: AdminListingMarketingTemplate): Draft {
  return {
    name: row.name,
    description: row.description ?? '',
    body: row.body,
    applicability: row.applicability,
    active: row.active,
  };
}

function toRequest(draft: Draft): AdminUpsertListingMarketingTemplateRequest {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    body: draft.body,
    applicability: draft.applicability,
    active: draft.active,
  };
}

export function AdminListingMarketingTemplatesPage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<AdminListingMarketingTemplate[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listListingMarketingTemplates();
      setRows(data);
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, t('admin.marketing.templatesPage.loadFailed')), {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const preview = useMemo(() => {
    const selectable: ListingMarketingTemplate = {
      key: editingId ? `custom:${editingId}` : 'custom:preview',
      name: draft.name || 'Preview',
      body: draft.body,
      kinds:
        draft.applicability === 'BOTH'
          ? ['PROPERTY', 'MESS']
          : [draft.applicability],
      builtin: false,
      active: draft.active,
    };
    return buildMessageForTemplate(selectable, SAMPLE_FIELDS);
  }, [draft, editingId]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setEditorOpen(true);
  };

  const openEdit = (row: AdminListingMarketingTemplate) => {
    setEditingId(row.id);
    setDraft(toDraft(row));
    setEditorOpen(true);
  };

  const insertPlaceholder = (token: string) => {
    const el = bodyRef.current;
    const cursor = el ? el.selectionStart ?? draft.body.length : draft.body.length;
    const next = insertListingMarketingPlaceholder(draft.body, token, cursor);
    setDraft((prev) => ({ ...prev, body: next }));
    requestAnimationFrame(() => {
      if (!el) return;
      const pos = cursor + `{{${token}}}`.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const saveDraft = async () => {
    if (!draft.name.trim()) {
      enqueueSnackbar(t('admin.marketing.templatesPage.nameRequired'), { variant: 'warning' });
      return;
    }
    if (!draft.body.trim()) {
      enqueueSnackbar(t('admin.marketing.templatesPage.bodyRequired'), { variant: 'warning' });
      return;
    }
    const unsupported = unsupportedListingMarketingPlaceholders(draft.body);
    if (unsupported.length > 0) {
      enqueueSnackbar(
        t('admin.marketing.templatesPage.unsupportedPlaceholders', {
          tokens: unsupported.map((token) => `{{${token}}}`).join(', '),
        }),
        { variant: 'warning' },
      );
      return;
    }

    setSaving(true);
    try {
      const payload = toRequest(draft);
      if (editingId) {
        await adminApi.updateListingMarketingTemplate(editingId, payload);
        enqueueSnackbar(t('admin.marketing.templatesPage.updated'), { variant: 'success' });
      } else {
        await adminApi.createListingMarketingTemplate(payload);
        enqueueSnackbar(t('admin.marketing.templatesPage.created'), { variant: 'success' });
      }
      setEditorOpen(false);
      await load();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, t('admin.marketing.templatesPage.saveFailed')), {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const duplicateRow = async (id: string) => {
    setSaving(true);
    try {
      await adminApi.duplicateListingMarketingTemplate(id);
      enqueueSnackbar(t('admin.marketing.templatesPage.duplicated'), { variant: 'success' });
      await load();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, t('admin.marketing.templatesPage.saveFailed')), {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await adminApi.deleteListingMarketingTemplate(deleteId);
      enqueueSnackbar(t('admin.marketing.templatesPage.deleted'), { variant: 'success' });
      setDeleteId(null);
      await load();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, t('admin.marketing.templatesPage.deleteFailed')), {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {t('admin.marketing.templatesPage.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.5 }}>
            {t('admin.marketing.templatesPage.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={openCreate}
          sx={{ textTransform: 'none', fontWeight: 700, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
          {t('admin.marketing.templatesPage.create')}
        </Button>
      </Stack>

      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px solid ${colors.border}`,
          bgcolor: colors.surface,
        }}>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>
          {t('admin.marketing.templatesPage.customSection')}
        </Typography>
        <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1.5 }}>
          {t('admin.marketing.templatesPage.editableHint')}
        </Typography>
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : rows.length === 0 ? (
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            {t('admin.marketing.templatesPage.empty')}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {rows.map((row) => (
              <Box
                key={row.id}
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  border: `1px solid ${colors.border}`,
                  bgcolor: '#fff',
                }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' } }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 0.5 }}>
                      <Typography sx={{ fontWeight: 800 }}>{row.name}</Typography>
                      <Chip
                        size="small"
                        label={row.active
                          ? t('admin.marketing.templatesPage.active')
                          : t('admin.marketing.templatesPage.inactive')}
                        color={row.active ? 'success' : 'default'}
                        variant="outlined"
                      />
                      <Chip size="small" label={row.applicability} variant="outlined" />
                    </Stack>
                    {row.description ? (
                      <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.75 }}>
                        {row.description}
                      </Typography>
                    ) : null}
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        whiteSpace: 'pre-wrap',
                        color: colors.textSecondary,
                        maxHeight: 72,
                        overflow: 'hidden',
                      }}>
                      {row.body}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      startIcon={<Pencil size={14} />}
                      onClick={() => openEdit(row)}
                      sx={dashOutlinedButtonSx}>
                      {t('admin.common.edit')}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Copy size={14} />}
                      disabled={saving}
                      onClick={() => void duplicateRow(row.id)}
                      sx={dashOutlinedButtonSx}>
                      {t('admin.marketing.templatesPage.duplicate')}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Trash2 size={14} />}
                      disabled={saving}
                      onClick={() => setDeleteId(row.id)}
                      sx={dashOutlinedButtonSx}>
                      {t('admin.common.delete')}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <Dialog open={editorOpen} onClose={saving ? undefined : () => setEditorOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingId
            ? t('admin.marketing.templatesPage.editTitle')
            : t('admin.marketing.templatesPage.createTitle')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t('admin.marketing.templatesPage.name')}
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label={t('admin.marketing.templatesPage.description')}
              value={draft.description}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
              fullWidth
              size="small"
              multiline
              minRows={2}
            />
            <FormControl size="small" fullWidth>
              <InputLabel id="marketing-applicability-label">
                {t('admin.marketing.templatesPage.applicability')}
              </InputLabel>
              <Select
                labelId="marketing-applicability-label"
                label={t('admin.marketing.templatesPage.applicability')}
                value={draft.applicability}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    applicability: e.target.value as ListingMarketingTemplateApplicability,
                  }))
                }>
                <MenuItem value="PROPERTY">
                  {t('admin.marketing.templatesPage.applicabilityProperty')}
                </MenuItem>
                <MenuItem value="MESS">
                  {t('admin.marketing.templatesPage.applicabilityMess')}
                </MenuItem>
                <MenuItem value="BOTH">
                  {t('admin.marketing.templatesPage.applicabilityBoth')}
                </MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={draft.active}
                  onChange={(e) => setDraft((prev) => ({ ...prev, active: e.target.checked }))}
                />
              }
              label={t('admin.marketing.templatesPage.active')}
            />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: colors.textSecondary }}>
                {t('admin.marketing.templatesPage.placeholders')}
              </Typography>
              <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 0.75 }}>
                {LISTING_MARKETING_PLACEHOLDERS.map((token) => (
                  <Chip
                    key={token}
                    size="small"
                    label={`{{${t(`admin.marketing.placeholders.${token}`, { defaultValue: token })}}}`}
                    onClick={() => insertPlaceholder(token)}
                    clickable
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
            <TextField
              label={t('admin.marketing.templatesPage.body')}
              value={draft.body}
              onChange={(e) => setDraft((prev) => ({ ...prev, body: e.target.value }))}
              fullWidth
              multiline
              minRows={8}
              inputRef={bodyRef}
              helperText={t('admin.marketing.templatesPage.bodyHint')}
            />
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                border: `1px dashed ${colors.border}`,
                bgcolor: '#F8FAFC',
              }}>
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.75 }}>
                {t('admin.marketing.templatesPage.preview')}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {preview || t('admin.marketing.templatesPage.previewEmpty')}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button disabled={saving} onClick={() => setEditorOpen(false)} sx={dashOutlinedButtonSx}>
            {t('admin.common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={() => void saveDraft()}
            sx={{ textTransform: 'none', fontWeight: 700 }}>
            {saving ? t('admin.common.saving') : t('admin.common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteId)} onClose={saving ? undefined : () => setDeleteId(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {t('admin.marketing.templatesPage.deleteTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            {t('admin.marketing.templatesPage.deleteHint')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button disabled={saving} onClick={() => setDeleteId(null)} sx={dashOutlinedButtonSx}>
            {t('admin.common.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={saving}
            onClick={() => void confirmDelete()}
            sx={{ textTransform: 'none', fontWeight: 700 }}>
            {t('admin.common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
