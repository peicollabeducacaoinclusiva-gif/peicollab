import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Heart, Users, TrendingUp, Shield, Zap, Eye, Ear, MessageCircle, Brain, FileText, Clock, CheckCircle, Award, Globe } from "lucide-react";

// URL da Landing Page (ajustar para produção)
const LANDING_URL = import.meta.env.VITE_LANDING_URL || 'http://localhost:3000';

const features = [
  {
    icon: FileText,
    title: "PEIs Personalizados e Inteligentes",
    text: "Crie planos educacionais que respeitam o ritmo e as necessidades de cada aluno, com templates inteligentes e acolhedores.",
    color: "from-cyan-500 to-violet-500",
  },
  {
    icon: Users,
    title: "Colaboração que Une Pessoas",
    text: "Conecte professores, coordenadores, terapeutas e famílias em tempo real. Porque juntos fazemos mais.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Heart,
    title: "Celebre Cada Conquista",
    text: "Timeline interativa para registrar progressos e conquistas. Cada passo importa na jornada de aprendizado.",
    color: "from-orange-400 to-pink-400",
  },
  {
    icon: TrendingUp,
    title: "Insights que Orientam",
    text: "Relatórios visuais e claros que ajudam a tomar decisões pedagógicas mais assertivas e humanas.",
    color: "from-cyan-400 to-blue-500",
  },
  {
    icon: Brain,
    title: "O Aluno no Centro de Tudo",
    text: "Interface pensada com carinho para colocar cada estudante no centro, respeitando suas potencialidades e sonhos únicos.",
    color: "from-violet-600 to-purple-600",
  },
  {
    icon: Shield,
    title: "Trabalhe de Qualquer Lugar",
    text: "Continue seu trabalho mesmo offline. Suas atualizações são sincronizadas automaticamente ao voltar à internet.",
    color: "from-cyan-500 to-violet-500",
  },
];

const accessibilityFeatures = [
  {
    icon: Eye,
    title: "Acessibilidade Visual",
    description: "Alto contraste e navegação por teclado",
  },
  {
    icon: Ear,
    title: "Recursos Auditivos",
    description: "Suporte para leitores de tela",
  },
  {
    icon: MessageCircle,
    title: "Comunicação Facilitada",
    description: "Linguagem clara e objetiva",
  },
  {
    icon: Brain,
    title: "Design Inclusivo",
    description: "Interface intuitiva para todos",
  },
];

const testimonials = [
  {
    name: "Profa. Ana Ribeiro",
    role: "Coordenadora de Inclusão",
    quote:
      "O PEI Collab trouxe harmonia entre escola e famílias. Agora todos acompanham o desenvolvimento com clareza e empatia.",
    image: "/fotos/comunidade_escolar.jpg",
  },
  {
    name: "Carlos Silva",
    role: "Professor de Atendimento Educacional Especializado",
    quote:
      "Simplificou todo o processo do PEI e ainda nos aproximou das famílias. Uma ferramenta essencial.",
    image: "/fotos/situacoes_escolares_mosaico_1.jpg",
  },
  {
    name: "Mariana Souza",
    role: "Mãe de aluno",
    quote:
      "Pela primeira vez, sinto que faço parte da jornada de aprendizado do meu filho. O PEI Collab é maravilhoso.",
    image: "/fotos/situacoes_escolares_mosaico_2.jpg",
  },
];

// NOVA SEÇÃO: DADOS PARA O MINI-BLOG
const blogPosts = [
  {
    title: "Diagnóstico de Inclusão em São Gonçalo dos Campos",
    description: "Painéis de dados identificaram gargalos e avanços na rede, guiando decisões pedagógicas com clareza e evidências.",
    image: "/fotos/situacoes_escolares_mosaico_3.jpg",
    category: "Benefício Real",
  },
  {
    title: "PEI com IA: experiência da Profa. Rosângela",
    description: "A criação do PEI ficou mais rápida e humana com sugestões inteligentes, mantendo a autoria pedagógica da professora.",
    image: "/fotos/alunos_no_computador.jpg",
    category: "Sala de Aula",
  },
  {
    title: "Modelo de Qualidade para Coordenadores e Gestores",
    description: "Um referencial consistente que atende às demandas da gestão municipal diante dos desafios do cotidiano.",
    image: "/fotos/situacoes_escolares_mosaico_4.jpg",
    category: "Gestão",
  },
];


const DotConnection = ({ delay = 0 }) => (
  <motion.svg
    className="absolute inset-0 w-full h-full pointer-events-none"
    initial="hidden"
    animate="visible"
  >
    <motion.circle
      cx="10%"
      cy="20%"
      r="8"
      className="fill-orange-400"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.6, scale: 1 }}
      transition={{ delay: delay, duration: 0.6 }}
    />
    <motion.line
      x1="10%"
      y1="20%"
      x2="30%"
      y2="40%"
      stroke="url(#gradient1)"
      strokeWidth="2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: delay + 0.3, duration: 0.8 }}
    />
    <motion.circle
      cx="30%"
      cy="40%"
      r="10"
      className="fill-purple-500"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.6, scale: 1 }}
      transition={{ delay: delay + 0.6, duration: 0.6 }}
    />
    <motion.line
      x1="30%"
      y1="40%"
      x2="50%"
      y2="30%"
      stroke="url(#gradient2)"
      strokeWidth="2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: delay + 0.9, duration: 0.8 }}
    />
    <motion.circle
      cx="50%"
      cy="30%"
      r="12"
      className="fill-blue-500"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.8, scale: 1 }}
      transition={{ delay: delay + 1.2, duration: 0.6 }}
    />
    <defs>
      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fb923c" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
      </linearGradient>
    </defs>
  </motion.svg>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 text-gray-800 overflow-hidden relative">
      {/* Subtle floating elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-24 h-24 bg-gradient-to-br from-orange-300/30 to-amber-400/30 rounded-full blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-br from-purple-300/30 to-pink-400/30 rounded-full blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 left-1/4 w-36 h-36 bg-gradient-to-br from-blue-300/30 to-cyan-400/30 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md border-b border-indigo-100 z-50 shadow-sm">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <img
              src="/logo.png"
              alt="PEI Collab"
              className="h-10 w-auto"
            />
            <span className="text-xl font-bold text-gray-800">
              PEI Collab
            </span>
          </motion.div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors relative group">
              Funcionalidades
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all" />
            </a>
            <a href="#accessibility" className="hover:text-purple-600 transition-colors relative group">
              Acessibilidade
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all" />
            </a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors relative group">
              Depoimentos
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all" />
            </a>
          </nav>
          <div className="flex gap-3">
            <Button
              onClick={() => window.open(LANDING_URL, '_blank')}
              variant="outline"
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold hidden md:flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              Sobre o Projeto
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Acesso ao PEI Collab
            </Button>

          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 relative">
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <DotConnection delay={0.5} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-6 relative z-10"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                  Cada Aluno Merece um{" "}
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Caminho Único
                  </span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-gray-600 mb-8 leading-relaxed"
              >
                O PEI Collab conecta educadores, famílias e profissionais em uma jornada colaborativa para criar Planos Educacionais Individualizados que transformam vidas e celebram a diversidade.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 mb-8"
              >

                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl font-semibold transition-all shadow-md"
                >
                  Fazer Login
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex flex-wrap gap-4 items-center text-sm text-gray-600"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>100% Inclusão e Acessibilidade</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Seguro e Privado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span>Seguindo a LGPD</span>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/fotos/alunos_no_computador_2.jpg"
                  alt="Professora trabalhando com aluno em ambiente inclusivo"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent" />
              </div>

              {/* Floating card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 max-w-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">INCLUSÃO E ACESSIBILIDADE</p>
                    <p className="text-sm text-gray-600">Transformando vidas com tecnologia</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Ferramentas que Fazem a Diferença
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Recursos pensados para inclusão, acessibilidade e colaboração real
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group"
                >
                  <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all border border-gray-100 h-full">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {f.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{f.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Accessibility Section */}
      <section id="accessibility" className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <DotConnection delay={0} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/fotos/comunidade_escolar.jpg"
                  alt="Ambiente educacional inclusivo e acessível"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Acessibilidade em Primeiro Lugar
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Desenvolvido com foco em inclusão digital, garantindo que todos possam usar a plataforma de forma eficiente e confortável.
              </p>

              <div className="space-y-4">
                {accessibilityFeatures.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              O Que Dizem Sobre o PEI Collab
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Histórias reais de quem transforma a educação todos os dias
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-16 h-16 rounded-full object-cover shadow-md"
                  />
                  <div>
                    <p className="font-bold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-600">{t.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sponosors */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Parceiros
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Quem acreditou no nosso sonho desde o início
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 mb-6">
              <img
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhvs4TP3lsFhImiXC0m5llDiX6HrnJzwVATytAY9cpiWtViMiaqaLPU-DosMLS2K3cWlyZ8lqccpGjxkmuz9smV6g2SnEuX0KefQGo-POvgftXKjuoOaDC9LVtjwD6BQ6csgo-Vod2VGDZw/s1600/LogoNova.png"
                alt="Logo Escola Municipal de AEE Semente da Vida"
                className="w-16 h-16 rounded-full object-cover shadow-md"
              />
              <div>
                <p className="font-bold text-gray-900">EMAEESV</p>
                <p className="text-sm text-gray-600">Escola</p>
              </div>
            </div>
                        <div className="flex items-center gap-4 mb-6">
              <img
                src="https://www.santabarbara.ba.gov.br/images/entidade/teste.jpg"
                alt="Logo Prefeitura Municipal de Santa Bárbara"
                className="w-16 h-16 rounded-full object-cover shadow-md"
              />
              <div>
                <p className="font-bold text-gray-900">Santa Bárbara</p>
                <p className="text-sm text-gray-600">Prefeitura</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <img
                src="https://doem.org.br/uploads/a51a753ea5d60a606bc2f74321fe01e3.png"
                alt="Logo Prefeitura Municipal de São Gonçalo dos Campos"
                className="w-16 h-16 rounded-full object-cover shadow-md"
              />
              <div>
                <p className="font-bold text-gray-900">São Gonçalo dos Campos</p>
                <p className="text-sm text-gray-600">Prefeitura</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed italic">
              "Juntos na educação inclusiva"
            </p>
          </div>
        </div>
      </section>

      {/* NOVA SEÇÃO DE MINI-BLOG */}
      <section id="news" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              PEI Collab em Ação
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Notícias, artigos e casos de uso que mostram como estamos transformando a educação inclusiva.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {blogPosts.map((post, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group"
              >
                <div className="relative">
                  <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
                  <span className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">{post.category}</span>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-7 h-14">{post.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 h-20">{post.description}</p>
                  
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-700 via-purple-700 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img
            src="/fotos/situacoes_escolares_mosaico_1.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Compromisso com a Educação Inclusiva
            </h2>
            <p className="text-lg md:text-xl text-white/95 max-w-3xl mx-auto leading-relaxed">
              O PEI Collab é uma iniciativa que apoia redes municipais, escolas e profissionais
              na construção de planos educacionais com qualidade, participação da família e
              monitoramento contínuo do desenvolvimento dos estudantes.
            </p>
            <p className="mt-6 text-white/90 text-sm">
              Inclusão, acessibilidade e colaboração como pilares do nosso trabalho.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.png" alt="PEI Collab" className="h-10 w-auto" />
                <span className="text-xl font-bold text-white">
                  PEI Collab
                </span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Transformando a educação inclusiva através da colaboração e tecnologia.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Produto</h4>
              <ul className="space-y-3">
                <li 
                  onClick={() => window.open(LANDING_URL, '_blank')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Sobre o Projeto
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">Funcionalidades</li>
                <li className="hover:text-white transition-colors cursor-pointer">Preços</li>
                <li className="hover:text-white transition-colors cursor-pointer">Segurança</li>
                <li className="hover:text-white transition-colors cursor-pointer">Integrações</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Suporte</h4>
              <ul className="space-y-3">
                <li className="hover:text-white transition-colors cursor-pointer">Central de Ajuda</li>
                <li className="hover:text-white transition-colors cursor-pointer">Documentação</li>
                <li className="hover:text-white transition-colors cursor-pointer">Contato</li>
                <li className="hover:text-white transition-colors cursor-pointer">Status</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li className="hover:text-white transition-colors cursor-pointer">Privacidade</li>
                <li className="hover:text-white transition-colors cursor-pointer">Termos de Uso</li>
                <li className="hover:text-white transition-colors cursor-pointer">LGPD</li>
                <li className="hover:text-white transition-colors cursor-pointer">Cookies</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>
              © {new Date().getFullYear()} PEI Collab. Todos os direitos reservados.
              <span className="mx-2">•</span>
              Feito com 💜 para a educação inclusiva
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}