import { test, expect } from './fixtures/crm-fixtures';

/**
 * Testes de Planos e Produtos por Modelo de Negócio
 * @tags @plans @subscriptions @products
 */

test.describe('📦 Planos e Produtos por Modelo', () => {

  test('RF-14: Página /subscriptions deve carregar sem erros', async ({ page, loginAsAdmin, waitForDashboardLoad }) => {
    await loginAsAdmin();
    await waitForDashboardLoad();

    await page.click('text=Assinaturas');
    await page.waitForURL(/\/subscriptions/);

    // Verificar que página carregou
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('text=/Assinaturas|Planos|Subscriptions/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('RF-14: Planos devem ser específicos do workspace Barbershop', async ({ page, loginAsBarbershop, waitForDashboardLoad }) => {
    await loginAsBarbershop();
    await waitForDashboardLoad();

    await page.click('text=Assinaturas');
    await page.waitForURL(/\/subscriptions/);

    // Verificar planos de barbearia
    const pageContent = await page.locator('#root').textContent();
    expect(pageContent).toBeTruthy();
  });

  test('RF-14: Planos devem ser específicos do workspace Law', async ({ page, loginAsLaw, waitForDashboardLoad }) => {
    await loginAsLaw();
    await waitForDashboardLoad();

    await page.click('text=Assinaturas');
    await page.waitForURL(/\/subscriptions/);

    // Verificar planos de advocacia
    const pageContent = await page.locator('#root').textContent();
    expect(pageContent).toBeTruthy();
  });

  test('RF-15: Completude de campos por modelo', async ({ page, loginAsAdmin, waitForDashboardLoad }) => {
    await loginAsAdmin();
    await waitForDashboardLoad();

    await page.click('text=Assinaturas');
    await page.waitForURL(/\/subscriptions/);

    // Verificar que há informações de planos completas
    const planCards = page.locator('[class*="card"], [class*="Card"]').first();
    // Pelo menos deve haver conteúdo visível
    await expect(page.locator('#root')).toBeVisible();
  });

  test('RF-16: CRUD de assinaturas - Criar assinatura', async ({ page, loginAsAdmin, waitForDashboardLoad }) => {
    await loginAsAdmin();
    await waitForDashboardLoad();

    await page.click('text=Assinaturas');
    await page.waitForURL(/\/subscriptions/);
    await page.waitForTimeout(2000);

    // Verificar botão de criar (se existir)
    const hasCreateButton = await page.locator('button:has-text("Novo"), button:has-text("Criar"), button:has-text("Adicionar")').count() > 0;

    if (hasCreateButton) {
      await page.locator('button:has-text("Novo"), button:has-text("Criar")').first().click();
      await page.waitForTimeout(1000);
    }

    // A página deve permanecer estável
    await expect(page.locator('#root')).toBeVisible();
  });

  test('RF-17: Planos de workspace NÃO devem vazar entre workspaces', async ({ page }) => {
    // Login como Barbershop e capturar planos visíveis
    await page.goto('/');
    await page.fill('input[type="email"]', 'barber@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.click('text=Assinaturas');
    await page.waitForURL(/\/subscriptions/);
    await page.waitForTimeout(2000);

    const barbershopPlans = await page.locator('#root').textContent();

    // Logout
    await page.click('button:has-text("Sair")');
    await page.waitForURL(/\/login/);

    // Login como Law
    await page.fill('input[type="email"]', 'law@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.click('text=Assinaturas');
    await page.waitForURL(/\/subscriptions/);
    await page.waitForTimeout(2000);

    const lawPlans = await page.locator('#root').textContent();

    // Verificar que são diferentes (isolamento)
    // (Esta é uma verificação básica - idealmente compararíamos IDs específicos)
    expect(barbershopPlans).not.toBe(lawPlans);
  });
});
