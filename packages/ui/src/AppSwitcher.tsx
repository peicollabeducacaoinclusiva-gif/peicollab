import { useEffect, useState } from 'react'
import { Grid3x3, Check, GraduationCap, School, FileText, Calendar, BookOpen, Newspaper, Users, Bus, Utensils, Loader2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

interface AppSwitcherProps {
  currentApp?: string
}

interface App {
  id: string
  name: string
  url: string
  icon: string
}

// Mapeamento de ícones
const iconMap: Record<string, React.ComponentType<any>> = {
  GraduationCap,
  School,
  FileText,
  Calendar,
  BookOpen,
  Newspaper,
  Users,
  Bus,
  Utensils,
}

// Inicializar Supabase client (usar variáveis de ambiente)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fximylewmvsllkdczovj.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY0NzIsImV4cCI6MjA3NzI3MjQ3Mn0.3FqQqUfVgD3hIh1daa3R1JjouGZ4D4ONR6SmcL9Qids'
const supabase = createClient(supabaseUrl, supabaseKey)

// Lista fallback de apps (caso RPC falhe)
const fallbackApps: App[] = [
  {
    id: 'pei-collab',
    name: 'PEI Collab',
    url: (import.meta.env.VITE_PEI_COLLAB_URL || 'http://localhost:8080') + '/dashboard',
    icon: 'GraduationCap',
  },
  {
    id: 'gestao-escolar',
    name: 'Gestão Escolar',
    url: import.meta.env.VITE_GESTAO_ESCOLAR_URL || 'http://localhost:5174',
    icon: 'School',
  },
  {
    id: 'plano-aee',
    name: 'Plano de AEE',
    url: import.meta.env.VITE_PLANO_AEE_URL || 'http://localhost:5175',
    icon: 'FileText',
  },
  {
    id: 'planejamento',
    name: 'Planejamento',
    url: import.meta.env.VITE_PLANEJAMENTO_URL || 'http://localhost:5176',
    icon: 'Calendar',
  },
  {
    id: 'atividades',
    name: 'Atividades',
    url: import.meta.env.VITE_ATIVIDADES_URL || 'http://localhost:5178',
    icon: 'BookOpen',
  },
  {
    id: 'blog',
    name: 'Blog',
    url: import.meta.env.VITE_BLOG_URL || 'http://localhost:5179',
    icon: 'Newspaper',
  },
  {
    id: 'portal-responsavel',
    name: 'Portal do Responsável',
    url: import.meta.env.VITE_PORTAL_RESPONSAVEL_URL || 'http://localhost:5180',
    icon: 'Users',
  },
  {
    id: 'transporte-escolar',
    name: 'Transporte Escolar',
    url: import.meta.env.VITE_TRANSPORTE_ESCOLAR_URL || 'http://localhost:5181',
    icon: 'Bus',
  },
  {
    id: 'merenda-escolar',
    name: 'Merenda Escolar',
    url: import.meta.env.VITE_MERENDA_ESCOLAR_URL || 'http://localhost:5182',
    icon: 'Utensils',
  },
]

export function AppSwitcher({ currentApp }: AppSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [availableApps, setAvailableApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAvailableApps()
  }, [])

  const loadAvailableApps = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Tentar usar RPC primeiro
      const { data: rpcApps, error: rpcError } = await supabase.rpc('get_available_apps_for_user', {
        p_user_id: user.id
      })

      if (!rpcError && rpcApps && rpcApps.length > 0) {
        // Mapear resultado do RPC para formato App
        const apps: App[] = rpcApps.map((app: any) => {
          // Garantir que PEI Collab sempre vá para /dashboard
          let url = app.app_url
          if (app.app_id === 'pei-collab' && !url.includes('/dashboard')) {
            url = url.endsWith('/') ? url + 'dashboard' : url + '/dashboard'
          }
          return {
            id: app.app_id,
            name: app.app_name,
            url: url,
            icon: app.app_icon || 'Grid3x3',
          }
        })
        setAvailableApps(apps)
      } else {
        // Fallback: usar lista hardcoded baseada em roles
        console.warn('RPC get_available_apps_for_user falhou, usando fallback:', rpcError)
        
        // Buscar roles do usuário diretamente da tabela user_roles
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)

        if (userRoles && userRoles.length > 0) {
          const userRole = userRoles[0].role
          
          // Filtrar apps baseado em roles (lógica simplificada para fallback)
          const roleBasedApps = fallbackApps.filter(app => {
            // Lógica básica de permissões para fallback
            const rolePermissions: Record<string, string[]> = {
              'superadmin': ['pei-collab', 'gestao-escolar', 'plano-aee', 'planejamento', 'atividades', 'blog', 'portal-responsavel', 'transporte-escolar', 'merenda-escolar'],
              'education_secretary': ['pei-collab', 'gestao-escolar', 'blog', 'transporte-escolar', 'merenda-escolar'],
              'school_manager': ['pei-collab', 'gestao-escolar', 'plano-aee', 'planejamento', 'transporte-escolar', 'merenda-escolar'],
              'school_director': ['pei-collab', 'gestao-escolar', 'plano-aee', 'planejamento', 'transporte-escolar', 'merenda-escolar'],
              'coordinator': ['pei-collab', 'gestao-escolar', 'plano-aee', 'planejamento'],
              'teacher': ['pei-collab', 'planejamento', 'atividades'],
              'aee_teacher': ['pei-collab', 'plano-aee', 'atividades'],
              'family': ['pei-collab', 'portal-responsavel'],
            }
            
            return rolePermissions[userRole]?.includes(app.id) || false
          })
          
          setAvailableApps(roleBasedApps)
        } else {
          // Se não encontrou roles, ainda assim mostrar apps padrão para superadmin (fallback seguro)
          console.warn('Nenhuma role encontrada para o usuário, usando lista completa de apps')
          setAvailableApps(fallbackApps)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar apps disponíveis:', error)
      setAvailableApps([])
    } finally {
      setLoading(false)
    }
  }

  // Função helper para identificar target_app a partir da URL
  const getAppIdFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Mapear domínios/portas para app IDs
      if (hostname.includes('gestao-escolar') || url.includes('5174')) {
        return 'gestao-escolar';
      }
      if (hostname.includes('plano-aee') || url.includes('5175')) {
        return 'plano-aee';
      }
      if (hostname.includes('planejamento') || url.includes('5176')) {
        return 'planejamento';
      }
      if (hostname.includes('atividades') || url.includes('5178')) {
        return 'atividades';
      }
      if (hostname.includes('blog') || url.includes('5179')) {
        return 'blog';
      }
      if (hostname.includes('portal-responsavel') || url.includes('5180')) {
        return 'portal-responsavel';
      }
      if (hostname.includes('transporte-escolar') || url.includes('5181')) {
        return 'transporte-escolar';
      }
      if (hostname.includes('merenda-escolar') || url.includes('5182')) {
        return 'merenda-escolar';
      }
      if (hostname.includes('pei-collab') || url.includes('8080') || url.includes('8081')) {
        return 'pei-collab';
      }
      
      // Tentar extrair do caminho ou fallback
      return null;
    } catch {
      return null;
    }
  }

  const handleAppClick = async (url: string, appId?: string) => {
    // Fechar dropdown ao clicar
    setIsOpen(false);
    
    try {
      // Tentar usar appId se fornecido, caso contrário identificar pela URL
      let targetApp = appId || getAppIdFromUrl(url);
      
      if (!targetApp) {
        // Se não conseguir identificar o app, redirecionar sem SSO
        console.warn('Não foi possível identificar target_app da URL:', url);
        window.location.href = url;
        return;
      }
      
      // Verificar se há sessão ativa
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Se não tiver sessão, redirecionar normalmente
        window.location.href = url;
        return;
      }
      
      // Gerar código SSO via Edge Function
      // Passar dados da sessão para a Edge Function validar e armazenar
      const { data, error } = await supabase.functions.invoke('create-sso-code', {
        body: { 
          target_app: targetApp,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error || !data?.code) {
        console.error('Erro ao gerar código SSO:', error);
        // Fallback: redirecionar sem SSO (usuário fará login manual)
        window.location.href = url;
        return;
      }
      
      // Redirecionar com código na URL
      const urlObj = new URL(url);
      urlObj.searchParams.set('sso_code', data.code);
      window.location.href = urlObj.toString();
      
    } catch (error) {
      console.error('Erro ao fazer SSO:', error);
      // Em caso de erro, redirecionar normalmente
      window.location.href = url;
    }
  }

  if (loading) {
    return (
      <div className="inline-flex items-center justify-center gap-x-1.5 rounded-md bg-primary/10 px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="hidden sm:inline text-sm text-primary">Carregando...</span>
      </div>
    )
  }

  // Sempre mostrar AppSwitcher, mesmo se só tiver 1 app (para indicar sistema integrado)
  // Mas desabilitar se não houver apps ou só tiver 1
  const isDisabled = availableApps.length <= 1

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
          isDisabled 
            ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' 
            : 'bg-primary/10 hover:bg-primary/20 text-primary'
        }`}
        title={isDisabled ? 'Apenas um aplicativo disponível' : 'Alternar entre aplicações'}
      >
        <Grid3x3 className="h-5 w-5" />
        <span className="hidden sm:inline">Apps</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute left-0 z-50 mt-2 w-56 origin-top-left rounded-md bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-border">
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Aplicações Disponíveis
              </div>
              {availableApps.map((app) => {
                const IconComponent = iconMap[app.icon] || Grid3x3
                return (
                  <button
                    key={app.id}
                    onClick={() => handleAppClick(app.url, app.id)}
                    className={`
                      w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between gap-2
                      ${currentApp === app.id 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-foreground hover:bg-accent'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <IconComponent className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{app.name}</span>
                    </div>
                    {currentApp === app.id && (
                      <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

