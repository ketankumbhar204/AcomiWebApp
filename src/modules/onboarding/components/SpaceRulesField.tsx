import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useTranslation } from 'react-i18next';
import type { RuleAssignment, SpaceType } from '@/shared/types/space';
import { colors } from '@/shared/theme/colors';
import {
  MAX_RULE_TEXT_LENGTH,
  MAX_SPACE_RULES,
  buildEditableRuleRows,
  selectedRulesFromEditableRows,
} from '@/modules/onboarding/utils/spaceRules';

type SpaceRulesFieldProps = {
  spaceType: SpaceType | null | undefined;
  value: RuleAssignment[];
  onChange: (value: RuleAssignment[]) => void;
  disabled?: boolean;
};

type EditableRow = ReturnType<typeof buildEditableRuleRows>[number] & { rowId: string };

export function SpaceRulesField({
  spaceType,
  value,
  onChange,
  disabled = false,
}: SpaceRulesFieldProps) {
  const { t } = useTranslation();
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [addingCustom, setAddingCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState('');

  const rows: EditableRow[] = useMemo(() => {
    let customIndex = 0;
    return buildEditableRuleRows(spaceType, value).map((row) => ({
      ...row,
      rowId: row.isCustom ? `CUSTOM:${customIndex++}:${row.label}` : row.code,
    }));
  }, [spaceType, value]);

  function commit(nextRows: EditableRow[]) {
    onChange(
      selectedRulesFromEditableRows(
        nextRows.map(({ code, label, selected }) => ({ code, label, selected })),
      ),
    );
  }

  function toggleRow(rowId: string) {
    if (disabled) return;
    const next = rows.map((row) =>
      row.rowId === rowId ? { ...row, selected: !row.selected } : row,
    );
    if (next.filter((row) => row.selected).length > MAX_SPACE_RULES) {
      return;
    }
    commit(next);
  }

  function saveEdit(rowId: string) {
    const text = draftText.trim();
    if (!text || text.length > MAX_RULE_TEXT_LENGTH) return;
    commit(
      rows.map((row) =>
        row.rowId === rowId ? { ...row, label: text, selected: true } : row,
      ),
    );
    setEditingRowId(null);
    setDraftText('');
  }

  function addCustom() {
    const text = customDraft.trim();
    if (!text || text.length > MAX_RULE_TEXT_LENGTH) return;
    if (rows.filter((row) => row.selected).length >= MAX_SPACE_RULES) return;
    onChange(
      selectedRulesFromEditableRows([
        ...rows.map(({ code, label, selected }) => ({ code, label, selected })),
        { code: 'CUSTOM', label: text, selected: true },
      ]),
    );
    setCustomDraft('');
    setAddingCustom(false);
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '10px',
            bgcolor: `${colors.primary}18`,
            color: colors.primaryDark,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <DescriptionOutlinedIcon fontSize="small" />
        </Box>
        <Box>
          <Typography fontWeight={700}>
            {t('spaces.rules.title', { defaultValue: 'Rules & Guidelines' })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('spaces.rules.helper', {
              defaultValue:
                'Select, edit or add rules for this space. These rules will be shown to residents.',
            })}
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          border: `1px solid ${colors.border}`,
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#fff',
        }}
      >
        {rows.map((row, index) => {
          const editing = editingRowId === row.rowId;
          return (
            <Box
              key={row.rowId}
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'flex-start',
                px: 1.5,
                py: 1.25,
                borderBottom:
                  index < rows.length - 1 ? `1px solid ${colors.border}` : 'none',
              }}
            >
              <Checkbox
                checked={row.selected}
                onChange={() => toggleRow(row.rowId)}
                disabled={disabled}
                sx={{
                  color: colors.primary,
                  '&.Mui-checked': { color: colors.primary },
                  p: 0.5,
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {editing ? (
                  <Stack spacing={1}>
                    <TextField
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      multiline
                      minRows={2}
                      fullWidth
                      disabled={disabled}
                      inputProps={{ maxLength: MAX_RULE_TEXT_LENGTH }}
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        onClick={() => {
                          setEditingRowId(null);
                          setDraftText('');
                        }}
                      >
                        {t('common.cancel', { defaultValue: 'Cancel' })}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => saveEdit(row.rowId)}
                        sx={{ bgcolor: colors.primary, '&:hover': { bgcolor: colors.primaryHover } }}
                      >
                        {t('common.save', { defaultValue: 'Save' })}
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Typography
                    sx={{
                      color: row.selected ? 'text.primary' : 'text.secondary',
                      lineHeight: 1.45,
                      pt: 0.5,
                    }}
                  >
                    {row.label}
                  </Typography>
                )}
              </Box>
              {!editing ? (
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    disabled={disabled}
                    onClick={() => {
                      setEditingRowId(row.rowId);
                      setDraftText(row.label);
                    }}
                    aria-label={t('spaces.rules.editA11y', { defaultValue: 'Edit rule' })}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  {row.isCustom ? (
                    <IconButton
                      size="small"
                      disabled={disabled}
                      onClick={() => commit(rows.filter((r) => r.rowId !== row.rowId))}
                      aria-label={t('spaces.rules.deleteA11y', {
                        defaultValue: 'Delete custom rule',
                      })}
                    >
                      <DeleteOutlineIcon fontSize="small" color="error" />
                    </IconButton>
                  ) : null}
                </Stack>
              ) : null}
            </Box>
          );
        })}
      </Box>

      {addingCustom ? (
        <Stack spacing={1}>
          <TextField
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            autoFocus
            disabled={disabled}
            placeholder={t('spaces.rules.customPlaceholder', {
              defaultValue: 'Enter a custom rule',
            })}
            inputProps={{ maxLength: MAX_RULE_TEXT_LENGTH }}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              onClick={() => {
                setAddingCustom(false);
                setCustomDraft('');
              }}
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={addCustom}
              sx={{ bgcolor: colors.primary, '&:hover': { bgcolor: colors.primaryHover } }}
            >
              {t('spaces.rules.add', { defaultValue: 'Add' })}
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          disabled={disabled}
          onClick={() => setAddingCustom(true)}
          sx={{
            borderColor: colors.primary,
            color: colors.primaryDark,
            borderWidth: 1.5,
            '&:hover': { borderColor: colors.primaryDark, bgcolor: `${colors.primary}0F` },
          }}
        >
          {t('spaces.rules.addCustom', { defaultValue: 'Add Custom Rule' })}
        </Button>
      )}
    </Stack>
  );
}

export function SpaceRulesReadOnlyList({ rules }: { rules: RuleAssignment[] }) {
  const { t } = useTranslation();
  const selected = rules.filter((rule) => rule.label?.trim());
  if (selected.length === 0) {
    return null;
  }
  return (
    <Box
      sx={{
        border: `1px solid ${colors.border}`,
        borderRadius: 2,
        bgcolor: '#fff',
        p: 2,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
        <DescriptionOutlinedIcon sx={{ color: colors.primary }} fontSize="small" />
        <Typography fontWeight={700}>
          {t('spaces.rules.title', { defaultValue: 'Rules & Guidelines' })}
        </Typography>
      </Stack>
      <Stack spacing={1}>
        {selected.map((rule, index) => (
          <Typography key={`${rule.code}-${index}`} sx={{ pl: 0.5, lineHeight: 1.45 }}>
            ✓ {rule.label}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}
