import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type AdminNumberedFormSectionProps = {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
};

export function AdminNumberedFormSection({
  step,
  title,
  description,
  children,
}: AdminNumberedFormSectionProps) {
  return (
    <Box
      sx={{
        bgcolor: '#FFFFFF',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '14px',
        p: { xs: 2, md: 2.5 },
        boxShadow: '0 1px 2px rgb(15 23 42 / 0.04)',
      }}>
      <StackHeader step={step} title={title} description={description} />
      <Box
        sx={{
          display: 'grid',
          gap: 1.75,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          mt: 2,
        }}>
        {children}
      </Box>
    </Box>
  );
}

function StackHeader({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description?: string;
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          bgcolor: '#22C55E',
          color: '#FFFFFF',
          fontWeight: 800,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          mt: 0.15,
        }}>
        {step}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.2 }}>{title}</Typography>
        {description ? (
          <Typography sx={{ color: 'text.secondary', fontSize: 13.5, mt: 0.35 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
