import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../card';
import { cn } from '../../lib/utils';

interface AccessibleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  role?: string;
}

export const AccessibleCard = React.forwardRef<HTMLDivElement, AccessibleCardProps>(
  ({ className, title, description, footer, children, ...props }, ref) => {
    const titleId = title ? `card-title-${title.toLowerCase().replace(/\s+/g, '-')}` : undefined;
    const descId = description ? `card-desc-${description.toLowerCase().replace(/\s+/g, '-')}` : undefined;

    return (
      <Card
        ref={ref}
        className={cn(className)}
        aria-labelledby={titleId}
        aria-describedby={descId}
        role={props.role || 'region'}
        {...props}
      >
        {(title || description) && (
          <CardHeader>
            {title && (
              <CardTitle id={titleId}>
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription id={descId}>
                {description}
              </CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent>
          {children}
        </CardContent>
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    );
  }
);

AccessibleCard.displayName = 'AccessibleCard';

