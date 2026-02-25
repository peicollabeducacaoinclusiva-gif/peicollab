import { Tables } from './database';

export type Student = Tables<'students'>;
export type User = Tables<'users'>;
export type FamilyStudent = Tables<'family_students'>;

export type Document = Tables<'documents'> & {
  versao_pai?: Document | null;
  field_values?: DocumentFieldValue[];
  goal_links?: GoalLink[];
};

export type DocumentFieldValue = Tables<'document_field_values'>;
export type Goal = Tables<'goals'> & {
  latest_update?: Tables<'goal_updates'> | null;
  links?: Tables<'goal_links'>[];
};
export type GoalLink = Tables<'goal_links'>;

export type Template = Tables<'document_templates'> & {
  sections: (Tables<'template_sections'> & {
    fields: Tables<'template_fields'>[];
  })[];
};

export const isEditable = (doc: Document) => doc.status === 'rascunho';
export const canBeVersioned = (doc: Document) => doc.status === 'aprovado';
export const isReadOnly = (doc: Document) =>
  ['em_validacao', 'aprovado', 'arquivado'].includes(doc.status);
