# 🔗 Integração PEI + Plano de AEE no Relatório

## 🎯 Objetivo

O **Plano de AEE** deve aparecer como **anexo** no relatório PDF do PEI, criando um documento completo e integrado.

---

## 📊 Estrutura do Relatório Integrado

```
┌─────────────────────────────────────────────────────────┐
│  PLANO EDUCACIONAL INDIVIDUALIZADO (PEI)                │
│  Aluno: João Silva                                      │
│  Data: 08/01/2025                                       │
├─────────────────────────────────────────────────────────┤
│  SEÇÃO 1: IDENTIFICAÇÃO DO ALUNO                        │
│  SEÇÃO 2: OBJETIVOS EDUCACIONAIS                        │
│  SEÇÃO 3: ESTRATÉGIAS PEDAGÓGICAS                       │
│  SEÇÃO 4: RECURSOS E MATERIAIS                          │
│  SEÇÃO 5: AVALIAÇÃO                                     │
├─────────────────────────────────────────────────────────┤
│  SEÇÃO 6: FEEDBACKS DOS PROFISSIONAIS DE APOIO          │
│  ✓ Registros diários de socialização                   │
│  ✓ Registros de autonomia                              │
│  ✓ Registros de comportamento                          │
├─────────────────────────────────────────────────────────┤
│  SEÇÃO 7: REUNIÕES REALIZADAS                           │
│  ✓ Reunião 1 - 15/03/2025 - Ata completa               │
│  ✓ Reunião 2 - 20/06/2025 - Ata completa               │
├─────────────────────────────────────────────────────────┤
│  SEÇÃO 8: AVALIAÇÕES CÍCLICAS                           │
│  ✓ I Ciclo - Março/2025                                │
│  ✓ II Ciclo - Junho/2025                               │
│  ✓ III Ciclo - Novembro/2025                           │
├─────────────────────────────────────────────────────────┤
│  ╔═══════════════════════════════════════════════════╗  │
│  ║ ANEXO A: PLANO DE ATENDIMENTO EDUCACIONAL        ║  │
│  ║          ESPECIALIZADO (AEE)                      ║  │
│  ╚═══════════════════════════════════════════════════╝  │
│                                                         │
│  A.1 IDENTIFICAÇÃO                                      │
│      • Aluno: João Silva                                │
│      • Professor AEE: Maria Santos                      │
│      • Ano Letivo: 2025                                 │
│                                                         │
│  A.2 ANAMNESE                                           │
│      • Histórico Médico                                 │
│      • Desenvolvimento                                  │
│      • Contexto Familiar                                │
│                                                         │
│  A.3 DIAGNÓSTICO                                        │
│      • Tipo de Deficiência: Deficiência Intelectual    │
│      • Ferramentas Aplicadas: WISC-IV, Vineland        │
│      • Resultados                                       │
│                                                         │
│  A.4 BARREIRAS IDENTIFICADAS                            │
│      • Barreiras de Aprendizagem                        │
│      • Barreiras de Acessibilidade                      │
│      • Barreiras de Comunicação                         │
│                                                         │
│  A.5 QUEIXAS                                            │
│      • Queixa da Escola                                 │
│      • Queixa da Família                                │
│      • Queixa do Aluno                                  │
│                                                         │
│  A.6 RECURSOS E ADAPTAÇÕES                              │
│      • Recursos Materiais                               │
│      • Adaptações Curriculares                          │
│      • Adaptações de Avaliação                          │
│      • Adaptações Espaciais                             │
│                                                         │
│  A.7 OBJETIVOS DE ENSINO                                │
│      • Objetivo 1: [descrição]                          │
│      • Objetivo 2: [descrição]                          │
│      • Objetivo 3: [descrição]                          │
│                                                         │
│  A.8 MÉTODOS DE AVALIAÇÃO                               │
│      • Instrumentos Utilizados                          │
│      • Periodicidade                                    │
│                                                         │
│  A.9 ACOMPANHAMENTOS                                    │
│      • Frequência: 2x por semana                        │
│      • Duração: 50 minutos                              │
│      • Registro de Sessões                              │
│                                                         │
│  A.10 ENCAMINHAMENTOS                                   │
│       • Fonoaudiólogo - 10/02/2025                      │
│       • Psicólogo - 15/02/2025                          │
│                                                         │
│  A.11 ORIENTAÇÕES                                       │
│       → Para a Família                                  │
│       → Para a Escola                                   │
│       → Para a Equipe de Apoio                          │
│                                                         │
│  A.12 AVALIAÇÕES CÍCLICAS DO PLANO DE AEE               │
│       ✓ I Ciclo - Progresso e Ajustes                   │
│       ✓ II Ciclo - Evolução                             │
│       ✓ III Ciclo - Resultados Finais                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Implementação no Código

### **Passo 1: Buscar Plano de AEE Vinculado ao PEI**

No arquivo de geração de PDF do PEI:

```typescript
// src/lib/generatePEIReport.ts

import { supabase } from '@pei/database';

export async function generatePEIReport(peiId: string) {
  // 1. Buscar dados do PEI
  const { data: pei, error: peiError } = await supabase
    .from('peis')
    .select(`
      *,
      student:students(*),
      teachers:pei_teachers(
        user:profiles(full_name)
      )
    `)
    .eq('id', peiId)
    .single();

  if (peiError) throw peiError;

  // 2. Buscar Plano de AEE vinculado
  const { data: planoAEE, error: aeeError } = await supabase
    .from('plano_aee')
    .select(`
      *,
      created_by_user:profiles!created_by(full_name)
    `)
    .eq('pei_id', peiId)
    .single();

  // Se não houver Plano de AEE, ignorar (não é erro)
  const hasPlanoAEE = !aeeError && planoAEE;

  // 3. Buscar feedbacks do PA
  const { data: feedbacks } = await supabase
    .from('support_professional_feedbacks')
    .select(`
      *,
      support_professional:profiles!support_professional_id(full_name)
    `)
    .eq('student_id', pei.student_id)
    .order('date', { ascending: false });

  // 4. Buscar reuniões
  const { data: meetings } = await supabase
    .from('pei_meetings')
    .select(`
      *,
      pei_meeting_peis!inner(pei_id)
    `)
    .eq('pei_meeting_peis.pei_id', peiId);

  // 5. Buscar avaliações cíclicas
  const { data: evaluations } = await supabase
    .from('pei_evaluations')
    .select('*')
    .eq('pei_id', peiId)
    .order('cycle');

  // 6. Gerar PDF
  return generatePDF({
    pei,
    planoAEE: hasPlanoAEE ? planoAEE : null,
    feedbacks: feedbacks || [],
    meetings: meetings || [],
    evaluations: evaluations || [],
  });
}
```

---

### **Passo 2: Estruturar o PDF com o Plano de AEE**

```typescript
// src/lib/pdfGenerator.ts

import jsPDF from 'jspdf';

export function generatePDF(data: {
  pei: any;
  planoAEE: any | null;
  feedbacks: any[];
  meetings: any[];
  evaluations: any[];
}) {
  const doc = new jsPDF();
  let yPosition = 20;

  // ===== CABEÇALHO =====
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PLANO EDUCACIONAL INDIVIDUALIZADO (PEI)', 105, yPosition, {
    align: 'center',
  });
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Aluno: ${data.pei.student.full_name}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition);
  yPosition += 15;

  // ===== SEÇÕES DO PEI =====
  yPosition = addPEISections(doc, data.pei, yPosition);

  // ===== FEEDBACKS DO PA =====
  if (data.feedbacks.length > 0) {
    yPosition = addPAFeedbacks(doc, data.feedbacks, yPosition);
  }

  // ===== REUNIÕES =====
  if (data.meetings.length > 0) {
    yPosition = addMeetings(doc, data.meetings, yPosition);
  }

  // ===== AVALIAÇÕES CÍCLICAS =====
  if (data.evaluations.length > 0) {
    yPosition = addEvaluations(doc, data.evaluations, yPosition);
  }

  // ===== PLANO DE AEE (ANEXO) =====
  if (data.planoAEE) {
    doc.addPage(); // Nova página para o anexo
    yPosition = 20;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 200); // Azul
    doc.text('ANEXO A: PLANO DE ATENDIMENTO EDUCACIONAL ESPECIALIZADO (AEE)', 105, yPosition, {
      align: 'center',
    });
    yPosition += 15;

    doc.setTextColor(0, 0, 0); // Preto
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    // A.1 IDENTIFICAÇÃO
    doc.setFont('helvetica', 'bold');
    doc.text('A.1 IDENTIFICAÇÃO', 20, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Aluno: ${data.pei.student.full_name}`, 25, yPosition);
    yPosition += 5;
    doc.text(`Professor AEE: ${data.planoAEE.created_by_user?.full_name || 'N/A'}`, 25, yPosition);
    yPosition += 5;
    doc.text(`Ano Letivo: 2025`, 25, yPosition);
    yPosition += 10;

    // A.2 ANAMNESE
    if (data.planoAEE.anamnesis_data) {
      doc.setFont('helvetica', 'bold');
      doc.text('A.2 ANAMNESE', 20, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      
      const anamneseText = JSON.stringify(data.planoAEE.anamnesis_data, null, 2);
      const anamneseLines = doc.splitTextToSize(anamneseText, 170);
      doc.text(anamneseLines, 25, yPosition);
      yPosition += anamneseLines.length * 5 + 5;
    }

    // A.3 DIAGNÓSTICO
    if (data.planoAEE.diagnosis_tools && Array.isArray(data.planoAEE.diagnosis_tools)) {
      doc.setFont('helvetica', 'bold');
      doc.text('A.3 DIAGNÓSTICO', 20, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      
      data.planoAEE.diagnosis_tools.forEach((tool: any, index: number) => {
        doc.text(`• ${tool.tool_name || `Ferramenta ${index + 1}`}`, 25, yPosition);
        yPosition += 5;
        if (tool.results) {
          const resultLines = doc.splitTextToSize(`  Resultados: ${tool.results}`, 165);
          doc.text(resultLines, 25, yPosition);
          yPosition += resultLines.length * 5;
        }
        yPosition += 3;
      });
      yPosition += 5;
    }

    // A.4 BARREIRAS
    if (data.planoAEE.learning_barriers) {
      doc.setFont('helvetica', 'bold');
      doc.text('A.4 BARREIRAS IDENTIFICADAS', 20, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      
      const barriersData = Array.isArray(data.planoAEE.learning_barriers)
        ? data.planoAEE.learning_barriers
        : [data.planoAEE.learning_barriers];
      
      barriersData.forEach((barrier: any) => {
        const barrierText = typeof barrier === 'string' ? barrier : JSON.stringify(barrier);
        const barrierLines = doc.splitTextToSize(`• ${barrierText}`, 170);
        doc.text(barrierLines, 25, yPosition);
        yPosition += barrierLines.length * 5 + 3;
      });
      yPosition += 5;
    }

    // A.5 QUEIXAS
    if (data.planoAEE.school_complaint || data.planoAEE.family_complaint) {
      doc.setFont('helvetica', 'bold');
      doc.text('A.5 QUEIXAS', 20, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      
      if (data.planoAEE.school_complaint) {
        doc.text('Queixa da Escola:', 25, yPosition);
        yPosition += 5;
        const schoolLines = doc.splitTextToSize(data.planoAEE.school_complaint, 165);
        doc.text(schoolLines, 25, yPosition);
        yPosition += schoolLines.length * 5 + 5;
      }
      
      if (data.planoAEE.family_complaint) {
        doc.text('Queixa da Família:', 25, yPosition);
        yPosition += 5;
        const familyLines = doc.splitTextToSize(data.planoAEE.family_complaint, 165);
        doc.text(familyLines, 25, yPosition);
        yPosition += familyLines.length * 5 + 5;
      }
      yPosition += 5;
    }

    // A.6 RECURSOS E ADAPTAÇÕES
    if (data.planoAEE.resources || data.planoAEE.adaptations) {
      doc.setFont('helvetica', 'bold');
      doc.text('A.6 RECURSOS E ADAPTAÇÕES', 20, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      
      if (data.planoAEE.resources) {
        doc.text('Recursos:', 25, yPosition);
        yPosition += 5;
        const resourcesText = JSON.stringify(data.planoAEE.resources, null, 2);
        const resourcesLines = doc.splitTextToSize(resourcesText, 165);
        doc.text(resourcesLines, 25, yPosition);
        yPosition += resourcesLines.length * 5 + 5;
      }
      
      if (data.planoAEE.adaptations) {
        doc.text('Adaptações:', 25, yPosition);
        yPosition += 5;
        const adaptText = JSON.stringify(data.planoAEE.adaptations, null, 2);
        const adaptLines = doc.splitTextToSize(adaptText, 165);
        doc.text(adaptLines, 25, yPosition);
        yPosition += adaptLines.length * 5 + 5;
      }
      yPosition += 5;
    }

    // A.7 OBJETIVOS DE ENSINO
    if (data.planoAEE.teaching_objectives) {
      doc.setFont('helvetica', 'bold');
      doc.text('A.7 OBJETIVOS DE ENSINO', 20, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      
      const objectivesData = Array.isArray(data.planoAEE.teaching_objectives)
        ? data.planoAEE.teaching_objectives
        : [data.planoAEE.teaching_objectives];
      
      objectivesData.forEach((obj: any, index: number) => {
        const objText = typeof obj === 'string' ? obj : JSON.stringify(obj);
        doc.text(`${index + 1}. ${objText}`, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    // A.8 MÉTODOS DE AVALIAÇÃO
    if (data.planoAEE.evaluation_methodology) {
      doc.setFont('helvetica', 'bold');
      doc.text('A.8 MÉTODOS DE AVALIAÇÃO', 20, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      
      const evalLines = doc.splitTextToSize(data.planoAEE.evaluation_methodology, 170);
      doc.text(evalLines, 25, yPosition);
      yPosition += evalLines.length * 5 + 10;
    }

    // A.9 ACOMPANHAMENTOS
    if (data.planoAEE.follow_ups) {
      doc.setFont('helvetica', 'bold');
      doc.text('A.9 ACOMPANHAMENTOS', 20, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      
      const followUpsText = JSON.stringify(data.planoAEE.follow_ups, null, 2);
      const followUpsLines = doc.splitTextToSize(followUpsText, 170);
      doc.text(followUpsLines, 25, yPosition);
      yPosition += followUpsLines.length * 5 + 10;
    }

    // A.10 ENCAMINHAMENTOS
    if (data.planoAEE.referrals) {
      doc.setFont('helvetica', 'bold');
      doc.text('A.10 ENCAMINHAMENTOS', 20, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      
      const referralsText = JSON.stringify(data.planoAEE.referrals, null, 2);
      const referralsLines = doc.splitTextToSize(referralsText, 170);
      doc.text(referralsLines, 25, yPosition);
      yPosition += referralsLines.length * 5 + 10;
    }

    // A.11 ORIENTAÇÕES
    if (data.planoAEE.family_guidance || data.planoAEE.school_guidance || data.planoAEE.other_guidance) {
      doc.setFont('helvetica', 'bold');
      doc.text('A.11 ORIENTAÇÕES', 20, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      
      if (data.planoAEE.family_guidance) {
        doc.text('Para a Família:', 25, yPosition);
        yPosition += 5;
        const familyGuidLines = doc.splitTextToSize(data.planoAEE.family_guidance, 165);
        doc.text(familyGuidLines, 25, yPosition);
        yPosition += familyGuidLines.length * 5 + 5;
      }
      
      if (data.planoAEE.school_guidance) {
        doc.text('Para a Escola:', 25, yPosition);
        yPosition += 5;
        const schoolGuidLines = doc.splitTextToSize(data.planoAEE.school_guidance, 165);
        doc.text(schoolGuidLines, 25, yPosition);
        yPosition += schoolGuidLines.length * 5 + 5;
      }
      
      if (data.planoAEE.other_guidance) {
        doc.text('Outras Orientações:', 25, yPosition);
        yPosition += 5;
        const otherGuidLines = doc.splitTextToSize(data.planoAEE.other_guidance, 165);
        doc.text(otherGuidLines, 25, yPosition);
        yPosition += otherGuidLines.length * 5 + 5;
      }
      yPosition += 5;
    }

    // A.12 AVALIAÇÕES CÍCLICAS DO AEE
    if (data.planoAEE.cycle_1_evaluation || data.planoAEE.cycle_2_evaluation || data.planoAEE.cycle_3_evaluation) {
      doc.setFont('helvetica', 'bold');
      doc.text('A.12 AVALIAÇÕES CÍCLICAS DO PLANO DE AEE', 20, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      
      if (data.planoAEE.cycle_1_evaluation) {
        doc.text('I Ciclo:', 25, yPosition);
        yPosition += 5;
        const cycle1Text = JSON.stringify(data.planoAEE.cycle_1_evaluation, null, 2);
        const cycle1Lines = doc.splitTextToSize(cycle1Text, 165);
        doc.text(cycle1Lines, 25, yPosition);
        yPosition += cycle1Lines.length * 5 + 5;
      }
      
      if (data.planoAEE.cycle_2_evaluation) {
        doc.text('II Ciclo:', 25, yPosition);
        yPosition += 5;
        const cycle2Text = JSON.stringify(data.planoAEE.cycle_2_evaluation, null, 2);
        const cycle2Lines = doc.splitTextToSize(cycle2Text, 165);
        doc.text(cycle2Lines, 25, yPosition);
        yPosition += cycle2Lines.length * 5 + 5;
      }
      
      if (data.planoAEE.cycle_3_evaluation) {
        doc.text('III Ciclo:', 25, yPosition);
        yPosition += 5;
        const cycle3Text = JSON.stringify(data.planoAEE.cycle_3_evaluation, null, 2);
        const cycle3Lines = doc.splitTextToSize(cycle3Text, 165);
        doc.text(cycle3Lines, 25, yPosition);
        yPosition += cycle3Lines.length * 5 + 5;
      }
    }
  }

  // Retornar o PDF
  return doc;
}

// Funções auxiliares (addPEISections, addPAFeedbacks, etc.)
// ...
```

---

## 🎨 Customização Visual do Anexo

Para destacar o anexo no PDF:

```typescript
// Adicionar borda ao anexo
doc.setDrawColor(0, 100, 200); // Azul
doc.setLineWidth(0.5);
doc.rect(15, 15, 180, 10); // Borda no título

// Adicionar marca d'água
doc.setTextColor(200, 200, 200); // Cinza claro
doc.setFontSize(40);
doc.text('ANEXO', 105, 150, {
  align: 'center',
  angle: 45,
});
doc.setTextColor(0, 0, 0); // Voltar ao preto
```

---

## ✅ Checklist de Implementação

- [x] Migração SQL do Plano de AEE aplicada
- [x] App Plano de AEE criado e rodando
- [ ] Função de busca do Plano de AEE por `pei_id` implementada
- [ ] Seção de anexo adicionada ao gerador de PDF
- [ ] Teste de geração de PDF com Plano de AEE
- [ ] Teste de PDF sem Plano de AEE (deve funcionar normalmente)

---

## 🧪 Como Testar

1. Crie um PEI para um aluno
2. Crie um Plano de AEE vinculado ao PEI (usando o `pei_id`)
3. No PEI Collab, vá até o PEI
4. Clique em "Gerar Relatório PDF"
5. **Verifique**: O PDF deve ter o anexo com o Plano de AEE completo

---

## 🎉 Resultado Final

O relatório PDF terá:

✅ **Seções do PEI** (todas as informações originais)  
✅ **Feedbacks do PA** (se houver)  
✅ **Reuniões** (se houver)  
✅ **Avaliações Cíclicas do PEI**  
✅ **ANEXO A: Plano de AEE** (completo e formatado)

Criando assim um **documento único e integrado** para cada aluno! 🚀

