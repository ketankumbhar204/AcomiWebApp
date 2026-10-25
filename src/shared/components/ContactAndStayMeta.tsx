import { Box, Typography } from '@mui/material';
import { BedSingle, Phone } from 'lucide-react';
import type { SxProps, Theme } from '@mui/material/styles';
import { formatMemberContactNumber } from '@/shared/utils/indianMobile';
import { formatStayTrail } from '@/shared/utils/stayTrail';

type ContactNumberLineProps = {
  value?: string | null;
  label?: string | null;
  sx?: SxProps<Theme>;
};

export function ContactNumberLine({ value, label, sx }: ContactNumberLineProps) {
  const text = label?.trim() || formatMemberContactNumber(value);
  if (!text) {
    return null;
  }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, minWidth: 0, ...sx }}>
      <Phone size={13} color="#64748B" strokeWidth={2.2} aria-hidden />
      <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', overflowWrap: 'anywhere' }}>
        {text}
      </Typography>
    </Box>
  );
}

type StayTrailLineProps = {
  label?: string | null;
  sx?: SxProps<Theme>;
};

export function StayTrailLine({ label, sx }: StayTrailLineProps) {
  const text = formatStayTrail(label);
  if (!text) {
    return null;
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, minWidth: 0, ...sx }}>
      <BedSingle size={13} color="#64748B" strokeWidth={2.2} aria-hidden style={{ marginTop: 2, flexShrink: 0 }} />
      <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>
        {text}
      </Typography>
    </Box>
  );
}
