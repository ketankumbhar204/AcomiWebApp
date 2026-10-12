import { IconButton, Tooltip } from '@mui/material';
import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { accountHomePath } from '@/shared/utils/accountHomePath';
import { colors } from '@/shared/theme/colors';
import { useSpaceStore } from '@/store/spaceStore';

/** Leaves the open space for My Spaces, or the member home when there are none. */
export function SpaceDashboardHomeButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasSpaces = useSpaceStore((state) => state.mySpaces.length > 0);
  const label = t('navigation.home', { defaultValue: 'Home' });

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        onClick={() => navigate(accountHomePath(hasSpaces))}
        sx={{
          flexShrink: 0,
          width: 40,
          height: 40,
          color: colors.textPrimary,
        }}
      >
        <Home size={20} />
      </IconButton>
    </Tooltip>
  );
}
