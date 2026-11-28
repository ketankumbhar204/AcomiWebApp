import { describe, expect, it } from 'vitest';
import {
  activeSpaceRegistrationDetailPath,
  isActiveSpaceShareActionVisible,
} from './adminActiveSpaceRow';

describe('adminActiveSpaceRow', () => {
  it('builds property detail path from registrationId', () => {
    expect(activeSpaceRegistrationDetailPath('reg-1', 'property')).toBe('/admin/properties/reg-1');
    expect(activeSpaceRegistrationDetailPath('reg-2', 'mess')).toBe('/admin/mess/reg-2');
  });

  it('returns undefined when registrationId is missing (no View/detail route)', () => {
    expect(activeSpaceRegistrationDetailPath(null)).toBeUndefined();
    expect(activeSpaceRegistrationDetailPath(undefined)).toBeUndefined();
    expect(activeSpaceRegistrationDetailPath('   ')).toBeUndefined();
  });

  it('keeps Share visible for owner-listed, admin-added, and imported spaces', () => {
    expect(isActiveSpaceShareActionVisible({ registrationId: null, source: null })).toBe(true);
    expect(isActiveSpaceShareActionVisible({ registrationId: 'reg-1', source: 'ADMIN' })).toBe(true);
    expect(
      isActiveSpaceShareActionVisible({ registrationId: 'reg-2', source: 'PUBLIC_WEBSITE' }),
    ).toBe(true);
    expect(isActiveSpaceShareActionVisible()).toBe(true);
  });
});
