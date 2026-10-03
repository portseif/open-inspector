import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from './settings.js';

describe('normalizeSettings', () => {
  it('defaults to oklch when nothing has been saved', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.colorFormat).toBe('oklch');
  });

  it('keeps a saved format it recognises', () => {
    expect(normalizeSettings({ colorFormat: 'hex' }).colorFormat).toBe('hex');
  });

  it('falls back field by field on anything it does not', () => {
    expect(normalizeSettings({ colorFormat: 'cmyk' }).colorFormat).toBe('oklch');
    expect(normalizeSettings('not an object')).toEqual(DEFAULT_SETTINGS);
  });
});
