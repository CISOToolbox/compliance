// @ts-check
//
// End-to-end smoke journeys for the CISO Toolbox Compliance Tracking module.
//
// These run against a local static server (see playwright.config.js) — the app
// has no backend, so the suite must never need one. Everything asserted here
// is about the local frontend: boot, navigation, i18n/theme preferences and
// local (localStorage) persistence.
//
// The suite is self-contained: no journey reads a dataset shipped in the
// repository. Whenever a test needs an assessment to work with, it creates
// one through the application's own UI.
//
const { test, expect } = require('@playwright/test');

const AUTOSAVE_KEY = 'compliance_autosave_v2';
// The rail also holds help-overlay triggers; only these entries switch panel.
const NAV_ITEMS = '.ct-rail-item[data-click="selectPanel"]';

/** Collect uncaught page errors for the lifetime of a test. */
function trackErrors(page) {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    return errors;
}

/** Fresh app, no leftover state from a previous journey. */
async function openApp(page, url = '/') {
    await page.goto(url);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.ct-appbar')).toBeVisible();
}

/**
 * Give the suite an assessment to work with, created the way a user would:
 * by filling the organisation field of the "Contexte" panel. Returns the
 * name written, unique per run so an assertion cannot pass on stale state.
 */
async function seedAssessment(page) {
    const org = `E2E Org ${Date.now()}`;
    await page.locator(NAV_ITEMS, { hasText: /Contexte|Context/i }).first().click();
    await expect(page.locator('#panel-context')).toHaveClass(/active/);

    const societe = page.locator('#context-content input[type="text"]').first();
    await societe.fill(org);
    await societe.blur();
    await expect(page.locator('#header-subtitle')).toHaveText(org);
    return org;
}

test.describe('Compliance Tracking — local frontend journeys', () => {

    // ── 1. Boot ────────────────────────────────────────────────────────
    test('page load: the app shell boots with no uncaught error', async ({ page }) => {
        const errors = trackErrors(page);
        await openApp(page);

        await expect(page).toHaveTitle(/Compliance/i);
        await expect(page.locator('.ct-appbar')).toBeVisible();
        await expect(page.locator('.ct-rail')).toBeVisible();

        const rail = page.locator(NAV_ITEMS);
        expect(await rail.count()).toBeGreaterThanOrEqual(4);

        expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
    });

    // ── 2. Offline by construction ─────────────────────────────────────
    test('no request leaves the local origin (the app has no backend)', async ({ page }) => {
        const external = [];
        page.on('request', (r) => {
            const u = new URL(r.url());
            if (!['127.0.0.1', 'localhost'].includes(u.hostname) && u.protocol !== 'data:') {
                external.push(r.url());
            }
        });

        await openApp(page);
        for (const item of await page.locator(NAV_ITEMS).all()) {
            await item.click();
            await page.waitForTimeout(120);
        }

        expect(external, `unexpected external requests: ${external.join(' | ')}`).toEqual([]);
    });

    // ── 3. Navigation ──────────────────────────────────────────────────
    test('navigation: every rail entry opens its panel without error', async ({ page }) => {
        const errors = trackErrors(page);
        await openApp(page);

        const items = await page.locator(NAV_ITEMS).all();
        expect(items.length).toBeGreaterThanOrEqual(4);

        for (const item of items) {
            const label = (await item.innerText()).trim();
            await item.click();
            await page.waitForTimeout(150);
            // Whatever the module's panel strategy (#panel-x.active or #content),
            // something must be rendered in the body area.
            const body = page.locator('.tab-panel.active, #content, .ct-content').first();
            await expect(body, `empty panel after clicking "${label}"`).not.toBeEmpty();
        }

        expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
    });

    // ── 4. File menu ───────────────────────────────────────────────────
    test('file menu exposes open / save and a hidden file input', async ({ page }) => {
        await openApp(page);

        await page.locator('.toolbar-menu button').first().click();
        const menu = page.locator('#io-menu');
        await expect(menu).toBeVisible();
        await expect(menu.locator('.toolbar-dropdown-item')).not.toHaveCount(0);

        // The file input is the local-persistence entry point; it must exist
        // and stay hidden (it is driven by the menu, not clicked directly).
        await expect(page.locator('#file-input')).toHaveCount(1);
        await expect(page.locator('#file-input')).toBeHidden();

    });

    // ── 5. Language preference persists locally ────────────────────────
    test('language toggle persists across a reload (localStorage ct_lang)', async ({ page }) => {
        await openApp(page);

        const before = await page.evaluate(() => localStorage.getItem('ct_lang'));
        // The globe opens the list of deployed languages; picking the one that
        // is not current is what stores the preference.
        await page.locator('[data-click="ct_toggleLang"]').click();
        const menu = page.locator('#ct-lang-menu');
        await expect(menu).toBeVisible();
        await menu.locator('.ct-lang-item:not(.active)').first().click();
        await page.waitForTimeout(400);

        const after = await page.evaluate(() => localStorage.getItem('ct_lang'));
        expect(after).not.toBe(before);
        expect(['fr', 'en']).toContain(after);

        await page.reload();
        await expect(page.locator('.ct-appbar')).toBeVisible();
        expect(await page.evaluate(() => localStorage.getItem('ct_lang'))).toBe(after);
    });

    // ── 6. Theme preference persists locally ───────────────────────────
    test('theme toggle persists across a reload (localStorage ct_theme)', async ({ page }) => {
        await openApp(page);

        await page.locator('[data-click="ct_toggleTheme"]').click();
        await page.waitForTimeout(200);
        const theme = await page.evaluate(() => localStorage.getItem('ct_theme'));
        expect(['light', 'dark']).toContain(theme);

        await page.reload();
        await expect(page.locator('.ct-appbar')).toBeVisible();
        expect(await page.evaluate(() => localStorage.getItem('ct_theme'))).toBe(theme);
    });

    // ── 7. Local persistence: edit, reload, data is still there ────────
    //
    // The journey builds its own state through the UI — it must never depend
    // on a dataset shipped in the repository.
    test('local persistence: an assessment created in the app survives a reload', async ({ page }) => {
        const errors = trackErrors(page);
        await openApp(page);

        // Nothing stored yet.
        expect(await page.evaluate((k) => localStorage.getItem(k), AUTOSAVE_KEY)).toBeNull();

        const org = await seedAssessment(page);

        const saved = await page.evaluate((k) => localStorage.getItem(k), AUTOSAVE_KEY);
        expect(saved, 'the edited assessment should be autosaved in localStorage').toBeTruthy();
        expect(saved).toContain(org);

        // Reload: the analysis must still be there, with no file and no
        // server involved.
        await page.reload();
        await expect(page.locator('.ct-appbar')).toBeVisible();

        const restored = await page.evaluate((k) => localStorage.getItem(k), AUTOSAVE_KEY);
        expect(restored).toContain(org);

        expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
    });

    // ── Known issue ────────────────────────────────────────────────────
    // `_checkAutoSaveBanner()` builds the "previous session found" banner and
    // inserts it with `document.body.insertBefore(banner, layoutEl)`, but
    // `.ct-body` is a child of `.ct-app`, not of `<body>` — the call throws
    // and the surrounding `catch {}` swallows it. The autosave is written and
    // survives (test 7), yet nothing ever offers to restore it. Remove the
    // `fixme` once the insertion point is fixed.
    test('the autosaved session can be restored from the banner', async ({ page }) => {
        test.fixme(true, 'the restore banner is never inserted (see comment above)');
        await openApp(page);
        const org = await seedAssessment(page);

        await page.reload();
        await expect(page.locator('#restore-banner')).toBeVisible();
        await page.locator('#restore-banner .btn-restore').click();
        await expect(page.locator('#header-subtitle')).toHaveText(org);
    });

    // ── Module-specific: frameworks ────────────────────────────────────
    test('activating a referential adds it to the framework rail', async ({ page }) => {
        await openApp(page);
        await expect(page.locator('#sidebar-frameworks')).toHaveCount(1);

        // The referentials are activated from the "Contexte" panel; the rail
        // must then list the ones that are active.
        await page.locator(NAV_ITEMS, { hasText: /Contexte|Context/i }).first().click();
        await expect(page.locator('#panel-context')).toHaveClass(/active/);
        await page.locator('#context-content .ct-ref-chip.is-inactive').first().click();
        await expect(page.locator('#sidebar-frameworks')).not.toBeEmpty();

        await page.locator(NAV_ITEMS, { hasText: /Tableau de bord|Dashboard/i }).first().click();
        await expect(page.locator('#panel-dashboard')).toHaveClass(/active/);
        await expect(page.locator('#dashboard-content')).not.toBeEmpty();
    });

    // ── Module-specific: non-conformities and derogations ──────────────
    //
    // The register works the same way here as in the server-backed module,
    // except that there is nobody else to ask: the person holding the file
    // declares the gap, requests the derogation and approves it. The journey
    // walks that whole path and checks the requirement it covers changes
    // status and that everything is still there after a reload.
    test('a gap declared on a requirement can be derogated, approved locally, and survives a reload', async ({ page }) => {
        const errors = trackErrors(page);
        await openApp(page);

        // An assessment with one framework: its requirements are what the
        // register attaches records to.
        await page.locator(NAV_ITEMS, { hasText: /Contexte|Context/i }).first().click();
        await page.locator('#context-content .ct-ref-chip.is-inactive').first().click();
        await expect(page.locator('#sidebar-frameworks')).not.toBeEmpty();
        await page.locator('#sidebar-frameworks .ct-rail-item').first().click();
        await page.locator('#sidebar-frameworks .ct-rail-subitem', { hasText: /Exigences|Requirements/i }).first().click();

        const row = page.locator('tr[data-exig-ref]').first();
        const ref = await row.getAttribute('data-exig-ref');
        expect(ref).toBeTruthy();

        // 1. Declare a non-conformity on that requirement.
        await row.locator('[data-click="_declareNcExig"]').click();
        let modal = page.locator('.ct-modal-box').first();
        await expect(modal.locator('#ct-nc-title')).toBeVisible();
        await modal.locator('#ct-nc-title').fill('E2E gap on ' + ref);
        await modal.getByRole('button', { name: /^(Déclarer|Declare)$/ }).click();
        await expect(page.locator('.ct-modal-box')).toHaveCount(0);

        // The register lists it, to qualify.
        await page.locator(NAV_ITEMS, { hasText: /Non-conformit/i }).first().click();
        await expect(page.locator('#panel-nonconformities')).toHaveClass(/active/);
        const register = page.locator('#nonconformities-content');
        await expect(register).toContainText('E2E gap on ' + ref);
        await expect(register).toContainText(/NC-\d{4}-\d{3}/);

        // 2. Request a derogation on the same requirement.
        await page.locator('#sidebar-frameworks .ct-rail-item').first().click();
        await page.locator('#sidebar-frameworks .ct-rail-subitem', { hasText: /Exigences|Requirements/i }).first().click();
        await page.locator('tr[data-exig-ref]').first().locator('[data-click="_requestDerogExig"]').click();
        modal = page.locator('.ct-modal-box').first();
        await expect(modal.locator('#ct-der-just')).toBeVisible();
        await modal.locator('#ct-der-just').fill('Compensating control in place until the migration');
        // No directory behind a local file: the person fields are plain text.
        await expect(modal.locator('#ct-der-owner-plain')).toBeVisible();
        await modal.locator('#ct-der-owner-plain').fill('Risk owner');
        await modal.locator('#ct-der-approver-plain').fill('Approver');
        const until = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
        await modal.locator('#ct-der-until').fill(until);
        await modal.getByRole('button', { name: /^(Soumettre la demande|Submit request)$/ }).click();
        await expect(page.locator('.ct-modal-box')).toHaveCount(0);

        // 3. Approve it — local approval, no second account involved.
        await page.locator(NAV_ITEMS, { hasText: /Non-conformit/i }).first().click();
        await register.getByText(/DER-\d{4}-\d{3}/).first().click();
        modal = page.locator('.ct-modal-box').first();
        await modal.getByRole('button', { name: /^(Approuver|Approve)$/ }).click();
        await page.locator('.ct-modal-box').first().getByRole('button', { name: /^(Confirmer|Confirm)$/ }).click();
        await expect(page.locator('.ct-modal-box')).toHaveCount(0);
        await expect(register).toContainText(/Approuvée|Approved/);

        // 4. The requirement it covers now reads as derogated, and the whole
        //    register is in the autosave.
        await page.locator('#sidebar-frameworks .ct-rail-item').first().click();
        await page.locator('#sidebar-frameworks .ct-rail-subitem', { hasText: /Exigences|Requirements/i }).first().click();
        await expect(page.locator('tr[data-exig-ref]').first()).toContainText(/Dérogation|Derogation/);

        await page.reload();
        await expect(page.locator('.ct-appbar')).toBeVisible();
        const saved = await page.evaluate((k) => localStorage.getItem(k), AUTOSAVE_KEY);
        expect(saved).toContain('E2E gap on ' + ref);
        expect(saved).toContain('"status":"approved"');

        expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
    });

    // A gap with no requirement behind it: the register can create the
    // requirement, in a framework of internal controls, so the gap is
    // assessed and evidenced like any other.
    test('a gap without a requirement creates an internal control from the declaration', async ({ page }) => {
        const errors = trackErrors(page);
        await openApp(page);

        await page.locator(NAV_ITEMS, { hasText: /Non-conformit/i }).first().click();
        await page.locator('[data-click="_ctNcDeclare"]').click();
        const modal = page.locator('.ct-modal-box').first();
        await modal.locator('#ct-nc-title').fill('No requirement covers this');

        // The item field offers "+ create a control" — the module's own modal.
        await modal.locator('.ct-ref-tags').first().click();
        await modal.locator('.ct-ref-create').first().click();
        await expect(page.locator('#ct-cc-ref')).toBeVisible();
        const ref = await page.locator('#ct-cc-ref').inputValue();
        expect(ref).toMatch(/^INT-\d{3}$/);
        await page.locator('#ct-cc-mesure').fill('Keep an inventory of the exceptions');
        await page.locator('.ct-modal-box').first().getByRole('button', { name: /^(Créer un contrôle|Create a control)$/ }).click();

        // Back on the declaration, the new control selected; declaring links them.
        const back = page.locator('.ct-modal-box').first();
        await expect(back.locator('#ct-nc-title')).toHaveValue('No requirement covers this');
        await expect(back.locator('.ct-ref-tag').first()).toContainText(ref);
        await back.getByRole('button', { name: /^(Déclarer|Declare)$/ }).click();
        await expect(page.locator('.ct-modal-box')).toHaveCount(0);

        // The internal framework is now part of the assessment.
        await expect(page.locator('#sidebar-frameworks')).toContainText(/Contrôles internes|Internal controls/);
        const saved = await page.evaluate((k) => localStorage.getItem(k), AUTOSAVE_KEY);
        expect(saved).toContain('internal:' + ref);

        expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
    });

});
