import { testWithHostAccess as test, expect, FIXTURE_URL, toggleInspector } from './fixtures.js';
import type { Page, Worker } from '@playwright/test';
import { openInspector, panel, pin } from './support/panel.js';

/**
 * Moving the panel, and finding it where it was left next time.
 *
 * Real mouse input throughout: a drag is a press on the header, travel, and
 * a release, and only the release is saved.
 */

interface Placement {
  dock: 'left' | 'right' | null;
  x: number;
  y: number;
  width: number;
}

async function savedPlacement(serviceWorker: Worker): Promise<Placement | null> {
  return serviceWorker.evaluate(async () => {
    const stored = (await chrome.storage.local.get('settings'))['settings'] as
      | { panel?: Placement }
      | undefined;
    return stored?.panel ?? null;
  });
}

async function savePlacement(serviceWorker: Worker, placement: Placement): Promise<void> {
  await serviceWorker.evaluate(
    async (value: Placement) => chrome.storage.local.set({ settings: { panel: value } }),
    placement,
  );
}

function frame(page: Page) {
  return panel(page).locator('.panel');
}

/** Drag the panel by its header so that its title lands at (x, y). */
async function dragHeaderTo(page: Page, x: number, y: number): Promise<void> {
  const box = await panel(page).locator('.head-top .selector').boundingBox();
  if (!box) throw new Error('no panel header');
  await page.mouse.move(box.x + 10, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 8 });
  await page.mouse.up();
}

test.describe('panel placement', () => {
  test('dragging the header floats the panel, and the drop is saved', async ({
    context,
    serviceWorker,
  }) => {
    const page = await context.newPage();
    await openInspector(page, serviceWorker, FIXTURE_URL);
    await pin(page, '#plain-button');

    await dragHeaderTo(page, 400, 200);

    await expect(frame(page)).toHaveAttribute('data-side', 'float');
    await expect(panel(page).locator('.selector')).toHaveText('button#plain-button');
    await expect.poll(async () => (await savedPlacement(serviceWorker))?.dock).toBeNull();

    const box = await frame(page).boundingBox();
    const saved = await savedPlacement(serviceWorker);
    expect(Math.abs((box?.x ?? 0) - (saved?.x ?? -1))).toBeLessThanOrEqual(1);
    expect(Math.abs((box?.y ?? 0) - (saved?.y ?? -1))).toBeLessThanOrEqual(1);
  });

  test('reopening puts the panel back where it was left', async ({ context, serviceWorker }) => {
    await savePlacement(serviceWorker, { dock: null, x: 200, y: 150, width: 400 });

    const page = await context.newPage();
    const tabId = await openInspector(page, serviceWorker, FIXTURE_URL);
    await expect(frame(page)).toHaveAttribute('data-side', 'float');
    expect(await frame(page).boundingBox()).toMatchObject({ x: 200, y: 150, width: 400 });

    // Closed and opened again in the same page, it is still there.
    expect((await toggleInspector(serviceWorker, tabId)).active).toBe(false);
    expect((await toggleInspector(serviceWorker, tabId)).active).toBe(true);
    expect(await frame(page).boundingBox()).toMatchObject({ x: 200, y: 150, width: 400 });
  });

  test('dropping against a side edge docks it there', async ({ context, serviceWorker }) => {
    await savePlacement(serviceWorker, { dock: null, x: 300, y: 150, width: 348 });

    const page = await context.newPage();
    await openInspector(page, serviceWorker, FIXTURE_URL);
    await pin(page, '#plain-button');

    await dragHeaderTo(page, 2, 300);

    await expect(frame(page)).toHaveAttribute('data-side', 'left');
    await expect.poll(async () => (await savedPlacement(serviceWorker))?.dock).toBe('left');
  });

  test('double-clicking the header docks a floating panel to the nearer side', async ({
    context,
    serviceWorker,
  }) => {
    await savePlacement(serviceWorker, { dock: null, x: 700, y: 150, width: 348 });

    const page = await context.newPage();
    await openInspector(page, serviceWorker, FIXTURE_URL);
    await pin(page, '#plain-button');

    await panel(page).locator('.head-top .selector').dblclick();

    await expect(frame(page)).toHaveAttribute('data-side', 'right');
    await expect.poll(async () => (await savedPlacement(serviceWorker))?.dock).toBe('right');
  });

  test('a position saved in a bigger window is pulled back on screen', async ({
    context,
    serviceWorker,
  }) => {
    await savePlacement(serviceWorker, { dock: null, x: 5000, y: 5000, width: 348 });

    const page = await context.newPage();
    await openInspector(page, serviceWorker, FIXTURE_URL);

    const box = await frame(page).boundingBox();
    const viewport = page.viewportSize();
    if (!box || !viewport) throw new Error('no panel or viewport');
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y).toBeLessThan(viewport.height - 100);
  });
});
