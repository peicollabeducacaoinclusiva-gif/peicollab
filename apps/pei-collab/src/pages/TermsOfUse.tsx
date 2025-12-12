import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function TermsOfUse() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Termos de Uso</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Última atualização: 30 de novembro de 2025
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-250px)] pr-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-base leading-relaxed mb-6">
                Estes Termos regulam o uso dos aplicativos do ecossistema Inclusão/PEI Collab. Ao utilizar os serviços, você concorda com as regras aqui descritas.
              </p>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Definições</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>"Serviços":</strong> aplicativos e funcionalidades disponibilizados (PEI Collab, Gestão Escolar, Portal do Responsável, etc.).</li>
                  <li><strong>"Usuário":</strong> pessoa física com acesso aos Serviços (profissional, estudante, responsável).</li>
                  <li><strong>"Controlador":</strong> entidade responsável pelo tratamento de dados.</li>
                  <li><strong>"Conta":</strong> credenciais de acesso e configurações associadas ao usuário.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Elegibilidade e Cadastro</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>O acesso pode ser restrito a perfis autorizados (profissionais, responsáveis, estudantes) e a redes/tenants específicos.</li>
                  <li>Você declara que as informações de cadastro são verdadeiras e atualizadas.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Uso da Conta e Segurança</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Mantenha suas credenciais em sigilo e não compartilhe acessos.</li>
                  <li>Notifique imediatamente em caso de suspeita de uso indevido.</li>
                  <li>O sistema pode registrar logs de acesso por motivos de segurança e compliance.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Regras de Uso Aceitável</h2>
                <p className="mb-3">É proibido:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Violar leis aplicáveis, direitos de terceiros ou políticas internas.</li>
                  <li>Tentar acesso não autorizado, engenharia reversa ou exploração de vulnerabilidades.</li>
                  <li>Compartilhar dados pessoais sem base legal ou autorização.</li>
                  <li>Inserir conteúdo ofensivo, discriminatório, ilegal ou que comprometa segurança.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Conteúdos e Propriedade Intelectual</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Conteúdos pedagógicos, documentos e registros pertencem ao Controlador ou ao titular, conforme o caso.</li>
                  <li>As marcas, logotipos e o software são protegidos por legislação aplicável.</li>
                  <li>Você recebe licença limitada para uso pessoal/funcional, não exclusiva e intransferível, conforme perfil e políticas internas.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Privacidade e Consentimentos</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>O uso dos Serviços está sujeito à Política de Privacidade.</li>
                  <li>Consentimentos específicos podem ser exigidos para certas funcionalidades; você pode revogá-los a qualquer tempo, com efeitos prospectivos.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Serviços de Terceiros</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Alguns componentes podem depender de provedores externos (ex.: hospedagem, autenticação, e-mail).</li>
                  <li>Não nos responsabilizamos por conteúdo/práticas de terceiros, mas buscamos relações contratuais com salvaguardas adequadas.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Disponibilidade e Alterações</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Envidamos esforços para manter disponibilidade e qualidade; não garantimos operação ininterrupta.</li>
                  <li>Podemos atualizar, modificar ou descontinuar funcionalidades, buscando preservar continuidade e comunicar mudanças relevantes.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Suporte e Comunicação</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Canais de suporte: [preencher e-mail/canal].</li>
                  <li>Notificações podem ser enviadas via app ou e-mail, conforme preferências e bases legais aplicáveis.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Suspensão e Encerramento</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Podemos suspender/encerrar acessos por violações destes Termos ou requisições legais.</li>
                  <li>Você pode solicitar encerramento voluntário da conta quando aplicável.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Responsabilidade e Garantias</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Os Serviços são fornecidos "no estado em que se encontram", dentro de razoáveis padrões técnicos e legais.</li>
                  <li>Na extensão permitida pela lei, limitamos responsabilidades por danos indiretos, lucros cessantes ou perda de dados, ressalvadas hipóteses legais específicas.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Alterações dos Termos</h2>
                <p>
                  Estes Termos podem ser atualizados; comunicaremos mudanças relevantes e a data de vigência.
                </p>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13. Lei e Foro</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Lei aplicável: legislação brasileira.</li>
                  <li>Foro: [preencher comarca], salvo disposições específicas aplicáveis ao setor público.</li>
                </ul>
              </section>

              <Separator className="my-6" />

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">14. Contato</h2>
                <p>
                  Dúvidas sobre estes Termos: [preencher e-mail/canal].
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
