import { Avatar, AvatarGroup, Tooltip } from '@mui/material';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';

export type AvatarStackItem = {
  id: string;
  name: string;
  src?: string;
};

type AvatarStackProps = {
  items: AvatarStackItem[];
  max?: number;
  size?: number;
};

/** Initials use badge token (compact glyph), same as StatusChip. */
export function AvatarStack({ items, max = 4, size = 32 }: AvatarStackProps) {
  return (
    <AvatarGroup
      max={max}
      sx={{
        '& .MuiAvatar-root': {
          width: size,
          height: size,
          ...DASHBOARD_UX.badge,
        },
      }}
    >
      {items.map((item) => (
        <Tooltip key={item.id} title={item.name}>
          <Avatar alt={item.name} src={item.src}>
            {item.name.slice(0, 1).toUpperCase()}
          </Avatar>
        </Tooltip>
      ))}
    </AvatarGroup>
  );
}
