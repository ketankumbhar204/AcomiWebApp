/**
 * Soft semantic pastel surfaces — dashboard + workspace visual language.
 *
 * Meaning stays consistent:
 *   success  — healthy, occupied, collected, completed
 *   info     — activity, under review, inventory, move-ins
 *   warning  — pending, meals, attention
 *   danger   — critical / error
 *   accent   — brand mint/teal wells (expected, residents)
 *   purple   — vacant beds, secondary people, dinner, notifications
 *   pink     — customers / secondary alerts
 *   peach    — breakfast / warm meal attention
 *   neutral  — empty / default
 *
 * Backgrounds stay very light; fg/icon colors carry the meaning.
 */

export type SemanticTone =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'purple'
  | 'pink'
  | 'peach'
  | 'neutral';

export type SemanticSurface = {
  bg: string;
  border: string;
  iconBg: string;
  fg: string;
};

const LIGHT: Record<SemanticTone, SemanticSurface> = {
  success: { bg: '#E8F8EF', border: '#C6EBD7', iconBg: '#D4F3E2', fg: '#047857' },
  info: { bg: '#EEF4FF', border: '#D0E0F8', iconBg: '#DCE8FB', fg: '#1D4ED8' },
  warning: { bg: '#FFF6E8', border: '#F5D9A8', iconBg: '#FFE8C4', fg: '#C2410C' },
  danger: { bg: '#FEF2F2', border: '#FECACA', iconBg: '#FEE2E2', fg: '#DC2626' },
  accent: { bg: '#E7F6F1', border: '#C5E8DC', iconBg: '#D4F0E6', fg: '#0F766E' },
  purple: { bg: '#F4F0FF', border: '#DDD6FE', iconBg: '#EDE9FE', fg: '#6D28D9' },
  pink: { bg: '#FDF2F8', border: '#FBCFE8', iconBg: '#FCE7F3', fg: '#BE185D' },
  peach: { bg: '#FFF4EC', border: '#FED7AA', iconBg: '#FFEDD5', fg: '#C2410C' },
  neutral: { bg: '#F8FAFC', border: '#E2E8F0', iconBg: '#EEF2F7', fg: '#475569' },
};

const DARK: Record<SemanticTone, SemanticSurface> = {
  success: {
    bg: 'rgba(5, 150, 105, 0.16)',
    border: 'rgba(52, 211, 153, 0.28)',
    iconBg: 'rgba(52, 211, 153, 0.22)',
    fg: '#34D399',
  },
  info: {
    bg: 'rgba(37, 99, 235, 0.16)',
    border: 'rgba(147, 197, 253, 0.28)',
    iconBg: 'rgba(147, 197, 253, 0.22)',
    fg: '#93C5FD',
  },
  warning: {
    bg: 'rgba(217, 119, 6, 0.16)',
    border: 'rgba(251, 191, 36, 0.28)',
    iconBg: 'rgba(251, 191, 36, 0.22)',
    fg: '#FBBF24',
  },
  danger: {
    bg: 'rgba(220, 38, 38, 0.16)',
    border: 'rgba(248, 113, 113, 0.32)',
    iconBg: 'rgba(248, 113, 113, 0.22)',
    fg: '#F87171',
  },
  accent: {
    bg: 'rgba(15, 118, 110, 0.18)',
    border: 'rgba(45, 212, 191, 0.28)',
    iconBg: 'rgba(45, 212, 191, 0.22)',
    fg: '#2DD4BF',
  },
  purple: {
    bg: 'rgba(109, 40, 217, 0.18)',
    border: 'rgba(196, 181, 253, 0.28)',
    iconBg: 'rgba(196, 181, 253, 0.22)',
    fg: '#C4B5FD',
  },
  pink: {
    bg: 'rgba(190, 24, 93, 0.16)',
    border: 'rgba(249, 168, 212, 0.28)',
    iconBg: 'rgba(249, 168, 212, 0.22)',
    fg: '#F9A8D4',
  },
  peach: {
    bg: 'rgba(194, 65, 12, 0.16)',
    border: 'rgba(253, 186, 116, 0.28)',
    iconBg: 'rgba(253, 186, 116, 0.22)',
    fg: '#FDBA74',
  },
  neutral: {
    bg: 'rgba(51, 65, 85, 0.45)',
    border: 'rgba(148, 163, 184, 0.28)',
    iconBg: 'rgba(148, 163, 184, 0.18)',
    fg: '#CBD5E1',
  },
};

export function semanticSurface(tone: SemanticTone, mode: 'light' | 'dark' = 'light'): SemanticSurface {
  return mode === 'dark' ? DARK[tone] : LIGHT[tone];
}

export function healthTone(band: string | undefined): SemanticTone {
  switch (band) {
    case 'excellent':
    case 'healthy':
      return 'success';
    case 'needsImprovement':
      return 'warning';
    case 'atRisk':
      return 'peach';
    case 'critical':
      return 'danger';
    default:
      return 'neutral';
  }
}
