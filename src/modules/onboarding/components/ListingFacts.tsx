import { Box, Typography } from '@mui/material';
import { Users, UtensilsCrossed } from 'lucide-react';
import type { ReactNode } from 'react';
import type { GenderPolicy } from '@/shared/types/space';

export type FoodAvailability = 'INCLUDED' | 'AVAILABLE' | 'NONE';

const GENDER_LABEL: Record<GenderPolicy, string> = {
  MALE: 'Gents',
  FEMALE: 'Ladies',
  MIXED: 'Gents & Ladies',
};

const FOOD_LABEL: Record<FoodAvailability, string> = {
  INCLUDED: 'Food Included',
  AVAILABLE: 'Food Available',
  NONE: 'No Food',
};

export function sharingChipLabel(notes?: string | null): string | null {
  const raw = notes?.trim();
  if (!raw || raw === '-' || raw === '—' || raw === '–') return null;
  const text = ` ${raw.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
  if (!text.trim()) return null;
  const sharingContext = /shar|occup|bed|person|room/.test(text);
  const numbers = [...text.matchAll(/\b(\d{1,2})\b/g)].map((match) => Number(match[1]));
  const labels: string[] = [];
  if (/\bsingle\b/.test(text) || (sharingContext && numbers.includes(1))) labels.push('Single');
  if (/\bdouble\b|\btwin\b/.test(text) || (sharingContext && numbers.includes(2))) labels.push('2 Sharing');
  if (/\btriple\b/.test(text) || (sharingContext && numbers.includes(3))) labels.push('3 Sharing');
  if (sharingContext && numbers.includes(4)) labels.push('4 Sharing');
  if (sharingContext && numbers.includes(5)) labels.push('5 Sharing');
  const high = numbers.some((value) => value >= 6 && value <= 30);
  if (sharingContext && high && labels.length === 0) labels.push('6+ Sharing');
  if (labels.length === 1) return labels[0] ?? null;
  if (labels.length > 1) {
    const numeric = labels.every((label) => /^\d+ Sharing$/.test(label) || label === '6+ Sharing');
    if (numeric) {
      return `${labels.map((label) => label.replace(' Sharing', '')).join('/')} Sharing`;
    }
    return labels.join(' / ');
  }
  return null;
}

type ListingFactsProps = {
  leading?: ReactNode;
  genderPolicy?: GenderPolicy | null;
  sharingNotes?: string | null;
  foodAvailability?: FoodAvailability | null;
  foodIncludedInRent?: boolean;
  /** Compact pills for the discovery card. Detail pages keep the default chips. */
  appearance?: 'default' | 'pills';
};

export function ListingFacts({
  leading,
  genderPolicy,
  sharingNotes,
  foodAvailability,
  foodIncludedInRent,
  appearance = 'default',
}: ListingFactsProps) {
  const gender = genderPolicy ? GENDER_LABEL[genderPolicy] : null;
  const sharing = sharingChipLabel(sharingNotes);
  const food = foodAvailability
    ? FOOD_LABEL[foodAvailability]
    : foodIncludedInRent
      ? FOOD_LABEL.INCLUDED
      : null;
  if (!leading && !gender && !sharing && !food) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: appearance === 'pills' ? 'nowrap' : 'wrap',
        alignItems: 'center',
        gap: appearance === 'pills' ? 0.5 : 0.75,
        mb: appearance === 'pills' ? 0 : 1,
      }}
    >
      {leading}
      {gender ? <Fact icon="people" label={gender} appearance={appearance} /> : null}
      {sharing ? <Fact icon="people" label={sharing} appearance={appearance} /> : null}
      {food ? <Fact icon="food" label={food} appearance={appearance} /> : null}
    </Box>
  );
}

export function TypeChip({ label }: { label: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '6px',
        bgcolor: '#F4F7F5',
        px: 1,
        py: 0.5,
        color: '#10261F',
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        lineHeight: 1,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Box>
  );
}

function Fact({
  icon,
  label,
  appearance = 'default',
}: {
  icon: 'people' | 'food';
  label: string;
  appearance?: 'default' | 'pills';
}) {
  const Icon = icon === 'food' ? UtensilsCrossed : Users;
  const pills = appearance === 'pills';
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        maxWidth: '100%',
        alignItems: 'center',
        gap: pills ? 0.35 : 0.5,
        borderRadius: pills ? '999px' : '6px',
        bgcolor: '#E7F6EE',
        px: pills ? 0.75 : 1,
        py: pills ? 0.35 : 0.5,
        color: '#0F6B4C',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={pills ? 11 : 13} aria-hidden />
      <Typography component="span" sx={{ fontSize: pills ? '0.625rem' : '0.75rem', fontWeight: 600, lineHeight: 1.2, color: '#0F6B4C', whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
    </Box>
  );
}
