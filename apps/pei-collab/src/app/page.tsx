'use client';

import Link from 'next/link';

const LOGO = 'https://i.ibb.co/xSW48Tjf/pei-collab-logo.png';
const IMG_BG =
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80&auto=format&fit=crop';
const IMG_1 =
  'https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=80&auto=format&fit=crop';
const IMG_2 =
  'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&q=80&auto=format&fit=crop';
const IMG_3 =
  'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&q=80&auto=format&fit=crop';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');

  :root {
    --purple:   #5b4dd6;
    --purple-d: #4739b8;
    --purple-l: #ede9ff;
    --purple-xl:#f7f5ff;
    --teal:     #007f7d;
    --teal-l:   #e0fafa;
    --coral:    #c05e38;
    --coral-l:  #fef0eb;
    --ink:      #1a1a2a;
    --muted:    #4a5568;
    --line:     #ddd6fe;
    --bg:       #fafafa;
    --white:    #ffffff;
    --focus:    #005fcc;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; font-size: 16px; }
  body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--ink); -webkit-font-smoothing: antialiased; }
  img  { display: block; max-width: 100%; }
  a    { color: inherit; }

  .h { font-family: 'Nunito', sans-serif; }

  *:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; border-radius: 6px; }

  .skip { position: absolute; top: -100px; left: 16px; background: var(--focus); color: #fff; padding: 10px 18px; border-radius: 0 0 8px 8px; font-weight: 700; font-size: 14px; z-index: 999; text-decoration: none; transition: top .2s; }
  .skip:focus { top: 0; }

  @media (prefers-reduced-motion: no-preference) {
    @keyframes fadeUp  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }
    @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
    @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

    .a1{animation:fadeUp .6s .00s ease both}
    .a2{animation:fadeUp .6s .10s ease both}
    .a3{animation:fadeUp .6s .20s ease both}
    .a4{animation:fadeUp .6s .30s ease both}
    .a5{animation:fadeUp .6s .40s ease both}
    .float{animation:float 4s ease-in-out infinite}
    .ticker-track{animation:marquee 28s linear infinite}
  }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-family: 'Nunito', sans-serif; font-weight: 800;
    border: 2px solid transparent; cursor: pointer;
    border-radius: 50px; transition: all .22s;
    white-space: nowrap; font-size: 15px;
    min-height: 50px; padding: 12px 32px;
    text-decoration: none;
  }
  .btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }

  .btn-primary {
    background: linear-gradient(135deg, var(--purple), var(--purple-d));
    color: #fff; box-shadow: 0 4px 20px rgba(91,77,214,.35);
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(91,77,214,.45); }

  .btn-ghost {
    background: transparent; color: var(--purple);
    border-color: var(--purple);
  }
  .btn-ghost:hover { background: var(--purple-xl); }

  .btn-white {
    background: #fff; color: var(--purple);
    box-shadow: 0 4px 18px rgba(0,0,0,.16);
  }
  .btn-white:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,.22); }

  /* ── Helpers ── */
  .wrap  { max-width: 1180px; margin: 0 auto; padding: 0 32px; }
  .sec   { padding: 88px 32px; }
  .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 50px; font-size: 12px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; }
  .sec-label { font-family: 'Nunito', sans-serif; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 14px; display: block; }
  .blob { position: absolute; border-radius: 50%; filter: blur(72px); opacity: .14; pointer-events: none; }
  .grad { background: linear-gradient(135deg, var(--purple), var(--teal)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .card { background: var(--white); border-radius: 20px; border: 1.5px solid var(--line); transition: all .25s; }
  .card:hover { transform: translateY(-3px); box-shadow: 0 18px 48px rgba(91,77,214,.1); border-color: rgba(91,77,214,.3); }

  .img-cover { width: 100%; object-fit: cover; border-radius: 16px; }
  .ticker-track { display: flex; width: max-content; gap: 0; }

  @media (max-width: 960px) {
    .two-col { grid-template-columns: 1fr !important; }
    .three-col { grid-template-columns: repeat(2,1fr) !important; }
    .hero-vis  { display: none !important; }
    .sec { padding: 64px 20px; }
    .wrap { padding: 0 20px; }
  }
  @media (max-width: 600px) {
    .three-col { grid-template-columns: 1fr !important; }
    .cta-inner { padding: 48px 28px !important; }
    h1 { font-size: 2.2rem !important; }
  }
`;

const features = [
  {
    icon: '📋',
    color: 'var(--purple)',
    bg: 'var(--purple-l)',
    title: 'Estudo de Caso',
    body: 'Contexto, barreiras, potencialidades e parecer multiprofissional registrados de forma colaborativa.',
  },
  {
    icon: '🎯',
    color: 'var(--teal)',
    bg: 'var(--teal-l)',
    title: 'PEI',
    body: 'Metas SMART, adaptações curriculares e fluxo de aprovação com assinatura digital da família.',
  },
  {
    icon: '⭐',
    color: 'var(--coral)',
    bg: 'var(--coral-l)',
    title: 'Plano de AEE',
    body: 'Objetivos funcionais, tecnologia assistiva e intervenções do Atendimento Educacional Especializado.',
  },
  {
    icon: '🔄',
    color: 'var(--purple)',
    bg: 'var(--purple-l)',
    title: 'Framework ADAPT',
    body: 'Ciclos de hipótese → proposta → teste → avaliação para decisões pedagógicas rastreáveis.',
  },
  {
    icon: '👥',
    color: 'var(--teal)',
    bg: 'var(--teal-l)',
    title: 'Dashboards por Perfil',
    body: 'Visões dedicadas para professor, coordenador, especialista do AEE e família.',
  },
  {
    icon: '🔒',
    color: 'var(--coral)',
    bg: 'var(--coral-l)',
    title: 'LGPD & Auditoria',
    body: 'Log de auditoria completo, controle de acesso granular e conformidade com a legislação.',
  },
];

const ticker = [
  '✦ Framework ADAPT',
  '✦ Educação Inclusiva',
  '✦ PEI Digital',
  '✦ Plano de AEE',
  '✦ LGPD Compliant',
  '✦ Exportação PDF',
  '✦ Colaboração em tempo real',
  '✦ Grupo MAR & Inclusão',
];

/* ── Hero dashboard illustration ── */
function HeroDashboard() {
  return (
    <div style={{ position: 'relative', height: 460 }} aria-hidden="true">
      <div
        className="float"
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: 22,
          boxShadow: '0 24px 70px rgba(91,77,214,.18)',
          border: '1.5px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
          <div
            style={{ flex: 1, height: 7, background: '#f1f1f5', borderRadius: 4, marginLeft: 8 }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--purple)',
                fontWeight: 800,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              Aluno ativo
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, fontFamily: 'Nunito, sans-serif' }}>
              Lucas Mendes · 4º Ano A
            </div>
          </div>
          <div
            style={{
              background: 'var(--purple-l)',
              color: 'var(--purple)',
              borderRadius: 20,
              padding: '4px 10px',
              fontSize: 10,
              fontWeight: 800,
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            TEA · Nível 1
          </div>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}
        >
          {[
            { l: 'Estudo de Caso', s: '✓ Concluído', c: 'var(--purple)', bg: 'var(--purple-l)' },
            { l: 'PEI', s: '⟳ Em revisão', c: 'var(--teal)', bg: 'var(--teal-l)' },
            { l: 'Plano AEE', s: '◌ Pendente', c: 'var(--coral)', bg: 'var(--coral-l)' },
          ].map((d) => (
            <div key={d.l} style={{ background: d.bg, borderRadius: 10, padding: '10px 8px' }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: d.c,
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                {d.l}
              </div>
              <div style={{ fontSize: 9, color: d.c, opacity: 0.8, marginTop: 2 }}>{d.s}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#f9f9fd', borderRadius: 12, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>
              Metas do PEI
            </span>
            <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 800 }}>68%</span>
          </div>
          <div style={{ height: 6, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
            <div
              style={{
                width: '68%',
                height: '100%',
                background: 'linear-gradient(90deg, var(--purple), var(--teal))',
                borderRadius: 10,
              }}
            />
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: -14,
          right: -22,
          background: 'var(--purple)',
          color: '#fff',
          borderRadius: 50,
          padding: '9px 15px',
          fontSize: 12,
          fontWeight: 800,
          boxShadow: '0 6px 22px rgba(91,77,214,.45)',
          animation: 'float 3.5s ease-in-out infinite',
          fontFamily: 'Nunito, sans-serif',
          zIndex: 3,
        }}
      >
        🎯 Meta aprovada!
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          left: -26,
          background: '#fff',
          border: '2px solid var(--teal)',
          color: 'var(--teal)',
          borderRadius: 50,
          padding: '9px 15px',
          fontSize: 12,
          fontWeight: 800,
          animation: 'float 4.5s ease-in-out .6s infinite',
          fontFamily: 'Nunito, sans-serif',
          zIndex: 3,
        }}
      >
        ✓ Família notificada
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: -16,
          background: 'var(--coral-l)',
          border: '2px solid var(--coral)',
          color: 'var(--coral)',
          borderRadius: 50,
          padding: '9px 15px',
          fontSize: 12,
          fontWeight: 800,
          animation: 'float 3.2s ease-in-out 1s infinite',
          fontFamily: 'Nunito, sans-serif',
          zIndex: 3,
        }}
      >
        📄 PDF exportado
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <style>{CSS}</style>
      <a href="#main-content" className="skip">
        Pular para o conteúdo principal
      </a>

      {/* ── ANNOUNCEMENT BANNER ── */}
      <div
        role="banner"
        aria-label="Novidade"
        style={{
          background: 'linear-gradient(90deg, var(--purple-d), var(--purple) 50%, var(--teal))',
          padding: '11px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <p
          style={{
            fontSize: 13,
            color: '#fff',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            margin: 0,
          }}
        >
          🚀 PEICollab 2.0 chegou — Framework ADAPT, exportação PDF e assinatura digital da família.
        </p>
        <Link
          href="/login"
          style={{
            fontSize: 12,
            color: '#fff',
            fontWeight: 800,
            background: 'rgba(255,255,255,.2)',
            borderRadius: 20,
            padding: '5px 14px',
            border: '1.5px solid rgba(255,255,255,.5)',
            fontFamily: 'Nunito, sans-serif',
            whiteSpace: 'nowrap',
            textDecoration: 'none',
          }}
        >
          Acessar agora →
        </Link>
      </div>

      {/* ── NAV ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(250,250,250,.95)',
          backdropFilter: 'blur(18px)',
          borderBottom: '2px solid var(--line)',
        }}
      >
        <nav
          aria-label="Navegação principal"
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '0 32px',
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            aria-label="PEICollab 2.0 — página inicial"
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          >
            <img
              src={LOGO}
              alt="PEICollab"
              width={130}
              height={44}
              style={{ objectFit: 'contain' }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--teal)',
                background: 'var(--teal-l)',
                padding: '2px 8px',
                borderRadius: 20,
              }}
            >
              2.0
            </span>
          </Link>
          <ul style={{ display: 'flex', alignItems: 'center', gap: 28, listStyle: 'none' }}>
            {[
              ['#como-funciona', 'Como funciona'],
              ['#recursos', 'Recursos'],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  style={{
                    fontSize: 14,
                    color: 'var(--muted)',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  {label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/register"
                style={{
                  fontSize: 14,
                  color: 'var(--muted)',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Cadastrar
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="btn btn-primary"
                style={{ minHeight: 40, padding: '9px 22px', fontSize: 14 }}
              >
                Entrar →
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1}>
        {/* ── HERO ── */}
        <section
          aria-labelledby="hero-heading"
          style={{ position: 'relative', overflow: 'hidden', padding: '80px 32px 96px' }}
        >
          <div
            className="blob"
            aria-hidden="true"
            style={{ width: 560, height: 560, background: 'var(--purple)', top: -240, left: -200 }}
          />
          <div
            className="blob"
            aria-hidden="true"
            style={{ width: 440, height: 440, background: 'var(--teal)', top: 60, right: -140 }}
          />
          <div
            className="blob"
            aria-hidden="true"
            style={{
              width: 300,
              height: 300,
              background: 'var(--coral)',
              bottom: -80,
              left: '40%',
            }}
          />

          <div
            className="two-col"
            style={{
              maxWidth: 1180,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '1fr 460px',
              gap: 60,
              alignItems: 'center',
            }}
          >
            <div>
              <div
                className="a1 badge"
                style={{
                  background: 'var(--purple-l)',
                  color: 'var(--purple)',
                  marginBottom: 26,
                  display: 'inline-flex',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--purple)',
                    display: 'block',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
                Plataforma para Educação Inclusiva
              </div>

              <h1
                id="hero-heading"
                className="h a2"
                style={{
                  fontSize: 'clamp(36px, 4.5vw, 58px)',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: '-.025em',
                  marginBottom: 22,
                }}
              >
                Do Estudo de Caso
                <br />
                <span className="grad">ao AEE,</span> em um só lugar.
              </h1>

              <p
                className="a3"
                style={{
                  fontSize: 17,
                  color: 'var(--muted)',
                  lineHeight: 1.8,
                  maxWidth: 510,
                  marginBottom: 38,
                }}
              >
                O PEICollab conecta professores, coordenação, especialistas e família em um fluxo
                único — estruturado pelo framework ADAPT — para planos educacionais com
                rastreabilidade e qualidade real.
              </p>

              <div
                className="a4"
                style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 46 }}
              >
                <Link href="/login" className="btn btn-primary">
                  Entrar →
                </Link>
                <Link href="/register" className="btn btn-ghost">
                  Criar conta
                </Link>
              </div>

              <dl
                className="a5"
                style={{
                  display: 'flex',
                  gap: 32,
                  paddingTop: 28,
                  borderTop: '2px solid var(--line)',
                  flexWrap: 'wrap',
                }}
              >
                {[
                  { num: '3', label: 'Documentos integrados', c: 'var(--purple)' },
                  { num: '100%', label: 'Rastreabilidade', c: 'var(--teal)' },
                  { num: 'LGPD', label: 'Compliant', c: 'var(--coral)' },
                ].map((s) => (
                  <div key={s.label}>
                    <dt
                      className="h"
                      style={{ fontSize: 34, fontWeight: 900, color: s.c, lineHeight: 1 }}
                    >
                      {s.num}
                    </dt>
                    <dd
                      style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginTop: 3 }}
                    >
                      {s.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="hero-vis" aria-hidden="true">
              <HeroDashboard />
            </div>
          </div>
        </section>

        {/* ── TICKER ── */}
        <div
          aria-hidden="true"
          style={{
            background: 'var(--ink)',
            overflow: 'hidden',
            padding: '13px 0',
            borderTop: '1px solid rgba(255,255,255,.06)',
          }}
        >
          <div className="ticker-track">
            {[...ticker, ...ticker].map((t, i) => (
              <span
                key={i}
                style={{
                  color: 'rgba(255,255,255,.55)',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '.07em',
                  padding: '0 28px',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── BANNER — GRUPO MAR ── */}
        <section
          aria-labelledby="banner-heading"
          style={{
            background:
              'linear-gradient(135deg, var(--purple-d) 0%, var(--purple) 45%, var(--teal) 100%)',
            padding: '72px 32px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: 420,
              height: 420,
              borderRadius: '50%',
              border: '80px solid rgba(255,255,255,.06)',
              right: -80,
              top: -120,
              pointerEvents: 'none',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: 260,
              height: 260,
              borderRadius: '50%',
              border: '50px solid rgba(255,255,255,.04)',
              left: -50,
              bottom: -80,
              pointerEvents: 'none',
            }}
          />

          <div
            className="two-col"
            style={{
              maxWidth: 1180,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 56,
              alignItems: 'center',
            }}
          >
            <div>
              <div
                className="badge"
                style={{
                  background: 'rgba(255,255,255,.18)',
                  color: '#fff',
                  marginBottom: 22,
                  display: 'inline-flex',
                }}
              >
                🏆 Produto do Grupo MAR & Inclusão
              </div>
              <h2
                id="banner-heading"
                className="h"
                style={{
                  fontSize: 'clamp(24px, 3vw, 40px)',
                  fontWeight: 900,
                  color: '#fff',
                  lineHeight: 1.18,
                  marginBottom: 18,
                  letterSpacing: '-.02em',
                }}
              >
                Organização e rastreabilidade para cada aluno da educação inclusiva.
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,.85)',
                  lineHeight: 1.78,
                  marginBottom: 32,
                }}
              >
                Desenvolvido com especialistas da educação especial, em conformidade com os Decretos
                nº 12.686/2025 e nº 12.773/2025.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/login" className="btn btn-white">
                  Entrar no sistema →
                </Link>
                <Link
                  href="/register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'rgba(255,255,255,.85)',
                    fontSize: 15,
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  Criar conta gratuita
                </Link>
              </div>
            </div>
            <div>
              <img
                src={IMG_BG}
                alt="Professora sorrindo ao lado de alunos em sala de aula inclusiva e diversa"
                className="img-cover"
                width={560}
                height={360}
                style={{
                  borderRadius: 20,
                  boxShadow: '0 20px 60px rgba(0,0,0,.25)',
                  border: '3px solid rgba(255,255,255,.25)',
                }}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section
          id="como-funciona"
          aria-labelledby="flow-heading"
          style={{
            background: 'linear-gradient(180deg, #f4f2ff 0%, #fafafa 100%)',
            padding: '88px 32px',
          }}
        >
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span className="sec-label" style={{ color: 'var(--purple)' }}>
                Como funciona
              </span>
              <h2
                id="flow-heading"
                className="h"
                style={{
                  fontSize: 'clamp(26px, 3vw, 42px)',
                  fontWeight: 900,
                  letterSpacing: '-.02em',
                  marginBottom: 12,
                }}
              >
                Três documentos. <span className="grad">Um fluxo colaborativo.</span>
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: 'var(--muted)',
                  maxWidth: 520,
                  margin: '0 auto',
                  lineHeight: 1.75,
                }}
              >
                Cada documento conecta-se ao próximo, formando um histórico completo e auditável do
                aluno.
              </p>
            </div>

            <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 72 }}>
              {[
                {
                  num: '01',
                  color: 'var(--purple)',
                  bg: 'var(--purple-l)',
                  icon: '📋',
                  label: 'Estudo de Caso',
                  desc: 'Histórico completo do aluno: contexto, barreiras, potencialidades e parecer multiprofissional colaborativo registrados de forma estruturada.',
                  checks: [
                    'Anamnese e histórico escolar',
                    'Mapeamento de barreiras',
                    'Potencialidades e interesses',
                    'Parecer pedagógico final',
                  ],
                  img: IMG_1,
                  alt: 'Professora sentada ao lado de criança, apoiando seu aprendizado de forma individualizada',
                },
                {
                  num: '02',
                  color: 'var(--teal)',
                  bg: 'var(--teal-l)',
                  icon: '🎯',
                  label: 'PEI',
                  desc: 'Metas SMART por área de desenvolvimento, adaptações curriculares e fluxo completo de aprovação com assinatura digital da família.',
                  checks: [
                    'Metas por área de desenvolvimento',
                    'Adaptações metodológicas',
                    'Estratégias avaliativas',
                    'Assinatura digital da família',
                  ],
                  img: IMG_2,
                  alt: 'Equipe de educadores colaborando em torno de mesa com documentos e tablets',
                },
                {
                  num: '03',
                  color: 'var(--coral)',
                  bg: 'var(--coral-l)',
                  icon: '⭐',
                  label: 'Plano de AEE',
                  desc: 'Objetivos funcionais, recursos de tecnologia assistiva, frequência de sessões e intervenções especializadas para o atendimento do aluno.',
                  checks: [
                    'Objetivos funcionais e operacionais',
                    'Recursos de tecnologia assistiva',
                    'Registro de sessões e frequência',
                    'Parceiros e intervenções externas',
                  ],
                  img: IMG_3,
                  alt: 'Educadora especialista em atendimento individualizado com aluno em sala de recursos',
                },
              ].map((s, idx) => (
                <li key={s.num}>
                  <article
                    className="two-col"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2,1fr)',
                      gap: 52,
                      alignItems: 'center',
                    }}
                    aria-labelledby={`step-${s.num}`}
                  >
                    <div style={{ order: idx % 2 === 0 ? 0 : 1 }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}
                      >
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 14,
                            background: s.bg,
                            fontSize: 26,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          aria-hidden="true"
                        >
                          {s.icon}
                        </div>
                        <div>
                          <span
                            className="h"
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: '.1em',
                              textTransform: 'uppercase',
                              color: s.color,
                            }}
                          >
                            Passo {s.num}
                          </span>
                          <h3
                            id={`step-${s.num}`}
                            className="h"
                            style={{
                              fontSize: 28,
                              fontWeight: 900,
                              color: 'var(--ink)',
                              letterSpacing: '-.01em',
                            }}
                          >
                            {s.label}
                          </h3>
                        </div>
                      </div>
                      <p
                        style={{
                          fontSize: 15,
                          color: 'var(--muted)',
                          lineHeight: 1.78,
                          marginBottom: 22,
                        }}
                      >
                        {s.desc}
                      </p>
                      <ul
                        style={{
                          listStyle: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        {s.checks.map((c) => (
                          <li
                            key={c}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                              fontSize: 14,
                            }}
                          >
                            <span
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: s.bg,
                                color: s.color,
                                fontSize: 11,
                                fontWeight: 800,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: 1,
                              }}
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                            <span style={{ color: 'var(--ink)', lineHeight: 1.55 }}>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ order: idx % 2 === 0 ? 1 : 0 }}>
                      <img
                        src={s.img}
                        alt={s.alt}
                        className="img-cover"
                        width={560}
                        height={340}
                        style={{
                          boxShadow: '0 16px 48px rgba(91,77,214,.1)',
                          border: `3px solid ${s.bg}`,
                        }}
                        loading="lazy"
                      />
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="recursos" aria-labelledby="feat-heading" style={{ padding: '88px 32px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <span className="sec-label" style={{ color: 'var(--teal)' }}>
                Recursos
              </span>
              <h2
                id="feat-heading"
                className="h"
                style={{
                  fontSize: 'clamp(26px, 3vw, 42px)',
                  fontWeight: 900,
                  letterSpacing: '-.02em',
                  marginBottom: 12,
                }}
              >
                Tudo para <span className="grad">incluir de verdade.</span>
              </h2>
            </div>
            <ul
              className="three-col"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 18,
                listStyle: 'none',
              }}
            >
              {features.map((f) => (
                <li key={f.title}>
                  <article className="card" style={{ padding: '26px 22px', height: '100%' }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: f.bg,
                        fontSize: 21,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 14,
                      }}
                      aria-hidden="true"
                    >
                      {f.icon}
                    </div>
                    <h3 className="h" style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>
                      {f.title}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.68 }}>
                      {f.body}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── CTA ── */}
        <section aria-labelledby="cta-heading" style={{ padding: '0 32px 88px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div
              className="cta-inner"
              style={{
                background:
                  'linear-gradient(135deg, var(--purple) 0%, #4537c0 45%, var(--teal) 100%)',
                borderRadius: 28,
                padding: '72px 64px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 52,
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  width: 380,
                  height: 380,
                  borderRadius: '50%',
                  border: '76px solid rgba(255,255,255,.06)',
                  right: -80,
                  top: -110,
                  pointerEvents: 'none',
                }}
              />
              <div>
                <div
                  className="badge"
                  style={{
                    background: 'rgba(255,255,255,.18)',
                    color: '#fff',
                    marginBottom: 18,
                    display: 'inline-flex',
                  }}
                >
                  🏆 Grupo MAR & Inclusão LTDA
                </div>
                <h2
                  id="cta-heading"
                  className="h"
                  style={{
                    fontSize: 'clamp(22px, 2.8vw, 38px)',
                    fontWeight: 900,
                    color: '#fff',
                    lineHeight: 1.2,
                    marginBottom: 14,
                  }}
                >
                  Pronto para transformar o planejamento inclusivo da sua escola?
                </h2>
                <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 16, lineHeight: 1.72 }}>
                  Acesse agora e leve organização, colaboração e rastreabilidade para cada PEI.
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Link href="/login" className="btn btn-white">
                  Entrar no PEICollab →
                </Link>
                <Link
                  href="/register"
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,.75)',
                    fontWeight: 600,
                    fontFamily: 'Nunito, sans-serif',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  Criar conta gratuita
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer
        role="contentinfo"
        style={{
          borderTop: '2px solid var(--line)',
          padding: '40px 32px 28px',
          background: 'var(--bg)',
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div
            className="three-col"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr',
              gap: 40,
              marginBottom: 36,
            }}
          >
            <div>
              <Link
                href="/"
                aria-label="PEICollab — página inicial"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 14,
                  textDecoration: 'none',
                }}
              >
                <img
                  src={LOGO}
                  alt="PEICollab"
                  width={120}
                  height={40}
                  style={{ objectFit: 'contain' }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: 'var(--teal)',
                    background: 'var(--teal-l)',
                    padding: '2px 8px',
                    borderRadius: 20,
                  }}
                >
                  2.0
                </span>
              </Link>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 230 }}>
                Gestão de Planos Educacionais Individualizados para educação inclusiva.
              </p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, fontWeight: 500 }}>
                Um produto do{' '}
                <strong style={{ color: 'var(--ink)' }}>Grupo MAR & Inclusão LTDA</strong>
              </p>
            </div>
            <nav aria-label="Links do produto">
              <h3
                className="h"
                style={{
                  fontWeight: 800,
                  fontSize: 12,
                  marginBottom: 16,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                }}
              >
                Produto
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['#como-funciona', 'Como funciona'],
                  ['#recursos', 'Recursos'],
                  ['/login', 'Entrar'],
                  ['register', 'Cadastrar'],
                ].map(([href, label]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <h3
                className="h"
                style={{
                  fontWeight: 800,
                  fontSize: 12,
                  marginBottom: 16,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                }}
              >
                Contato
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['contato@peicollab.com.br', 'suporte@grupoMAR.com.br'].map((e) => (
                  <li key={e}>
                    <a href={`mailto:${e}`} style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {e}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            style={{
              borderTop: '1px solid var(--line)',
              paddingTop: 18,
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>
              © 2025 Grupo MAR & Inclusão LTDA · PEICollab 2.0 · Todos os direitos reservados.
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>
              <span aria-hidden="true">🔒</span> LGPD · Segurança e rastreabilidade
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
