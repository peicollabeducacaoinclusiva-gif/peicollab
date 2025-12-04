import { Link } from 'react-router-dom'
import { ArrowLeft, Save, Link2, Upload, Plus } from 'lucide-react'
import { useState } from 'react'
import { AppHeader } from '@pei/ui'

export default function CriarAtividade() {
  const [isExternal, setIsExternal] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <AppHeader currentApp="atividades" />
      <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard"
              className="bg-white p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Nova Atividade
              </h1>
              <p className="text-gray-600">
                Crie ou referencie uma atividade educacional
              </p>
            </div>
          </div>
          <button className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center gap-2">
            <Save className="w-5 h-5" />
            Salvar
          </button>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Tipo de Atividade */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📌 Tipo de Atividade
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    !isExternal ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                  }`}
                  onClick={() => setIsExternal(false)}
                >
                  <div className="flex items-start">
                    <input 
                      type="radio" 
                      name="tipo" 
                      checked={!isExternal}
                      onChange={() => setIsExternal(false)}
                      className="mr-3 mt-1" 
                    />
                    <div>
                      <span className="font-semibold text-lg">Atividade Própria</span>
                      <p className="text-sm text-gray-600 mt-1">
                        Crie uma atividade original com instruções, materiais e anexos
                      </p>
                    </div>
                  </div>
                </label>
                
                <label 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    isExternal ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setIsExternal(true)}
                >
                  <div className="flex items-start">
                    <input 
                      type="radio" 
                      name="tipo" 
                      checked={isExternal}
                      onChange={() => setIsExternal(true)}
                      className="mr-3 mt-1" 
                    />
                    <div>
                      <span className="font-semibold text-lg">Referência Externa</span>
                      <p className="text-sm text-gray-600 mt-1">
                        Referencie uma atividade da internet (link)
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <hr />

            {/* Identificação */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📋 Identificação
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título da Atividade *
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: Jogo da Memória - Tabuada do 5"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição Breve
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="Resumo da atividade..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <hr />

            {/* Referência Externa (condicional) */}
            {isExternal && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    🔗 Informações da Referência
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL da Atividade *
                      </label>
                      <input 
                        type="url"
                        placeholder="https://exemplo.com/atividade"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fonte/Autor
                      </label>
                      <input 
                        type="text"
                        placeholder="Nome do site ou autor"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      />
                    </div>
                  </div>
                </div>
                <hr />
              </>
            )}

            {/* Classificação */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🏷️ Classificação
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nível de Ensino *
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                    <option>Selecione...</option>
                    <option>Educação Infantil</option>
                    <option>Fundamental I</option>
                    <option>Fundamental II</option>
                    <option>Ensino Médio</option>
                    <option>EJA</option>
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
                    <option>História</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Atividade *
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                    <option>Selecione...</option>
                    <option>Individual</option>
                    <option>Dupla</option>
                    <option>Grupo</option>
                    <option>Coletiva</option>
                    <option>Prática</option>
                    <option>Teórica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dificuldade
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                    <option>Média</option>
                    <option>Muito Fácil</option>
                    <option>Fácil</option>
                    <option>Difícil</option>
                    <option>Muito Difícil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração (minutos)
                  </label>
                  <input 
                    type="number"
                    placeholder="30"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm font-medium text-gray-700">Atividade Pública</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Conteúdo da Atividade (se não for externa) */}
            {!isExternal && (
              <>
                <hr />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    📖 Conteúdo da Atividade
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Objetivos de Aprendizagem
                      </label>
                      <textarea 
                        rows={3}
                        placeholder="O que os alunos aprenderão..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Habilidades BNCC
                      </label>
                      <input 
                        type="text"
                        placeholder="Ex: EF05MA07, EF05LP01"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Materiais Necessários
                      </label>
                      <textarea 
                        rows={2}
                        placeholder="Liste os materiais necessários..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instruções Passo a Passo *
                      </label>
                      <textarea 
                        rows={6}
                        placeholder="Descreva como realizar a atividade..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      />
                    </div>
                  </div>
                </div>

                <hr />

                {/* Anexos */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    📎 Anexos
                  </h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">
                      Arraste arquivos ou clique para enviar
                    </p>
                    <p className="text-sm text-gray-400">
                      PDF, imagens, vídeos (máx. 10MB)
                    </p>
                    <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                      Escolher Arquivos
                    </button>
                  </div>
                </div>
              </>
            )}

            <hr />

            {/* Adaptações para Inclusão */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                ♿ Adaptações para Inclusão
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adaptações por Tipo de Deficiência
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Descreva adaptações para alunos com deficiência visual, auditiva, intelectual, física..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dicas de Acessibilidade
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="Dicas gerais para tornar a atividade mais acessível..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <hr />

            {/* Tags */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🏷️ Tags
              </h2>
              <input 
                type="text"
                placeholder="Digite tags separadas por vírgula (ex: matemática, jogos, tabuada)"
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
              <p className="text-sm text-gray-500 mt-2">
                Tags ajudam outros professores a encontrar sua atividade
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <Link 
              to="/dashboard"
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center gap-2">
              <Save className="w-5 h-5" />
              Salvar Atividade
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

