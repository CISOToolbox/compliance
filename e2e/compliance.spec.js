// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://compliance.cisotoolbox.org/staging';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

/**
 * Load the French demo via the settings panel.
 * Closes the panel, fetches demo-fr.json, and waits for data to render.
 */
async function loadDemo(page) {
    const settingsBtn = page.locator('#btn-settings');
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();
    await expect(page.locator('.ai-panel.open')).toBeVisible({ timeout: 5000 });
    const demoBtn = page.locator('#settings-load-demo');
    await expect(demoBtn).toBeVisible({ timeout: 5000 });
    await demoBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
}

test.describe('Compliance App — Critical User Journeys', () => {

    // ─── Journey 1: Page Load ─────────────────────────────────────────────
    test('1. Page load: app loads with correct sidebar items', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Title
        await expect(page).toHaveTitle(/Conformit/i);

        // Sidebar global section
        await expect(page.locator('[data-i18n="comp.sidebar.context"], .sidebar-item').first()).toBeVisible();

        // Exact sidebar items
        const sidebarItems = page.locator('.sidebar-item');
        const texts = await sidebarItems.allTextContents();
        const joined = texts.join(' ');
        expect(joined).toMatch(/Contexte/);
        expect(joined).toMatch(/Tableau de bord/);
        expect(joined).toMatch(/Plan d.action/);
        expect(joined).toMatch(/Contrôles|Controles/);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-page-load.png'), fullPage: false });
    });

    // ─── Journey 2: Context page fields ──────────────────────────────────
    test('2. Context page: shows context fields (Organisation, Date, Évaluateur, Périmètre)', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Navigate to Contexte
        await page.locator('.sidebar-item', { hasText: 'Contexte' }).click();
        await page.waitForTimeout(400);

        const contextPanel = page.locator('#panel-context');
        await expect(contextPanel).toBeVisible();

        // Check context form fields exist — label shown is "Organisation" (i18n key comp.context.organisation)
        const contextContent = page.locator('#context-content');
        await expect(contextContent).toBeVisible();

        const html = await contextContent.innerHTML();
        // societe field (label: "Organisation")
        expect(html).toMatch(/Organisation|societe/);
        // date field
        expect(html).toMatch(/Date|date_evaluation/);
        // evaluateur field
        expect(html).toMatch(/valuateur|evaluateur/);
        // perimetre field
        expect(html).toMatch(/rim|perimetre/);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-context-page.png'), fullPage: false });
    });

    // ─── Journey 3: Framework activation ─────────────────────────────────
    test('3. Framework activation: clicking a chip activates it and adds it to sidebar', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Navigate to Contexte
        await page.locator('.sidebar-item', { hasText: 'Contexte' }).click();
        await page.waitForTimeout(400);

        // Find a framework chip (DORA or NIS 2)
        const chip = page.locator('.ref-chip').filter({ hasText: /DORA|NIS 2|NIS2/ }).first();
        await expect(chip).toBeVisible();

        // Get its style before activation
        const styleBefore = await chip.getAttribute('style');

        // Click to activate
        await chip.click();
        await page.waitForTimeout(500);

        // Style should change (background should now be colored, not white)
        const styleAfter = await chip.getAttribute('style');
        expect(styleAfter).not.toEqual(styleBefore);
        // Active chip has background = its color (not white)
        expect(styleAfter).not.toMatch(/background:white|background: white/);

        // Chip text should have checkmark
        const chipText = await chip.textContent();
        expect(chipText).toMatch(/✓/);

        // Framework should appear in sidebar
        const sidebarFw = page.locator('#sidebar-frameworks');
        await expect(sidebarFw).not.toBeEmpty();
        const sidebarHtml = await sidebarFw.innerHTML();
        expect(sidebarHtml.length).toBeGreaterThan(10);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-framework-activated.png'), fullPage: false });
    });

    // ─── Journey 4: Framework deactivation ───────────────────────────────
    test('4. Framework deactivation: clicking active chip deactivates it', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        await page.locator('.sidebar-item', { hasText: 'Contexte' }).click();
        await page.waitForTimeout(400);

        const chip = page.locator('.ref-chip').filter({ hasText: /DORA|NIS 2|NIS2/ }).first();
        await expect(chip).toBeVisible();

        // Activate first
        await chip.click();
        await page.waitForTimeout(400);

        const styleActive = await chip.getAttribute('style');
        expect(styleActive).not.toMatch(/background:white|background: white/);

        // Deactivate
        await chip.click();
        await page.waitForTimeout(400);

        const styleInactive = await chip.getAttribute('style');
        // Should be back to outline/white background
        expect(styleInactive).toMatch(/background:white|background: white/);

        // Chip text should have + again
        const chipText = await chip.textContent();
        expect(chipText).toMatch(/\+/);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-framework-deactivated.png'), fullPage: false });
    });

    // ─── Journey 5: Demo load ─────────────────────────────────────────────
    test('5. Demo load: settings gear → load demo → data appears', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Click the settings gear button
        const settingsBtn = page.locator('#btn-settings');
        await expect(settingsBtn).toBeVisible();
        await settingsBtn.click();

        // Wait for the ai-panel to open (it slides in with CSS transition)
        await expect(page.locator('.ai-panel.open')).toBeVisible({ timeout: 5000 });

        // Find the "Charger la démonstration" button inside the settings panel
        const demoBtn = page.locator('#settings-load-demo');
        await expect(demoBtn).toBeVisible({ timeout: 5000 });
        await demoBtn.click();

        // Panel closes and demo JSON is fetched — wait for network + render
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // After demo load, the app navigates to the Dashboard panel.
        // Verify demo loaded: header subtitle shows company name "MedSecure"
        const subtitle = page.locator('#header-subtitle');
        await expect(subtitle).not.toBeEmpty({ timeout: 5000 });
        const subtitleText = await subtitle.textContent();
        expect(subtitleText).toMatch(/MedSecure|medsecure/i);

        // Dashboard content should be populated with framework stats
        const dashContent = page.locator('#dashboard-content');
        const dashHtml = await dashContent.innerHTML();
        expect(dashHtml.length).toBeGreaterThan(200);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-demo-loaded.png'), fullPage: false });
    });

    // ─── Journey 6: Dashboard view ────────────────────────────────────────
    test('6. Dashboard: shows charts/stats after demo load', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await loadDemo(page);

        // Navigate to Tableau de bord
        await page.locator('.sidebar-item', { hasText: 'Tableau de bord' }).click();
        await page.waitForTimeout(600);

        const dashPanel = page.locator('#panel-dashboard');
        await expect(dashPanel).toHaveClass(/active/);

        const dashContent = page.locator('#dashboard-content');
        await expect(dashContent).not.toBeEmpty();
        const dashHtml = await dashContent.innerHTML();
        // Should have compliance indicators or stats
        expect(dashHtml.length).toBeGreaterThan(200);
        // Look for percentage or indicator elements
        expect(dashHtml).toMatch(/indicator|pct|%|conformit/i);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-dashboard.png'), fullPage: false });
    });

    // ─── Journey 7: Framework view (controls table) ───────────────────────
    test('7. Framework view: clicking activated framework shows controls table', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await loadDemo(page);

        // Click on first framework in sidebar
        const sidebarFw = page.locator('#sidebar-frameworks .sidebar-item').first();
        await expect(sidebarFw).toBeVisible({ timeout: 5000 });
        const fwName = await sidebarFw.textContent();
        await sidebarFw.click();
        await page.waitForTimeout(600);

        // Framework panel should be active
        const fwPanel = page.locator('#panel-fw');
        await expect(fwPanel).toHaveClass(/active/);

        // Controls table should appear
        const fwContent = page.locator('#fw-content');
        await expect(fwContent).not.toBeEmpty();
        const fwHtml = await fwContent.innerHTML();
        expect(fwHtml).toMatch(/table|slider|exig/i);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-framework-view.png'), fullPage: false });
    });

    // ─── Journey 8: Conformité interaction — checkbox toggles statut badge ───
    // NOTE: This app uses checkboxes + linked measures for conformité tracking,
    // not sliders. The "Exigences" sub-view has "applicable" checkboxes per control.
    test('8. Conformité interaction: toggling applicable checkbox in Exigences view', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await loadDemo(page);

        // Navigate to first framework (loads its dashboard sub-view)
        const sidebarFw = page.locator('#sidebar-frameworks .sidebar-item').first();
        await expect(sidebarFw).toBeVisible({ timeout: 5000 });
        await sidebarFw.click();
        await page.waitForTimeout(600);

        // Framework panel should be active showing the fw dashboard
        const fwPanel = page.locator('#panel-fw');
        await expect(fwPanel).toHaveClass(/active/);

        // Click the "Exigences" sub-item in the sidebar (appears under the selected framework)
        const exigencesSubItem = page.locator('#sidebar-frameworks .sidebar-sub', { hasText: /Exigences/i });
        await expect(exigencesSubItem).toBeVisible({ timeout: 5000 });
        await exigencesSubItem.click();
        await page.waitForTimeout(600);

        // Exigences table should now be visible with checkboxes
        const checkboxes = page.locator('input[type="checkbox"][data-change="_toggleApplicable"]');
        await expect(checkboxes.first()).toBeVisible({ timeout: 5000 });
        const checkboxCount = await checkboxes.count();
        expect(checkboxCount).toBeGreaterThan(0);

        // Toggle the first checkbox
        const firstCb = checkboxes.first();
        const wasChecked = await firstCb.isChecked();
        if (wasChecked) {
            await firstCb.uncheck();
            await page.waitForTimeout(400);
            // Verify table still rendered after interaction
            const tableRows = page.locator('#fw-content tbody tr');
            expect(await tableRows.count()).toBeGreaterThan(0);
            // Restore
            await firstCb.check();
        } else {
            await firstCb.check();
            await page.waitForTimeout(400);
            await firstCb.uncheck();
        }
        await page.waitForTimeout(400);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-conformite-checkbox.png'), fullPage: false });
    });

    // ─── Journey 9: Plan d'action ─────────────────────────────────────────
    test("9. Plan d'action: shows measures table", async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await loadDemo(page);

        await page.locator('.sidebar-item', { hasText: /Plan d.action/i }).click();
        await page.waitForTimeout(600);

        const planPanel = page.locator('#panel-plan');
        await expect(planPanel).toHaveClass(/active/);

        const planContent = page.locator('#plan-content');
        await expect(planContent).not.toBeEmpty();
        const planHtml = await planContent.innerHTML();
        expect(planHtml.length).toBeGreaterThan(100);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-plan-action.png'), fullPage: false });
    });

    // ─── Journey 10: CSV import button ────────────────────────────────────
    test('10. CSV import button exists in Contexte', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        await page.locator('.sidebar-item', { hasText: 'Contexte' }).click();
        await page.waitForTimeout(400);

        // Find the import CSV button
        const importBtn = page.locator('button[data-click="importCustomCSV"]');
        await expect(importBtn).toBeVisible({ timeout: 5000 });
        const btnText = await importBtn.textContent();
        expect(btnText).toMatch(/Importer|Import/i);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-csv-import-button.png'), fullPage: false });
    });

    // ─── Journey 11: CSV template download ───────────────────────────────
    test('11. CSV template download: clicking download link triggers file download', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        await page.locator('.sidebar-item', { hasText: 'Contexte' }).click();
        await page.waitForTimeout(400);

        // Find the CSV template download link
        const downloadLink = page.locator('[data-click="downloadCSVTemplate"]');
        await expect(downloadLink).toBeVisible({ timeout: 5000 });

        // Set up download listener
        const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 8000 }),
            downloadLink.click()
        ]);

        expect(download.suggestedFilename()).toMatch(/referentiel.*\.csv|template.*\.csv/i);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-csv-download.png'), fullPage: false });
    });

    // ─── Journey 12: Language switch ─────────────────────────────────────
    test('12. Language switch: switching to English changes all labels', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Verify French labels are default
        const sidebar = page.locator('.sidebar');
        let sidebarText = await sidebar.textContent();
        expect(sidebarText).toMatch(/Contexte/);
        expect(sidebarText).toMatch(/Tableau de bord/);

        // Open settings
        const settingsBtn = page.locator('#btn-settings');
        await settingsBtn.click();
        await expect(page.locator('.ai-panel.open')).toBeVisible({ timeout: 5000 });

        // Click English button — this calls switchLang("en") then openSettings()
        // so the panel stays open (re-renders in English)
        const enBtn = page.locator('#settings-lang-en');
        await expect(enBtn).toBeVisible({ timeout: 5000 });
        await enBtn.click();
        // Wait for EN i18n file to lazy-load and re-render
        await page.waitForTimeout(1500);

        // Close the settings panel via the X button
        const closeBtn = page.locator('#ai-close-btn');
        await expect(closeBtn).toBeVisible({ timeout: 3000 });
        await closeBtn.click();
        await page.waitForTimeout(500);

        // Verify English labels
        sidebarText = await sidebar.textContent();
        expect(sidebarText).not.toMatch(/Tableau de bord/);
        expect(sidebarText).toMatch(/Dashboard|Context|Action Plan|Controls/i);

        // App title should change to English
        const title = page.locator('.app-title');
        const titleText = await title.textContent();
        expect(titleText).toMatch(/Compliance/i);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-language-english.png'), fullPage: false });

        // Switch back to French via settings
        await settingsBtn.click();
        await expect(page.locator('.ai-panel.open')).toBeVisible({ timeout: 5000 });
        const frBtn = page.locator('#settings-lang-fr');
        await expect(frBtn).toBeVisible({ timeout: 5000 });
        await frBtn.click();
        await page.waitForTimeout(800);

        // Close panel
        const closeBtn2 = page.locator('#ai-close-btn');
        await expect(closeBtn2).toBeVisible({ timeout: 3000 });
        await closeBtn2.click();
        await page.waitForTimeout(400);

        sidebarText = await sidebar.textContent();
        expect(sidebarText).toMatch(/Contexte/);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12b-language-back-french.png'), fullPage: false });
    });

    // ─── Journey 13: Multiple frameworks ─────────────────────────────────
    test('13. Multiple frameworks: activate 2-3 frameworks, each in sidebar', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        await page.locator('.sidebar-item', { hasText: 'Contexte' }).click();
        await page.waitForTimeout(400);

        // Get all chips
        const chips = page.locator('.ref-chip');
        const count = await chips.count();
        expect(count).toBeGreaterThanOrEqual(2);

        // Activate first 3 chips (or however many are available)
        const toActivate = Math.min(3, count);
        const activatedNames = [];

        for (let i = 0; i < toActivate; i++) {
            const chip = chips.nth(i);
            const name = await chip.textContent();
            // Only activate if not already active (no checkmark)
            if (!name.includes('✓')) {
                await chip.click();
                await page.waitForTimeout(400);
                activatedNames.push(name.replace('+', '').trim());
            } else {
                activatedNames.push(name.replace('✓', '').trim());
            }
        }

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13a-multiple-frameworks-activated.png'), fullPage: false });

        // Sidebar should now show framework items
        const sidebarFwItems = page.locator('#sidebar-frameworks .sidebar-item');
        const fwItemCount = await sidebarFwItems.count();
        expect(fwItemCount).toBeGreaterThanOrEqual(1);

        // Each activated framework should have its own view
        for (let i = 0; i < fwItemCount; i++) {
            const fwItem = sidebarFwItems.nth(i);
            await fwItem.click();
            await page.waitForTimeout(500);

            const fwPanel = page.locator('#panel-fw');
            await expect(fwPanel).toHaveClass(/active/);

            const fwContent = page.locator('#fw-content');
            await expect(fwContent).not.toBeEmpty();

            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, `13-fw-view-${i + 1}.png`),
                fullPage: false
            });
        }
    });

});
