import { ReactNode, useMemo } from 'react';
import { cn } from '../../lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
}

/**
 * Componente de lista virtualizada para grandes volumes de dados
 * Renderiza apenas os itens visíveis na viewport
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 50,
  containerHeight = 400,
  className,
}: VirtualizedListProps<T>) {
  const visibleItems = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Buffer
    return items.slice(0, visibleCount);
  }, [items, itemHeight, containerHeight]);

  return (
    <div
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              height: itemHeight,
              width: '100%',
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

