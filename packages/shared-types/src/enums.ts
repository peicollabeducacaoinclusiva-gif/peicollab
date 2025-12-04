/**
 * Enums e constantes compartilhadas
 */

// Status de Matrícula
export const STATUS_MATRICULA = {
  ATIVO: 'Ativo',
  TRANSFERIDO: 'Transferido',
  CANCELADO: 'Cancelado',
  CONCLUIDO: 'Concluído',
  ABANDONOU: 'Abandonou',
} as const;

// Status de Enrollment
export const ENROLLMENT_STATUS = {
  MATRICULADO: 'Matriculado',
  TRANSFERIDO: 'Transferido',
  CANCELADO: 'Cancelado',
  CONCLUIDO: 'Concluído',
  ABANDONOU: 'Abandonou',
} as const;

// Modalidades de Ensino
export const MODALIDADES = {
  EDUCACAO_INFANTIL: 'Educação Infantil',
  ENSINO_FUNDAMENTAL: 'Ensino Fundamental',
  ENSINO_MEDIO: 'Ensino Médio',
  EJA: 'EJA',
  EDUCACAO_ESPECIAL: 'Educação Especial',
} as const;

// Turnos
export const TURNOS = {
  MATUTINO: 'Matutino',
  VESPERTINO: 'Vespertino',
  NOTURNO: 'Noturno',
  INTEGRAL: 'Integral',
} as const;

// Períodos Letivos
export const PERIODOS_LETIVOS = {
  PRIMEIRO_BIMESTRE: '1BIM',
  SEGUNDO_BIMESTRE: '2BIM',
  TERCEIRO_BIMESTRE: '3BIM',
  QUARTO_BIMESTRE: '4BIM',
  PRIMEIRO_SEMESTRE: 'SEM1',
  SEGUNDO_SEMESTRE: 'SEM2',
  ANUAL: 'ANUAL',
  RECUPERACAO: 'REC',
} as const;

// Tipos de Avaliação
export const TIPOS_AVALIACAO = {
  PROVA: 'Prova',
  TRABALHO: 'Trabalho',
  PROJETO: 'Projeto',
  PARTICIPACAO: 'Participação',
  RECUPERACAO: 'Recuperação',
  SIMULADO: 'Simulado',
} as const;

// Áreas de Conhecimento
export const AREAS_CONHECIMENTO = {
  LINGUAGENS: 'Linguagens',
  MATEMATICA: 'Matemática',
  CIENCIAS_HUMANAS: 'Ciências Humanas',
  CIENCIAS_NATUREZA: 'Ciências da Natureza',
  ENSINO_RELIGIOSO: 'Ensino Religioso',
} as const;

// Tipos de Vínculo Profissional
export const TIPOS_VINCULO = {
  EFETIVO: 'Efetivo',
  CONTRATO: 'Contrato',
  COMISSIONADO: 'Comissionado',
  VOLUNTARIO: 'Voluntário',
} as const;

// Regimes de Trabalho
export const REGIMES_TRABALHO = {
  VINTE_HORAS: '20h',
  TRINTA_HORAS: '30h',
  QUARENTA_HORAS: '40h',
  DEDICACAO_EXCLUSIVA: 'Dedicação Exclusiva',
} as const;

