import { test as base, expect, Page, BrowserContext } from '@playwright/test';

// ============================================================
// FIXTURES CUSTOMIZADAS - NEXUS CRM v2
// ============================================================

// Interface estendida com fixtures customizadas
interface CRMFixtures {
  // Login helpers
  loginAsAdmin: () => Promise<void>;
  loginAsBarbershop: () => Promise<void>;
  loginAsLaw: () => Promise<void>;
  loginAsGeneral: () => Promise<void>;
  
  // Workspace helpers
  getWorkspaceType: () => Promise<string>;
  waitForDashboardLoad: () => Promise<void>;
  
  // Data helpers
  createTestLead: (lead: Partial<TestLead>) => Promise<TestLead>;
  deleteAllMockLeads: () => Promise<void>;
  
  // Assertion helpers
  expectWorkspaceIsolated: () => Promise<void>;
}

export interface TestLead {
  name: string;
  email: string;
  phone: string;
  source: string;
  value: number;
  status: string;
}

// Credenciais de teste por workspace
const TEST_USERS = {
  admin: {
    email: 'diogo@dvadvoga.com.br',
    password: 'admin123',
    expectedRole: 'admin',
  },
  barbershop: {
    email: 'barber@test.com',
    password: 'test123',
    expectedWorkspace: 'barbershop',
  },
  law: {
    email: 'law@test.com',
    password: 'test123',
    expectedWorkspace: 'law',
  },
  general: {
    email: 'general@test.com',
    password: 'test123',
    expectedWorkspace: 'general',
  },
};

export const test = base.extend<CRMFixtures>({
  // Fixture: Login como Admin
  loginAsAdmin: async ({ page }, use) => {
    await use(async () => {
      await performLogin(page, TEST_USERS.admin);
    });
  },

  // Fixture: Login como Barbershop
  loginAsBarbershop: async ({ page }, use) => {
    await use(async () => {
      await performLogin(page, TEST_USERS.barbershop);
      await waitForWorkspaceType(page, 'barbershop');
    });
  },

  // Fixture: Login como Law
  loginAsLaw: async ({ page }, use) => {
    await use(async () => {
      await performLogin(page, TEST_USERS.law);
      await waitForWorkspaceType(page, 'law');
    });
  },

  // Fixture: Login como General
  loginAsGeneral: async ({ page }, use) => {
    await use(async () => {
      await performLogin(page, TEST_USERS.general);
      await waitForWorkspaceType(page, 'general');
    });
  },

  // Fixture: Obter tipo de workspace atual
  getWorkspaceType: async ({ page }, use) => {
    await use(async () => {
      return await page.evaluate(() => {
        const settings = localStorage.getItem('doboy_settings');
        return settings ? JSON.parse(settings).workspace_type : 'unknown';
      });
    });
  },

  // Fixture: Aguardar Dashboard carregar completamente
  waitForDashboardLoad: async ({ page }, use) => {
    await use(async () => {
      await expect(page.locator('#root')).toBeVisible();
      // Aguardar spinner de loading sumir
      await page.locator('.animate-spin').waitFor({ state: 'detached', timeout: 10000 });
      // Verificar que dashboard renderizou
      await expect(page.locator('text=/Dashboard|Kanban|Contatos/').first()).toBeVisible({ timeout: 10000 });
    });
  },

  // Fixture: Criar lead de teste
  createTestLead: async ({ page }, use) => {
    await use(async (leadData) => {
      const lead: TestLead = {
        name: leadData.name || `Test Lead ${Date.now()}`,
        email: leadData.email || `test${Date.now()}@test.com`,
        phone: leadData.phone || '(11) 99999-0000',
        source: leadData.source || 'Manual',
        value: leadData.value || 1000,
        status: leadData.status || 'Novo Lead',
      };

      // Navegar para formulário
      await page.click('text=Contatos');
      await page.click('text=Novo Lead');

      // Preencher formulário
      await page.fill('input[name="name"]', lead.name);
      await page.fill('input[name="email"]', lead.email);
      await page.fill('input[name="phone"]', lead.phone);
      await page.fill('input[name="value"]', String(lead.value));
      
      // Salvar
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Lead cadastrado com sucesso')).toBeVisible({ timeout: 5000 });

      return lead;
    });
  },

  // Fixture: Deletar todos os leads mock
  deleteAllMockLeads: async ({ page }, use) => {
    await use(async () => {
      await page.evaluate(async () => {
        const token = localStorage.getItem('doboy_token');
        await fetch('/api/admin/clear-mock-data', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      });
      await page.reload();
    });
  },

  // Fixture: Verificar isolamento de workspace
  expectWorkspaceIsolated: async ({ page }, use) => {
    await use(async () => {
      const workspaceType = await page.evaluate(() => {
        const settings = localStorage.getItem('doboy_settings');
        return settings ? JSON.parse(settings).workspace_type : null;
      });

      expect(workspaceType).not.toBeNull();
      expect(['barbershop', 'law', 'general']).toContain(workspaceType);
    });
  },
});

// ============================================================
// HELPERS INTERNOS
// ============================================================

async function performLogin(page: Page, user: any) {
  await page.goto('/');
  
  // Aguardar tela de login
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  
  // Preencher credenciais
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  
  // Submeter
  await page.click('button[type="submit"]');
  
  // Aguardar redirecionamento (URL deve mudar de /login)
  await page.waitForURL(/\/(dashboard|kanban|contacts)/, { timeout: 10000 });
  
  // Verificar que login foi bem-sucedido
  await expect(page.locator('#root')).toBeVisible();
}

async function waitForWorkspaceType(page: Page, expectedType: string) {
  await expect(async () => {
    const workspaceType = await page.evaluate(() => {
      const settings = localStorage.getItem('doboy_settings');
      return settings ? JSON.parse(settings).workspace_type : null;
    });
    expect(workspaceType).toBe(expectedType);
  }).toPass({ timeout: 10000 });
}

export { expect } from '@playwright/test';
