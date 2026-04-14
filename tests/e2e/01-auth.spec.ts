import { test, expect } from './fixtures/crm-fixtures';

/**
 * Testes de Autenticação e Controle de Acesso
 * @tags @auth @login @security
 */

test.describe('🔐 Autenticação e Controle de Acesso', () => {

  test('RF-01: Login como Admin deve redirecionar para Dashboard', async ({ page, loginAsAdmin, waitForDashboardLoad }) => {
    await loginAsAdmin();
    await waitForDashboardLoad();

    // Verificar token JWT no localStorage
    const token = await page.evaluate(() => localStorage.getItem('doboy_token'));
    expect(token).toBeTruthy();
    expect(token!.length).toBeGreaterThan(20);

    // Verificar que não está mais na página de login
    await expect(page.locator('input[type="email"]')).not.toBeVisible();
  });

  test('RF-05: Logout deve redirecionar para /login e limpar token', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.waitForURL(/\/dashboard/);

    // Realizar logout
    await page.click('button:has-text("Sair")');
    await page.waitForURL(/\/login/);

    // Verificar token removido
    const token = await page.evaluate(() => localStorage.getItem('doboy_token'));
    expect(token).toBeNull();
  });

  test('RF-06: Usuário não-admin NÃO deve acessar /users', async ({ page, loginAsGeneral }) => {
    await loginAsGeneral();
    await page.waitForURL(/\/dashboard/);

    // Tentar acessar página de usuários diretamente
    await page.goto('/users');
    await page.waitForTimeout(2000);

    // Deve ser redirecionado para dashboard
    expect(page.url()).not.toContain('/users');
    expect(page.url()).toContain('/dashboard');
  });

  test('RF-07: Token JWT deve persistir após F5', async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await page.waitForURL(/\/dashboard/);

    const tokenBefore = await page.evaluate(() => localStorage.getItem('doboy_token'));
    expect(tokenBefore).toBeTruthy();

    // Recarregar página (F5)
    await page.reload();
    await page.waitForURL(/\/dashboard/);

    const tokenAfter = await page.evaluate(() => localStorage.getItem('doboy_token'));
    expect(tokenAfter).toBeTruthy();
    expect(tokenAfter).toBe(tokenBefore);
  });

  test('Login com credenciais inválidas deve exibir erro', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Aguardar mensagem de erro
    await expect(page.locator('text=/Credenciais inválidas|Erro/')).toBeVisible({ timeout: 5000 });
  });

  test('Login vazio deve ser bloqueado', async ({ page }) => {
    await page.goto('/');

    // Tentar submit sem preencher nada
    await page.click('button[type="submit"]');

    // Validar que campos estão vazios
    const emailValue = await page.locator('input[type="email"]').inputValue();
    expect(emailValue).toBe('');
  });
});
