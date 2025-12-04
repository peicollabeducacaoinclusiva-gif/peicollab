/**
 * Constantes centralizadas para o app de Gestão Escolar
 * 
 * Este arquivo centraliza todas as listas estáticas e constantes
 * para facilitar reuso e manutenção em todo o aplicativo.
 */

/**
 * Níveis de Ensino disponíveis
 * Compatível com a estrutura usada em Students.tsx
 */
export const EDUCATIONAL_LEVELS = {
  "EDUCAÇÃO INFANTIL": {
    label: "EDUCAÇÃO INFANTIL (0-5 anos)",
    grades: [
      { value: "Berçário 1", label: "Berçário 1 (0 a 1 ano)" },
      { value: "Berçário 2", label: "Berçário 2 (1 a 2 anos)" },
      { value: "Maternal", label: "Maternal (2 a 3 anos)" },
      { value: "Infantil 4", label: "Infantil 4 (4 anos)" },
      { value: "Infantil 5", label: "Infantil 5 (5 anos)" },
    ],
  },
  "ENSINO FUNDAMENTAL": {
    label: "ENSINO FUNDAMENTAL (6-14 anos)",
    grades: [
      { value: "1º Ano EF", label: "1º Ano EF (6 anos)" },
      { value: "2º Ano EF", label: "2º Ano EF (7 anos)" },
      { value: "3º Ano EF", label: "3º Ano EF (8 anos)" },
      { value: "4º Ano EF", label: "4º Ano EF (9 anos)" },
      { value: "5º Ano EF", label: "5º Ano EF (10 anos)" },
      { value: "6º Ano EF", label: "6º Ano EF (11 anos)" },
      { value: "7º Ano EF", label: "7º Ano EF (12 anos)" },
      { value: "8º Ano EF", label: "8º Ano EF (13 anos)" },
      { value: "9º Ano EF", label: "9º Ano EF (14 anos)" },
    ],
  },
  "ENSINO MÉDIO": {
    label: "ENSINO MÉDIO (15-17 anos)",
    grades: [
      { value: "1º Ano EM", label: "1º Ano EM (15 anos)" },
      { value: "2º Ano EM", label: "2º Ano EM (16 anos)" },
      { value: "3º Ano EM", label: "3º Ano EM (17 anos)" },
    ],
  },
  "EJA": {
    label: "EJA - EDUCAÇÃO DE JOVENS E ADULTOS (15+ anos)",
    grades: [
      { value: "EJA - Anos Iniciais (EF)", label: "EJA - Anos Iniciais (EF) - 1º ao 5º ano" },
      { value: "EJA - Anos Finais (EF)", label: "EJA - Anos Finais (EF) - 6º ao 9º ano" },
      { value: "EJA - Ensino Médio", label: "EJA - Ensino Médio - 1ª a 3ª série" },
    ],
  },
} as const;

/**
 * Labels para níveis de ensino (formato do banco de dados)
 */
export const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  educacao_infantil: 'Educação Infantil',
  ensino_fundamental_1: 'Ensino Fundamental I',
  ensino_fundamental_2: 'Ensino Fundamental II',
  ensino_medio: 'Ensino Médio',
  eja: 'EJA',
} as const;

/**
 * Turnos disponíveis
 * Compatível com a estrutura usada em Students.tsx
 */
export const SHIFTS = [
  { value: "Manhã", label: "Manhã" },
  { value: "Tarde", label: "Tarde" },
  { value: "Noite", label: "Noite" },
  { value: "Integral", label: "Integral" },
] as const;

/**
 * Tipos de Necessidades Educacionais Especiais (NEE)
 * Compatível com a estrutura usada em Students.tsx e StudentSpecialNeedsData.tsx
 */
export const NEE_TYPES = [
  { value: "TDAH", label: "TDAH (Transtorno de Déficit de Atenção e Hiperatividade)" },
  { value: "TOD", label: "TOD (Transtorno Opositor Desafiador)" },
  { value: "TEA", label: "TEA (Transtorno do Espectro Autista)" },
  { value: "Dislexia", label: "Dislexia" },
  { value: "Discalculia", label: "Discalculia" },
  { value: "Disgrafia", label: "Disgrafia" },
  { value: "Transtorno de Aprendizagem", label: "Transtorno de Aprendizagem" },
  { value: "Altas Habilidades", label: "Altas Habilidades/Superdotação" },
] as const;

/**
 * Status de matrícula
 */
export const ENROLLMENT_STATUS = [
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Transferido', label: 'Transferido' },
  { value: 'Cancelado', label: 'Cancelado' },
  { value: 'Concluído', label: 'Concluído' },
  { value: 'Abandonou', label: 'Abandonou' },
] as const;

/**
 * Tipos de documentos escolares
 */
export const DOCUMENT_TYPES = [
  { value: 'declaration', label: 'Declaração' },
  { value: 'certificate', label: 'Atestado' },
  { value: 'history', label: 'Histórico' },
  { value: 'individual_record', label: 'Ficha Individual' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'attendance', label: 'Frequência' },
  { value: 'other', label: 'Outro' },
] as const;

/**
 * Funções de profissionais
 */
export const PROFESSIONAL_ROLES = [
  { value: 'professor', label: 'Professor' },
  { value: 'professor_aee', label: 'Professor AEE' },
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'diretor', label: 'Diretor' },
  { value: 'secretario_educacao', label: 'Secretário de Educação' },
  { value: 'profissional_apoio', label: 'Profissional de Apoio' },
  { value: 'psicologo', label: 'Psicólogo' },
  { value: 'fonoaudiologo', label: 'Fonoaudiólogo' },
  { value: 'terapeuta_ocupacional', label: 'Terapeuta Ocupacional' },
  { value: 'assistente_social', label: 'Assistente Social' },
  { value: 'outros', label: 'Outros' },
] as const;

