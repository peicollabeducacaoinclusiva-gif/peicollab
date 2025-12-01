import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn (utils)', () => {
  it('deve combinar classes corretamente', () => {
    const result = cn('class1', 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('deve mesclar classes do Tailwind corretamente', () => {
    const result = cn('px-2 py-1', 'px-4');
    // O px-4 deve sobrescrever o px-2
    expect(result).toContain('px-4');
    expect(result).not.toContain('px-2');
  });

  it('deve lidar com arrays de classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
    expect(result).toContain('class3');
  });

  it('deve lidar com objetos condicionais', () => {
    const result = cn({
      'class1': true,
      'class2': false,
      'class3': true,
    });
    expect(result).toContain('class1');
    expect(result).not.toContain('class2');
    expect(result).toContain('class3');
  });

  it('deve lidar com valores undefined e null', () => {
    const result = cn('class1', undefined, null, 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('deve mesclar classes conflitantes do Tailwind', () => {
    // Teste específico: padding
    const result = cn('p-2', 'p-4');
    expect(result).toContain('p-4');
    expect(result).not.toContain('p-2');
  });

  it('deve combinar múltiplos tipos de entrada', () => {
    const result = cn(
      'base-class',
      ['array-class1', 'array-class2'],
      { 'conditional-class': true },
      'string-class'
    );
    
    expect(result).toContain('base-class');
    expect(result).toContain('array-class1');
    expect(result).toContain('array-class2');
    expect(result).toContain('conditional-class');
    expect(result).toContain('string-class');
  });
});

