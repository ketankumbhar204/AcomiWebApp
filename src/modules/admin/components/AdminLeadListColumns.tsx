import { Box, Stack } from '@mui/material';
import type { ReactNode } from 'react';

const headerSx = {
  px: 2,
  py: 1,
  display: { xs: 'none' as const, sm: 'flex' as const },
  color: 'text.secondary',
  typography: 'caption',
  fontWeight: 600,
};

const entityColumnSx = { flex: 1, minWidth: 0 };
const sourceColumnSx = { width: 152, flexShrink: 0 };
const testLeadColumnSx = { width: 72, flexShrink: 0, textAlign: 'center' as const };
const actionsColumnSx = { width: 72, flexShrink: 0, textAlign: 'right' as const };

type AdminLeadListHeaderProps = {
  entityLabel: string;
};

export function AdminLeadListHeader({ entityLabel }: AdminLeadListHeaderProps) {
  return (
    <Stack direction="row" sx={headerSx}>
      <Box sx={entityColumnSx}>{entityLabel}</Box>
      <Box sx={sourceColumnSx}>Source</Box>
      <Box sx={testLeadColumnSx}>Test lead</Box>
      <Box sx={actionsColumnSx}>Actions</Box>
    </Stack>
  );
}

type AdminLeadListRowProps = {
  entity: ReactNode;
  source: ReactNode;
  testLead: ReactNode;
  actions: ReactNode;
};

export function AdminLeadListRow({ entity, source, testLead, actions }: AdminLeadListRowProps) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center' }}>
      <Box sx={entityColumnSx}>{entity}</Box>
      <Box sx={{ ...sourceColumnSx, display: 'flex', alignItems: 'center' }}>{source}</Box>
      <Box sx={{ ...testLeadColumnSx, alignSelf: 'center' }}>{testLead}</Box>
      <Box sx={{ ...actionsColumnSx, alignSelf: 'center' }}>{actions}</Box>
    </Stack>
  );
}
