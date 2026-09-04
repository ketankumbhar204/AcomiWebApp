import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  useTheme,
} from '@mui/material';
import type { FormEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { PageHeader } from '@/shared/components/PageHeader';
import { StickyFooter, StickyFooterClearance } from '@/shared/components/StickyFooter';
import type { BreadcrumbItem } from '@/shared/components/Breadcrumbs';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

type AdminRegistrationFormLayoutProps = {
  title: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  cancelTo: string;
  submitLabel: string;
  loading: boolean;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
};

export function AdminRegistrationFormLayout({
  title,
  description,
  breadcrumbs,
  cancelTo,
  submitLabel,
  loading,
  error,
  onSubmit,
  children,
}: AdminRegistrationFormLayoutProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 1 }}
    >
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />

      {error ? (
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_UX.radius}px` }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={2}>{children}</Stack>

      <StickyFooterClearance />

      <StickyFooter pin="fixed">
        <Button
          component={RouterLink}
          to={cancelTo}
          disabled={loading}
          sx={dashOutlinedButtonSx}
        >
          {t('admin.common.cancel')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={dashContainedButtonSx}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            submitLabel
          )}
        </Button>
      </StickyFooter>

      <Box
        sx={{
          ...DASHBOARD_UX.body,
          color: s.textMuted,
          fontSize: '0.8125rem',
          px: 0.5,
        }}
      >
        {t('admin.common.formOptionalHint')}
      </Box>
    </Box>
  );
}
