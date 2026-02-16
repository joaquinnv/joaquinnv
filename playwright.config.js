import { defineConfig } from '@playwright/test';

const PORT = 3000;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npx serve@latest . -l ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
