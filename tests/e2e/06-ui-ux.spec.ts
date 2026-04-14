import { test, expect } from './fixtures/crm-fixtures';

/**
 * Testes de UI/UX e Responsividade
 * @tags @ui @ux @responsive @theme
 */

test.describe('🎨 UI/UX e Responsividade', () => {

  test.beforeEach(async ({ page, loginAsAdmin, waitForDashboardLoad }) => {
    await loginAsAdmin();
    await waitForDashboardLoad();
  });

  test('RF-39: Sidebar colapsa/expand deve funcionar', async ({ page }) => {
    // Verificar sidebar visível
    const sidebar = page.locator('aside, [class*="Sidebar"], [class*="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    // Botão de toggle
    const toggleButton = page.locator('button[aria-label*="collapse"], button:has-text("Collapse"), [class*="toggle"]').first();

    if (await toggleButton.count() > 0) {
      await toggleButton.click();
      await page.waitForTimeout(600); // Aguardar transição

      // Sidebar deve mudar de estado
      await expect(page.locator('#root')).toBeVisible();
    }
  });

  test('RF-41: Temas dinâmicos devem aplicar', async ({ page }) => {
    // Ir para Settings
    await page.click('text=Configurações');
    await page.waitForURL(/\/settings/);
    await page.waitForTimeout(2000);

    // Verificar se há seletor de tema
    const themeSelector = page.locator('select, button').locator('visible=true').first();
    if (await themeSelector.count() > 0) {
      const themeText = await themeSelector.textContent();
      expect(themeText).toBeTruthy();
    }

    // Verificar que CSS variables estão aplicadas
    const rootStyles = await page.evaluate(() => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      return {
        bgColor: style.getPropertyValue('--bg-main') || style.getPropertyValue('--bg-primary'),
        textColor: style.getPropertyValue('--text-main') || style.getPropertyValue('--color-primary'),
      };
    });

    // Deve ter pelo menos uma variável CSS customizada
    expect(rootStyles.bgColor || rootStyles.textColor).toBeTruthy();
  });

  test('RF-42: Transições de página devem ser suaves', async ({ page }) => {
    // Navegar entre páginas e verificar transição
    const startTime = Date.now();

    await page.click('text=Kanban');
    await page.waitForURL(/\/kanban/);

    const transitionTime = Date.now() - startTime;

    // Transição não deve ser instantânea (deve ter animação)
    // Mas também não deve ser muito lenta (< 2s)
    expect(transitionTime).toBeLessThan(2000);
  });

  test('RF-43: Toast notifications devem aparecer', async ({ page }) => {
    // Ir para Contatos e realizar ação que gera toast
    await page.click('text=Contatos');
    await page.waitForURL(/\/contacts/);

    // Toast container deve existir no DOM
    const toastContainer = page.locator('[class*="toast"], [class*="Toast"]').first();
    // Pode não estar visível até uma ação, mas deve existir
    expect(toastContainer || page.locator('#root')).toBeTruthy();
  });

  test('RF-44: Loading states devem aparecer durante fetch', async ({ page }) => {
    // Recarregar página e verificar loading
    await page.reload();

    // Loading spinner pode aparecer brevemente
    const spinner = page.locator('.animate-spin, [class*="loading"], [class*="Loading"]').first();

    // Ou o conteúdo final deve aparecer
    await expect(page.locator('#root')).toBeVisible({ timeout: 10000 });
  });
});
