import { Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'

export default function CriarPlanoCurso() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/planos-curso"
              className="bg-white p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Novo Plano de Curso
              </h1>
              <p className="text-gray-600">
                Planejamento anual baseado na BNCC
              </p>
            </div>
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Save className="w-5 h-5" />
            Salvar
          </button>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Identificação */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📋 Identificação
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título do Plano *
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: Plano de Curso - Matemática 5º Ano"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ano Letivo *
                  </label>
                  <input 
                    type="text"
                    defaultValue="2025"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Turma *
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                    <option>Selecione...</option>
                    <option>5º Ano A</option>
                    <option>5º Ano B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disciplina *
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                    <option>Selecione...</option>
                    <option>Matemática</option>
                    <option>Português</option>
                    <option>Ciências</option>
                  </select>
                </div>
              </div>
            </div>

            <hr />

            {/* BNCC */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🎯 Competências e Habilidades BNCC
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Competências Gerais
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Ex: Competência 1, Competência 2..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habilidades Específicas (Códigos BNCC)
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Ex: EF05MA01, EF05MA02..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <hr />

            {/* Objetivos e Conteúdo */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📖 Objetivos e Conteúdo
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objetivos do Curso
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Descreva os objetivos gerais do curso..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conteúdo Programático
                  </label>
                  <textarea 
                    rows={6}
                    placeholder="Liste os conteúdos por bimestre/trimestre..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <hr />

            {/* Metodologia e Avaliação */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🔧 Metodologia e Avaliação
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metodologia
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Descreva as estratégias metodológicas..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Critérios de Avaliação
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Como os alunos serão avaliados..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <hr />

            {/* Informações Adicionais */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                ℹ️ Informações Adicionais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carga Horária Total (horas)
                  </label>
                  <input 
                    type="number"
                    placeholder="200"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aulas por Semana
                  </label>
                  <input 
                    type="number"
                    placeholder="5"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bibliografia
                </label>
                <textarea 
                  rows={3}
                  placeholder="Referências bibliográficas..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <Link 
              to="/planos-curso"
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Save className="w-5 h-5" />
              Salvar Plano
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

