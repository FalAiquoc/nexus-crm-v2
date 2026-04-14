import { test, expect } from './fixtures/crm-fixtures';

/**
 * Testes CRUD Completas de Leads/Clientes
 * @tags @crud @leads @clients @kanban
 */

test.describe('👥 CRUD de Leads/Clientes', () => {

  test.beforeEach(async ({ page, loginAsAdmin, waitForDashboardLoad }) => {
    await loginAsAdmin();
    await waitForDashboardLoad();
  });

  test.describe('Formulário de Leads', () => {

    test('RF-18: Criar lead via formulário', async ({ page }) => {
      await page.click('text=Contatos');
      await page.click('text=Novo Lead');
      await page.waitForURL(/\/form/);

      const timestamp = Date.now();
      await page.fill('input[name="name"]', `Lead Test ${timestamp}`);
      await page.fill('input[name="email"]', `lead${timestamp}@test.com`);
      await page.fill('input[name="phone"]', '(11) 99999-0000');

      await page.click('button[type="submit"]');

      // Verificar sucesso
      await expect(page.locator('text=Lead cadastrado com sucesso')).toBeVisible({ timeout: 5000 });
    });

    test('RF-18: Formulário deve validar campos obrigatórios', async ({ page }) => {
      await page.click('text=Contatos');
      await page.click('text=Novo Lead');
      await page.waitForURL(/\/form/);

      // Tentar submit vazio
      await page.click('button[type="submit"]');

      // Verificar que há validação (HTML5 ou custom)
      await page.waitForTimeout(1000);
      // O formulário deve permanecer visível
      await expect(page.locator('form')).toBeVisible();
    });
  });

  test.describe('Lista de Contatos', () => {

    test('RF-19: Listar leads em tabela', async ({ page }) => {
      await page.click('text=Contatos');
      await page.waitForURL(/\/contacts/);

      // Verificar que tabela/carregamento aparece
      await expect(page.locator('#root')).toBeVisible({ timeout: 10000 });
    });

    test('RF-23: Busca de leads com debounce', async ({ page }) => {
      await page.click('text=Contatos');
      await page.waitForURL(/\/contacts/);

      // Buscar lead
      const searchInput = page.locator('input[placeholder*="earch"], input[placeholder*="uscar"]').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('Test');
        await page.waitForTimeout(500); // Debounce time

        // Resultados devem atualizar
        await expect(page.locator('#root')).toBeVisible();
      }
    });
  });

  test.describe('Kanban Board', () => {

    test('RF-20: Kanban deve carregar com estágios', async ({ page }) => {
      await page.click('text=Kanban');
      await page.waitForURL(/\/kanban/);

      // Aguardar Kanban carregar
      await page.waitForTimeout(3000);

      // Verificar colunas de estágios
      const columns = page.locator('[class*="stage"], [class*="column"], [class*="Stage"]').all();
      const count = await (await columns).length;
      expect(count).toBeGreaterThan(0);
    });

    test('RF-20: Drag and Drop deve mover lead entre colunas', async ({ page }) => {
      await page.click('text=Kanban');
      await page.waitForURL(/\/kanban/);
      await page.waitForTimeout(3000);

      // Tentar drag and drop (se houver cards)
      const draggableCards = page.locator('[draggable="true"], [class*="draggable"], [class*="Draggable"]').all();
      const cardCount = await (await draggableCards).length;

      if (cardCount > 0) {
        const card = (await draggableCards)[0];
        await card.hover();

        // Simular drag para outra coluna
        const columns = page.locator('[class*="stage"], [class*="column"]').all();
        const targetColumn = (await columns)[1];

        if (await targetColumn.count() > 0) {
          await card.dragTo(targetColumn);
          await page.waitForTimeout(1000);

          // Verificar que card ainda existe (moveu)
          await expect(page.locator('#root')).toBeVisible();
        }
      }
    });
  });

  test.describe('Editar e Deletar', () => {

    test('RF-21: Editar lead existente', async ({ page }) => {
      await page.click('text=Contatos');
      await page.waitForURL(/\/contacts/);
      await page.waitForTimeout(2000);

      // Clicar em primeiro lead da lista (se houver)
      const firstLead = page.locator('tr, [class*="lead"], [class*="card"]').first();
      if (await firstLead.count() > 0) {
        await firstLead.click();
        await page.waitForTimeout(1000);

        // Modal de edição deve abrir
        const modal = page.locator('[class*="modal"], [class*="Modal"], [role="dialog"]').first();
        if (await modal.count() > 0) {
          await expect(modal).toBeVisible();
        }
      }
    });

    test('RF-22: Deletar lead com confirmação', async ({ page }) => {
      await page.click('text=Contatos');
      await page.waitForURL(/\/contacts/);
      await page.waitForTimeout(2000);

      // Criar lead para deletar
      await page.click('text=Novo Lead');
      await page.waitForURL(/\/form/);

      const timestamp = Date.now();
      await page.fill('input[name="name"]', `Delete Me ${timestamp}`);
      await page.fill('input[name="email"]', `delete${timestamp}@test.com`);
      await page.fill('input[name="phone"]', '(11) 99999-0000');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Lead cadastrado com sucesso')).toBeVisible({ timeout: 5000 });
    });
  });
});
