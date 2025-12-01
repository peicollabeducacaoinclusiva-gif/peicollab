import { describe, it, expect } from 'vitest';
import {
  validateCPF,
  validateCNPJ,
  sanitizeText,
  sanitizeHTML,
  sanitizeSQL,
  sanitizeURL,
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatCEP,
  validateLoginForm,
  validateUserForm,
  emailSchema,
  passwordSchema,
  fullNameSchema,
  cpfSchema,
  phoneSchema,
  cepSchema,
} from '../validation';

describe('validation', () => {
  describe('validateCPF', () => {
    it('deve validar CPF válido', () => {
      expect(validateCPF('111.444.777-35')).toBe(true);
      expect(validateCPF('123.456.789-09')).toBe(true);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(validateCPF('111.111.111-11')).toBe(false);
      expect(validateCPF('123.456.789-00')).toBe(false);
      expect(validateCPF('000.000.000-00')).toBe(false);
    });

    it('deve rejeitar CPF com formato incorreto', () => {
      expect(validateCPF('123456789')).toBe(false);
      expect(validateCPF('123.456.789')).toBe(false);
    });
  });

  describe('validateCNPJ', () => {
    it('deve validar CNPJ válido', () => {
      expect(validateCNPJ('11.444.777/0001-61')).toBe(true);
    });

    it('deve rejeitar CNPJ inválido', () => {
      expect(validateCNPJ('11.111.111/1111-11')).toBe(false);
      expect(validateCNPJ('00.000.000/0000-00')).toBe(false);
    });

    it('deve rejeitar CNPJ com formato incorreto', () => {
      expect(validateCNPJ('11444777000161')).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    it('deve remover tags script', () => {
      const input = 'Texto <script>alert("xss")</script> normal';
      const result = sanitizeText(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Texto');
      expect(result).toContain('normal');
    });

    it('deve remover event handlers', () => {
      const input = '<div onclick="alert(1)">Texto</div>';
      const result = sanitizeText(input);
      expect(result).not.toContain('onclick');
    });

    it('deve remover javascript: URIs', () => {
      const input = 'Link javascript:alert(1)';
      const result = sanitizeText(input);
      expect(result).not.toContain('javascript:');
    });

    it('deve retornar string vazia para input vazio', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null as any)).toBe('');
      expect(sanitizeText(undefined as any)).toBe('');
    });
  });

  describe('sanitizeHTML', () => {
    it('deve permitir tags permitidas', () => {
      const input = '<p>Texto <b>negrito</b> e <i>itálico</i></p>';
      const result = sanitizeHTML(input, ['p', 'b', 'i']);
      expect(result).toContain('<p>');
      expect(result).toContain('<b>');
      expect(result).toContain('<i>');
    });

    it('deve remover tags não permitidas', () => {
      const input = '<p>Texto <script>alert(1)</script></p>';
      const result = sanitizeHTML(input, ['p']);
      expect(result).not.toContain('<script>');
    });

    it('deve remover atributos', () => {
      const input = '<p class="test" id="test">Texto</p>';
      const result = sanitizeHTML(input, ['p']);
      expect(result).not.toContain('class');
      expect(result).not.toContain('id');
    });
  });

  describe('sanitizeSQL', () => {
    it('deve escapar aspas simples', () => {
      const input = "O'Reilly";
      const result = sanitizeSQL(input);
      expect(result).toContain("''");
    });

    it('deve remover ponto-e-vírgula', () => {
      const input = "test; DROP TABLE users;";
      const result = sanitizeSQL(input);
      expect(result).not.toContain(';');
    });

    it('deve remover comentários SQL', () => {
      const input = "test -- comment";
      const result = sanitizeSQL(input);
      expect(result).not.toContain('--');
    });
  });

  describe('sanitizeURL', () => {
    it('deve validar URL http válida', () => {
      const input = 'http://example.com';
      const result = sanitizeURL(input);
      expect(result).toBe('http://example.com/');
    });

    it('deve validar URL https válida', () => {
      const input = 'https://example.com';
      const result = sanitizeURL(input);
      expect(result).toBe('https://example.com/');
    });

    it('deve rejeitar URL com protocolo inválido', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });

    it('deve retornar string vazia para URL inválida', () => {
      expect(sanitizeURL('not-a-url')).toBe('');
      expect(sanitizeURL('')).toBe('');
    });
  });

  describe('formatCPF', () => {
    it('deve formatar CPF corretamente', () => {
      expect(formatCPF('11144477735')).toBe('111.444.777-35');
      expect(formatCPF('111.444.777-35')).toBe('111.444.777-35');
    });

    it('deve lidar com CPF incompleto', () => {
      expect(formatCPF('111')).toBe('111');
    });
  });

  describe('formatCNPJ', () => {
    it('deve formatar CNPJ corretamente', () => {
      expect(formatCNPJ('11444777000161')).toBe('11.444.777/0001-61');
    });
  });

  describe('formatPhone', () => {
    it('deve formatar telefone celular (11 dígitos)', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    });

    it('deve formatar telefone fixo (10 dígitos)', () => {
      expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    });

    it('deve retornar original se não tiver formato válido', () => {
      expect(formatPhone('123')).toBe('123');
    });
  });

  describe('formatCEP', () => {
    it('deve formatar CEP corretamente', () => {
      expect(formatCEP('12345678')).toBe('12345-678');
      expect(formatCEP('12345-678')).toBe('12345-678');
    });
  });

  describe('validateLoginForm', () => {
    it('deve validar formulário válido', () => {
      const result = validateLoginForm('test@example.com', 'Password123!');
      expect(result.success).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('deve rejeitar email inválido', () => {
      const result = validateLoginForm('invalid-email', 'Password123!');
      expect(result.success).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('deve rejeitar senha muito curta', () => {
      const result = validateLoginForm('test@example.com', 'short');
      expect(result.success).toBe(false);
      expect(result.errors.password).toBeDefined();
    });
  });

  describe('validateUserForm', () => {
    it('deve validar formulário completo válido', () => {
      const result = validateUserForm({
        fullName: 'João Silva',
        email: 'joao@example.com',
        password: 'Password123!',
        cpf: '111.444.777-35',
        phone: '(11) 98765-4321',
      });
      expect(result.success).toBe(true);
    });

    it('deve rejeitar nome muito curto', () => {
      const result = validateUserForm({
        fullName: 'Jo',
        email: 'joao@example.com',
        password: 'Password123!',
      });
      expect(result.success).toBe(false);
      expect(result.errors.fullName).toBeDefined();
    });

    it('deve rejeitar CPF inválido', () => {
      const result = validateUserForm({
        fullName: 'João Silva',
        email: 'joao@example.com',
        password: 'Password123!',
        cpf: '111.111.111-11',
      });
      expect(result.success).toBe(false);
      expect(result.errors.cpf).toBeDefined();
    });
  });

  describe('Schemas Zod', () => {
    describe('emailSchema', () => {
      it('deve validar email válido', () => {
        const result = emailSchema.safeParse('test@example.com');
        expect(result.success).toBe(true);
      });

      it('deve rejeitar email inválido', () => {
        const result = emailSchema.safeParse('invalid-email');
        expect(result.success).toBe(false);
      });

      it('deve converter para lowercase', () => {
        const result = emailSchema.safeParse('TEST@EXAMPLE.COM');
        if (result.success) {
          expect(result.data).toBe('test@example.com');
        }
      });
    });

    describe('passwordSchema', () => {
      it('deve validar senha válida', () => {
        const result = passwordSchema.safeParse('Password123!');
        expect(result.success).toBe(true);
      });

      it('deve rejeitar senha sem maiúscula', () => {
        const result = passwordSchema.safeParse('password123!');
        expect(result.success).toBe(false);
      });

      it('deve rejeitar senha sem minúscula', () => {
        const result = passwordSchema.safeParse('PASSWORD123!');
        expect(result.success).toBe(false);
      });

      it('deve rejeitar senha sem número', () => {
        const result = passwordSchema.safeParse('Password!');
        expect(result.success).toBe(false);
      });

      it('deve rejeitar senha sem caractere especial', () => {
        const result = passwordSchema.safeParse('Password123');
        expect(result.success).toBe(false);
      });

      it('deve rejeitar senha muito curta', () => {
        const result = passwordSchema.safeParse('Pass1!');
        expect(result.success).toBe(false);
      });
    });

    describe('fullNameSchema', () => {
      it('deve validar nome válido', () => {
        const result = fullNameSchema.safeParse('João Silva');
        expect(result.success).toBe(true);
      });

      it('deve rejeitar nome muito curto', () => {
        const result = fullNameSchema.safeParse('Jo');
        expect(result.success).toBe(false);
      });

      it('deve rejeitar caracteres inválidos', () => {
        const result = fullNameSchema.safeParse('João123');
        expect(result.success).toBe(false);
      });
    });

    describe('cpfSchema', () => {
      it('deve validar CPF formatado corretamente', () => {
        const result = cpfSchema.safeParse('111.444.777-35');
        // O schema valida formato, mas precisa de refine para validar dígitos
        expect(result.success).toBe(true);
      });

      it('deve rejeitar formato incorreto', () => {
        const result = cpfSchema.safeParse('11144477735');
        expect(result.success).toBe(false);
      });
    });

    describe('phoneSchema', () => {
      it('deve validar telefone formatado', () => {
        const result = phoneSchema.safeParse('(11) 98765-4321');
        expect(result.success).toBe(true);
      });

      it('deve rejeitar formato incorreto', () => {
        const result = phoneSchema.safeParse('11987654321');
        expect(result.success).toBe(false);
      });
    });

    describe('cepSchema', () => {
      it('deve validar CEP formatado', () => {
        const result = cepSchema.safeParse('12345-678');
        expect(result.success).toBe(true);
      });

      it('deve rejeitar formato incorreto', () => {
        const result = cepSchema.safeParse('12345678');
        expect(result.success).toBe(false);
      });
    });
  });
});

