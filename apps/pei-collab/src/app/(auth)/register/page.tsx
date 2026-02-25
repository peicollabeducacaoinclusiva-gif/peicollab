'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const LOGO = 'https://i.ibb.co/xSW48Tjf/pei-collab-logo.png';
const BG_IMG =
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80&auto=format&fit=crop';

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
    @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }

    .a1{animation:fadeUp .55s .00s ease both}
    .a2{animation:fadeUp .55s .07s ease both}
    .a3{animation:fadeUp .55s .14s ease both}
    .a4{animation:fadeUp .55s .21s ease both}
    .a5{animation:fadeUp .55s .28s ease both}
    .a6{animation:fadeUp .55s .35s ease both}
    .a7{animation:fadeUp .55s .42s ease both}
  }

  /* ── Field styles ── */
  .field {
    width: 100%; height: 48px; padding: 0 14px;
    border: 1.5px solid var(--line); border-radius: 10px;
    font-size: 15px; font-family: 'Inter', sans-serif;
    color: var(--ink); background: var(--white);
    transition: border-color .2s, box-shadow .2s; outline: none;
  }
  .field:focus { border-color: var(--purple); box-shadow: 0 0 0 3px rgba(91,77,214,.15); }
  .field:disabled { background: #f9f9fd; color: var(--muted); cursor: not-allowed; }
  .field.has-icon { padding-left: 42px; }
  .field.error { border-color: var(--error); }
  .field::placeholder { color: #a0aec0; }

  .field-wrap { position: relative; }
  .field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 15px; pointer-events: none; }
  .field-suffix { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--muted); font-size: 16px; padding: 4px; line-height: 1; }

  /* ── Role selector ── */
  .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .role-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid var(--line); background: var(--white);
    cursor: pointer; transition: all .18s;
    font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 13px;
    color: var(--muted); text-align: left;
  }
  .role-btn:hover { border-color: var(--purple); color: var(--purple); background: var(--purple-xl); }
  .role-btn.active { border-color: var(--purple); background: var(--purple-l); color: var(--purple); }
  .role-btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

  /* ── Submit button ── */
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

  /* ── Left panel ── */
  .left-panel {
    position: relative;
    background: linear-gradient(160deg, var(--teal) 0%, var(--purple) 55%, var(--purple-d) 100%);
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 48px 48px 40px; overflow: hidden; color: #fff;
  }
  .left-panel::before {
    content: ''; position: absolute; inset: 0;
    background: url('${BG_IMG}') center/cover no-repeat;
    opacity: .14;
  }

  /* ── Progress steps ── */
  .progress-step {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 12px;
    background: rgba(255,255,255,.1); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.15);
  }
  .step-dot {
    width: 28px; height: 28px; border-radius: '50%'; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; font-family: 'Nunito', sans-serif;
    border-radius: 50%;
  }

  .chip-float {
    position: absolute; border-radius: 50px;
    padding: 9px 16px; font-size: 12px; font-weight: 800;
    font-family: 'Nunito', sans-serif; white-space: nowrap; z-index: 2;
  }

  /* ── Password strength ── */
  .strength-bar { height: 4px; border-radius: 4px; transition: width .3s, background .3s; }

  @media (max-width: 900px) {
    .left-panel { display: none !important; }
    .reg-grid { grid-template-columns: 1fr !important; }
    .right-panel { min-height: 100vh; }
    .role-grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 480px) {
    .role-grid { grid-template-columns: 1fr !important; }
  }
`;

/* ── Schema ── */
const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum([
    'admin_rede',
    'gestor_escolar',
    'coordenador',
    'professor_regente',
    'professor_aee',
    'familia',
  ]),
});
type RegisterForm = z.infer<typeof registerSchema>;

const roles: { value: RegisterForm['role']; label: string; icon: string; desc: string }[] = [
  { value: 'professor_regente', label: 'Professor Regente', icon: '👩‍🏫', desc: 'Sala regular' },
  { value: 'professor_aee', label: 'Professor AEE', icon: '⭐', desc: 'Sala de recursos' },
  { value: 'coordenador', label: 'Coordenador', icon: '📋', desc: 'Validação e acompanhamento' },
  { value: 'gestor_escolar', label: 'Gestor Escolar', icon: '🏫', desc: 'Coordenação' },
  { value: 'admin_rede', label: 'Admin da Rede', icon: '🔑', desc: 'Rede de ensino' },
  { value: 'familia', label: 'Família', icon: '👨‍👩‍👦', desc: 'Responsável' },
];

/* ── Password strength helper ── */
function pwStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: 'transparent' };
  if (pw.length < 6) return { score: 1, label: 'Muito fraca', color: '#ef4444' };
  let s = 1;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 2) return { score: s, label: 'Fraca', color: '#f97316' };
  if (s === 3) return { score: s, label: 'Média', color: '#eab308' };
  if (s === 4) return { score: s, label: 'Forte', color: 'var(--teal)' };
  return { score: s, label: 'Muito forte', color: 'var(--purple)' };
}

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'professor_regente' },
  });

  const selectedRole = watch('role');
  const passwordVal = watch('password') ?? '';
  const strength = pwStrength(passwordVal);

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { name: values.name, role: values.role } },
    });
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Register] Supabase error:', error.message, error.status);
      }
      const msg = error.message?.toLowerCase() ?? '';
      const is500 = String(error.status ?? '').startsWith('5');
      if (
        msg.includes('already') ||
        msg.includes('já') ||
        msg.includes('exist') ||
        msg.includes('registered')
      ) {
        setServerError('Este e-mail já está cadastrado. Acesse a página de login para entrar.');
      } else if (msg.includes('disabled') || msg.includes('forbidden')) {
        setServerError(
          'Cadastros estão temporariamente desativados. Entre em contato com o administrador.'
        );
      } else if (msg.includes('invalid') || msg.includes('email')) {
        setServerError('E-mail inválido ou não permitido.');
      } else if (is500 || msg.includes('database') || msg.includes('saving new user')) {
        setServerError(
          'Erro ao criar sua conta. Verifique se as migrações do banco foram aplicadas (supabase db push). Se o problema persistir, consulte os logs do Supabase.'
        );
      } else {
        setServerError(`Não foi possível cadastrar: ${error.message || 'Tente novamente.'}`);
      }
      return;
    }
    router.push('/dashboard');
  };

  return (
    <>
      <style>{CSS}</style>
      <a href="#register-form" className="skip">
        Pular para o formulário
      </a>

      <div
        className="reg-grid"
        style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 520px' }}
      >
        {/* ════ LEFT PANEL ════ */}
        <div className="left-panel" aria-hidden="true">
          <div
            style={{
              position: 'absolute',
              width: 360,
              height: 360,
              borderRadius: '50%',
              border: '72px solid rgba(255,255,255,.07)',
              right: -90,
              top: -100,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: '50%',
              border: '44px solid rgba(255,255,255,.05)',
              left: -44,
              bottom: 100,
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
              padding: '36px 0',
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
                marginBottom: 24,
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
                Crie sua conta grátis
              </span>
            </div>

            <h2
              className="h"
              style={{
                fontSize: 'clamp(22px, 2.6vw, 34px)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.18,
                marginBottom: 14,
                letterSpacing: '-.02em',
              }}
            >
              Junte-se à comunidade da educação inclusiva.
            </h2>
            <p
              style={{
                fontSize: 15,
                color: 'rgba(255,255,255,.78)',
                lineHeight: 1.75,
                maxWidth: 360,
                marginBottom: 32,
              }}
            >
              Professores, coordenadores, especialistas e famílias colaborando no mesmo fluxo para
              cada aluno.
            </p>

            {/* Profile preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                {
                  icon: '👩‍🏫',
                  label: 'Professor Regente',
                  desc: 'Cria e acompanha o PEI',
                  c: 'rgba(255,255,255,.18)',
                },
                {
                  icon: '⭐',
                  label: 'Professor AEE',
                  desc: 'Coordena o Plano de AEE',
                  c: 'rgba(255,255,255,.12)',
                },
                {
                  icon: '👨‍👩‍👦',
                  label: 'Família',
                  desc: 'Acompanha e assina digitalmente',
                  c: 'rgba(255,255,255,.08)',
                },
              ].map((p) => (
                <div key={p.label} className="progress-step" style={{ background: p.c }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <div>
                    <div className="h" style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)' }}>{p.desc}</div>
                  </div>
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
              top: '20%',
              right: -22,
              background: '#fff',
              color: 'var(--purple)',
              boxShadow: '0 6px 20px rgba(0,0,0,.15)',
              animation: 'float 3.5s ease-in-out infinite',
            }}
          >
            🎯 PEI criado!
          </div>
          <div
            className="chip-float"
            style={{
              bottom: '30%',
              right: -16,
              background: 'rgba(255,255,255,.9)',
              color: 'var(--teal)',
              boxShadow: '0 4px 14px rgba(0,0,0,.1)',
              animation: 'float 4s ease-in-out .8s infinite',
            }}
          >
            ✓ LGPD
          </div>
        </div>

        {/* ════ RIGHT PANEL — form ════ */}
        <main
          id="register-form"
          className="right-panel"
          style={{
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 40px',
            position: 'relative',
            overflowY: 'auto',
          }}
        >
          <div style={{ width: '100%', maxWidth: 400 }}>
            {/* Header */}
            <div className="a1" style={{ marginBottom: 32, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
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
                Criar conta
              </h1>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                Cadastre-se e comece a usar o PEICollab
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Formulário de cadastro">
              {/* Name */}
              <div className="a2" style={{ marginBottom: 16 }}>
                <label
                  htmlFor="name"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginBottom: 6,
                  }}
                >
                  Nome completo
                </label>
                <div className="field-wrap">
                  <span className="field-icon" aria-hidden="true">
                    👤
                  </span>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    className={`field has-icon${errors.name ? ' error' : ''}`}
                    placeholder="Seu nome completo"
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <p
                    id="name-error"
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
                    <span aria-hidden="true">⚠</span> {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="a3" style={{ marginBottom: 16 }}>
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
                    className={`field has-icon${errors.email ? ' error' : ''}`}
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
              <div className="a4" style={{ marginBottom: 16 }}>
                <label
                  htmlFor="password"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginBottom: 6,
                  }}
                >
                  Senha
                </label>
                <div className="field-wrap">
                  <span className="field-icon" aria-hidden="true">
                    🔒
                  </span>
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`field has-icon${errors.password ? ' error' : ''}`}
                    placeholder="Mínimo 6 caracteres"
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    aria-describedby={`pw-strength${errors.password ? ' pw-error' : ''}`}
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
                {/* Strength meter */}
                {passwordVal && (
                  <div id="pw-strength" style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 4,
                            background: i <= strength.score ? strength.color : '#e2e8f0',
                            transition: 'background .3s',
                          }}
                        />
                      ))}
                    </div>
                    <p
                      style={{ fontSize: 11, color: strength.color, fontWeight: 600 }}
                      aria-live="polite"
                    >
                      {strength.label}
                    </p>
                  </div>
                )}
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

              {/* Role */}
              <div className="a5" style={{ marginBottom: 6 }}>
                <fieldset style={{ border: 'none', padding: 0 }}>
                  <legend
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--ink)',
                      marginBottom: 10,
                      display: 'block',
                    }}
                  >
                    Qual é o seu papel?
                  </legend>
                  <div
                    className="role-grid"
                    role="group"
                    aria-label="Selecione seu papel no sistema"
                  >
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        role="radio"
                        aria-checked={selectedRole === r.value}
                        className={`role-btn${selectedRole === r.value ? ' active' : ''}`}
                        onClick={() => setValue('role', r.value, { shouldValidate: true })}
                      >
                        <span aria-hidden="true" style={{ fontSize: 18, flexShrink: 0 }}>
                          {r.icon}
                        </span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.2 }}>
                            {r.label}
                          </div>
                          <div
                            style={{ fontSize: 10, fontWeight: 500, opacity: 0.7, marginTop: 1 }}
                          >
                            {r.desc}
                          </div>
                        </div>
                        {selectedRole === r.value && (
                          <span
                            aria-hidden="true"
                            style={{
                              marginLeft: 'auto',
                              fontSize: 14,
                              color: 'var(--purple)',
                              flexShrink: 0,
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Hidden input for form value */}
                  <input type="hidden" {...register('role')} />
                  {errors.role && (
                    <p
                      role="alert"
                      style={{
                        fontSize: 12,
                        color: 'var(--error)',
                        marginTop: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span aria-hidden="true">⚠</span> {errors.role.message}
                    </p>
                  )}
                </fieldset>
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
              <div className="a6" style={{ marginTop: 22 }}>
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
                      Criando conta...
                    </>
                  ) : (
                    'Cadastrar →'
                  )}
                </button>
              </div>

              {/* Login link */}
              <p
                className="a6"
                style={{ marginTop: 18, textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}
              >
                Já tem conta?{' '}
                <Link
                  href="/login"
                  style={{
                    color: 'var(--purple)',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  Entrar
                </Link>
              </p>
            </form>

            {/* Back link */}
            <div className="a7" style={{ marginTop: 18, textAlign: 'center' }}>
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
              className="a7"
              style={{
                marginTop: 28,
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
          <p style={{ marginTop: 32, fontSize: 11, color: '#a0aec0', textAlign: 'center' }}>
            © 2025 Grupo MAR & Inclusão LTDA · PEICollab 2.0
          </p>
        </main>
      </div>
    </>
  );
}
