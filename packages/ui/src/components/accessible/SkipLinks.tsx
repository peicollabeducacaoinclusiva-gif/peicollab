import { useRef, useEffect } from 'react';

export interface SkipLink {
  id: string;
  label: string;
  targetId: string;
}

export interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

/**
 * Componente de Skip Links para navegação por teclado
 * Permite pular para seções principais da página
 */
export function SkipLinks({ links, className }: SkipLinksProps) {
  const defaultLinks: SkipLink[] = [
    {
      id: 'skip-to-content',
      label: 'Pular para o conteúdo',
      targetId: 'main-content',
    },
    {
      id: 'skip-to-navigation',
      label: 'Pular para a navegação',
      targetId: 'main-navigation',
    },
  ];

  const skipLinks = links || defaultLinks;

  const handleSkip = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={className || 'sr-only focus-within:not-sr-only'}>
      {skipLinks.map((link) => (
        <a
          key={link.id}
          href={`#${link.targetId}`}
          onClick={(e) => {
            e.preventDefault();
            handleSkip(link.targetId);
          }}
          className="absolute left-0 top-0 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-br-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label={link.label}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

/**
 * Hook para adicionar IDs de skip links automaticamente
 */
export function useSkipLinks(targetIds: string[]) {
  useEffect(() => {
    targetIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.setAttribute('tabIndex', '-1');
      }
    });
  }, [targetIds]);
}

