import { Box, Stack, Typography } from '@mui/material';
import {
  Building2,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  FileText,
  MapPin,
  Target,
  Users,
  XCircle,
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import type { AdminActivityItem, AdminActivityType } from '@/shared/types/admin';
import {
  adminActivityAccent,
  formatAdminActivityCardTime,
  formatAdminRelativeTime,
} from '@/modules/admin/utils/adminActivityUi';
import { resolveAdminActivityDestination } from '@/modules/admin/utils/resolveAdminActivityDestination';

function ActivityIcon({ type, size = 15 }: { type: AdminActivityType; size?: number }) {
  switch (type) {
    case 'NEW_ENQUIRY':
    case 'ENQUIRY_SHARED':
      return <FileText size={size} />;
    case 'ENQUIRY_REJECTED':
      return <XCircle size={size} />;
    case 'NEW_USER_REGISTRATION':
      return <Users size={size} />;
    case 'NEW_PROPERTY_REGISTRATION':
    case 'NEW_PROPERTY_LISTED':
      return <Building2 size={size} />;
    case 'NEW_MESS_REGISTRATION':
    case 'NEW_MESS_LISTED':
      return <ChefHat size={size} />;
    case 'LEAD_CLAIMED_PROPERTY':
    case 'LEAD_CLAIMED_MESS':
      return <Target size={size} />;
    case 'ADDRESS_SAVED':
      return <MapPin size={size} />;
    default:
      return <CheckCircle2 size={size} />;
  }
}

type AdminActivityRowProps = {
  activity: AdminActivityItem;
  variant?: 'compact' | 'card';
};

export function AdminActivityRow({ activity, variant = 'compact' }: AdminActivityRowProps) {
  const accent = adminActivityAccent(activity.type);
  const to = resolveAdminActivityDestination(activity);
  const isCard = variant === 'card';

  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: isCard ? 1.5 : 1.25,
        px: isCard ? 1.75 : 1,
        py: isCard ? 1.6 : 1.1,
        borderRadius: isCard ? '14px' : '10px',
        textDecoration: 'none',
        color: 'inherit',
        bgcolor: isCard ? '#FFFFFF' : 'transparent',
        border: isCard ? '1px solid' : 'none',
        borderColor: isCard ? 'divider' : undefined,
        boxShadow: isCard
          ? '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px rgb(15 23 42 / 0.04)'
          : undefined,
        height: '100%',
        transition: 'background-color 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        '&:hover': {
          bgcolor: '#F0FDF4',
          borderColor: isCard ? '#86EFAC' : undefined,
          boxShadow: isCard
            ? '0 2px 8px rgb(15 23 42 / 0.08), 0 8px 20px rgb(34 197 94 / 0.08)'
            : undefined,
        },
      }}>
      <Box
        sx={{
          width: isCard ? 42 : 34,
          height: isCard ? 42 : 34,
          borderRadius: '10px',
          bgcolor: accent.bg,
          color: accent.fg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
        <ActivityIcon type={activity.type} size={isCard ? 18 : 15} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: isCard ? 14.5 : 13.5,
            color: 'text.primary',
            lineHeight: 1.3,
          }}
          noWrap>
          {activity.title}
        </Typography>
        <Typography
          sx={{ fontSize: isCard ? 13 : 12.5, color: 'text.secondary', mt: 0.25 }}
          noWrap>
          {activity.description}
        </Typography>
      </Box>
      <Stack
        direction={isCard ? 'row' : 'row'}
        spacing={0.75}
        sx={{ alignItems: 'center', flexShrink: 0 }}>
        <Typography
          sx={{
            fontSize: isCard ? 12 : 11,
            fontWeight: 500,
            color: 'text.secondary',
            whiteSpace: 'nowrap',
            textAlign: 'right',
          }}>
          {isCard
            ? formatAdminActivityCardTime(activity.timestamp)
            : formatAdminRelativeTime(activity.timestamp)}
        </Typography>
        <ChevronRight size={isCard ? 16 : 15} color="#CBD5E1" />
      </Stack>
    </Box>
  );
}
