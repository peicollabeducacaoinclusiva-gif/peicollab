import { ChevronRight, Home, Users, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2 text-sm text-muted-foreground', className)}
    >
      <Link
        to="/"
        className="hover:text-foreground transition-colors flex items-center gap-1"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Início</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            {isLast ? (
              <span className="flex items-center gap-1 text-foreground font-medium">
                {Icon && <span className="text-muted-foreground">{Icon}</span>}
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href || '#'}
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                {Icon && <span>{Icon}</span>}
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Componente auxiliar para criar breadcrumb pedagógico da Superficha
interface StudentBreadcrumbProps {
  studentName: string;
  schoolName?: string;
  className?: string;
}

export function StudentBreadcrumb({ studentName, schoolName, className }: StudentBreadcrumbProps) {
  const items: BreadcrumbItem[] = [
    {
      label: 'Estudantes',
      href: '/students',
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: schoolName || 'Escola',
      href: schoolName ? undefined : undefined,
    },
    {
      label: studentName,
      icon: <User className="h-4 w-4" />,
    },
  ];

  return <BreadcrumbNav items={items} className={className} />;
}

