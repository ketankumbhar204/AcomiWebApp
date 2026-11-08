import type { LucideIcon } from 'lucide-react';
import { CompactPageBanner } from '@/shared/components/CompactPageBanner';

type MemberFormHeroProps = {
  icon: LucideIcon;
  /** Kept for call-site compatibility; title is sufficient. */
  eyebrow: string;
  heading: string;
  subheading: string;
};

/** Compact page banner for Add/Edit Member drawer (mobile CompactPageBanner parity). */
export function MemberFormHero({ icon, heading, subheading }: MemberFormHeroProps) {
  return <CompactPageBanner icon={icon} title={heading} subtitle={subheading} />;
}
