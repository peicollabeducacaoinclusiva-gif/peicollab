import { LoginForm } from '@pei/ui';

export default function Login() {
  return (
    <LoginForm
      appName="Gestão Escolar"
      appSubtitle="Sistema de Cadastro da Rede de Ensino"
      appLogo="/logo.png"
      redirectTo="/"
      validateProfile={true}
      requireSchoolId={false}
      showForgotPassword={true}
    />
  );
}
