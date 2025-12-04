import { Button, ButtonProps } from '../button';
import { forwardRef } from 'react';

export interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaHaspopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
}

/**
 * Botão acessível com suporte completo a ARIA
 */
export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      ariaLabel,
      ariaDescribedBy,
      ariaExpanded,
      ariaControls,
      ariaHaspopup,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-haspopup={ariaHaspopup}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
