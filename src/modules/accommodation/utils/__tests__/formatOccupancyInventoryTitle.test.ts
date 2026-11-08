import { describe, expect, it } from 'vitest';
import { formatOccupancyInventoryTitle } from '../formatOccupancyInventoryTitle';

describe('formatOccupancyInventoryTitle', () => {
  it('prefers bed and never returns bare A', () => {
    expect(
      formatOccupancyInventoryTitle({
        bedName: 'A',
        roomName: 'Room B',
        displayPathShort: 'A',
      }),
    ).toBe('Bed A');
  });

  it('formats room and unit', () => {
    expect(formatOccupancyInventoryTitle({ roomName: '1' })).toBe('Room 1');
    expect(formatOccupancyInventoryTitle({ unitName: 'Apartment 101' })).toBe('Apartment 101');
  });
});
