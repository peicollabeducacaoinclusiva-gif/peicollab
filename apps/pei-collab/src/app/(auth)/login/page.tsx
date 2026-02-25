'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const LOGO = 'https://i.ibb.co/xSW48Tjf/pei-collab-logo.png';
const BG_IMG =
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=80&auto=format&fit=crop';

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
    --bg:       #f7f6ff;
    --white:    #ffffff;
    --error:    #b91c1c;
    --error-bg: #fef2f2;
    --focus:    #005fcc;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--ink); -webkit-font-smoothing: antialiased; }
  .h { font-family: 'Nunito', sans-serif; }
  a { color: inherit; }

  *:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; border-radius: 6px; }

  .skip { position: absolute; top: -100px; left: 16px; background: var(--focus); color: #fff; padding: 10px 18px; border-radius: 0 0 8px 8px; font-weight: 700; font-size: 14px; z-index: 999; text-decoration: none; transition: top .2s; }
  .skip:focus { top: 0; }

  @media (prefers-reduced-motion: no-preference) {
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
    @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

    .a1{animation:fadeUp .55s .00s ease both}
    .a2{animation:fadeUp .55s .08s ease both}
    .a3{animation:fadeUp .55s .16s ease both}
    .a4{animation:fadeUp .55s .24s ease both}
    .a5{animation:fadeUp .55s .32s ease both}
    .a6{animation:fadeUp .55s .40s ease both}
  }

  .field {
    width: 100%; height: 48px; padding: 0 44px 0 14px;
    border: 1.5px solid var(--line); border-radius: 10px;
    font-size: 15px; font-family: 'Inter', sans-serif;
    color: var(--ink); background: var(--white);
    transition: border-color .2s, box-shadow .2s; outline: none;
  }
  .field:focus { border-color: var(--purple); box-shadow: 0 0 0 3px rgba(91,77,214,.15); }
  .field:disabled { background: #f9f9fd; color: var(--muted); cursor: not-allowed; }
  .field.error { border-color: var(--error); }
  .field::placeholder { color: #a0aec0; }

  .field-wrap { position: relative; }
  .field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; pointer-events: none; }
  .field-suffix { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--muted); font-size: 16px; padding: 4px; }
  .field-padded { padding-left: 42px; }

  .submit-btn {
    width: 100%; height: 50px;
    background: linear-gradient(135deg, var(--purple), var(--purple-d));
    color: #fff; border: none; border-radius: 50px;
    font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 16px;
    cursor: pointer; transition: all .22s;
    box-shadow: 0 4px 18px rgba(91,77,214,.35);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(91,77,214,.45); }
  .submit-btn:disabled { opacity: .65; cursor: not-allowed; transform: none; }

  .left-panel {
    position: relative;
    background: linear-gradient(160deg, var(--purple-d) 0%, var(--purple) 40%, var(--teal) 100%);
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 48px 48px 40px; overflow: hidden; color: #fff;
  }
  .left-panel::before {
    content: ''; position: absolute; inset: 0;
    background: url('${BG_IMG}') center/cover no-repeat;
    opacity: .15;
  }

  .doc-card {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,.12); backdrop-filter: blur(8px);
    border-radius: 12px; padding: 12px 16px;
    border: 1px solid rgba(255,255,255,.18);
  }

  .chip-float {
    position: absolute; border-radius: 50px;
    padding: 9px 16px; font-size: 12px; font-weight: 800;
    font-family: 'Nunito', sans-serif; white-space: nowrap; z-index: 2;
  }

  @media (max-width: 768px) {
    .left-panel { display: none !important; }
    .login-grid { grid-template-columns: 1fr !important; }
    .right-panel { min-height: 100vh; border-radius: 0 !important; }
  }
`;

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});
type LoginForm = z.infer<typeof loginSchema>;

const docs = [
  { icon: '📋', label: 'Estudo de Caso', delay: '0s' },
  { icon: '🎯', label: 'PEI', delay: '.3s' },
  { icon: '⭐', label: 'Plano de AEE', delay: '.6s' },
];

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setServerError('Credenciais inválidas. Verifique e tente novamente.');
      return;
    }
    router.push(searchParams.get('redirectTo') ?? '/dashboard');
  };

  return (
    <>
      <style>{CSS}</style>
      <a href="#login-form" className="skip">
        Pular para o formulário
      </a>

      <div
        className="login-grid"
        style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 480px' }}
      >
        {/* ── LEFT PANEL ── */}
        <div className="left-panel" aria-hidden="true">
          <div
            style={{
              position: 'absolute',
              width: 340,
              height: 340,
              borderRadius: '50%',
              border: '70px solid rgba(255,255,255,.07)',
              right: -80,
              top: -90,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              border: '40px solid rgba(255,255,255,.05)',
              left: -40,
              bottom: 120,
              pointerEvents: 'none',
            }}
          />

          {/* Logo */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <img
              src={LOGO}
              alt=""
              width={140}
              height={48}
              style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.92 }}
            />
          </div>

          {/* Center */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '40px 0',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: 'rgba(255,255,255,.18)',
                borderRadius: 50,
                padding: '7px 14px',
                border: '1.5px solid rgba(255,255,255,.3)',
                marginBottom: 28,
                backdropFilter: 'blur(8px)',
                width: 'fit-content',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#4ade80',
                  display: 'block',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'Nunito, sans-serif',
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                }}
              >
                Plataforma ativa
              </span>
            </div>

            <h2
              className="h"
              style={{
                fontSize: 'clamp(24px, 2.8vw, 36px)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.18,
                marginBottom: 16,
                letterSpacing: '-.02em',
              }}
            >
              Do Estudo de Caso ao AEE,
              <br />
              em um só lugar.
            </h2>
            <p
              style={{
                fontSize: 15,
                color: 'rgba(255,255,255,.8)',
                lineHeight: 1.75,
                maxWidth: 360,
                marginBottom: 32,
              }}
            >
              Conecte professores, coordenação, especialistas e família em um fluxo único com
              rastreabilidade e qualidade.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {docs.map((d) => (
                <div
                  key={d.label}
                  className="doc-card"
                  style={{
                    animation: `float ${3.5 + docs.indexOf(d) * 0.5}s ease-in-out ${d.delay} infinite`,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{d.icon}</span>
                  <span className="h" style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>
                    {d.label}
                  </span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 11,
                      color: 'rgba(255,255,255,.7)',
                      fontWeight: 600,
                    }}
                  >
                    ADAPT ✓
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              borderTop: '1px solid rgba(255,255,255,.2)',
              paddingTop: 20,
            }}
          >
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>
              Um produto do{' '}
              <strong style={{ color: 'rgba(255,255,255,.9)' }}>Grupo MAR & Inclusão LTDA</strong>
            </p>
          </div>

          {/* Floating chips */}
          <div
            className="chip-float"
            style={{
              top: '22%',
              right: -20,
              background: '#fff',
              color: 'var(--purple)',
              boxShadow: '0 6px 20px rgba(0,0,0,.15)',
              animation: 'float 3.5s ease-in-out infinite',
            }}
          >
            🎯 Meta aprovada!
          </div>
          <div
            className="chip-float"
            style={{
              bottom: '28%',
              right: -14,
              background: 'rgba(255,255,255,.9)',
              color: 'var(--teal)',
              boxShadow: '0 4px 14px rgba(0,0,0,.1)',
              animation: 'float 4s ease-in-out .8s infinite',
            }}
          >
            ✓ LGPD
          </div>
        </div>

        {/* ── RIGHT PANEL — form ── */}
        <main
          id="login-form"
          className="right-panel"
          style={{
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 40px',
            position: 'relative',
          }}
        >
          <div style={{ width: '100%', maxWidth: 360 }}>
            {/* Header */}
            <div className="a1" style={{ marginBottom: 36, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <img
                  src={LOGO}
                  alt="PEICollab"
                  width={130}
                  height={44}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <h1
                className="h"
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: 'var(--ink)',
                  marginBottom: 6,
                  letterSpacing: '-.01em',
                }}
              >
                Bem-vindo de volta
              </h1>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                Entre com suas credenciais para acessar o sistema
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Formulário de login">
              {/* Email */}
              <div className="a2" style={{ marginBottom: 18 }}>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginBottom: 6,
                  }}
                >
                  E-mail institucional
                </label>
                <div className="field-wrap">
                  <span className="field-icon" aria-hidden="true">
                    ✉️
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`field field-padded${errors.email ? ' error' : ''}`}
                    placeholder="seu@email.com"
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p
                    id="email-error"
                    role="alert"
                    style={{
                      fontSize: 12,
                      color: 'var(--error)',
                      marginTop: 5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span aria-hidden="true">⚠</span> {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="a3" style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <label
                    htmlFor="password"
                    style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}
                  >
                    Senha
                  </label>
                  <Link
                    href="/forgot-password"
                    style={{
                      fontSize: 12,
                      color: 'var(--purple)',
                      fontWeight: 600,
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="field-wrap">
                  <span className="field-icon" aria-hidden="true">
                    🔒
                  </span>
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`field field-padded${errors.password ? ' error' : ''}`}
                    placeholder="••••••••"
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'pw-error' : undefined}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="field-suffix"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="pw-error"
                    role="alert"
                    style={{
                      fontSize: 12,
                      color: 'var(--error)',
                      marginTop: 5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span aria-hidden="true">⚠</span> {errors.password.message}
                  </p>
                )}
              </div>

              {/* Server error */}
              {serverError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="a1"
                  style={{
                    margin: '14px 0',
                    background: 'var(--error-bg)',
                    border: '1.5px solid #fca5a5',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: 16, flexShrink: 0 }}>
                    ⚠️
                  </span>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--error)',
                      fontWeight: 500,
                      lineHeight: 1.5,
                    }}
                  >
                    {serverError}
                  </p>
                </div>
              )}

              {/* Submit */}
              <div className="a4" style={{ marginTop: 24 }}>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          border: '2.5px solid rgba(255,255,255,.4)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          display: 'inline-block',
                          animation: 'spin .7s linear infinite',
                        }}
                        aria-hidden="true"
                      />
                      Entrando...
                    </>
                  ) : (
                    'Entrar →'
                  )}
                </button>
              </div>

              {/* Register link */}
              <p
                className="a5"
                style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}
              >
                Não tem conta?{' '}
                <Link
                  href="/register"
                  style={{
                    color: 'var(--purple)',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  Cadastrar
                </Link>
              </p>
            </form>

            {/* Back link */}
            <div className="a5" style={{ marginTop: 20, textAlign: 'center' }}>
              <Link
                href="/"
                style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                ← Voltar para a página inicial
              </Link>
            </div>

            {/* Trust badges */}
            <div
              className="a6"
              style={{
                marginTop: 32,
                display: 'flex',
                justifyContent: 'center',
                gap: 18,
                flexWrap: 'wrap',
              }}
            >
              {[
                { icon: '🔒', label: 'LGPD Compliant' },
                { icon: '🛡️', label: 'Dados protegidos' },
                { icon: '✅', label: 'Acesso seguro' },
              ].map((b) => (
                <div
                  key={b.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    color: 'var(--muted)',
                    fontWeight: 600,
                  }}
                >
                  <span aria-hidden="true">{b.icon}</span>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <p
            style={{
              position: 'absolute',
              bottom: 20,
              fontSize: 11,
              color: '#a0aec0',
              textAlign: 'center',
            }}
          >
            © 2025 Grupo MAR & Inclusão LTDA · PEICollab 2.0
          </p>
        </main>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Nunito, sans-serif',
            fontSize: 16,
            color: '#5b4dd6',
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              border: '3px solid #ede9ff',
              borderTopColor: '#5b4dd6',
              borderRadius: '50%',
              display: 'inline-block',
              marginRight: 10,
              animation: 'spin .7s linear infinite',
            }}
          />
          Carregando...
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
