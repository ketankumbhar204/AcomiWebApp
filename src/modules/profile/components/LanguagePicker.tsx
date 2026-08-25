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
};

export function LanguagePicker({ value, hideLabel = false }: LanguagePickerProps) {
  const { t } = useTranslation();

  const handleChange = (event: SelectChangeEvent) => {
    const next = event.target.value as AppLanguage;
    if (next === value) return;
    void changeAppLanguage(next);
  };

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
