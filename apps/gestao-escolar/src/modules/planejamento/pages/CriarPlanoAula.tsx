import { Link } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Link2 } from 'lucide-react'

export default function CriarPlanoAula() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/planos-aula"
              className="bg-white p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Novo Plano de Aula
              </h1>
              <p className="text-gray-600">
                Planeje uma aula detalhada
              </p>
            </div>
          </div>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2">
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título da Aula *
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: Adição com Reserva"
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
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Aula *
                  </label>
                  <input 
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração (minutos) *
                  </label>
                  <input 
                    type="number"
                    placeholder="50"
                    defaultValue="50"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <hr />

            {/* Modalidade */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🎯 Modalidade Organizativa *
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-green-500 transition-colors">
                  <input type="radio" name="modalidade" className="mr-2" />
                  <span className="font-semibold">Sequência Didática</span>
                  <p className="text-sm text-gray-500 ml-6">Atividades sequenciais organizadas</p>
                </label>
                <label className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-green-500 transition-colors">
                  <input type="radio" name="modalidade" className="mr-2" />
                  <span className="font-semibold">Atividade Permanente</span>
                  <p className="text-sm text-gray-500 ml-6">Atividade regular contínua</p>
                </label>
                <label className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-green-500 transition-colors">
                  <input type="radio" name="modalidade" className="mr-2" />
                  <span className="font-semibold">Atividade Independente</span>
                  <p className="text-sm text-gray-500 ml-6">Atividade pontual específica</p>
                </label>
                <label className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-green-500 transition-colors">
                  <input type="radio" name="modalidade" className="mr-2" />
                  <span className="font-semibold">Projeto</span>
                  <p className="text-sm text-gray-500 ml-6">Investigação aprofundada</p>
                </label>
              </div>
            </div>

            <hr />

            {/* Objetivos e BNCC */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🎯 Objetivos e BNCC
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objetivos de Aprendizagem *
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="O que os alunos devem aprender nesta aula..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habilidades BNCC
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: EF05MA07, EF05MA08"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <hr />

            {/* Desenvolvimento da Aula */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📖 Desenvolvimento da Aula
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Abertura / Aquecimento
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Como você iniciará a aula..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desenvolvimento / Atividades Principais *
                  </label>
                  <textarea 
                    rows={5}
                    placeholder="Descreva as atividades principais da aula..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fechamento / Sistematização
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Como você concluirá a aula..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <hr />

            {/* Atividades Vinculadas */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  📚 Atividades Vinculadas
                </h2>
                <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Vincular Atividade
                </button>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-gray-500 mb-2">Nenhuma atividade vinculada</p>
                <p className="text-sm text-gray-400">Vincule atividades do banco para usar nesta aula</p>
              </div>
            </div>

            <hr />

            {/* Recursos e Materiais */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🔧 Recursos e Materiais
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Materiais Necessários
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Ex: Quadro branco, marcadores, papel A4..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recursos Tecnológicos
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: Projetor, computador, tablets..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <hr />

            {/* Avaliação */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                ✅ Avaliação
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Critérios de Avaliação
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Como você avaliará o aprendizado dos alunos..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Para Casa
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="Atividade para casa (opcional)..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <hr />

            {/* Adaptações */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                ♿ Adaptações para Inclusão
              </h2>
              <textarea 
                rows={3}
                placeholder="Descreva adaptações para alunos com necessidades especiais..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <Link 
              to="/planos-aula"
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
              Salvar Rascunho
            </button>
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2">
              <Save className="w-5 h-5" />
              Salvar e Agendar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

