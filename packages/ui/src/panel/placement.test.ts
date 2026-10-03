import { describe, expect, it } from 'vitest';
import { DOCK_ZONE, MARGIN, clampFloating, clampWidth, dropPlacement, nearestSide } from './placement.js';

const viewport = { width: 1280, height: 800 };

describe('clampFloating', () => {
  it('leaves a position that is on screen alone', () => {
    expect(clampFloating(300, 120, 348, viewport)).toEqual({ x: 300, y: 120 });
  });

  it('pulls a panel back inside the margins', () => {
    expect(clampFloating(-50, -10, 348, viewport)).toEqual({ x: MARGIN, y: MARGIN });
    expect(clampFloating(5000, 5000, 348, viewport)).toEqual({
      x: 1280 - 348 - MARGIN,
      y: 800 - 200 - MARGIN,
    });
  });

  it('brings back a position saved in a bigger window', () => {
    const small = { width: 700, height: 500 };
    const { x, y } = clampFloating(1100, 600, 348, small);
    expect(x + 348).toBeLessThanOrEqual(small.width - MARGIN);
    expect(y).toBeLessThan(small.height);
  });
});

describe('dropPlacement', () => {
  it('floats where it was let go', () => {
    expect(dropPlacement(640, 400, 100, 348, viewport)).toEqual({
      dock: null,
      x: 400,
      y: 100,
      width: 348,
    });
  });

  it('docks when dropped against a side edge', () => {
    expect(dropPlacement(DOCK_ZONE - 1, 0, 100, 348, viewport).dock).toBe('left');
    expect(dropPlacement(1280 - 4, 900, 100, 348, viewport).dock).toBe('right');
  });
});

describe('nearestSide', () => {
  it('is the dock when docked, and the closer half when floating', () => {
    expect(nearestSide({ dock: 'left', x: 900, y: 12, width: 348 }, viewport)).toBe('left');
    expect(nearestSide({ dock: null, x: 100, y: 12, width: 348 }, viewport)).toBe('left');
    expect(nearestSide({ dock: null, x: 800, y: 12, width: 348 }, viewport)).toBe('right');
  });
});

describe('clampWidth', () => {
  it('keeps the panel between its limits and inside a narrow window', () => {
    expect(clampWidth(100, viewport)).toBe(300);
    expect(clampWidth(2000, viewport)).toBe(720);
    expect(clampWidth(600, { width: 500, height: 800 })).toBe(452);
  });
});
