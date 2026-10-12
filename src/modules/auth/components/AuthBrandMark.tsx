import { Box } from '@mui/material';
import { AUTH_UX } from '../theme/authUx';

type AuthBrandMarkProps = {
  size?: number;
};

/** ACOMI house mark — spoon and fork forming the roof. */
export function AuthBrandMark({ size = AUTH_UX.markSize }: AuthBrandMarkProps) {
  return (
    <Box
      component="img"
      src="/brand/icon-light.png"
      alt=""
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: `${Math.round(size * 0.22)}px`,
        objectFit: 'cover',
        display: 'block',
      }}
    />
  );
}
