import { test, expect } from '@playwright/test';

/**
 * Testes E2E para fluxos LGPD
 * Valida consentimento, DSR e retenção de dados
 */

test.describe('LGPD Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar cookies e localStorage
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('deve exibir banner de consentimento na landing', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Verificar se banner de consentimento aparece
    const consentBanner = page.locator('[data-testid="consent-banner"]');
    await expect(consentBanner).toBeVisible();
  });

  test('deve permitir aceitar consentimento', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Aceitar consentimento
    const acceptButton = page.locator('button:has-text("Aceitar")');
    await acceptButton.click();

    // Verificar que banner desaparece
    const consentBanner = page.locator('[data-testid="consent-banner"]');
    await expect(consentBanner).not.toBeVisible();

    // Verificar que consentimento foi salvo
    const consentSaved = await page.evaluate(() => {
      return localStorage.getItem('@pei/consent');
    });
    expect(consentSaved).toBeTruthy();
  });

  test('deve permitir exportar dados pessoais', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('http://localhost:5174/auth');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Navegar para LGPD Management
    await page.goto('http://localhost:5174/lgpd');
    
    // Clicar em exportar dados
    const exportButton = page.locator('button:has-text("Exportar Dados")');
    await exportButton.click();

    // Verificar que download foi iniciado
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;
  });

  test('deve permitir solicitar anonimização de dados', async ({ page }) => {
    // Fazer login
    await page.goto('http://localhost:5174/auth');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Navegar para LGPD Management
    await page.goto('http://localhost:5174/lgpd');
    
    // Clicar em anonimizar dados
    const anonymizeButton = page.locator('button:has-text("Anonimizar Dados")');
    await anonymizeButton.click();

    // Confirmar ação
    const confirmButton = page.locator('button:has-text("Confirmar")');
    await confirmButton.click();

    // Verificar mensagem de sucesso
    const successMessage = page.locator('text=Solicitação de anonimização criada');
    await expect(successMessage).toBeVisible();
  });
});

