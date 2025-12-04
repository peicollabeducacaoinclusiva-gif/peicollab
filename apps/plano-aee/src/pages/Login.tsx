import { LoginForm } from '@pei/ui';

export default function Login() {
  return (
    <LoginForm
      appName="Plano de AEE"
      appSubtitle="Atendimento Educacional Especializado"
      appLogo="/logo.png"
      redirectTo="/"
      validateProfile={true}
      requireSchoolId={false}
      showForgotPassword={true}
    />
  );
}
