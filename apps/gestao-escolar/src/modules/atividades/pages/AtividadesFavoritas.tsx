import { Heart } from 'lucide-react'
import { AppHeader } from '@pei/ui'

export default function AtividadesFavoritas() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      <AppHeader currentApp="atividades" />
      <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ❤️ Atividades Favoritas
          </h1>
          <p className="text-gray-600">
            Atividades que você curtiu e salvou
          </p>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhuma atividade favoritada ainda
            </h3>
            <p className="text-gray-500 mb-6">
              Explore o banco e curta atividades para salvá-las aqui
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

