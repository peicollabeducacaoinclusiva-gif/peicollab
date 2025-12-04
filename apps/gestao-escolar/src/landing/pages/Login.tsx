import { LoginForm } from '@pei/ui';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirecionar para o seletor de apps após login bem-sucedido
    console.log('✅ handleSuccess chamado, redirecionando para /apps');
    // Usar setTimeout para garantir que o toast apareça antes do redirecionamento
    setTimeout(() => {
      console.log('🔄 Executando redirecionamento para /apps...');
      window.location.href = '/apps';
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1920&h=1080&fit=crop"
          alt="Professores e educadores em ambiente escolar"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/85 to-blue-900/90 backdrop-blur-[2px]" />
      </div>

      <LoginForm
        appName="PEI Collab"
        appLogo="/logo.png"
        appSubtitle="Plataforma Integrada de Educação Inclusiva"
        onSuccess={handleSuccess}
        redirectTo="/apps"
        showForgotPassword={true}
        validateProfile={false}
        requireSchoolId={false}
      />
    </div>
  );
}

