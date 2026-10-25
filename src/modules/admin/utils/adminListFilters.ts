import { i18n } from '@/i18n';
import { adminMessPath, adminPropertiesPath } from '@/routes/paths';
import type { RegistrationSource } from '@/shared/types/admin';

export type AdminListTab = 'leads' | 'active';

export type AdminListFilter = {
  tab: AdminListTab;
  source?: RegistrationSource;
};

export function adminListPath(
  target: 'properties' | 'mess',
  filter: AdminListFilter,
): string {
  const params = { tab: filter.tab, source: filter.source };
  return target === 'properties' ? adminPropertiesPath(params) : adminMessPath(params);
}

export function parseAdminListSearchParams(searchParams: URLSearchParams): AdminListFilter {
  const tabParam = searchParams.get('tab');
  const tab: AdminListTab = tabParam === 'active' ? 'active' : 'leads';
  const sourceParam = searchParams.get('source');
  const source =
    sourceParam === 'PUBLIC_WEBSITE' || sourceParam === 'ADMIN' ? sourceParam : undefined;
  return { tab, source };
}

export type AdminSummaryStat = 'total' | 'leads' | 'active' | 'registered';

export function registrationSourceFromParams(
  searchParams: URLSearchParams,
): RegistrationSource | '' {
  const source = searchParams.get('source');
  return source === 'PUBLIC_WEBSITE' || source === 'ADMIN' ? source : '';
}

export function readSummaryStat(searchParams: URLSearchParams): AdminSummaryStat | null {
  const stat = searchParams.get('stat');
  if (stat === 'total' || stat === 'leads' || stat === 'active' || stat === 'registered') {
    return stat;
  }
  return null;
}

/** Card keys used by the property and mess summary rows. */
export function summaryStatForCard(key: string): AdminSummaryStat | null {
  if (key === 'total' || key === 'leads' || key === 'active') return key;
  if (key === 'owners' || key === 'vendors') return 'registered';
  return null;
}

export function selectedSummaryStat(
  searchParams: URLSearchParams,
  tab: AdminListTab,
  leadScope: string,
  source: RegistrationSource | '',
  status: string,
): AdminSummaryStat | null {
  const explicit = readSummaryStat(searchParams);
  if (explicit) return explicit;
  if (tab === 'leads') {
    return leadScope === 'open' && !source && !status ? 'leads' : null;
  }
  if (source === 'PUBLIC_WEBSITE') return 'registered';
  if (!source) return 'active';
  return null;
}

export function summaryStatParams(
  current: URLSearchParams,
  stat: AdminSummaryStat,
): URLSearchParams {
  const params = new URLSearchParams(current);
  params.set('stat', stat);
  if (stat === 'leads') {
    params.set('tab', 'leads');
    params.set('scope', 'open');
    params.delete('source');
    return params;
  }
  params.set('tab', 'active');
  params.delete('scope');
  if (stat === 'registered') params.set('source', 'PUBLIC_WEBSITE');
  else params.delete('source');
  return params;
}

export function adminListFilterLabel(filter: AdminListFilter): string | null {
  if (filter.tab === 'active') {
    return i18n.t('admin.filters.activeSpaces');
  }
  if (filter.source === 'PUBLIC_WEBSITE') {
    return i18n.t('admin.filters.websiteRegistrations');
  }
  if (filter.source === 'ADMIN') {
    return i18n.t('admin.filters.addedByAdmin');
  }
  return i18n.t('admin.filters.openLeads');
}
