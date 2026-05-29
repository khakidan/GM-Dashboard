// ─── PROTECTED TEST FILE ───────────────────────────
// Do not delete, rename, or remove test cases from 
// this file without an explicit instruction to do so.
// Removing tests to make a count pass is not acceptable.
// ────────────────────────────────────────────────────

// ─── PROTECTED FILE — DO NOT DELETE OR MODIFY without explicit instruction ───
// These are end-to-end tests run with Playwright. They are not imported by
// production code by design. Removing this file breaks the E2E test suite.

import { test, expect } from '@playwright/test';

test.describe('GM Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page (GM Dashboard)
    await page.goto('/');
  });

  // 1. The page loads and the GM Encounter Dashboard title is visible
  test('1. Page loads and shows correct title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'GM Encounter Dashboard' })).toBeVisible();
  });

  // 2. The Party Roster tab is active by default
  test('2. Party Roster tab is active by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Party Roster' })).toBeVisible();
  });

  // 3. The sidebar starts collapsed
  test('3. Sidebar starts collapsed by default', async ({ page }) => {
    const sidebar = page.locator('aside');
    // lg:w-20 is for collapsed, lg:w-64 is for expanded
    await expect(sidebar).not.toHaveClass(/w-64/);
  });

  // 4. Clicking the sidebar toggle expands the sidebar and shows nav labels
  test('4. Sidebar toggle expands and shows labels', async ({ page }) => {
    const sidebar = page.locator('aside');
    const toggleBtn = page.locator('#sidebar-toggle-btn');
    
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/w-64/);
    
    // Check for visible labels
    await expect(sidebar.getByText('Party Roster')).toBeVisible();
    await expect(sidebar.getByText('NPC Library')).toBeVisible();
  });

  // 5. Clicking the Encounters nav item shows the Encounters view
  test('5. Navigation to Encounters works', async ({ page }) => {
    // Use title attribute which works whether collapsed or expanded
    await page.locator('button[title="Encounters"]').click();
    await expect(page.getByRole('heading', { name: 'Encounters Library' })).toBeVisible();
  });

  // 6. The Settings button opens the Settings modal (view)
  test('6. Settings button opens the settings view', async ({ page }) => {
    await page.locator('button[title="App Settings"]').click();
    await expect(page.getByText('Campaign & App Settings')).toBeVisible();
  });

  // 7. The Settings modal (view) can be closed (exited)
  test('7. Settings view can be exited', async ({ page }) => {
    // Open settings first
    await page.locator('button[title="App Settings"]').click();
    await expect(page.getByText('Campaign & App Settings')).toBeVisible();

    // Exit by clicking another tab (Party Roster)
    await page.locator('button[title="Party Roster"]').click();
    await expect(page.getByText('Campaign & App Settings')).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Party Roster' })).toBeVisible();
  });

  // 8. Navigating to /player-view shows the player broadcast view
  test('8. Player view shows standby message', async ({ page }) => {
    await page.goto('/#/player-view');
    await expect(page.getByText('Waiting for GM to start the encounter...')).toBeVisible();
    await expect(page.getByText('Standby...')).toBeVisible();
  });

  // 9. Tab persistence — after clicking Encounters and reloading, the Encounters tab is still active
  test('9. Tab persistence survives reload', async ({ page }) => {
    await page.locator('button[title="Encounters"]').click();
    await expect(page.getByRole('heading', { name: 'Encounters Library' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Encounters Library' })).toBeVisible();
  });

  // 10. Keyboard shortcut N does not error when no combat
  test('10. Keyboard shortcut N does not error when no combat', async ({ page }) => {
    await page.keyboard.press('n');
    // Ensure app is still responsive/visible
    await expect(page.getByRole('heading', { name: 'GM Encounter Dashboard' })).toBeVisible();
  });
});
