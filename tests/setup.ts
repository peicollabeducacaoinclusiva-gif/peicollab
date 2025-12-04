// Configuração global para testes
global.console = {
  ...console,
  // Silenciar logs durante testes, exceto erros
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error,
};

