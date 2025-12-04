import { Link } from 'react-router-dom';
import { ArrowLeft, School, ExternalLink } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export default function SelectNetwork() {
  const networks = [
    {
      id: 'sao-goncalo',
      name: 'São Gonçalo',
      description: 'Rede Municipal de São Gonçalo - RJ',
      url: 'http://localhost:8080',
      students: '43 alunos',
      status: 'Ativa',
    },
    // Você pode adicionar mais redes aqui
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition">
            <ArrowLeft className="h-5 w-5" />
            <span>Voltar</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Selecione Sua Rede de Ensino
          </h1>
          <p className="text-xl text-gray-600">
            Escolha a rede de ensino para acessar o sistema
          </p>
        </div>

        <div className="grid gap-6">
          {networks.map((network) => (
            <Card key={network.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-blue-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <School className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{network.name}</CardTitle>
                      <CardDescription className="text-base mt-1">
                        {network.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {network.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>{network.students}</p>
                  </div>
                  <a href={network.url} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      Acessar Sistema
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700 text-center">
            <strong>Não encontrou sua rede?</strong> Entre em contato com o administrador do sistema 
            para solicitar acesso à sua rede de ensino.
          </p>
        </div>
      </div>
    </div>
  );
}
