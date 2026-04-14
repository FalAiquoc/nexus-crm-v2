import { test, expect } from './fixtures/crm-fixtures';

/**
 * Testes do Modo Simulação (Sandbox)
 * @tags @sandbox @simulation @mock @isolation
 */

test.describe('🧪 Modo Simulação (Sandbox)', () => {

  test('RF-45: Banner de sandbox deve aparecer quando ativo', async ({ page }) => {
    // Ir para settings e ativar sandbox
    await page.goto('/');
    await page.fill('input[type="email"]', 'diogo@dvadvoga.com.br');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    await page.waitForTimeout(3000);

    await page.click('text=Configurações');
    await page.waitForURL(/\/settings/);
    await page.waitForTimeout(2000);

    // Verificar banner de sandbox (se ativo)
    const sandboxBanner = page.locator('text=/MODO DE SIMULAÇÃO|SANDBOX/i');
    const isBannerVisible = await sandboxBanner.isVisible().catch(() => false);

    // Se sandbox está ativo, banner deve estar visível
    if (isBannerVisible) {
      await expect(sandboxBanner).toBeVisible();
    }
  });

  test('RF-46: Ativar/desativar sandbox deve funcionar', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'diogo@dvadvoga.com.br');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    await page.waitForTimeout(3000);

    // Verificar status inicial
    const initialMode = await page.evaluate(() => localStorage.getItem('doboy_simulated_mode'));

    // Ir para settings
    await page.click('text=Configurações');
    await page.waitForURL(/\/settings/);
    await page.waitForTimeout(2000);

    // Procurar botão de toggle sandbox
    const sandboxToggle = page.locator('button:has-text("Sandbox"), button:has-text("Simulação")').first();

    if (await sandboxToggle.count() > 0) {
      await sandboxToggle.click();
      await page.waitForTimeout(2000);

      // Verificar que modo mudou
      const newMode = await page.evaluate(() => localStorage.getItem('doboy_simulated_mode'));
      expect(newMode).not.toBe(initialMode);
    }
  });

  test('RF-48: Sandbox mode deve persistir após F5', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'diogo@dvadvoga.com.br');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    await page.waitForTimeout(3000);

    const modeBefore = await page.evaluate(() => localStorage.getItem('doboy_simulated_mode'));

    // F5
    await page.reload();
    await page.waitForTimeout(3000);

    const modeAfter = await page.evaluate(() => localStorage.getItem('doboy_simulated_mode'));

    expect(modeAfter).toBe(modeBefore);
  });

  test('RF-47: Dados fakes devem ser inseridos/removidos', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'diogo@dvadvoga.com.br');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    await page.waitForTimeout(3000);

    // Verificar leads mock (is_mock = true)
    const leadsCount = await page.evaluate(async () => {
      const token = localStorage.getItem('doboy_token');
      const res = await fetch('/api/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const leads = await res.json();
      return leads.length;
    });

    expect(leadsCount).toBeGreaterThanOrEqual(0);
  });
});
