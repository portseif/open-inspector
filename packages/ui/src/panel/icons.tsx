import type { PanelTab } from './view-model.js';

/**
 * The panel's icons, drawn inline.
 *
 * Inline rather than an icon font or sprite file: the panel lives in a shadow
 * root on pages we do not control, and anything fetched would be a request
 * the extension promises never to make. Every glyph is a 16-unit stroke
 * drawing in `currentColor`, so a button's colour is its icon's colour.
 */
const PATHS = {
  styles: 'M3 4h10M3 8h10M3 12h10M6 2.6v2.8M10 6.6v2.8M5 10.6v2.8',
  color: 'M8 2.2c2.4 3 4 5 4 7.1a4 4 0 0 1-8 0c0-2.1 1.6-4.1 4-7.1z',
  type: 'M3.5 4.5V3h9v1.5M8 3v10M6 13h4',
  layout: 'M4 2.5h8A1.5 1.5 0 0 1 13.5 4v8a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 12V4A1.5 1.5 0 0 1 4 2.5zM2.5 6.5h11M6.5 6.5v7',
  assets: 'M4 3h8a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 12 13H4a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 4 3zM13.5 10.5l-3-3-6 5.5M6 5.4a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z',
  markup: 'M5.5 5L2.5 8l3 3M10.5 5l3 3-3 3',
  export: 'M8 2.5v8M5 7.5l3 3 3-3M3 12.5h10',
  // Drawn so its bounding box is centred on 8,8: a cursor's point sits top-left,
  // and centring the tip instead made it look pushed off to one side.
  pointer: 'M3 2.9l3.8 10.2 1.5-4.4 4.4-1.5z',
  flip: 'M2.5 5.5h11M11 3l2.5 2.5L11 8M13.5 10.5h-11M5 8l-2.5 2.5L5 13',
  collapse: 'M4 4l4 4-4 4M9 4l4 4-4 4',
  expand: 'M12 4L8 8l4 4M7 4L3 8l4 4',
  close: 'M4.5 4.5l7 7M11.5 4.5l-7 7',
  help: 'M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM6.4 6.4a1.6 1.6 0 1 1 2.2 1.5c-.4.2-.6.5-.6.9v.4M8 11h.01',
  up: 'M8 12.5v-9M4.5 7L8 3.5 11.5 7',
  down: 'M8 3.5v9M4.5 9L8 12.5 11.5 9',
  left: 'M12.5 8h-9M7 4.5L3.5 8 7 11.5',
  right: 'M3.5 8h9M9 4.5L12.5 8 9 11.5',
  // A parent row with two children hanging off it.
  tree: 'M2.5 3.5h6M4.5 3.5v8.5M4.5 8h2M4.5 12h2M8.5 8h5M8.5 12h5',
  // Points right when a tree row is closed; rotated a quarter turn when open.
  caret: 'M6 4l4 4-4 4',
  eye: 'M1.8 8S4 3.8 8 3.8 14.2 8 14.2 8 12 12.2 8 12.2 1.8 8 1.8 8zM8 6.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z',
  eyeOff: 'M1.8 8S4 3.8 8 3.8 14.2 8 14.2 8 12 12.2 8 12.2 1.8 8 1.8 8zM8 6.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM2.5 13.5l11-11',
  search: 'M7 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM10 10l3 3',
  coffee: 'M3 6.5h8V10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM11 7.5h1a1.5 1.5 0 0 1 0 3h-1M5.5 2.5V4M8.5 2.5V4',
  // An eight-tooth cog around a hub. Teeth with flat tops and a solid body,
  // because thin spokes round a small circle read as a sun — the light/dark
  // toggle — rather than as settings.
  settings:
    'M6.93 3.53L7.05 1.67L8.95 1.67L9.07 3.53A4.6 4.6 0 0 1 10.4 4.08L11.81 2.86L13.14 4.19L11.92 5.6A4.6 4.6 0 0 1 12.47 6.93L14.33 7.05L14.33 8.95L12.47 9.07A4.6 4.6 0 0 1 11.92 10.4L13.14 11.81L11.81 13.14L10.4 11.92A4.6 4.6 0 0 1 9.07 12.47L8.95 14.33L7.05 14.33L6.93 12.47A4.6 4.6 0 0 1 5.6 11.92L4.19 13.14L2.86 11.81L4.08 10.4A4.6 4.6 0 0 1 3.53 9.07L1.67 8.95L1.67 7.05L3.53 6.93A4.6 4.6 0 0 1 4.08 5.6L2.86 4.19L4.19 2.86L5.6 4.08A4.6 4.6 0 0 1 6.93 3.53ZM8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 14 }: { name: IconName; size?: number }) {
  return (
    <svg
      class="icon"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Which glyph stands for which tab on the rail. */
export const TAB_ICONS: Record<PanelTab, IconName> = {
  styles: 'styles',
  color: 'color',
  type: 'type',
  layout: 'layout',
  assets: 'assets',
  markup: 'markup',
  export: 'export',
  settings: 'settings',
};
