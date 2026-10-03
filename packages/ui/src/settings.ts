import { color } from '@open-inspector/core';

/**
 * The inspector's preferences.
 *
 * The only thing the extension stores, and only on this device: the shell
 * keeps them in `storage.local`, never the sync storage area, which would
 * send them to the browser vendor. Nothing here describes a page.
 */
/** Where the panel sits: docked full-height to a side, or floating where it was dropped. */
export interface PanelPlacement {
  /** The edge it is docked to, or null when it floats at `x`, `y`. */
  dock: 'left' | 'right' | null;
  /** Viewport position of a floating panel's top-left corner. */
  x: number;
  y: number;
  width: number;
}

export interface InspectorSettings {
  /** How colours are written in the panel, on the clipboard and in exports. */
  colorFormat: color.ColorFormat;
  /** Where the panel was left, so it opens there next time. */
  panel: PanelPlacement;
}

export const DEFAULT_SETTINGS: InspectorSettings = {
  colorFormat: 'oklch',
  panel: { dock: 'right', x: 12, y: 12, width: 348 },
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
    panel: normalizePlacement(stored['panel']),
  };
}

function normalizePlacement(raw: unknown): PanelPlacement {
  const fallback = DEFAULT_SETTINGS.panel;
  const stored = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const number = (value: unknown, otherwise: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : otherwise;
  const dock = stored['dock'];

  return {
    dock: dock === 'left' || dock === 'right' || dock === null ? dock : fallback.dock,
    x: number(stored['x'], fallback.x),
    y: number(stored['y'], fallback.y),
    width: number(stored['width'], fallback.width),
  };
}
