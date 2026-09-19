import type { ReactNode } from 'react';

export type AppNavItem = {
  id: string;
  label: string;
  to: string;
  icon?: ReactNode;
  badgeCount?: number;
  disabled?: boolean;
  /** When true, only exact path matches (e.g. admin dashboard `/admin`). */
  end?: boolean;
};

export type AppNavSection = {
  id: string;
  label?: string;
  items: AppNavItem[];
};
