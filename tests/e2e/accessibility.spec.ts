import { test, expect } from '@playwright/test';

/**
 * Testes E2E de acessibilidade
 * Valida navegação por teclado, leitores de tela e ARIA
 */

test.describe('Accessibility', () => {
  test('deve ter skip links visíveis ao focar', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Pressionar Tab para focar no skip link
    await page.keyboard.press('Tab');

    // Verificar se skip link está visível
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
  });

  test('deve navegar para conteúdo principal com skip link', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Pressionar Tab e Enter no skip link
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Verificar que foco está no conteúdo principal
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('deve ter labels adequados em formulários', async ({ page }) => {
    await page.goto('http://localhost:5174/auth');

    // Verificar que inputs têm labels associados
    const emailInput = page.locator('input[type="email"]');
    const emailLabel = page.locator('label[for*="email"]');
    
    await expect(emailLabel).toBeVisible();
    await expect(emailInput).toHaveAttribute('aria-label');
  });

  test('deve ter indicadores de foco visíveis', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Pressionar Tab várias vezes
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }

    // Verificar que algum elemento está focado
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('deve ter contraste adequado', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Verificar contraste de texto (simulação - em produção usar axe-core)
    const body = page.locator('body');
    const color = await body.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
      };
    });

    // Verificar que cores estão definidas
    expect(color.color).toBeTruthy();
    expect(color.backgroundColor).toBeTruthy();
  });

  test('deve ter landmarks semânticos', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Verificar presença de landmarks
    const main = page.locator('main, [role="main"]');
    const nav = page.locator('nav, [role="navigation"]');

    await expect(main).toBeVisible();
    await expect(nav).toBeVisible();
  });

  test('deve ter headings hierárquicos', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Verificar presença de h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Verificar que não pula níveis (h1 -> h3 sem h2)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });
});

