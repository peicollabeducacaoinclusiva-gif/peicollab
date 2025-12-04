import { AxePuppeteer } from '@axe-core/puppeteer';
import type { Page } from 'puppeteer';

export interface AccessibilityTestConfig {
  page: Page;
  url: string;
  description: string;
  skip?: boolean;
}

export async function runAccessibilityTest(config: AccessibilityTestConfig) {
  if (config.skip) {
    console.log(`⏭️  Skipping: ${config.description}`);
    return { violations: [], passes: 0 };
  }

  console.log(`🔍 Testing: ${config.description}`);
  
  await config.page.goto(config.url, { waitUntil: 'networkidle0' });
  
  const axe = new AxePuppeteer(config.page);
  const results = await axe.analyze();

  if (results.violations.length > 0) {
    console.error(`❌ Found ${results.violations.length} accessibility violations:`);
    results.violations.forEach((violation, index) => {
      console.error(`\n${index + 1}. ${violation.id}: ${violation.description}`);
      console.error(`   Impact: ${violation.impact}`);
      console.error(`   Nodes affected: ${violation.nodes.length}`);
      violation.nodes.forEach((node, nodeIndex) => {
        console.error(`   - Node ${nodeIndex + 1}: ${node.html}`);
      });
    });
  } else {
    console.log(`✅ No accessibility violations found`);
  }

  return {
    violations: results.violations,
    passes: results.passes.length,
    url: config.url,
    description: config.description,
  };
}

export const WCAG_LEVELS = {
  A: 'wcag2a',
  AA: 'wcag2aa',
  AAA: 'wcag2aaa',
} as const;

export function createAxeConfig(level: keyof typeof WCAG_LEVELS = 'AA') {
  return {
    tags: [WCAG_LEVELS[level]],
    rules: {
      // Regras específicas que queremos verificar
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-valid-attr': { enabled: true },
      'button-name': { enabled: true },
      'image-alt': { enabled: true },
      'label': { enabled: true },
      'link-name': { enabled: true },
    },
  };
}

