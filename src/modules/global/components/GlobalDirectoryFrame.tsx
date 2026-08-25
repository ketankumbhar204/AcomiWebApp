import { Button, Stack } from '@mui/material';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

type GlobalDirectoryFrameProps = {
  title: string;
  description: string;
  onRefresh?: () => void;
  children: ReactNode;
};

export function GlobalDirectoryFrame({
  title,
  description,
  onRefresh,
  children,
}: GlobalDirectoryFrameProps) {
  const { t } = useTranslation();

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={title}
          description={description}
          actions={
            onRefresh ? (
              <Button variant="outlined" onClick={() => void onRefresh()} sx={dashOutlinedButtonSx}>
                {t('common.refresh', { defaultValue: 'Refresh' })}
              </Button>
            ) : null
          }
        />
        {children}
      </Stack>
    </PageContainer>
  );
}
