// Edge Function para gerar arquivos .txt no layout do Inep
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CensoRecord {
  tipo: string;
  dados: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { school_id, academic_year, record_types } = await req.json();

    if (!school_id || !academic_year) {
      return new Response(
        JSON.stringify({ error: "school_id e academic_year são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const records: CensoRecord[] = [];

    // Registro 00: Identificação da Escola
    if (!record_types || record_types.includes("00")) {
      const { data: school } = await supabaseClient
        .from("schools")
        .select("*")
        .eq("id", school_id)
        .single();

      if (school) {
        records.push({
          tipo: "00",
          dados: {
            codigo_inep: school.codigo_inep?.padStart(8, "0") || "00000000",
            nome_escola: school.school_name?.substring(0, 100) || "",
            dependencia_administrativa: school.dependencia_administrativa || "1",
            localizacao: school.location_type || "1",
            // Adicionar mais campos conforme layout oficial
          },
        });
      }
    }

    // Registro 10: Turma
    if (!record_types || record_types.includes("10")) {
      const { data: classes } = await supabaseClient
        .from("classes")
        .select("*")
        .eq("school_id", school_id)
        .eq("is_active", true);

      if (classes) {
        for (const cls of classes) {
          records.push({
            tipo: "10",
            dados: {
              codigo_inep_escola: school?.codigo_inep?.padStart(8, "0") || "00000000",
              codigo_inep_turma: cls.codigo_inep_turma?.padStart(20, "0") || "",
              nome_turma: cls.class_name?.substring(0, 50) || "",
              etapa_ensino: cls.education_level || "",
              serie_ano: cls.grade || "",
              turno: cls.shift || "",
              // Adicionar mais campos conforme layout oficial
            },
          });
        }
      }
    }

    // Registro 20: Aluno
    if (!record_types || record_types.includes("20")) {
      const { data: students } = await supabaseClient
        .from("students")
        .select("*")
        .eq("school_id", school_id)
        .eq("is_active", true);

      if (students) {
        for (const student of students) {
          records.push({
            tipo: "20",
            dados: {
              codigo_inep_aluno: student.codigo_inep_aluno?.padStart(12, "0") || "",
              nome_aluno: student.name?.substring(0, 100) || "",
              data_nascimento: student.date_of_birth
                ? new Date(student.date_of_birth).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).replace(/\//g, "")
                : "",
              cpf: student.cpf?.replace(/\D/g, "").padStart(11, "0") || "",
              sexo: student.gender || "",
              cor_raca: student.race || "",
              // Adicionar mais campos conforme layout oficial
            },
          });
        }
      }
    }

    // Registro 30: Matrícula
    if (!record_types || record_types.includes("30")) {
      const { data: enrollments } = await supabaseClient
        .from("student_enrollments")
        .select("*, students:student_id(codigo_inep_aluno)")
        .eq("school_id", school_id)
        .eq("academic_year", academic_year)
        .eq("status", "active");

      if (enrollments) {
        for (const enrollment of enrollments) {
          const student = enrollment.students as any;
          records.push({
            tipo: "30",
            dados: {
              codigo_inep_aluno: student?.codigo_inep_aluno?.padStart(12, "0") || "",
              codigo_inep_matricula: enrollment.codigo_inep_matricula?.padStart(20, "0") || "",
              ano_letivo: academic_year.toString(),
              serie_ano: enrollment.grade || "",
              turno: enrollment.shift || "",
              data_matricula: enrollment.enrollment_date
                ? new Date(enrollment.enrollment_date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).replace(/\//g, "")
                : "",
            },
          });
        }
      }
    }

    // Registro 40: Docente
    if (!record_types || record_types.includes("40")) {
      const { data: professionals } = await supabaseClient
        .from("professionals")
        .select("*")
        .eq("school_id", school_id)
        .eq("is_active", true)
        .in("role", ["teacher", "aee_teacher"]);

      if (professionals) {
        for (const prof of professionals) {
          records.push({
            tipo: "40",
            dados: {
              codigo_inep_escola: school?.codigo_inep?.padStart(8, "0") || "00000000",
              codigo_inep_servidor: prof.codigo_inep_servidor?.padStart(12, "0") || "",
              nome_servidor: prof.full_name?.substring(0, 100) || "",
              cpf: prof.cpf?.replace(/\D/g, "").padStart(11, "0") || "",
              data_nascimento: prof.date_of_birth
                ? new Date(prof.date_of_birth).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).replace(/\//g, "")
                : "",
              sexo: prof.gender || "",
              formacao: prof.formation || "",
            },
          });
        }
      }
    }

    // Registro 50: Vínculo docente/turma
    if (!record_types || record_types.includes("50")) {
      const { data: classTeachers } = await supabaseClient
        .from("class_teachers")
        .select("*, classes:class_id(codigo_inep_turma), professionals:professional_id(codigo_inep_servidor)")
        .eq("academic_year", academic_year);

      if (classTeachers) {
        for (const ct of classTeachers) {
          const cls = ct.classes as any;
          const prof = ct.professionals as any;
          if (cls && cls.school_id === school_id) {
            records.push({
              tipo: "50",
              dados: {
                codigo_inep_escola: school?.codigo_inep?.padStart(8, "0") || "00000000",
                codigo_inep_turma: cls.codigo_inep_turma?.padStart(20, "0") || "",
                codigo_inep_servidor: prof?.codigo_inep_servidor?.padStart(12, "0") || "",
                carga_horaria: ct.hours_per_week?.toString() || "0",
                disciplina: ct.subject_id || "",
              },
            });
          }
        }
      }
    }

    // Registro 60: Gestor escolar
    if (!record_types || record_types.includes("60")) {
      const { data: directors } = await supabaseClient
        .from("professionals")
        .select("*")
        .eq("school_id", school_id)
        .eq("is_active", true)
        .in("role", ["school_director", "school_manager"]);

      if (directors) {
        for (const director of directors) {
          records.push({
            tipo: "60",
            dados: {
              codigo_inep_escola: school?.codigo_inep?.padStart(8, "0") || "00000000",
              codigo_inep_servidor: director.codigo_inep_servidor?.padStart(12, "0") || "",
              nome_gestor: director.full_name?.substring(0, 100) || "",
              cpf: director.cpf?.replace(/\D/g, "").padStart(11, "0") || "",
              cargo: director.role || "",
            },
          });
        }
      }
    }

    // Registro 70: Profissionais não docentes
    if (!record_types || record_types.includes("70")) {
      const { data: nonTeachers } = await supabaseClient
        .from("professionals")
        .select("*")
        .eq("school_id", school_id)
        .eq("is_active", true)
        .not("role", "in", "('teacher', 'aee_teacher', 'school_director', 'school_manager')");

      if (nonTeachers) {
        for (const prof of nonTeachers) {
          records.push({
            tipo: "70",
            dados: {
              codigo_inep_escola: school?.codigo_inep?.padStart(8, "0") || "00000000",
              codigo_inep_servidor: prof.codigo_inep_servidor?.padStart(12, "0") || "",
              nome_servidor: prof.full_name?.substring(0, 100) || "",
              cpf: prof.cpf?.replace(/\D/g, "").padStart(11, "0") || "",
              funcao: prof.role || "",
            },
          });
        }
      }
    }

    // Registro 80: Movimento e rendimento
    if (!record_types || record_types.includes("80")) {
      const { data: enrollments } = await supabaseClient
        .from("student_enrollments")
        .select("*, students:student_id(codigo_inep_aluno)")
        .eq("school_id", school_id)
        .eq("academic_year", academic_year);

      if (enrollments) {
        for (const enrollment of enrollments) {
          const student = enrollment.students as any;
          // Buscar dados de rendimento (simplificado - expandir conforme necessário)
          records.push({
            tipo: "80",
            dados: {
              codigo_inep_aluno: student?.codigo_inep_aluno?.padStart(12, "0") || "",
              codigo_inep_matricula: enrollment.codigo_inep_matricula?.padStart(20, "0") || "",
              ano_letivo: academic_year.toString(),
              situacao_final: enrollment.status === "active" ? "1" : "2", // 1=Cursando, 2=Transferido, etc.
              data_saida: enrollment.end_date
                ? new Date(enrollment.end_date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).replace(/\//g, "")
                : "",
            },
          });
        }
      }
    }

    // Gerar arquivo .txt no formato posicional do Inep
    const lines: string[] = [];

    for (const record of records) {
      // Formato posicional (ajustar conforme layout oficial do Inep)
      let line = "";
      
      switch (record.tipo) {
        case "00":
          // Layout registro 00 (exemplo - ajustar conforme oficial)
          line = `00${record.dados.codigo_inep.padStart(8, "0")}${record.dados.nome_escola.padEnd(100, " ")}`;
          break;
        case "10":
          // Layout registro 10
          line = `10${record.dados.codigo_inep_escola.padStart(8, "0")}${record.dados.codigo_inep_turma.padStart(20, "0")}${record.dados.nome_turma.padEnd(50, " ")}`;
          break;
        case "20":
          // Layout registro 20
          line = `20${record.dados.codigo_inep_aluno.padStart(12, "0")}${record.dados.nome_aluno.padEnd(100, " ")}${record.dados.data_nascimento.padStart(8, "0")}`;
          break;
        case "30":
          line = `30${record.dados.codigo_inep_aluno.padStart(12, "0")}${record.dados.codigo_inep_matricula.padStart(20, "0")}${record.dados.ano_letivo.padStart(4, "0")}${record.dados.serie_ano?.padEnd(10, " ") || "".padEnd(10, " ")}${record.dados.turno?.padEnd(1, " ") || "".padEnd(1, " ")}${record.dados.data_matricula.padStart(8, "0")}`;
          break;
        case "40":
          line = `40${record.dados.codigo_inep_escola.padStart(8, "0")}${record.dados.codigo_inep_servidor.padStart(12, "0")}${record.dados.nome_servidor.padEnd(100, " ")}${record.dados.cpf.padStart(11, "0")}${record.dados.data_nascimento.padStart(8, "0")}${record.dados.sexo?.padEnd(1, " ") || "".padEnd(1, " ")}${record.dados.formacao?.padEnd(50, " ") || "".padEnd(50, " ")}`;
          break;
        case "50":
          line = `50${record.dados.codigo_inep_escola.padStart(8, "0")}${record.dados.codigo_inep_turma.padStart(20, "0")}${record.dados.codigo_inep_servidor.padStart(12, "0")}${record.dados.carga_horaria.padStart(3, "0")}${record.dados.disciplina?.padEnd(20, " ") || "".padEnd(20, " ")}`;
          break;
        case "60":
          line = `60${record.dados.codigo_inep_escola.padStart(8, "0")}${record.dados.codigo_inep_servidor.padStart(12, "0")}${record.dados.nome_gestor.padEnd(100, " ")}${record.dados.cpf.padStart(11, "0")}${record.dados.cargo?.padEnd(30, " ") || "".padEnd(30, " ")}`;
          break;
        case "70":
          line = `70${record.dados.codigo_inep_escola.padStart(8, "0")}${record.dados.codigo_inep_servidor.padStart(12, "0")}${record.dados.nome_servidor.padEnd(100, " ")}${record.dados.cpf.padStart(11, "0")}${record.dados.funcao?.padEnd(30, " ") || "".padEnd(30, " ")}`;
          break;
        case "80":
          line = `80${record.dados.codigo_inep_aluno.padStart(12, "0")}${record.dados.codigo_inep_matricula.padStart(20, "0")}${record.dados.ano_letivo.padStart(4, "0")}${record.dados.situacao_final.padStart(1, "0")}${record.dados.data_saida.padStart(8, "0")}`;
          break;
        default:
          continue;
      }
      
      lines.push(line);
    }

    const fileContent = lines.join("\n");
    const fileName = `CENSO_${school_id}_${academic_year}_${new Date().toISOString().split("T")[0]}.txt`;

    // Salvar arquivo no storage (opcional)
    // const { data: uploadData, error: uploadError } = await supabaseClient.storage
    //   .from("censo-exports")
    //   .upload(fileName, new Blob([fileContent], { type: "text/plain" }));

    return new Response(
      JSON.stringify({
        success: true,
        fileName,
        recordCount: records.length,
        fileContent: fileContent.substring(0, 1000), // Primeiros 1000 caracteres para preview
        downloadUrl: null, // uploadData?.path || null
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

