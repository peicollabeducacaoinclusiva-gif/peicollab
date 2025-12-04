import { LoginForm } from '@pei/ui';

export default function Login() {
  return (
    <LoginForm
      appName="Blog Educacional"
      appSubtitle="Área Administrativa"
      appLogo="/logo.png"
      redirectTo="/admin"
      validateProfile={true}
      requireSchoolId={false}
      showForgotPassword={true}
    />
  );
}
