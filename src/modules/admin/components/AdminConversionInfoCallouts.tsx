import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { colors } from '@/shared/theme/colors';

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

/** Blue + yellow callouts shown under the conversion panel (mockup). */
export function AdminConversionInfoCallouts() {
  const { t } = useTranslation();
  const whatHappens = asStringList(t('admin.conversion.whatHappensItems', { returnObjects: true }));
  const important = asStringList(t('admin.conversion.importantItems', { returnObjects: true }));

  return (
    <>
      <Box
        sx={{
          p: 2,
          borderRadius: 2.5,
          bgcolor: colors.infoTint,
          border: '1px solid #BFDBFE',
        }}
      >
        <Typography sx={{ fontWeight: 800, color: colors.info, mb: 1 }}>
          {t('admin.conversion.whatHappensTitle')}
        </Typography>
        <Box component="ol" sx={{ m: 0, pl: 2.25, color: colors.textPrimary }}>
          {whatHappens.map((item) => (
            <Typography key={item} component="li" variant="body2" sx={{ mb: 0.75 }}>
              {item}
            </Typography>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          p: 2,
          borderRadius: 2.5,
          bgcolor: colors.warningTint,
          border: '1px solid #FDE68A',
        }}
      >
        <Typography sx={{ fontWeight: 800, color: colors.warning, mb: 1 }}>
          {t('admin.conversion.importantTitle')}
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.25, color: colors.textPrimary }}>
          {important.map((item) => (
            <Typography key={item} component="li" variant="body2" sx={{ mb: 0.75 }}>
              {item}
            </Typography>
          ))}
        </Box>
      </Box>
    </>
  );
}
