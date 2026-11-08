import { describe, expect, it } from 'vitest';
import { applyStayChoice } from '../shortStay';

describe('applyStayChoice stay-level', () => {
  const base = {
    rentSnapshot: 8000 as number | undefined,
    stayKind: undefined as 'MONTHLY' | 'SHORT' | 'OPEN_ENDED' | undefined,
    agreedTotal: undefined as number | undefined,
  };

  it('ignores enabled=false and still applies SHORT', () => {
    const result = applyStayChoice(base, {
      enabled: false,
      choice: 'SHORT',
      agreedTotal: 5600,
      checkInDate: '2026-11-01',
      expectedExitDate: '2026-11-08',
    });
    expect(result.errorKey).toBeNull();
    expect(result.body.stayKind).toBe('SHORT');
    expect(result.body.agreedTotal).toBe(5600);
    expect(result.body.rentSnapshot).toBeUndefined();
  });

  it('marks MONTHLY explicitly for transfer safety', () => {
    const result = applyStayChoice(base, { enabled: false, choice: 'MONTHLY' });
    expect(result.errorKey).toBeNull();
    expect(result.body.stayKind).toBe('MONTHLY');
    expect(result.body.agreedTotal).toBeUndefined();
  });

  it('applies OPEN_ENDED without checkout', () => {
    const result = applyStayChoice(base, { enabled: false, choice: 'OPEN_ENDED' });
    expect(result.errorKey).toBeNull();
    expect(result.body.stayKind).toBe('OPEN_ENDED');
  });
});
