import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { colors } from '@/shared/theme/colors';
import { getErrorMessage } from '@/shared/api/errors';
import { normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import type { MySpaceResponse } from '@/shared/types/space';
import { serviceContactsApi } from '../api/serviceContactsApi';
import type { ServiceContact, ServiceContactCategoryOption, ServiceContactDraft } from '../types';
import { associableSpaces } from '../utils/serviceContactAccess';
import { readDuplicate } from '../utils/serviceContactErrors';
import {
  draftFromContact,
  emptyDraft,
  toSaveBody,
  validateServiceContactDraft,
} from '../utils/serviceContactForm';

type ServiceContactFormDrawerProps = {
  open: boolean;
  contact: ServiceContact | null;
  categories: ServiceContactCategoryOption[];
  spaces: MySpaceResponse[];
  onClose: () => void;
  onSaved: () => void;
};

const FIELD_MESSAGE: Record<string, string> = {
  name_required: 'serviceContacts.requiredName',
  category_required: 'serviceContacts.requiredCategory',
  custom_required: 'serviceContacts.requiredCustom',
  method_required: 'serviceContacts.requiredMethod',
  phone_invalid: 'serviceContacts.invalidPhone',
  email_invalid: 'serviceContacts.invalidEmail',
};

export function ServiceContactFormDrawer({
  open,
  contact,
  categories,
  spaces,
  onClose,
  onSaved,
}: ServiceContactFormDrawerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const [draft, setDraft] = useState<ServiceContactDraft>(emptyDraft());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState<{ strong: boolean; names: string[] } | null>(null);
  const choices = useMemo(() => associableSpaces(spaces), [spaces]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(contact ? draftFromContact(contact) : emptyDraft());
    setErrors({});
    setDuplicate(null);
    setSaving(false);
  }, [open, contact]);

  function setField<K extends keyof ServiceContactDraft>(key: K, value: ServiceContactDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key] && key !== 'primaryPhone') {
        return current;
      }
      const next = { ...current };
      delete next[key as string];
      delete next.contactMethod;
      return next;
    });
  }

  function message(code: string | undefined): string | undefined {
    if (!code) return undefined;
    return t(FIELD_MESSAGE[code] ?? 'serviceContacts.saveError');
  }

  async function persist(acknowledgeDuplicate: boolean) {
    const nextErrors = validateServiceContactDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSaving(true);
    try {
      const body = toSaveBody(draft, acknowledgeDuplicate);
      if (contact) {
        await serviceContactsApi.update(contact.id, body);
      } else {
        await serviceContactsApi.create(body);
      }
      enqueueSnackbar(t('serviceContacts.saved'), { variant: 'success' });
      setDuplicate(null);
      onSaved();
    } catch (error) {
      const match = readDuplicate(error);
      if (match) {
        setDuplicate({
          strong: match.strong,
          names: match.matches.map((item) => item.businessName).filter(Boolean),
        });
        return;
      }
      enqueueSnackbar(getErrorMessage(error, t('serviceContacts.saveError')), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const phoneField = (key: 'primaryPhone' | 'alternatePhone' | 'whatsappPhone', label: string) => (
    <TextField
      label={label}
      value={draft[key]}
      error={Boolean(errors[key])}
      helperText={message(errors[key])}
      onChange={(event) => setField(key, normalizeIndianMobileDigits(event.target.value))}
      slotProps={{
        htmlInput: {
          inputMode: 'tel',
          maxLength: 10,
          'aria-label': label,
        },
        input: {
          startAdornment: <InputAdornment position="start">+91</InputAdornment>,
        },
      }}
    />
  );

  return (
    <>
      <AppDrawer open={open} onClose={saving ? () => undefined : onClose} width={480}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
            <Typography component="h2" sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
              {contact ? t('serviceContacts.formTitleEdit') : t('serviceContacts.formTitleAdd')}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.5 }}>
              {t('serviceContacts.reuseHint')}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, pb: 2 }}>
            <Stack spacing={1.75}>
              <TextField
                label={t('serviceContacts.businessName')}
                value={draft.businessName}
                required
                error={Boolean(errors.businessName)}
                helperText={message(errors.businessName)}
                onChange={(event) => setField('businessName', event.target.value)}
              />
              <FormControl required error={Boolean(errors.category)}>
                <InputLabel id="service-contact-category">{t('serviceContacts.category')}</InputLabel>
                <Select
                  labelId="service-contact-category"
                  label={t('serviceContacts.category')}
                  value={draft.category}
                  onChange={(event) => setField('category', event.target.value)}
                >
                  <MenuItem value="">{t('serviceContacts.category')}</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.code} value={category.code}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category ? <FormHelperText>{message(errors.category)}</FormHelperText> : null}
              </FormControl>
              {draft.category === 'OTHER' ? (
                <TextField
                  label={t('serviceContacts.customCategory')}
                  value={draft.customCategoryName}
                  required
                  error={Boolean(errors.customCategoryName)}
                  helperText={message(errors.customCategoryName)}
                  onChange={(event) => setField('customCategoryName', event.target.value)}
                />
              ) : null}
              <TextField
                label={`${t('serviceContacts.contactPerson')} (${t('serviceContacts.optional')})`}
                value={draft.contactPersonName}
                onChange={(event) => setField('contactPersonName', event.target.value)}
              />
              {phoneField('primaryPhone', t('serviceContacts.primaryPhone'))}
              {phoneField('alternatePhone', `${t('serviceContacts.alternatePhone')} (${t('serviceContacts.optional')})`)}
              {phoneField('whatsappPhone', `${t('serviceContacts.whatsappNumber')} (${t('serviceContacts.optional')})`)}
              <TextField
                label={`${t('serviceContacts.emailLabel')} (${t('serviceContacts.optional')})`}
                value={draft.email}
                error={Boolean(errors.email)}
                helperText={message(errors.email) ?? message(errors.contactMethod)}
                onChange={(event) => setField('email', event.target.value)}
                slotProps={{ htmlInput: { inputMode: 'email', 'aria-label': t('serviceContacts.emailLabel') } }}
              />
              <TextField
                label={`${t('serviceContacts.description')} (${t('serviceContacts.optional')})`}
                value={draft.description}
                onChange={(event) => setField('description', event.target.value)}
              />
              <TextField
                label={`${t('serviceContacts.address')} (${t('serviceContacts.optional')})`}
                value={draft.address}
                onChange={(event) => setField('address', event.target.value)}
              />
              <TextField
                label={`${t('serviceContacts.notes')} (${t('serviceContacts.optional')})`}
                value={draft.notes}
                multiline
                minRows={3}
                onChange={(event) => setField('notes', event.target.value)}
              />
              <FormControl>
                <InputLabel id="service-contact-spaces">{t('serviceContacts.spacesLabel')}</InputLabel>
                <Select
                  labelId="service-contact-spaces"
                  label={t('serviceContacts.spacesLabel')}
                  multiple
                  value={draft.spaceIds}
                  onChange={(event) => {
                    const value = event.target.value;
                    setField('spaceIds', typeof value === 'string' ? value.split(',') : value);
                  }}
                  renderValue={(selected) =>
                    choices
                      .filter((space) => selected.includes(space.spaceId))
                      .map((space) => space.spaceName)
                      .join(', ') || t('serviceContacts.noSpaces')
                  }
                >
                  {choices.map((space) => (
                    <MenuItem key={space.spaceId} value={space.spaceId}>
                      <Checkbox checked={draft.spaceIds.includes(space.spaceId)} />
                      <ListItemText primary={space.spaceName} />
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{t('serviceContacts.reuseHint')}</FormHelperText>
              </FormControl>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} sx={{ p: 2, borderTop: `1px solid ${s.border}` }}>
            <Button variant="outlined" onClick={onClose} disabled={saving} sx={dashOutlinedButtonSx}>
              {t('serviceContacts.cancel')}
            </Button>
            <Button
              variant="contained"
              disabled={saving}
              onClick={() => void persist(false)}
              sx={{ ...dashContainedButtonSx, bgcolor: colors.primaryDark, '&:hover': { bgcolor: colors.primaryHover } }}
            >
              {saving ? t('serviceContacts.loading') : t('serviceContacts.save')}
            </Button>
          </Stack>
        </Box>
      </AppDrawer>
      <Dialog open={Boolean(duplicate)} onClose={() => (saving ? undefined : setDuplicate(null))} fullWidth maxWidth="xs">
        <DialogTitle>{t('serviceContacts.duplicateTitle')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
            {duplicate?.strong ? t('serviceContacts.duplicateStrong') : t('serviceContacts.duplicateBody')}
          </Typography>
          {duplicate?.names.length ? (
            <Box component="ul" sx={{ mt: 1, pl: 2.5 }}>
              {duplicate.names.map((name) => (
                <li key={name}>
                  <Typography sx={DASHBOARD_UX.body}>{name}</Typography>
                </li>
              ))}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicate(null)} disabled={saving}>
            {t('serviceContacts.cancel')}
          </Button>
          <Button variant="contained" disabled={saving} onClick={() => void persist(true)}>
            {t('serviceContacts.saveAnyway')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
