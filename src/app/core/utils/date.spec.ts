import { localDateKey } from './date';

describe('localDateKey', () => {
  it('should format the local calendar date with zero-padded month and day', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('should format the last day of the year with a two-digit month', () => {
    expect(localDateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});
