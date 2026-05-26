import { test, expect } from '@playwright/test';

test.describe('GM Encounter Dashboard E2E Tests', () => {

  test('The page loads and the GM Encounter Dashboard title is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h2:has-text("GM Encounter Dashboard")')).toBeVisible();
  });

  test('The Party Roster tab is active by default', async ({ page }) => {
    await page.goto('/');
    // Active by default should render the Party Roster tab content
    await expect(page.locator('h2:has-text("Party Roster")')).toBeVisible();
  });

  test('Clicking the Encounters nav item shows the Encounters view', async ({ page }) => {
    await page.goto('/');
    // Click Encounters nav button
    await page.locator('button[title="Encounters"]').click();
    // Should show Encounters Library view
    await expect(page.locator('h2:has-text("Encounters Library")')).toBeVisible();
  });

  test('Clicking the NPC Library nav item shows the NPC Library view', async ({ page }) => {
    await page.goto('/');
    // Click NPC Library nav button
    await page.locator('button[title="NPC Library"]').click();
    // Should show NPC Library header title
    await expect(page.locator('h2:has-text("NPC Library")')).toBeVisible();
  });

  test('The Settings button opens the Settings modal', async ({ page }) => {
    await page.goto('/');
    // Click App Settings button
    await page.locator('#app-settings-btn').click();
    // Check if App Settings modal title is visible
    await expect(page.locator('h2:has-text("App Settings")')).toBeVisible();
  });

  test('The Settings modal can be closed with the Cancel button', async ({ page }) => {
    await page.goto('/');
    // Open Settings
    await page.locator('#app-settings-btn').click();
    await expect(page.locator('h2:has-text("App Settings")')).toBeVisible();
    
    // Close using Cancel
    await page.locator('#settings-cancel-btn').click();
    // Modal should close
    await expect(page.locator('h2:has-text("App Settings")')).not.toBeVisible();
  });

  test('The sidebar starts collapsed (the nav labels are not visible)', async ({ page }) => {
    await page.goto('/');
    // Under collapsed state, span nav label "Party Roster" should not be visible in DOM
    const navLabel = page.locator('aside span', { hasText: 'Party Roster' });
    await expect(navLabel).not.toBeVisible();
  });

  test('Clicking the sidebar toggle expands the sidebar and shows nav labels', async ({ page }) => {
    await page.goto('/');
    // The sidebar toggle expands it
    await page.locator('#sidebar-toggle-btn').click();
    // Now, nav labels should be visible
    const navLabel = page.locator('aside span', { hasText: 'Party Roster' });
    await expect(navLabel).toBeVisible();
  });

  test('Navigating to /player-view shows the player broadcast view', async ({ page }) => {
    await page.goto('/#/player-view');
    // Broadcasting view waiting message should be visible
    await expect(page.locator('p:has-text("Waiting for GM to start the encounter...")')).toBeVisible();
  });

});
