import { Search, Filter, Heart, Eye, TrendingUp } from 'lucide-react'
import { AppHeader } from '@pei/ui'

export default function ExplorarAtividades() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <AppHeader currentApp="atividades" />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔍 Explorar Atividades
          </h1>
          <p className="text-gray-600">
            Encontre atividades compartilhadas por outros professores
          </p>
        </div>

        {/* Busca e Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Buscar atividades..."
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3"
              />
            </div>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Buscar
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nível
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option>Todos</option>
                <option>Ed. Infantil</option>
                <option>Fund. I</option>
                <option>Fund. II</option>
                <option>Médio</option>
                <option>EJA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disciplina
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option>Todas</option>
                <option>Matemática</option>
                <option>Português</option>
                <option>Ciências</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option>Todos</option>
                <option>Individual</option>
                <option>Grupo</option>
                <option>Prática</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dificuldade
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option>Todas</option>
                <option>Fácil</option>
                <option>Média</option>
                <option>Difícil</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option>Mais Recentes</option>
                <option>Mais Curtidas</option>
                <option>Mais Usadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Atividades em Destaque */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              Mais Populares
            </h2>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhuma atividade encontrada
            </h3>
            <p className="text-gray-500">
              Seja o primeiro a criar e compartilhar atividades!
            </p>
          </div>
        </div>

        {/* Grid de Atividades (exemplo vazio) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Exemplo de card (vazio por enquanto) */}
        </div>
        </div>
      </div>
    </div>
  )
}

