# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-auth.spec.ts >> 🔐 Autenticação e Controle de Acesso >> RF-07: Token JWT deve persistir após F5
- Location: tests\e2e\01-auth.spec.ts:49:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[type="email"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('input[type="email"]')

```

# Test source

```ts
  79  |       await performLogin(page, TEST_USERS.law);
  80  |       await waitForWorkspaceType(page, 'law');
  81  |     });
  82  |   },
  83  | 
  84  |   // Fixture: Login como General
  85  |   loginAsGeneral: async ({ page }, use) => {
  86  |     await use(async () => {
  87  |       await performLogin(page, TEST_USERS.general);
  88  |       await waitForWorkspaceType(page, 'general');
  89  |     });
  90  |   },
  91  | 
  92  |   // Fixture: Obter tipo de workspace atual
  93  |   getWorkspaceType: async ({ page }, use) => {
  94  |     await use(async () => {
  95  |       return await page.evaluate(() => {
  96  |         const settings = localStorage.getItem('doboy_settings');
  97  |         return settings ? JSON.parse(settings).workspace_type : 'unknown';
  98  |       });
  99  |     });
  100 |   },
  101 | 
  102 |   // Fixture: Aguardar Dashboard carregar completamente
  103 |   waitForDashboardLoad: async ({ page }, use) => {
  104 |     await use(async () => {
  105 |       await expect(page.locator('#root')).toBeVisible();
  106 |       // Aguardar spinner de loading sumir
  107 |       await page.locator('.animate-spin').waitFor({ state: 'detached', timeout: 10000 });
  108 |       // Verificar que dashboard renderizou
  109 |       await expect(page.locator('text=/Dashboard|Kanban|Contatos/').first()).toBeVisible({ timeout: 10000 });
  110 |     });
  111 |   },
  112 | 
  113 |   // Fixture: Criar lead de teste
  114 |   createTestLead: async ({ page }, use) => {
  115 |     await use(async (leadData) => {
  116 |       const lead: TestLead = {
  117 |         name: leadData.name || `Test Lead ${Date.now()}`,
  118 |         email: leadData.email || `test${Date.now()}@test.com`,
  119 |         phone: leadData.phone || '(11) 99999-0000',
  120 |         source: leadData.source || 'Manual',
  121 |         value: leadData.value || 1000,
  122 |         status: leadData.status || 'Novo Lead',
  123 |       };
  124 | 
  125 |       // Navegar para formulário
  126 |       await page.click('text=Contatos');
  127 |       await page.click('text=Novo Lead');
  128 | 
  129 |       // Preencher formulário
  130 |       await page.fill('input[name="name"]', lead.name);
  131 |       await page.fill('input[name="email"]', lead.email);
  132 |       await page.fill('input[name="phone"]', lead.phone);
  133 |       await page.fill('input[name="value"]', String(lead.value));
  134 |       
  135 |       // Salvar
  136 |       await page.click('button[type="submit"]');
  137 |       await expect(page.locator('text=Lead cadastrado com sucesso')).toBeVisible({ timeout: 5000 });
  138 | 
  139 |       return lead;
  140 |     });
  141 |   },
  142 | 
  143 |   // Fixture: Deletar todos os leads mock
  144 |   deleteAllMockLeads: async ({ page }, use) => {
  145 |     await use(async () => {
  146 |       await page.evaluate(async () => {
  147 |         const token = localStorage.getItem('doboy_token');
  148 |         await fetch('/api/admin/clear-mock-data', {
  149 |           method: 'POST',
  150 |           headers: { Authorization: `Bearer ${token}` },
  151 |         });
  152 |       });
  153 |       await page.reload();
  154 |     });
  155 |   },
  156 | 
  157 |   // Fixture: Verificar isolamento de workspace
  158 |   expectWorkspaceIsolated: async ({ page }, use) => {
  159 |     await use(async () => {
  160 |       const workspaceType = await page.evaluate(() => {
  161 |         const settings = localStorage.getItem('doboy_settings');
  162 |         return settings ? JSON.parse(settings).workspace_type : null;
  163 |       });
  164 | 
  165 |       expect(workspaceType).not.toBeNull();
  166 |       expect(['barbershop', 'law', 'general']).toContain(workspaceType);
  167 |     });
  168 |   },
  169 | });
  170 | 
  171 | // ============================================================
  172 | // HELPERS INTERNOS
  173 | // ============================================================
  174 | 
  175 | async function performLogin(page: Page, user: any) {
  176 |   await page.goto('/');
  177 |   
  178 |   // Aguardar tela de login
> 179 |   await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
      |                                                     ^ Error: expect(locator).toBeVisible() failed
  180 |   
  181 |   // Preencher credenciais
  182 |   await page.fill('input[type="email"]', user.email);
  183 |   await page.fill('input[type="password"]', user.password);
  184 |   
  185 |   // Submeter
  186 |   await page.click('button[type="submit"]');
  187 |   
  188 |   // Aguardar redirecionamento (URL deve mudar de /login)
  189 |   await page.waitForURL(/\/(dashboard|kanban|contacts)/, { timeout: 10000 });
  190 |   
  191 |   // Verificar que login foi bem-sucedido
  192 |   await expect(page.locator('#root')).toBeVisible();
  193 | }
  194 | 
  195 | async function waitForWorkspaceType(page: Page, expectedType: string) {
  196 |   await expect(async () => {
  197 |     const workspaceType = await page.evaluate(() => {
  198 |       const settings = localStorage.getItem('doboy_settings');
  199 |       return settings ? JSON.parse(settings).workspace_type : null;
  200 |     });
  201 |     expect(workspaceType).toBe(expectedType);
  202 |   }).toPass({ timeout: 10000 });
  203 | }
  204 | 
  205 | export { expect } from '@playwright/test';
  206 | 
```