export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      ai_recommendation_logs: {
        Row: {
          aceita_boolean: boolean | null;
          contexto_json: Json | null;
          created_at: string | null;
          id: string;
          student_id: string | null;
          sugestao_json: Json | null;
        };
        Insert: {
          aceita_boolean?: boolean | null;
          contexto_json?: Json | null;
          created_at?: string | null;
          id?: string;
          student_id?: string | null;
          sugestao_json?: Json | null;
        };
        Update: {
          aceita_boolean?: boolean | null;
          contexto_json?: Json | null;
          created_at?: string | null;
          id?: string;
          student_id?: string | null;
          sugestao_json?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_recommendation_logs_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'students';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: {
          acao: string;
          after_json: Json | null;
          before_json: Json | null;
          entidade: string;
          entidade_id: string | null;
          id: string;
          timestamp: string | null;
          user_id: string | null;
        };
        Insert: {
          acao: string;
          after_json?: Json | null;
          before_json?: Json | null;
          entidade: string;
          entidade_id?: string | null;
          id?: string;
          timestamp?: string | null;
          user_id?: string | null;
        };
        Update: {
          acao?: string;
          after_json?: Json | null;
          before_json?: Json | null;
          entidade?: string;
          entidade_id?: string | null;
          id?: string;
          timestamp?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      document_field_values: {
        Row: {
          document_id: string;
          field_id: string;
          id: string;
          updated_at: string | null;
          value_json: Json | null;
          value_text: string | null;
        };
        Insert: {
          document_id: string;
          field_id: string;
          id?: string;
          updated_at?: string | null;
          value_json?: Json | null;
          value_text?: string | null;
        };
        Update: {
          document_id?: string;
          field_id?: string;
          id?: string;
          updated_at?: string | null;
          value_json?: Json | null;
          value_text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'document_field_values_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'document_field_values_field_id_fkey';
            columns: ['field_id'];
            isOneToOne: false;
            referencedRelation: 'template_fields';
            referencedColumns: ['id'];
          },
        ];
      };
      document_templates: {
        Row: {
          ativo: boolean | null;
          base_nacional: boolean | null;
          created_at: string | null;
          id: string;
          network_id: string | null;
          nome_template: string;
          tipo: string;
          versao: number | null;
        };
        Insert: {
          ativo?: boolean | null;
          base_nacional?: boolean | null;
          created_at?: string | null;
          id?: string;
          network_id?: string | null;
          nome_template: string;
          tipo: string;
          versao?: number | null;
        };
        Update: {
          ativo?: boolean | null;
          base_nacional?: boolean | null;
          created_at?: string | null;
          id?: string;
          network_id?: string | null;
          nome_template?: string;
          tipo?: string;
          versao?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'document_templates_network_id_fkey';
            columns: ['network_id'];
            isOneToOne: false;
            referencedRelation: 'networks';
            referencedColumns: ['id'];
          },
        ];
      };
      document_validations: {
        Row: {
          data_validacao: string | null;
          document_id: string;
          id: string;
          motivo_rejeicao: string | null;
          papel_validador: string | null;
          status: string | null;
          validado_por: string | null;
        };
        Insert: {
          data_validacao?: string | null;
          document_id: string;
          id?: string;
          motivo_rejeicao?: string | null;
          papel_validador?: string | null;
          status?: string | null;
          validado_por?: string | null;
        };
        Update: {
          data_validacao?: string | null;
          document_id?: string;
          id?: string;
          motivo_rejeicao?: string | null;
          papel_validador?: string | null;
          status?: string | null;
          validado_por?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'document_validations_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'document_validations_validado_por_fkey';
            columns: ['validado_por'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      documents: {
        Row: {
          aprovado_em: string | null;
          aprovado_por: string | null;
          created_at: string | null;
          criado_por: string | null;
          id: string;
          is_versao_atual: boolean;
          network_id: string;
          status: string;
          student_id: string;
          template_id: string;
          template_versao: number;
          tipo: string;
          updated_at: string | null;
          versao: number;
          versao_pai_id: string | null;
        };
        Insert: {
          aprovado_em?: string | null;
          aprovado_por?: string | null;
          created_at?: string | null;
          criado_por?: string | null;
          id?: string;
          is_versao_atual?: boolean;
          network_id: string;
          status?: string;
          student_id: string;
          template_id: string;
          template_versao?: number;
          tipo: string;
          updated_at?: string | null;
          versao?: number;
          versao_pai_id?: string | null;
        };
        Update: {
          aprovado_em?: string | null;
          aprovado_por?: string | null;
          created_at?: string | null;
          criado_por?: string | null;
          id?: string;
          is_versao_atual?: boolean;
          network_id?: string;
          status?: string;
          student_id?: string;
          template_id?: string;
          template_versao?: number;
          tipo?: string;
          updated_at?: string | null;
          versao?: number;
          versao_pai_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_aprovado_por_fkey';
            columns: ['aprovado_por'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_criado_por_fkey';
            columns: ['criado_por'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_network_id_fkey';
            columns: ['network_id'];
            isOneToOne: false;
            referencedRelation: 'networks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'students';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'document_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_versao_pai_id_fkey';
            columns: ['versao_pai_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
        ];
      };
      family_acknowledgements: {
        Row: {
          aceite_boolean: boolean | null;
          data_aceite: string | null;
          document_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          aceite_boolean?: boolean | null;
          data_aceite?: string | null;
          document_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          aceite_boolean?: boolean | null;
          data_aceite?: string | null;
          document_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'family_acknowledgements_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'family_acknowledgements_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      family_comments: {
        Row: {
          comentario: string;
          created_at: string | null;
          document_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          comentario: string;
          created_at?: string | null;
          document_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          comentario?: string;
          created_at?: string | null;
          document_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'family_comments_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'family_comments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      family_students: {
        Row: {
          created_at: string | null;
          id: string;
          student_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          student_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          student_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'family_students_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'students';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'family_students_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      goal_links: {
        Row: {
          goal_id: string;
          id: string;
          linked_document_id: string;
          tipo_vinculo: string | null;
        };
        Insert: {
          goal_id: string;
          id?: string;
          linked_document_id: string;
          tipo_vinculo?: string | null;
        };
        Update: {
          goal_id?: string;
          id?: string;
          linked_document_id?: string;
          tipo_vinculo?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'goal_links_goal_id_fkey';
            columns: ['goal_id'];
            isOneToOne: false;
            referencedRelation: 'goals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'goal_links_goal_id_fkey';
            columns: ['goal_id'];
            isOneToOne: false;
            referencedRelation: 'mv_metas_atrasadas';
            referencedColumns: ['goal_id'];
          },
          {
            foreignKeyName: 'goal_links_linked_document_id_fkey';
            columns: ['linked_document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
        ];
      };
      goal_updates: {
        Row: {
          data_registro: string | null;
          goal_id: string;
          id: string;
          observacao: string | null;
          progresso_percentual: number | null;
          registrado_por: string | null;
        };
        Insert: {
          data_registro?: string | null;
          goal_id: string;
          id?: string;
          observacao?: string | null;
          progresso_percentual?: number | null;
          registrado_por?: string | null;
        };
        Update: {
          data_registro?: string | null;
          goal_id?: string;
          id?: string;
          observacao?: string | null;
          progresso_percentual?: number | null;
          registrado_por?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'goal_updates_goal_id_fkey';
            columns: ['goal_id'];
            isOneToOne: false;
            referencedRelation: 'goals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'goal_updates_goal_id_fkey';
            columns: ['goal_id'];
            isOneToOne: false;
            referencedRelation: 'mv_metas_atrasadas';
            referencedColumns: ['goal_id'];
          },
          {
            foreignKeyName: 'goal_updates_registrado_por_fkey';
            columns: ['registrado_por'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      goals: {
        Row: {
          created_at: string | null;
          descricao: string;
          id: string;
          indicador: string | null;
          linha_base: string | null;
          meta_valor: string | null;
          origin_document_id: string | null;
          prazo: string | null;
          responsavel_user_id: string | null;
          status: string | null;
          student_id: string;
          tipo_meta: string | null;
          unidade: string | null;
        };
        Insert: {
          created_at?: string | null;
          descricao: string;
          id?: string;
          indicador?: string | null;
          linha_base?: string | null;
          meta_valor?: string | null;
          origin_document_id?: string | null;
          prazo?: string | null;
          responsavel_user_id?: string | null;
          status?: string | null;
          student_id: string;
          tipo_meta?: string | null;
          unidade?: string | null;
        };
        Update: {
          created_at?: string | null;
          descricao?: string;
          id?: string;
          indicador?: string | null;
          linha_base?: string | null;
          meta_valor?: string | null;
          origin_document_id?: string | null;
          prazo?: string | null;
          responsavel_user_id?: string | null;
          status?: string | null;
          student_id?: string;
          tipo_meta?: string | null;
          unidade?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'goals_origin_document_id_fkey';
            columns: ['origin_document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'goals_responsavel_user_id_fkey';
            columns: ['responsavel_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'goals_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'students';
            referencedColumns: ['id'];
          },
        ];
      };
      networks: {
        Row: {
          cnpj: string | null;
          created_at: string | null;
          id: string;
          name: string;
          type: string;
        };
        Insert: {
          cnpj?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          type: string;
        };
        Update: {
          cnpj?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          type?: string;
        };
        Relationships: [];
      };
      schools: {
        Row: {
          created_at: string | null;
          id: string;
          inep_code: string | null;
          name: string;
          network_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          inep_code?: string | null;
          name: string;
          network_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          inep_code?: string | null;
          name?: string;
          network_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'schools_network_id_fkey';
            columns: ['network_id'];
            isOneToOne: false;
            referencedRelation: 'networks';
            referencedColumns: ['id'];
          },
        ];
      };
      students: {
        Row: {
          ativo: boolean | null;
          categoria_necessidade: string | null;
          created_at: string | null;
          data_nascimento: string | null;
          id: string;
          network_id: string;
          nome: string;
          school_id: string;
          serie: string | null;
          turno: string | null;
        };
        Insert: {
          ativo?: boolean | null;
          categoria_necessidade?: string | null;
          created_at?: string | null;
          data_nascimento?: string | null;
          id?: string;
          network_id: string;
          nome: string;
          school_id: string;
          serie?: string | null;
          turno?: string | null;
        };
        Update: {
          ativo?: boolean | null;
          categoria_necessidade?: string | null;
          created_at?: string | null;
          data_nascimento?: string | null;
          id?: string;
          network_id?: string;
          nome?: string;
          school_id?: string;
          serie?: string | null;
          turno?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'students_network_id_fkey';
            columns: ['network_id'];
            isOneToOne: false;
            referencedRelation: 'networks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'students_school_id_fkey';
            columns: ['school_id'];
            isOneToOne: false;
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          },
        ];
      };
      template_fields: {
        Row: {
          id: string;
          label: string;
          options_json: Json | null;
          ordem: number;
          required: boolean | null;
          section_id: string;
          tipo_campo: string;
        };
        Insert: {
          id?: string;
          label: string;
          options_json?: Json | null;
          ordem: number;
          required?: boolean | null;
          section_id: string;
          tipo_campo: string;
        };
        Update: {
          id?: string;
          label?: string;
          options_json?: Json | null;
          ordem?: number;
          required?: boolean | null;
          section_id?: string;
          tipo_campo?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'template_fields_section_id_fkey';
            columns: ['section_id'];
            isOneToOne: false;
            referencedRelation: 'template_sections';
            referencedColumns: ['id'];
          },
        ];
      };
      template_sections: {
        Row: {
          descricao: string | null;
          id: string;
          nome_secao: string;
          ordem: number;
          template_id: string;
        };
        Insert: {
          descricao?: string | null;
          id?: string;
          nome_secao: string;
          ordem: number;
          template_id: string;
        };
        Update: {
          descricao?: string | null;
          id?: string;
          nome_secao?: string;
          ordem?: number;
          template_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'template_sections_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'document_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          active: boolean | null;
          created_at: string | null;
          id: string;
          name: string;
          network_id: string | null;
          role: string;
          school_id: string | null;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string | null;
          id: string;
          name: string;
          network_id?: string | null;
          role: string;
          school_id?: string | null;
        };
        Update: {
          active?: boolean | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          network_id?: string | null;
          role?: string;
          school_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'users_network_id_fkey';
            columns: ['network_id'];
            isOneToOne: false;
            referencedRelation: 'networks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'users_school_id_fkey';
            columns: ['school_id'];
            isOneToOne: false;
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      mv_documentos_ativos: {
        Row: {
          ativos: number | null;
          em_edicao: number | null;
          network_id: string | null;
          pendentes: number | null;
          school_id: string | null;
          tipo: string | null;
          total: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'students_network_id_fkey';
            columns: ['network_id'];
            isOneToOne: false;
            referencedRelation: 'networks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'students_school_id_fkey';
            columns: ['school_id'];
            isOneToOne: false;
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          },
        ];
      };
      mv_metas_atrasadas: {
        Row: {
          descricao: string | null;
          dias_atraso: number | null;
          goal_id: string | null;
          prazo: string | null;
          responsavel_user_id: string | null;
          school_id: string | null;
          student_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'goals_responsavel_user_id_fkey';
            columns: ['responsavel_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'goals_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'students';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'students_school_id_fkey';
            columns: ['school_id'];
            isOneToOne: false;
            referencedRelation: 'schools';
            referencedColumns: ['id'];
          },
        ];
      };
      mv_tempo_aprovacao: {
        Row: {
          mediana: unknown;
          network_id: string | null;
          tempo_medio: unknown;
          tipo: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_network_id_fkey';
            columns: ['network_id'];
            isOneToOne: false;
            referencedRelation: 'networks';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      calcular_completude_secao: {
        Args: {
          p_estudo_caso_id: string;
          p_tipo_secao: Database['public']['Enums']['tipo_secao'];
        };
        Returns: number;
      };
      calcular_progresso_estudo_caso: {
        Args: { p_estudo_caso_id: string };
        Returns: number;
      };
      create_aee_test_data_repo_schema: {
        Args: {
          p_coordenador_id: string;
          p_gestor_id: string;
          p_instituicao_id: string;
          p_prof_aee_id: string;
          p_prof_regente_id: string;
        };
        Returns: Json;
      };
      create_document_version: {
        Args: { p_document_id: string; p_user_id: string };
        Returns: string;
      };
      create_test_auth_user: {
        Args: {
          p_confirm_email?: boolean;
          p_email: string;
          p_full_name: string;
          p_password: string;
          p_role?: string;
        };
        Returns: string;
      };
      create_test_auth_users_default: { Args: never; Returns: Json };
      current_instituicao_id: { Args: never; Returns: string };
      get_my_network_id: { Args: never; Returns: string };
      get_my_role: { Args: never; Returns: string };
      get_my_school_id: { Args: never; Returns: string };
      refresh_analytics: { Args: never; Returns: undefined };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
    };
    Enums: {
      categoria_adaptacao: 'CONTEUDO' | 'METODOLOGIA' | 'AVALIACAO' | 'MATERIAIS';
      estudo_caso_status: 'RASCUNHO' | 'EM_ANALISE' | 'APROVADO' | 'RETORNADO' | 'ARQUIVADO';
      impacto_barreira: 'BAIXO' | 'MEDIO' | 'ALTO';
      meta_status: 'NAO_INICIADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'REVISADA';
      objetivo_status: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
      pei_status: 'RASCUNHO' | 'EM_ANALISE' | 'ATIVO' | 'REVISAO' | 'ARQUIVADO';
      plano_aee_status: 'RASCUNHO' | 'EM_EXECUCAO' | 'REVISAO' | 'CONCLUIDO';
      sexo_enum: 'MASCULINO' | 'FEMININO' | 'OUTRO';
      tipo_barreira: 'ATITUDINAL' | 'ARQUITETONICA' | 'METODOLOGICA' | 'COMUNICACIONAL';
      tipo_intervencao: 'INDIVIDUAL' | 'GRUPO' | 'OBSERVACAO';
      tipo_secao:
        | 'IDENTIFICACAO'
        | 'VOZ_ESTUDANTE'
        | 'CONTEXTO_FAMILIAR'
        | 'CONTEXTO_ESCOLAR'
        | 'AVALIACAO_FUNCIONAL'
        | 'BARREIRAS'
        | 'POTENCIALIDADES'
        | 'PARECER_FINAL';
      turno_enum: 'MATUTINO' | 'VESPERTINO' | 'NOTURNO' | 'INTEGRAL';
      user_role: 'COORDENADOR' | 'PROFESSOR_AEE' | 'PROFESSOR_REGENTE' | 'GESTOR' | 'ADMIN';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      categoria_adaptacao: ['CONTEUDO', 'METODOLOGIA', 'AVALIACAO', 'MATERIAIS'],
      estudo_caso_status: ['RASCUNHO', 'EM_ANALISE', 'APROVADO', 'RETORNADO', 'ARQUIVADO'],
      impacto_barreira: ['BAIXO', 'MEDIO', 'ALTO'],
      meta_status: ['NAO_INICIADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'REVISADA'],
      objetivo_status: ['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO'],
      pei_status: ['RASCUNHO', 'EM_ANALISE', 'ATIVO', 'REVISAO', 'ARQUIVADO'],
      plano_aee_status: ['RASCUNHO', 'EM_EXECUCAO', 'REVISAO', 'CONCLUIDO'],
      sexo_enum: ['MASCULINO', 'FEMININO', 'OUTRO'],
      tipo_barreira: ['ATITUDINAL', 'ARQUITETONICA', 'METODOLOGICA', 'COMUNICACIONAL'],
      tipo_intervencao: ['INDIVIDUAL', 'GRUPO', 'OBSERVACAO'],
      tipo_secao: [
        'IDENTIFICACAO',
        'VOZ_ESTUDANTE',
        'CONTEXTO_FAMILIAR',
        'CONTEXTO_ESCOLAR',
        'AVALIACAO_FUNCIONAL',
        'BARREIRAS',
        'POTENCIALIDADES',
        'PARECER_FINAL',
      ],
      turno_enum: ['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL'],
      user_role: ['COORDENADOR', 'PROFESSOR_AEE', 'PROFESSOR_REGENTE', 'GESTOR', 'ADMIN'],
    },
  },
} as const;
