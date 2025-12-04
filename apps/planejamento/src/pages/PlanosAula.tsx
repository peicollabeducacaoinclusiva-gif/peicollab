import { Link } from 'react-router-dom'
import { Plus, Calendar, Filter } from 'lucide-react'

export default function PlanosAula() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              📅 Planos de Aula
            </h1>
            <p className="text-gray-600">
              Organize suas aulas com modalidades organizativas
            </p>
          </div>
          <Link 
            to="/planos-aula/novo"
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Plano de Aula
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data
              </label>
              <input 
                type="date"
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disciplina
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option>Todas</option>
                <option>Matemática</option>
                <option>Português</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turma
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option>Todas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modalidade
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option>Todas</option>
                <option>Sequência Didática</option>
                <option>Atividade Permanente</option>
                <option>Atividade Independente</option>
                <option>Projeto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option>Todos</option>
                <option>Rascunho</option>
                <option>Agendada</option>
                <option>Executada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calendário Semanal */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            📆 Esta Semana
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map(dia => (
              <div key={dia} className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-400 transition-colors">
                <div className="font-semibold text-gray-700 mb-2">{dia}</div>
                <div className="text-sm text-gray-500">08/01</div>
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-gray-400">Nenhuma aula planejada</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Planos */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhum plano de aula criado ainda
            </h3>
            <p className="text-gray-500 mb-6">
              Comece criando seu primeiro plano de aula
            </p>
            <Link 
              to="/planos-aula/novo"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Plano
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

