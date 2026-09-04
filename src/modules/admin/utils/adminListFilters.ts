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
