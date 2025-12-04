import { Link } from 'react-router-dom'
import { Plus, BookOpen, Edit, Trash2, Eye } from 'lucide-react'
import { AppHeader } from '@pei/ui'

export default function MinhasAtividades() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <AppHeader currentApp="atividades" />
      <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              📚 Minhas Atividades
            </h1>
            <p className="text-gray-600">
              Gerencie as atividades que você criou
            </p>
          </div>
          <Link 
            to="/criar"
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Atividade
          </Link>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-3xl font-bold text-green-600">0</p>
              </div>
              <BookOpen className="w-10 h-10 text-green-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Visualizações</p>
                <p className="text-3xl font-bold text-blue-600">0</p>
              </div>
              <Eye className="w-10 h-10 text-blue-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Usadas em Planos</p>
                <p className="text-3xl font-bold text-purple-600">0</p>
              </div>
              <BookOpen className="w-10 h-10 text-purple-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Curtidas</p>
                <p className="text-3xl font-bold text-pink-600">0</p>
              </div>
              <BookOpen className="w-10 h-10 text-pink-200" />
            </div>
          </div>
        </div>

        {/* Lista de Atividades */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Suas Atividades
            </h2>
            <div className="flex gap-2">
              <select className="border border-gray-300 rounded-lg px-4 py-2">
                <option>Todas</option>
                <option>Públicas</option>
                <option>Privadas</option>
              </select>
            </div>
          </div>

          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhuma atividade criada ainda
            </h3>
            <p className="text-gray-500 mb-6">
              Crie sua primeira atividade para compartilhar com outros professores
            </p>
            <Link 
              to="/criar"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Primeira Atividade
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

