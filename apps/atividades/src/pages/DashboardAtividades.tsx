import { Link } from 'react-router-dom'
import { Plus, Search, Sparkles, Heart, BookOpen, TrendingUp, Users } from 'lucide-react'
import { AppHeader } from '@pei/ui'

export default function DashboardAtividades() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-50/30 dark:to-orange-950/10">
      <AppHeader
        appName="Atividades"
        appLogo="/logo.png"
        currentApp="atividades"
      />
      
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-8 animate-fade-in">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 p-8 text-white shadow-2xl">
              <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-1">🎨 Banco de Atividades</h1>
                    <p className="text-orange-100">Crie, explore e compartilhe atividades educacionais</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              to: '/criar', 
              title: 'Criar Nova', 
              subtitle: 'Atividade', 
              description: 'Crie uma atividade personalizada',
              icon: Plus, 
              gradient: 'from-orange-500 to-amber-500',
              bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
              borderColor: 'hover:border-orange-500'
            },
            { 
              to: '/explorar', 
              title: 'Explorar', 
              subtitle: 'Banco completo', 
              description: 'Encontre atividades prontas',
              icon: Search, 
              gradient: 'from-blue-500 to-cyan-500',
              bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
              borderColor: 'hover:border-blue-500'
            },
            { 
              to: '/minhas-atividades', 
              title: 'Minhas', 
              subtitle: 'Criadas por mim', 
              description: 'Gerencie suas atividades',
              icon: BookOpen, 
              gradient: 'from-green-500 to-emerald-500',
              bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
              borderColor: 'hover:border-green-500'
            },
            { 
              to: '/favoritas', 
              title: 'Favoritas', 
              subtitle: 'Salvos', 
              description: 'Suas atividades curtidas',
              icon: Heart, 
              gradient: 'from-pink-500 to-rose-500',
              bgGradient: 'from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20',
              borderColor: 'hover:border-pink-500'
            },
          ].map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className={`card-hover bg-card border-2 border-border rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 ${action.borderColor} bg-gradient-to-br ${action.bgGradient} animate-fade-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${action.gradient} shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Minhas Atividades', value: 0, icon: BookOpen, gradient: 'from-orange-500 to-amber-500', bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20' },
            { title: 'Total no Banco', value: 0, icon: Search, gradient: 'from-blue-500 to-cyan-500', bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20' },
            { title: 'Mais Usadas', value: 0, icon: TrendingUp, gradient: 'from-green-500 to-emerald-500', bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20' },
            { title: 'Compartilhadas', value: 0, icon: Users, gradient: 'from-purple-500 to-pink-500', bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className={`stat-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${stat.bgGradient} rounded-xl p-6 animate-fade-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{stat.title}</p>
                    <p className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Featured Activities */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">
                Atividades em Destaque
              </h2>
            </div>
            <Link 
              to="/explorar"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todas →
            </Link>
          </div>
          
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhuma atividade em destaque ainda
            </h3>
            <p className="text-gray-500 mb-6">
              Comece criando ou explorando atividades
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                to="/criar"
                className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Criar Atividade
              </Link>
              <Link 
                to="/explorar"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Search className="w-5 h-5" />
                Explorar Banco
              </Link>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-4">💡 Dicas para Criar Atividades Incríveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-semibold mb-2">🎯 Seja Específico</h3>
              <p className="text-sm">
                Defina objetivos claros e vincule às habilidades da BNCC
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-semibold mb-2">♿ Pense em Inclusão</h3>
              <p className="text-sm">
                Adicione adaptações para alunos com necessidades especiais
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-semibold mb-2">🤝 Compartilhe</h3>
              <p className="text-sm">
                Marque como pública para ajudar outros professores
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

