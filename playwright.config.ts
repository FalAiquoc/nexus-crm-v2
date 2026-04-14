import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração Playwright para testes E2E do Nexus CRM v2
 * 
 * Execução:
 *   npx playwright test                    # Todos os testes (headed)
 *   npx playwright test --project=crm      # Só o projeto principal
 *   npx playwright test --ui               # Modo UI interativo
 *   npx playwright test --reporter=html    # Relatório HTML
 *   npx playwright test --grep @isolation  # Só testes de isolamento
 *   npx playwright test --grep @auth       # Só testes de autenticação
 *   npx playwright test --grep @plans      # Só testes de planos
 */

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 3, // 3 workers local, 1 em CI
  reporter: [
    ['html', { open: 'never', outputFolder: 'test-results/html-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.CRM_URL || 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },

  projects: [
    {
      name: 'crm-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'crm-laptop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: 'crm-tablet',
      use: {
        ...devices['iPad Pro'],
      },
    },
    {
      name: 'crm-mobile',
      use: {
        ...devices['iPhone 14 Pro'],
      },
    },
  ],

  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI, // Reutiliza servidor existente localmente
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
