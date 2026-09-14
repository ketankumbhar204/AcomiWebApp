import { Box, type BoxProps } from '@mui/material';
import { useState } from 'react';
import { colors } from '@/shared/theme/colors';

type DiscoverListingImageProps = {
  src: string;
  alt: string;
} & Omit<BoxProps, 'component' | 'children'>;

/**
 * Cover image with mint fallback — mirrors AcomiPublicWebsite ListingImage.
 */
export function DiscoverListingImage({ src, alt, sx, ...rest }: DiscoverListingImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <Box
        role="img"
        aria-label={alt}
        sx={{
          bgcolor: colors.mintSubtle,
          width: '100%',
          height: '100%',
          ...((sx as object) ?? {}),
        }}
        {...rest}
      />
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      sx={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        bgcolor: colors.mintSubtle,
        ...((sx as object) ?? {}),
      }}
      {...rest}
    />
  );
}
