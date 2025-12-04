import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@pei/i18n';
import { AuthProvider } from '@pei/auth';

/**
 * Helper para renderizar componentes com providers necessários
 */

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  locale?: string;
  user?: { id: string; tenant_id?: string } | null;
}

/**
 * Cria um QueryClient para testes
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Wrapper de providers para testes
 */
function TestWrapper({ children, queryClient, locale, user }: {
  children: React.ReactNode;
  queryClient?: QueryClient;
  locale?: string;
  user?: { id: string; tenant_id?: string } | null;
}) {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <I18nProvider defaultLocale={locale as any}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

/**
 * Renderiza componente com providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient, locale, user, ...renderOptions } = options;

  return render(ui, {
    wrapper: (props) => (
      <TestWrapper queryClient={queryClient} locale={locale} user={user} {...props} />
    ),
    ...renderOptions,
  });
}

/**
 * Re-exporta tudo do @testing-library/react
 */
export * from '@testing-library/react';

