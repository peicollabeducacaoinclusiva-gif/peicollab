import { Link } from 'react-router-dom'
import { BookOpen, Calendar, FileText, Library, Clock, CheckSquare } from 'lucide-react'
import { AppHeader } from '@pei/ui'

export default function DashboardPlanejamento() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50/30 dark:to-blue-950/10">
      <AppHeader
        appName="Planejamento"
        appLogo="/logo.png"
        currentApp="planejamento"
      />
      
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-8 animate-fade-in">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 p-8 text-white shadow-2xl">
              <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-1">📚 Planejamento de Aulas</h1>
                    <p className="text-blue-100">Organize seus planos de curso e aulas com base na BNCC</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Cards de Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link 
            to="/planos-curso"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Planos de Curso</h3>
                <p className="text-sm text-gray-500">Planejamento anual</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Crie e gerencie seus planos de curso baseados na BNCC
            </p>
          </Link>

          <Link 
            to="/planos-aula"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-500"
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Planos de Aula</h3>
                <p className="text-sm text-gray-500">Aulas detalhadas</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Planeje suas aulas com diferentes modalidades organizativas
            </p>
          </Link>

          <Link 
            to="/biblioteca-atividades"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Library className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Biblioteca</h3>
                <p className="text-sm text-gray-500">Atividades</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Vincule atividades aos seus planos de aula
            </p>
          </Link>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Planos de Curso', value: 0, icon: FileText, gradient: 'from-blue-500 to-cyan-500', bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20' },
            { title: 'Aulas Planejadas', value: 0, icon: Calendar, gradient: 'from-green-500 to-emerald-500', bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20' },
            { title: 'Aulas Esta Semana', value: 0, icon: Clock, gradient: 'from-orange-500 to-amber-500', bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20' },
            { title: 'Aulas Executadas', value: 0, icon: CheckSquare, gradient: 'from-purple-500 to-pink-500', bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20' },
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

        {/* Modalidades Organizativas */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📋 Modalidades Organizativas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-700 mb-2">Sequência Didática</h3>
              <p className="text-sm text-gray-600">
                Conjunto de atividades organizadas de forma sequencial
              </p>
            </div>
            <div className="border-2 border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-700 mb-2">Atividade Permanente</h3>
              <p className="text-sm text-gray-600">
                Atividades regulares e contínuas ao longo do ano
              </p>
            </div>
            <div className="border-2 border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-700 mb-2">Atividade Independente</h3>
              <p className="text-sm text-gray-600">
                Atividades pontuais não relacionadas a projetos
              </p>
            </div>
            <div className="border-2 border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-700 mb-2">Projeto</h3>
              <p className="text-sm text-gray-600">
                Investigação aprofundada sobre um tema específico
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

