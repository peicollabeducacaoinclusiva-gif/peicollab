import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link to="/">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">Sobre o PEI Collab</h1>
        
        <div className="prose prose-lg">
          <p className="text-xl text-gray-600 mb-8">
            O PEI Collab é um sistema integrado para gestão educacional inclusiva,
            desenvolvido para facilitar a criação, acompanhamento e avaliação de
            Planos Educacionais Individualizados.
          </p>

          <h2>Nossos Aplicativos</h2>
          
          <h3>🎓 PEI Collab</h3>
          <p>
            Crie e gerencie Planos Educacionais Individualizados com auxílio de IA,
            versionamento, sistema de reuniões e avaliações cíclicas.
          </p>

          <h3>📋 Gestão Escolar</h3>
          <p>
            Cadastre alunos, profissionais, turmas e disciplinas de forma centralizada.
            Dados compartilhados com todos os outros apps.
          </p>

          <h3>♿ Plano de AEE</h3>
          <p>
            Elabore Planos de Atendimento Educacional Especializado completos,
            com ferramentas diagnósticas e avaliações por ciclo.
          </p>

          <h3>📅 Planejamento de Aulas</h3>
          <p>
            Organize e planeje suas aulas de forma integrada com os PEIs dos alunos.
          </p>

          <h3>✏️ Criação de Atividades</h3>
          <p>
            Crie e compartilhe atividades adaptadas para diferentes necessidades.
          </p>

          <h2>Tecnologia</h2>
          <p>
            Construído com React, TypeScript, Supabase e Turborepo para máxima
            performance e escalabilidade.
          </p>
        </div>

        <div className="mt-12 text-center">
          <Link to="/redes">
            <Button size="lg">
              Acessar Minha Rede
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

