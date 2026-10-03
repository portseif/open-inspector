import { color } from '@open-inspector/core';

/**
 * The inspector's preferences.
 *
 * The only thing the extension stores, and only on this device: the shell
 * keeps them in `storage.local`, never the sync storage area, which would
 * send them to the browser vendor. Nothing here describes a page.
 */
export interface InspectorSettings {
  /** How colours are written in the panel, on the clipboard and in exports. */
  colorFormat: color.ColorFormat;
}

export const DEFAULT_SETTINGS: InspectorSettings = {
  colorFormat: 'oklch',
};

/**
 * Settings from storage, checked field by field.
 *
 * What comes back from storage was written by an earlier version, or by
 * nobody; anything missing or unrecognised falls back to its default rather
 * than reaching the panel as `undefined`.
 */
export function normalizeSettings(raw: unknown): InspectorSettings {
  const stored = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const format = stored['colorFormat'];

  return {
    colorFormat: color.COLOR_FORMATS.includes(format as color.ColorFormat)
      ? (format as color.ColorFormat)
      : DEFAULT_SETTINGS.colorFormat,
  };
}
