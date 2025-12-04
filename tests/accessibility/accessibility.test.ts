import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import puppeteer, { Browser, Page } from 'puppeteer';
import { runAccessibilityTest, createAxeConfig } from './axe.config';

describe('Accessibility Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterAll(async () => {
    await browser.close();
  });

  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:5173';

  const testPages = [
    {
      url: `${baseUrl}/merenda-escolar/login`,
      description: 'Página de login - Merenda Escolar',
    },
    {
      url: `${baseUrl}/merenda-escolar/menus`,
      description: 'Página de cardápios - Merenda Escolar',
      requiresAuth: true,
    },
    {
      url: `${baseUrl}/transporte-escolar/login`,
      description: 'Página de login - Transporte Escolar',
    },
    {
      url: `${baseUrl}/transporte-escolar/vehicles`,
      description: 'Página de veículos - Transporte Escolar',
      requiresAuth: true,
    },
  ];

  testPages.forEach((testPage) => {
    it(`should have no accessibility violations on ${testPage.description}`, async () => {
      const result = await runAccessibilityTest({
        page,
        url: testPage.url,
        description: testPage.description,
        skip: testPage.requiresAuth && !process.env.TEST_AUTH_TOKEN,
      });

      expect(result.violations).toHaveLength(0);
    }, 30000);
  });

  it('should have proper ARIA labels on interactive elements', async () => {
    await page.goto(`${baseUrl}/merenda-escolar/login`, {
      waitUntil: 'networkidle0',
    });

    // Verificar se botões têm aria-label ou texto visível
    const buttons = await page.$$eval('button', (buttons) =>
      buttons.map((btn) => ({
        hasAriaLabel: btn.hasAttribute('aria-label'),
        hasText: btn.textContent?.trim().length > 0,
        html: btn.outerHTML,
      }))
    );

    buttons.forEach((button) => {
      expect(
        button.hasAriaLabel || button.hasText
      ).toBeTruthy();
    });
  });

  it('should have proper form labels', async () => {
    await page.goto(`${baseUrl}/merenda-escolar/login`, {
      waitUntil: 'networkidle0',
    });

    const inputs = await page.$$eval('input', (inputs) =>
      inputs.map((input) => ({
        id: input.id,
        type: input.type,
        hasLabel: !!input.labels?.length,
        hasAriaLabel: input.hasAttribute('aria-label'),
        hasAriaLabelledBy: input.hasAttribute('aria-labelledby'),
      }))
    );

    inputs.forEach((input) => {
      if (input.type !== 'hidden' && input.type !== 'submit') {
        expect(
          input.hasLabel || input.hasAriaLabel || input.hasAriaLabelledBy
        ).toBeTruthy();
      }
    });
  });

  it('should have proper heading hierarchy', async () => {
    await page.goto(`${baseUrl}/merenda-escolar/menus`, {
      waitUntil: 'networkidle0',
    });

    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (headings) =>
      headings.map((h) => ({
        level: parseInt(h.tagName.charAt(1)),
        text: h.textContent?.trim(),
      }))
    );

    // Verificar se há pelo menos um h1
    const h1Count = headings.filter((h) => h.level === 1).length;
    expect(h1Count).toBeGreaterThan(0);
  });

  it('should be keyboard navigable', async () => {
    await page.goto(`${baseUrl}/merenda-escolar/login`, {
      waitUntil: 'networkidle0',
    });

    // Verificar se elementos interativos são focáveis
    const focusableElements = await page.$$eval(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      (elements) =>
        elements.map((el) => ({
          tag: el.tagName.toLowerCase(),
          tabIndex: el.getAttribute('tabindex'),
          disabled: (el as HTMLElement).hasAttribute('disabled'),
        }))
    );

    focusableElements.forEach((element) => {
      if (!element.disabled) {
        expect(
          element.tabIndex === null ||
            element.tabIndex === '0' ||
            parseInt(element.tabIndex || '0') >= 0
        ).toBeTruthy();
      }
    });
  });
});

