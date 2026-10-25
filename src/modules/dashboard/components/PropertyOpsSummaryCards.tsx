import { Box, Typography } from '@mui/material';
import { Bed, ChevronRight, UserPlus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pastels } from '@/shared/theme/colors';
import type { DashboardAccommodationOperations } from '@/shared/types/dashboard';

export type PropertyOpsFocus = 'occupied' | 'vacant' | 'moveIns';

type PropertyOpsSummaryCardsProps = {
  operations: DashboardAccommodationOperations;
  selected: PropertyOpsFocus | null;
  onSelect: (focus: PropertyOpsFocus) => void;
};

type CardModel = {
  id: PropertyOpsFocus;
  labelKey: string;
  value: number;
  icon: LucideIcon;
  pastel: { bg: string; border: string; fg: string };
};

export function PropertyOpsSummaryCards({
  operations,
  selected,
  onSelect,
}: PropertyOpsSummaryCardsProps) {
  const { t } = useTranslation();
  const cards: CardModel[] = [
    {
      id: 'occupied',
      labelKey: 'dashboard.accommodationOperations.occupiedBeds',
      value: operations.occupiedBeds,
      icon: Users,
      pastel: pastels.mint,
    },
    {
      id: 'vacant',
      labelKey: 'dashboard.accommodationOperations.vacantBeds',
      value: operations.vacantBeds,
      icon: Bed,
      pastel: pastels.purple,
    },
    {
      id: 'moveIns',
      labelKey: 'dashboard.accommodationOperations.moveInsThisMonth',
      value: operations.moveInsThisMonth,
      icon: UserPlus,
      pastel: pastels.blue,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: { xs: 1, md: 1.5 },
        width: '100%',
        minWidth: 0,
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = selected === card.id;
        const label = t(card.labelKey);
        return (
          <Box
            key={card.id}
            component="button"
            type="button"
            onClick={() => onSelect(card.id)}
            aria-pressed={isSelected}
            aria-label={`${label}: ${card.value}`}
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              minWidth: 0,
              minHeight: { xs: 92, sm: 104 },
              px: { xs: 0.75, sm: 1.5 },
              py: 1.25,
              borderRadius: '16px',
              borderStyle: 'solid',
              borderWidth: 2,
              borderColor: isSelected ? card.pastel.fg : card.pastel.border,
              bgcolor: card.pastel.bg,
              color: card.pastel.fg,
              cursor: 'pointer',
              textAlign: 'center',
              font: 'inherit',
              boxSizing: 'border-box',
              '&:focus-visible': {
                outline: `2px solid ${card.pastel.fg}`,
                outlineOffset: 2,
              },
            }}
          >
            <ChevronRight
              size={14}
              color="#94A3B8"
              style={{ position: 'absolute', top: 8, right: 8 }}
              aria-hidden
            />
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: `${card.pastel.fg}18`,
              }}
            >
              <Icon size={16} strokeWidth={2.2} />
            </Box>
            <Typography
              sx={{
                fontSize: { xs: 20, sm: 24 },
                lineHeight: 1.15,
                fontWeight: 700,
                color: card.pastel.fg,
              }}
            >
              {card.value}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 11, sm: 12 },
                lineHeight: 1.2,
                fontWeight: 600,
                color: '#64748B',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
