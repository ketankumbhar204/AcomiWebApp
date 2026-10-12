/**
 * Transparent host for a GuidedStepPanel inside a sticky/fixed footer.
 * Drops the mint strip so the dark panel is the only guidance surface.
 */
export const guidedStepFooterHostSx = {
  bgcolor: 'transparent',
  backgroundImage: 'none',
  border: 'none',
  boxShadow: 'none',
  px: { xs: 2, md: 3 },
  pt: 0,
  pb: { xs: 1.5, md: 2 },
} as const;
