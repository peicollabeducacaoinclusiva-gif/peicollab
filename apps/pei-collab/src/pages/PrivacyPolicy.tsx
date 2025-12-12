import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Política de Privacidade</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Última atualização: 30 de novembro de 2025
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-250px)] pr-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-base leading-relaxed mb-6">
                Esta Política de Privacidade descreve como tratamos dados pessoais no ecossistema Inclusão/PEI Collab e aplicativos relacionados. Nosso compromisso é cumprir a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018) e demais normas aplicáveis.
              </p>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Controlador e Contato</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Controlador: [preencher com nome da instituição/órgão]</li>
                  <li>CNPJ: [preencher]</li>
                  <li>Endereço: [preencher]</li>
                  <li>Encarregado (DPO): [preencher nome]</li>
                  <li>E-mail de contato (privacidade): [preencher e-mail]</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Dados que Coletamos</h2>
                <p className="mb-3">Podemos coletar e tratar as seguintes categorias:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Identificação:</strong> nome, CPF, RG, data de nascimento, sexo, filiação.</li>
                  <li><strong>Contato:</strong> e-mail, telefone, endereço.</li>
                  <li><strong>Acadêmicos:</strong> matrícula, turma, disciplinas, notas, frequência, documentos escolares, PEI e registros de reuniões.</li>
                  <li><strong>Profissionais (servidores/educadores):</strong> matrícula, unidade, cargos/perfis, ações em sistemas.</li>
                  <li><strong>Acesso e segurança:</strong> logs de acesso, eventos de autenticação, tokens de sessão, IP, agente de usuário.</li>
                  <li><strong>Preferências:</strong> notificações, idioma, configurações de conta.</li>
                  <li><strong>Consentimentos:</strong> termos aceitos, consentimentos ativos, revogações, trilhas relacionadas.</li>
                  <li><strong>Suporte e comunicação:</strong> interações com canais de atendimento e formulários.</li>
                </ul>
                <p className="mt-4 text-sm italic">
                  Dados de crianças e adolescentes são tratados com cuidado reforçado e, sempre que aplicável, com o consentimento dos responsáveis.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Finalidades do Tratamento</h2>
                <p className="mb-3">Utilizamos dados para:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Operar os apps (PEI Collab, Gestão Escolar, Portal do Responsável, etc.).</li>
                  <li>Elaborar, acompanhar e registrar PEIs e reuniões pedagógicas.</li>
                  <li>Gestão acadêmica: matrículas, notas, frequência, documentos.</li>
                  <li>Comunicação com responsáveis e profissionais (notificações, orientações).</li>
                  <li>Cumprir obrigações legais e regulatórias.</li>
                  <li>Garantir segurança (auditoria, controle de acesso, prevenção a fraudes).</li>
                  <li>Produzir relatórios e indicadores institucionais, quando permitido e anonimizado sempre que possível.</li>
                  <li>Melhorar a experiência (usabilidade, acessibilidade, suporte).</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Bases Legais (LGPD)</h2>
                <p className="mb-3">Exemplos de bases legais:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Consentimento (art. 7º, I):</strong> para funcionalidades que dependam de autorização, ex.: compartilhamento específico, comunicações opcionais.</li>
                  <li><strong>Execução de políticas públicas/atribuição legal (art. 7º, III):</strong> quando aplicável ao órgão público.</li>
                  <li><strong>Cumprimento de obrigação legal/regulatória (art. 7º, II).</strong></li>
                  <li><strong>Legítimo interesse (art. 7º, IX):</strong> segurança da informação, melhorias de produto, desde que respeitados direitos dos titulares.</li>
                  <li><strong>Execução de contrato (art. 7º, V):</strong> quando aplicável a serviços educacionais/tecnológicos.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Crianças e Adolescentes</h2>
                <p>
                  Dados de estudantes menores de 18 anos são tratados com foco pedagógico e segurança, observando o melhor interesse do titular. Consentimentos são obtidos dos responsáveis quando exigidos, e registramos trilhas de auditoria e status dos consentimentos.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Cookies e Tecnologias Semelhantes</h2>
                <p className="mb-3">Podemos utilizar cookies/sessão e armazenamento local para:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Manter a sessão autenticada.</li>
                  <li>Salvar preferências (idioma, acessibilidade).</li>
                  <li>Medir uso agregado, com respeito à privacidade e minimização de dados.</li>
                </ul>
                <p className="mt-4">
                  Você pode gerenciar cookies no navegador; algumas funcionalidades podem depender deles.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Compartilhamento de Dados</h2>
                <p className="mb-3">Compartilhamentos podem ocorrer com:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Órgãos e unidades da rede de ensino, nos limites legais.</li>
                  <li>Provedores tecnológicos (ex.: hospedagem, e-mail, autenticação), sob contrato e medidas de segurança.</li>
                  <li>Autoridades públicas, quando requisitado por lei.</li>
                </ul>
                <p className="mt-4">
                  Não vendemos dados pessoais. Qualquer compartilhamento é registrado e limitado à finalidade necessária.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Retenção e Backups</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Retemos dados pelo tempo necessário às finalidades e/ou prazos legais.</li>
                  <li>Backups seguem políticas de integridade e segurança; verificações e logs de execução são mantidos (ex.: integridade por checksum quando disponível).</li>
                  <li>Solicitações de exclusão/anonimização são avaliadas conforme LGPD e normas aplicáveis.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Segurança da Informação</h2>
                <p className="mb-3">Adotamos medidas técnicas e organizacionais:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Autenticação e controle de acesso, RLS (Row Level Security) quando aplicável no banco de dados.</li>
                  <li>Criptografia em repouso e em trânsito (onde suportado).</li>
                  <li>Auditoria de acessos, trilhas de logs e detecção de anomalias.</li>
                  <li>Princípios de minimização e necessidade de acesso.</li>
                </ul>
                <p className="mt-4">
                  Nenhum sistema é 100% seguro, mas atuamos continuamente para reduzir riscos.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Direitos dos Titulares</h2>
                <p className="mb-3">Você tem, entre outros, os seguintes direitos (art. 18, LGPD):</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Confirmação da existência de tratamento e acesso aos dados.</li>
                  <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
                  <li>Anonimização, bloqueio ou eliminação quando cabível.</li>
                  <li>Portabilidade, conforme regulamentação.</li>
                  <li>Informação sobre compartilhamentos e consentimento.</li>
                  <li>Revogação do consentimento a qualquer momento, com efeitos prospectivos.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Exercício de Direitos</h2>
                <p className="mb-3">Para exercer seus direitos:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Utilize as funcionalidades de gestão de consentimentos e privacidade disponíveis no sistema (ex.: painel de consentimentos).</li>
                  <li>Ou entre em contato: [preencher e-mail privacidade].</li>
                </ul>
                <p className="mt-4">
                  Respostas serão fornecidas dentro dos prazos legais.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Transferências Internacionais</h2>
                <p>
                  Se houver transferência para fora do Brasil, serão adotadas salvaguardas adequadas (contratuais, técnicas e organizacionais), em conformidade com a LGPD.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13. Atualizações desta Política</h2>
                <p>
                  Podemos atualizar esta Política para refletir mudanças legais e operacionais. Publicaremos a nova versão com a data de vigência e, quando aplicável, notificaremos usuários.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Anexo Técnico (Resumo Operacional)</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Consentimentos:</strong> o sistema utiliza um serviço canônico de consentimentos, com registro e consulta centralizados (RPCs de banco). O status ativo, histórico e revogação são acessíveis a partir do aplicativo e registrados em trilhas de auditoria.</li>
                  <li><strong>Auditoria e Acesso:</strong> logs de acesso podem ser exportados para fins de compliance e segurança.</li>
                  <li><strong>Segurança de Dados:</strong> camadas de RLS, autenticação, e segregação por tenant quando aplicável.</li>
                  <li><strong>Backups:</strong> execuções de backup e restauração são gerenciadas com registro de integridade e falhas.</li>
                </ul>
                <p className="mt-4 text-sm italic">
                  Este anexo complementa a visão técnica, sem substituir obrigações legais/contratuais.
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
