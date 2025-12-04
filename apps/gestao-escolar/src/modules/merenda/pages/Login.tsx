import { LoginForm } from '@pei/ui';

export default function Login() {
  return (
    <LoginForm
      appName="Merenda Escolar"
      appSubtitle="Gestão de Cardápios e Alimentação"
      appLogo="/logo.png"
      redirectTo="/"
      validateProfile={true}
      requireSchoolId={false}
      showForgotPassword={true}
    />
  );
}

