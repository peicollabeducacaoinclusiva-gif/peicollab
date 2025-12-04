import { waitFor as rtlWaitFor } from '@testing-library/react';

/**
 * Helpers para aguardar condições em testes
 */

/**
 * Aguarda até que uma condição seja verdadeira
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options?: { timeout?: number; interval?: number }
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options || {};

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Aguarda até que um elemento apareça
 */
export async function waitForElement(
  queryFn: () => HTMLElement | null,
  options?: { timeout?: number }
): Promise<HTMLElement> {
  return rtlWaitFor(queryFn, {
    timeout: options?.timeout || 5000,
  });
}

/**
 * Aguarda até que um elemento desapareça
 */
export async function waitForElementToBeRemoved(
  queryFn: () => HTMLElement | null,
  options?: { timeout?: number }
): Promise<void> {
  return rtlWaitFor(() => {
    const element = queryFn();
    if (!element) {
      return true;
    }
    throw new Error('Element still present');
  }, {
    timeout: options?.timeout || 5000,
  });
}

/**
 * Aguarda um tempo específico
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

