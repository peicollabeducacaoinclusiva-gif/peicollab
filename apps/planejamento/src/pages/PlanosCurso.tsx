import { Link } from 'react-router-dom'
import { Plus, BookOpen, Calendar, CheckCircle, Clock } from 'lucide-react'

export default function PlanosCurso() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              📚 Planos de Curso
            </h1>
            <p className="text-gray-600">
              Organize o planejamento anual baseado na BNCC
            </p>
          </div>
          <Link 
            to="/planos-curso/novo"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Plano de Curso
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano Letivo
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option>2025</option>
                <option>2024</option>
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
                Status
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option>Todos</option>
                <option>Rascunho</option>
                <option>Pendente</option>
                <option>Aprovado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Planos */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhum plano de curso criado ainda
            </h3>
            <p className="text-gray-500 mb-6">
              Comece criando seu primeiro plano de curso baseado na BNCC
            </p>
            <Link 
              to="/planos-curso/novo"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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

