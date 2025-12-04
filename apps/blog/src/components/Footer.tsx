import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sobre */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-gray-900">
                Blog Educacional
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              Conteúdo sobre educação inclusiva e o sistema PEI Colaborativo.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                >
                  Início
                </Link>
              </li>
              <li>
                <a
                  href={import.meta.env.VITE_LANDING_URL || 'http://localhost:3001'}
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Voltar à Landing
                </a>
              </li>
              <li>
                <a
                  href={import.meta.env.VITE_PEI_COLLAB_URL || 'http://localhost:8080'}
                  className="text-gray-600 hover:text-primary transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PEI Collab
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Sistema</h3>
            <p className="text-gray-600 text-sm mb-2">
              Parte do ecossistema PEI Colaborativo
            </p>
            <p className="text-gray-600 text-sm">
              6 aplicações integradas para educação inclusiva
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            © {currentYear} PEI Colaborativo. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

