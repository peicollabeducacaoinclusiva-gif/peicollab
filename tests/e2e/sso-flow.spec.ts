/**
 * Testes E2E para fluxo SSO
 * Valida login único e navegação entre apps
 */

import { test, expect } from '@playwright/test';

const LANDING_URL = process.env.LANDING_URL || 'http://localhost:3000';
const GESTAO_URL = process.env.GESTAO_URL || 'http://localhost:5174';
const PEI_URL = process.env.PEI_URL || 'http://localhost:8080';

// Credenciais de teste (ajustar conforme necessário)
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123456';

test.describe('SSO Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar cookies e localStorage antes de cada teste
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('deve fazer login no Landing e manter sessão ao navegar para Gestão Escolar', async ({ page }) => {
    // 1. Navegar para Landing
    await page.goto(LANDING_URL);
    
    // 2. Fazer login (ajustar seletores conforme UI real)
    // Assumindo que há um formulário de login
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // 3. Aguardar login ser concluído
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // 4. Verificar que está autenticado
    const isAuthenticated = await page.evaluate(() => {
      return localStorage.getItem('@pei-collab:sso-token') !== null;
    });
    expect(isAuthenticated).toBe(true);
    
    // 5. Navegar para Gestão Escolar
    await page.goto(GESTAO_URL);
    
    // 6. Verificar que está autenticado automaticamente
    // (ajustar seletor conforme UI real)
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 });
    
    const isAuthenticatedInGestao = await page.evaluate(() => {
      return localStorage.getItem('@pei-collab:sso-token') !== null;
    });
    expect(isAuthenticatedInGestao).toBe(true);
  });

  test('deve fazer logout e limpar sessão em todos os apps', async ({ page, context }) => {
    // 1. Fazer login no Landing
    await page.goto(LANDING_URL);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // 2. Navegar para Gestão Escolar
    await page.goto(GESTAO_URL);
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 });
    
    // 3. Fazer logout no Gestão Escolar
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    
    // 4. Verificar que sessão foi limpa
    const sessionCleared = await page.evaluate(() => {
      return localStorage.getItem('@pei-collab:sso-token') === null;
    });
    expect(sessionCleared).toBe(true);
    
    // 5. Navegar de volta para Landing
    await page.goto(LANDING_URL);
    
    // 6. Verificar que precisa fazer login novamente
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  });

  test('deve restaurar sessão ao recarregar página', async ({ page }) => {
    // 1. Fazer login
    await page.goto(LANDING_URL);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // 2. Recarregar página
    await page.reload();
    
    // 3. Verificar que ainda está autenticado
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 });
    
    const isAuthenticated = await page.evaluate(() => {
      return localStorage.getItem('@pei-collab:sso-token') !== null;
    });
    expect(isAuthenticated).toBe(true);
  });

  test('deve compartilhar sessão entre múltiplos apps', async ({ page, context }) => {
    // 1. Fazer login no Landing
    await page.goto(LANDING_URL);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // 2. Abrir Gestão Escolar em nova aba
    const gestaoPage = await context.newPage();
    await gestaoPage.goto(GESTAO_URL);
    
    // 3. Verificar autenticação na nova aba
    await gestaoPage.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 });
    
    // 4. Abrir PEI Collab em nova aba
    const peiPage = await context.newPage();
    await peiPage.goto(PEI_URL);
    
    // 5. Verificar autenticação no PEI
    await peiPage.waitForSelector('[data-testid="user-menu"]', { timeout: 10000 });
    
    // Limpar
    await gestaoPage.close();
    await peiPage.close();
  });
});

test.describe('SSO Cookie Management', () => {
  test('deve criar cookies compartilhados em produção', async ({ page, context }) => {
    // Este teste requer configuração de domínio real
    // Pular em desenvolvimento
    test.skip(process.env.NODE_ENV === 'development', 'Requer domínio real');
    
    await page.goto(LANDING_URL);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verificar que cookie foi criado
    const cookies = await context.cookies();
    const ssoCookie = cookies.find(c => c.name === 'pei-sso-session');
    
    expect(ssoCookie).toBeDefined();
    expect(ssoCookie?.domain).toContain('.peicollab.com.br');
    expect(ssoCookie?.secure).toBe(true);
  });

  test('deve usar localStorage em desenvolvimento', async ({ page }) => {
    // Este teste é para desenvolvimento
    test.skip(process.env.NODE_ENV === 'production', 'Apenas para desenvolvimento');
    
    await page.goto(LANDING_URL);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verificar que localStorage foi usado
    const hasLocalStorage = await page.evaluate(() => {
      return localStorage.getItem('@pei-collab:sso-token') !== null;
    });
    
    expect(hasLocalStorage).toBe(true);
  });
});

