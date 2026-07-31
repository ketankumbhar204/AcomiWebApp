import { Box, Link, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

const MAIN_ID = 'main-content';

/** Skip link for keyboard users — first focusable in app chrome. */
export function SkipLink() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Link
      href={`#${MAIN_ID}`}
      underline="none"
      sx={{
        position: 'absolute',
        left: 12,
        top: 12,
        zIndex: (th) => th.zIndex.tooltip + 1,
        px: 1.5,
        py: 1,
        borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        bgcolor: colors.primaryDark,
        color: '#FFFFFF',
        ...DASHBOARD_UX.button,
        transform: 'translateY(-120%)',
        transition: 'transform 120ms ease',
        '&:focus': {
          transform: 'translateY(0)',
          outline: `2px solid ${s.textPrimary}`,
          outlineOffset: 2,
        },
      }}
    >
      {t('a11y.skipToContent', { defaultValue: 'Skip to main content' })}
    </Link>
  );
}

export { MAIN_ID as MAIN_CONTENT_ID };
