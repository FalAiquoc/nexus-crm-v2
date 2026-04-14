# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-auth.spec.ts >> 🔐 Autenticação e Controle de Acesso >> Login vazio deve ser bloqueado
- Location: tests\e2e\01-auth.spec.ts:76:3

# Error details

```
TimeoutError: page.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"]')

```

# Test source

```ts
  1  | import { test, expect } from './fixtures/crm-fixtures';
  2  | 
  3  | /**
  4  |  * Testes de Autenticação e Controle de Acesso
  5  |  * @tags @auth @login @security
  6  |  */
  7  | 
  8  | test.describe('🔐 Autenticação e Controle de Acesso', () => {
  9  | 
  10 |   test('RF-01: Login como Admin deve redirecionar para Dashboard', async ({ page, loginAsAdmin, waitForDashboardLoad }) => {
  11 |     await loginAsAdmin();
  12 |     await waitForDashboardLoad();
  13 | 
  14 |     // Verificar token JWT no localStorage
  15 |     const token = await page.evaluate(() => localStorage.getItem('doboy_token'));
  16 |     expect(token).toBeTruthy();
  17 |     expect(token!.length).toBeGreaterThan(20);
  18 | 
  19 |     // Verificar que não está mais na página de login
  20 |     await expect(page.locator('input[type="email"]')).not.toBeVisible();
  21 |   });
  22 | 
  23 |   test('RF-05: Logout deve redirecionar para /login e limpar token', async ({ page, loginAsAdmin }) => {
  24 |     await loginAsAdmin();
  25 |     await page.waitForURL(/\/dashboard/);
  26 | 
  27 |     // Realizar logout
  28 |     await page.click('button:has-text("Sair")');
  29 |     await page.waitForURL(/\/login/);
  30 | 
  31 |     // Verificar token removido
  32 |     const token = await page.evaluate(() => localStorage.getItem('doboy_token'));
  33 |     expect(token).toBeNull();
  34 |   });
  35 | 
  36 |   test('RF-06: Usuário não-admin NÃO deve acessar /users', async ({ page, loginAsGeneral }) => {
  37 |     await loginAsGeneral();
  38 |     await page.waitForURL(/\/dashboard/);
  39 | 
  40 |     // Tentar acessar página de usuários diretamente
  41 |     await page.goto('/users');
  42 |     await page.waitForTimeout(2000);
  43 | 
  44 |     // Deve ser redirecionado para dashboard
  45 |     expect(page.url()).not.toContain('/users');
  46 |     expect(page.url()).toContain('/dashboard');
  47 |   });
  48 | 
  49 |   test('RF-07: Token JWT deve persistir após F5', async ({ page, loginAsAdmin }) => {
  50 |     await loginAsAdmin();
  51 |     await page.waitForURL(/\/dashboard/);
  52 | 
  53 |     const tokenBefore = await page.evaluate(() => localStorage.getItem('doboy_token'));
  54 |     expect(tokenBefore).toBeTruthy();
  55 | 
  56 |     // Recarregar página (F5)
  57 |     await page.reload();
  58 |     await page.waitForURL(/\/dashboard/);
  59 | 
  60 |     const tokenAfter = await page.evaluate(() => localStorage.getItem('doboy_token'));
  61 |     expect(tokenAfter).toBeTruthy();
  62 |     expect(tokenAfter).toBe(tokenBefore);
  63 |   });
  64 | 
  65 |   test('Login com credenciais inválidas deve exibir erro', async ({ page }) => {
  66 |     await page.goto('/');
  67 | 
  68 |     await page.fill('input[type="email"]', 'invalid@test.com');
  69 |     await page.fill('input[type="password"]', 'wrongpassword');
  70 |     await page.click('button[type="submit"]');
  71 | 
  72 |     // Aguardar mensagem de erro
  73 |     await expect(page.locator('text=/Credenciais inválidas|Erro/')).toBeVisible({ timeout: 5000 });
  74 |   });
  75 | 
  76 |   test('Login vazio deve ser bloqueado', async ({ page }) => {
  77 |     await page.goto('/');
  78 | 
  79 |     // Tentar submit sem preencher nada
> 80 |     await page.click('button[type="submit"]');
     |                ^ TimeoutError: page.click: Timeout 10000ms exceeded.
  81 | 
  82 |     // Validar que campos estão vazios
  83 |     const emailValue = await page.locator('input[type="email"]').inputValue();
  84 |     expect(emailValue).toBe('');
  85 |   });
  86 | });
  87 | 
```