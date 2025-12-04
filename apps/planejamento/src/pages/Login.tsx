import { LoginForm } from '@pei/ui';

export default function Login() {
  return (
    <LoginForm
      appName="Planejamento"
      appSubtitle="Planejamento de Aulas e Cursos"
      appLogo="/logo.png"
      redirectTo="/dashboard"
      validateProfile={true}
      requireSchoolId={false}
      showForgotPassword={true}
    />
  );
}

