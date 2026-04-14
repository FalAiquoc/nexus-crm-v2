import { test, expect } from './fixtures/crm-fixtures';

/**
 * Testes de Isolamento de Workspaces
 * Valida que cada modelo de negócio opera isoladamente
 * @tags @isolation @workspace @multi-tenant
 */

test.describe('🏢 Isolamento de Workspaces', () => {

  test.describe('Barbershop Workspace', () => {

    test('RF-08: Barbershop deve ver KPIs de barbearia', async ({ page, loginAsBarbershop, waitForDashboardLoad }) => {
      await loginAsBarbershop();
      await waitForDashboardLoad();

      // Verificar que workspace é barbershop
      const workspaceType = await page.evaluate(() => {
        const settings = localStorage.getItem('doboy_settings');
        return settings ? JSON.parse(settings).workspace_type : null;
      });
      expect(workspaceType).toBe('barbershop');

      // KPIs específicos de barbearia devem estar presentes
      await expect(page.locator('text=/Rebooking|Ticket Médio|No-Show/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('RF-08: Barbershop NÃO deve ver dados de Law', async ({ page, loginAsBarbershop, waitForDashboardLoad }) => {
      await loginAsBarbershop();
      await waitForDashboardLoad();

      // Verificar que não há termos jurídicos
      const pageContent = await page.locator('#root').textContent();
      expect(pageContent).not.toMatch(/Casos por Área|Tempo Médio.*Advocacia/i);
    });
  });

  test.describe('Law Workspace', () => {

    test('RF-09: Law deve ver KPIs jurídicos', async ({ page, loginAsLaw, waitForDashboardLoad }) => {
      await loginAsLaw();
      await waitForDashboardLoad();

      // Verificar que workspace é law
      const workspaceType = await page.evaluate(() => {
        const settings = localStorage.getItem('doboy_settings');
        return settings ? JSON.parse(settings).workspace_type : null;
      });
      expect(workspaceType).toBe('law');

      // KPIs específicos de advocacia
      await expect(page.locator('text=/Casos|Área Jurídica|Taxa de Sucesso/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('RF-09: Law NÃO deve ver dados de Barbershop', async ({ page, loginAsLaw, waitForDashboardLoad }) => {
      await loginAsLaw();
      await waitForDashboardLoad();

      // Verificar que não há termos de barbearia
      const pageContent = await page.locator('#root').textContent();
      expect(pageContent).not.toMatch(/Rebooking|No-Show.*Barbearia/i);
    });
  });

  test.describe('General Workspace', () => {

    test('RF-10: General deve ver KPIs genéricos SaaS', async ({ page, loginAsGeneral, waitForDashboardLoad }) => {
      await loginAsGeneral();
      await waitForDashboardLoad();

      // Verificar que workspace é general
      const workspaceType = await page.evaluate(() => {
        const settings = localStorage.getItem('doboy_settings');
        return settings ? JSON.parse(settings).workspace_type : null;
      });
      expect(workspaceType).toBe('general');

      // KPIs genéricos de funil de vendas
      await expect(page.locator('text=/Funil|Velocidade|Conversão/i').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test('RF-12: workspace_type deve persistir após F5', async ({ page, loginAsBarbershop, waitForDashboardLoad }) => {
    await loginAsBarbershop();
    await waitForDashboardLoad();

    const workspaceBefore = await page.evaluate(() => {
      const settings = localStorage.getItem('doboy_settings');
      return settings ? JSON.parse(settings).workspace_type : null;
    });
    expect(workspaceBefore).toBe('barbershop');

    // F5
    await page.reload();
    await page.waitForTimeout(3000);

    const workspaceAfter = await page.evaluate(() => {
      const settings = localStorage.getItem('doboy_settings');
      return settings ? JSON.parse(settings).workspace_type : null;
    });
    expect(workspaceAfter).toBe('barbershop');
  });

  test('RF-13: Sidebar deve exibir nome correto do negócio', async ({ page, loginAsBarbershop, waitForDashboardLoad }) => {
    await loginAsBarbershop();
    await waitForDashboardLoad();

    // Verificar nome na sidebar
    const sidebarText = await page.locator('aside').textContent();
    expect(sidebarText).toMatch(/Central Barber|DoBoy/i);
  });
});
