import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('combina classes com clsx', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filtra valores falsy', () => {
    expect(cn('a', false, 'b', null, undefined, 'c')).toBe('a b c');
  });

  it('faz merge de classes Tailwind com twMerge', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('aceita objetos condicionais', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('aceita arrays', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });
});
