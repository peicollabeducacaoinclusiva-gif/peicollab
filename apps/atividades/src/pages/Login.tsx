import { LoginForm } from '@pei/ui';

export default function Login() {
  return (
    <LoginForm
      appName="Atividades"
      appSubtitle="Banco de Atividades Educacionais"
      appLogo="/logo.png"
      redirectTo="/dashboard"
      validateProfile={true}
      requireSchoolId={false}
      showForgotPassword={true}
    />
  );
}

