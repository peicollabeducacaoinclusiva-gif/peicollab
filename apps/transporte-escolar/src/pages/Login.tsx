import { LoginForm } from '@pei/ui';

export default function Login() {
  return (
    <LoginForm
      appName="Transporte Escolar"
      appSubtitle="Gestão de Transporte e Rotas"
      appLogo="/logo.png"
      redirectTo="/"
      validateProfile={true}
      requireSchoolId={false}
      showForgotPassword={true}
    />
  );
}

