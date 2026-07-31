import type { ReactNode } from 'react';

export type AppNavItem = {
  id: string;
  label: string;
  to: string;
  icon?: ReactNode;
  badgeCount?: number;
  disabled?: boolean;
};

export type AppNavSection = {
  id: string;
  label?: string;
  items: AppNavItem[];
};
