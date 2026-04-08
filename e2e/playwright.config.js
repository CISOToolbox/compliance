// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: '.',
    fullyParallel: false,
    retries: 1,
    workers: 1,
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list']
    ],
    use: {
        baseURL: 'https://compliance.cisotoolbox.org/staging',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        headless: true,
        viewport: { width: 1280, height: 800 },
        actionTimeout: 10000,
        navigationTimeout: 30000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    timeout: 60000,
    expect: {
        timeout: 8000,
    },
});
