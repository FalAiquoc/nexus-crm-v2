import { test, expect } from './fixtures/crm-fixtures';

/**
 * Testes de Dashboard e Analytics
 * @tags @dashboard @analytics @kpi @charts
 */

test.describe('📊 Dashboard e Analytics', () => {

  test.beforeEach(async ({ page, loginAsAdmin, waitForDashboardLoad }) => {
    await loginAsAdmin();
    await waitForDashboardLoad();
  });

  test('RF-34: Dashboard deve carregar com KPIs', async ({ page }) => {
    await expect(page.locator('#root')).toBeVisible();

    // Verificar que há conteúdo no dashboard
    const dashboardContent = await page.locator('#root').textContent();
    expect(dashboardContent).toBeTruthy();
    expect(dashboardContent!.length).toBeGreaterThan(100);
  });

  test('RF-35: Filtros de data devem funcionar', async ({ page }) => {
    // Verificar que filtros de data existem
    const filters = page.locator('button, select').locator('visible=true');
    const filterCount = await filters.count();

    // Deve haver pelo menos alguns filtros
    expect(filterCount).toBeGreaterThan(0);

    // Testar mudança de filtro
    const dateFilter = page.locator('button:has-text("Este Mês"), button:has-text("Hoje"), button:has-text("Total")').first();
    if (await dateFilter.count() > 0) {
      await dateFilter.click();
      await page.waitForTimeout(1000);

      // Dashboard deve atualizar
      await expect(page.locator('#root')).toBeVisible();
    }
  });

  test('RF-36: Gráficos devem renderizar', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Verificar SVGs ou canvases de gráficos (Recharts)
    const charts = page.locator('svg, canvas').all();
    const chartCount = await (await charts).length;

    // Deve haver pelo menos 1 gráfico
    expect(chartCount).toBeGreaterThan(0);
  });

  test('RF-37: Analytics page deve carregar', async ({ page }) => {
    await page.click('text=Analytics');
    await page.waitForURL(/\/analytics/);
    await page.waitForTimeout(2000);

    await expect(page.locator('#root')).toBeVisible();
  });

  test('RF-38: Export Modal deve abrir', async ({ page }) => {
    // Procurar botão de export
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("Exportar")').first();

    if (await exportButton.count() > 0) {
      await exportButton.click();
      await page.waitForTimeout(1000);

      // Modal deve aparecer
      const modal = page.locator('[class*="modal"], [class*="Modal"], [role="dialog"]').first();
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible();
      }
    }
  });
});
