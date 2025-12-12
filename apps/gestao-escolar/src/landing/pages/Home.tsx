import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  School, 
  ArrowRight, 
  CheckCircle,
  BookOpen,
  Users,
  Sparkles
} from 'lucide-react';
import { Button } from '@pei/ui';
import { BlogSection } from '../components/BlogSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80">
            <img src="/logo.png" alt="PEI Collab" className="h-10" />
            <div>
              <span className="font-bold text-xl">PEI Collab</span>
              <p className="text-xs text-muted-foreground">Educação Inclusiva</p>
            </div>
          </Link>
          <nav className="flex gap-6 items-center">
            <Link to="/blog" className="text-sm hover:underline">Blog</Link>
            <Link to="/login">
              <Button size="sm">Entrar</Button>
            </Link>
          </nav>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Plataforma Completa de Gestão Educacional</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Educação Inclusiva com Inteligência Artificial
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Gerencie sua instituição de ensino com ferramentas modernas,
            crie PEIs personalizados e ofereça uma educação verdadeiramente inclusiva.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/login">
              <Button size="lg" className="gap-2">
                Acessar Sistema
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/blog">
              <Button size="lg" variant="outline" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Ver Blog
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Apps Section */}
      <section className="py-20 px-4 bg-muted/40">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Dois Apps, Uma Plataforma Completa</h2>
            <p className="text-muted-foreground">
              Tudo que você precisa para gestão educacional e inclusão
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Gestão Escolar */}
            <div className="bg-card rounded-lg border p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <School className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold">Gestão Escolar</h3>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Sistema completo de administração escolar com módulos integrados
              </p>
              
              <div className="space-y-3 mb-6">
                {[
                  'Cadastro de alunos e professores',
                  'Frequência e notas digital',
                  'Atividades pedagógicas com IA',
                  'Blog institucional público',
                  'Gestão de merenda escolar',
                  'Planejamento pedagógico',
                  'Transporte escolar'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              <Link to="/login">
                <Button className="w-full gap-2">
                  Acessar Gestão Escolar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            
            {/* PEI Collab */}
            <div className="bg-card rounded-lg border p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold">PEI Collab</h3>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Planos Educacionais Individualizados com Inteligência Artificial
              </p>
              
              <div className="space-y-3 mb-6">
                {[
                  'PEI com sugestões de IA',
                  'Metas SMART personalizadas',
                  'Geração de documentos PDF',
                  'Plano de AEE integrado',
                  'Portal do Responsável',
                  'Acompanhamento de evolução',
                  'Reuniões e avaliações'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              <a href={import.meta.env.VITE_PEI_COLLAB_URL || 'https://pei.peicollab.com.br'} target="_blank" rel="noopener noreferrer">
                <Button className="w-full gap-2" variant="outline">
                  Acessar PEI Collab
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {/* Blog Section */}
      <BlogSection />
      
      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Por Que Escolher PEI Collab?</h2>
            <p className="text-muted-foreground">
              Tecnologia de ponta para educação inclusiva de qualidade
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'Inteligência Artificial',
                description: 'IA para sugestões de PEIs, atividades e conteúdos pedagógicos'
              },
              {
                icon: Users,
                title: 'Gestão Completa',
                description: 'Tudo em um só lugar: alunos, professores, turmas e mais'
              },
              {
                icon: CheckCircle,
                title: 'LGPD e Segurança',
                description: 'Dados protegidos com as melhores práticas de segurança'
              },
              {
                icon: BookOpen,
                title: 'Acessibilidade',
                description: 'Interface moderna e acessível para todos os usuários'
              },
              {
                icon: GraduationCap,
                title: 'Educação Inclusiva',
                description: 'Ferramentas especializadas para atendimento especializado'
              },
              {
                icon: School,
                title: 'Multi-tenancy',
                description: 'Suporta múltiplas instituições com dados isolados'
              }
            ].map((benefit, i) => (
              <div key={i} className="bg-card rounded-lg border p-6 text-center">
                <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Final */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para Transformar sua Gestão Educacional?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se às instituições que já confiam no PEI Collab
          </p>
          <Link to="/login">
            <Button 
              size="lg" 
              variant="secondary"
              className="gap-2"
            >
              Começar Agora
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="PEI Collab" className="h-8" />
                <span className="text-xl font-bold">PEI Collab</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Plataforma completa para gestão educacional inclusiva,
                desenvolvida com foco em qualidade e acessibilidade.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Aplicações</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a 
                    href={import.meta.env.VITE_GESTAO_URL || 'https://gei.peicollab.com.br'} 
                    className="text-muted-foreground hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Gestão Escolar
                  </a>
                </li>
                <li>
                  <a 
                    href={import.meta.env.VITE_PEI_COLLAB_URL || 'https://pei.peicollab.com.br'} 
                    className="text-muted-foreground hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    PEI Collab
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/blog" className="text-muted-foreground hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-muted-foreground hover:text-foreground">
                    Acessar Sistema
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} PEI Collab - Educação Inclusiva de Qualidade</p>
            <p className="mt-2">Desenvolvido com ❤️ para a educação pública brasileira</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
