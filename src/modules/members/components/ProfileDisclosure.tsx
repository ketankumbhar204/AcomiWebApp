import { Accordion, AccordionDetails, AccordionSummary, Box, Typography, useTheme } from '@mui/material';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';

type ProfileDisclosureProps = {
  title: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  actions?: ReactNode;
  children: ReactNode;
};

export function ProfileDisclosure({
  title,
  icon: Icon,
  defaultOpen = false,
  actions,
  children,
}: ProfileDisclosureProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Accordion
      defaultExpanded={defaultOpen}
      disableGutters
      elevation={0}
      sx={{
        border: `1px solid ${s.border}`,
        borderRadius: `${DASHBOARD_UX.tileRadius}px`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        '&:before': { display: 'none' },
        '&.Mui-expanded': { margin: 0 },
      }}
    >
      <AccordionSummary
        expandIcon={<ChevronDown size={18} color={s.textMuted} />}
        aria-controls={`${title}-content`}
        id={`${title}-header`}
        sx={{
          minHeight: 48,
          px: 1.5,
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            gap: 1,
            my: 1,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
          {Icon ? <Icon size={16} color={colors.primaryDark} strokeWidth={2.2} /> : null}
          <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }} noWrap={false}>
            {title}
          </Typography>
        </Box>
        {actions ? (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {actions}
          </Box>
        ) : null}
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.5, pt: 0, pb: 1.5 }}>{children}</AccordionDetails>
    </Accordion>
  );
}
