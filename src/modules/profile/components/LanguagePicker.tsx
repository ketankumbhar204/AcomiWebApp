import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  changeAppLanguage,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
} from '@/i18n';

type LanguagePickerProps = {
  value: AppLanguage;
  hideLabel?: boolean;
  /** Compact select for app header toolbars. */
  compact?: boolean;
};

export function LanguagePicker({
  value,
  hideLabel = false,
  compact = false,
}: LanguagePickerProps) {
  const { t } = useTranslation();

  const handleChange = (event: SelectChangeEvent) => {
    const next = event.target.value as AppLanguage;
    if (next === value) return;
    void changeAppLanguage(next);
  };

  if (compact) {
    return (
      <FormControl size="small" sx={{ minWidth: { xs: 96, sm: 120 } }}>
        <Select
          id="app-language-header"
          value={value}
          onChange={handleChange}
          aria-label={t('settings.language.select')}
          displayEmpty
          sx={{
            height: 36,
            borderRadius: 999,
            typography: 'body2',
            '& .MuiSelect-select': {
              py: 0.75,
              px: 1.5,
            },
          }}
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <MenuItem key={language} value={language}>
              {t(`settings.language.names.${language}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <FormControl fullWidth size="small">
      {hideLabel ? null : (
        <InputLabel id="app-language-label">{t('settings.language.title')}</InputLabel>
      )}
      <Select
        labelId={hideLabel ? undefined : 'app-language-label'}
        id="app-language"
        value={value}
        label={hideLabel ? undefined : t('settings.language.title')}
        onChange={handleChange}
        aria-label={t('settings.language.select')}
        displayEmpty={hideLabel}
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <MenuItem key={language} value={language}>
            {t(`settings.language.names.${language}`)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
