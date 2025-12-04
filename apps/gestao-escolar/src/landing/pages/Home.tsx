import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  School, 
  Users, 
  ArrowRight, 
  Sparkles,
  CheckCircle,
  Calendar,
  FileText,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export default function Home() {
  const products = [
    {
      id: 'pei-collab',
      name: 'PEI Collab',
      icon: GraduationCap,
      color: 'blue',
      description: 'Planos Educacionais Individualizados',
      longDescription: 'Crie e gerencie PEIs com inteligência artificial, acompanhe metas SMART e gere documentos profissionais automaticamente.',
      features: ['IA para sugestões', 'Metas SMART', 'Documentos PDF', 'Histórico completo'],
      url: import.meta.env.VITE_PEI_COLLAB_URL || 'http://localhost:8080',
    },
    {
      id: 'gestao-escolar',
      name: 'Gestão Escolar',
      icon: School,
      color: 'green',
      description: 'Administração Completa da Escola',
      longDescription: 'Gerencie alunos, profissionais, turmas, matrículas, frequência e notas em uma plataforma integrada.',
      features: ['Cadastro completo', 'Frequência digital', 'Boletins online', 'Dashboard analítico'],
      url: import.meta.env.VITE_GESTAO_ESCOLAR_URL || 'http://localhost:5174',
    },
    {
      id: 'plano-aee',
      name: 'Plano de AEE',
      icon: Users,
      color: 'purple',
      description: 'Atendimento Educacional Especializado',
      longDescription: 'Planeje atendimentos, registre avaliações diagnósticas, agende visitas escolares e faça encaminhamentos.',
      features: ['Avaliação diagnóstica', 'Registro de atendimentos', 'Visitas escolares', 'Encaminhamentos'],
      url: import.meta.env.VITE_PLANO_AEE_URL || 'http://localhost:5175',
    },
    {
      id: 'planejamento',
      name: 'Planejamento',
      icon: Calendar,
      color: 'indigo',
      description: 'Planejamento Pedagógico',
      longDescription: 'Organize planos de aula, sequências didáticas e projetos pedagógicos de forma colaborativa.',
      features: ['Planos de aula', 'Sequências didáticas', 'Colaboração', 'Biblioteca de recursos'],
      url: import.meta.env.VITE_PLANEJAMENTO_URL || 'http://localhost:5176',
    },
    {
      id: 'atividades',
      name: 'Atividades',
      icon: FileText,
      color: 'orange',
      description: 'Gestão de Atividades',
      longDescription: 'Crie, compartilhe e avalie atividades pedagógicas com foco em educação inclusiva.',
      features: ['Banco de atividades', 'Adaptações', 'Avaliações', 'Compartilhamento'],
      url: import.meta.env.VITE_ATIVIDADES_URL || 'http://localhost:5177',
    },
    {
      id: 'blog',
      name: 'Blog Educacional',
      icon: BookOpen,
      color: 'cyan',
      description: 'Conteúdo sobre Educação Inclusiva',
      longDescription: 'Blog institucional com artigos, tutoriais, novidades e dicas sobre educação inclusiva e o sistema PEI Colaborativo.',
      features: ['Artigos educativos', 'Tutoriais do sistema', 'Casos de sucesso', 'Legislação e políticas'],
      url: import.meta.env.VITE_BLOG_URL || 'http://localhost:5179',
    },
  ];

  const benefits = [
    'Interface moderna e intuitiva',
    'Dados seguros e protegidos (LGPD)',
    'Funcionamento offline',
    'Atualizações automáticas',
    'Suporte dedicado',
    'Integrações entre apps',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PEI Collab
              </span>
              <p className="text-xs text-gray-500">Educação Inclusiva</p>
            </div>
          </div>
          <nav className="flex gap-6 items-center">
            <Link to="/sobre" className="text-gray-600 hover:text-blue-600 transition font-medium">
              Sobre
            </Link>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Acessar Sistema
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full mb-6">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">6 Aplicações Integradas para Educação Inclusiva</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
          Transforme a
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Educação Inclusiva </span>
          com Tecnologia
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Plataforma integrada com <strong>6 aplicações especializadas</strong> para facilitar 
          a criação de PEIs, gestão escolar, planejamento pedagógico e muito mais.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login">
            <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
              Entrar no Sistema
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/sobre">
            <Button size="lg" variant="outline" className="text-lg px-8 border-2">
              Ver Demonstração
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
          {[
            { value: '6', label: 'Aplicações' },
            { value: '100%', label: 'Integradas' },
            { value: 'LGPD', label: 'Conforme' },
            { value: 'Offline', label: 'Disponível' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
              <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Seis Aplicações, Uma Plataforma
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Cada aplicação foi desenvolvida para uma necessidade específica, 
            mas todas trabalham juntas de forma integrada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const Icon = product.icon;
            const colorClasses = {
              blue: 'from-blue-500 to-blue-600',
              green: 'from-green-500 to-green-600',
              purple: 'from-purple-500 to-purple-600',
              indigo: 'from-indigo-500 to-indigo-600',
              orange: 'from-orange-500 to-orange-600',
              pink: 'from-pink-500 to-pink-600',
            };

            return (
              <Card key={product.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-gray-300">
                <CardHeader>
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${colorClasses[product.color as keyof typeof colorClasses]} mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                  <CardDescription className="text-base">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {product.longDescription}
                  </p>
                  <div className="space-y-2 mb-4">
                    {product.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <a href={product.url} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full group">
                      Acessar {product.name}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Por Que Escolher o PEI Collab?
            </h2>
            <p className="text-xl text-gray-600">
              Desenvolvido por educadores, para educadores
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                <TrendingUp className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">{benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para Transformar a Educação Inclusiva?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se às redes de ensino que já utilizam o PEI Collab para 
            proporcionar educação de qualidade para todos os alunos.
          </p>
          <Link to="/login">
            <Button 
              size="lg" 
              className="text-lg px-8 bg-white text-blue-600 hover:bg-gray-100 shadow-xl"
            >
              Entrar no Sistema
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">PEI Collab</span>
              </div>
              <p className="text-sm text-gray-400">
                Plataforma completa para gestão educacional inclusiva, 
                desenvolvida com foco em qualidade e acessibilidade.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Aplicações</h3>
              <ul className="space-y-2 text-sm">
                {products.map((product) => (
                  <li key={product.id}>
                    <a href={product.url} className="hover:text-blue-400 transition">
                      {product.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/sobre" className="hover:text-blue-400 transition">Sobre</Link></li>
                <li><Link to="/redes" className="hover:text-blue-400 transition">Acessar Sistema</Link></li>
                <li><a href="https://github.com" className="hover:text-blue-400 transition">Documentação</a></li>
                <li><a href="https://github.com" className="hover:text-blue-400 transition">Suporte</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm">
              © 2025 PEI Collab - Educação Inclusiva de Qualidade
            </p>
            <p className="text-xs mt-2 text-gray-500">
              Desenvolvido com ❤️ para a educação pública brasileira
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
