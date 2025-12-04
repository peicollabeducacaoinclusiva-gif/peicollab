import { Link } from 'react-router-dom'
import { Library, ExternalLink } from 'lucide-react'

export default function BibliotecaAtividades() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              📚 Biblioteca de Atividades
            </h1>
            <p className="text-gray-600">
              Explore e vincule atividades aos seus planos
            </p>
          </div>
          <a 
            href="http://localhost:5177"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            Ir para Banco de Atividades
          </a>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center py-12">
            <Library className="w-20 h-20 text-purple-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Integração com Banco de Atividades
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Este módulo permite vincular atividades do <strong>Banco de Atividades</strong> aos seus planos de aula.
              Acesse o banco completo para criar, explorar e gerenciar atividades educacionais.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <div className="border-2 border-purple-200 rounded-lg p-6">
                <div className="text-4xl mb-3">🎨</div>
                <h3 className="font-semibold text-gray-900 mb-2">Crie Atividades</h3>
                <p className="text-sm text-gray-600">
                  Desenvolva atividades próprias ou referencie da internet
                </p>
              </div>
              
              <div className="border-2 border-purple-200 rounded-lg p-6">
                <div className="text-4xl mb-3">🔗</div>
                <h3 className="font-semibold text-gray-900 mb-2">Vincule aos Planos</h3>
                <p className="text-sm text-gray-600">
                  Conecte atividades aos seus planos de aula
                </p>
              </div>
              
              <div className="border-2 border-purple-200 rounded-lg p-6">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="font-semibold text-gray-900 mb-2">Compartilhe</h3>
                <p className="text-sm text-gray-600">
                  Compartilhe atividades com outros professores da rede
                </p>
              </div>
            </div>

            <div className="mt-10">
              <a 
                href="http://localhost:5177"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-lg"
              >
                <ExternalLink className="w-6 h-6" />
                Acessar Banco de Atividades
              </a>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Como Vincular Atividades</h3>
          <ol className="space-y-2 text-blue-800">
            <li>1. Acesse o <strong>Banco de Atividades</strong> e crie ou explore atividades</li>
            <li>2. Ao criar um <strong>Plano de Aula</strong>, clique em "Vincular Atividade"</li>
            <li>3. Selecione as atividades desejadas da biblioteca</li>
            <li>4. As atividades aparecerão no plano e nos relatórios</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

