# 📧 Templates de E-mail - PEI Collab

Templates profissionais e responsivos para os e-mails do Supabase Auth.

---

## 🔐 1. Reset Password (Recuperação de Senha)

### Subject:
```
Redefinir sua senha - PEI Collab
```

### Body:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha - PEI Collab</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                PEI Collab
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Sistema de Planos Educacionais Individualizados
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Redefinir sua senha
              </h2>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Olá,
              </p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Recebemos uma solicitação para redefinir a senha da sua conta no <strong>PEI Collab</strong>. 
                Clique no botão abaixo para criar uma nova senha:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                      Redefinir Senha
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Ou copie e cole este link no seu navegador:
              </p>
              <p style="margin: 8px 0 0 0; color: #3b82f6; font-size: 14px; word-break: break-all; line-height: 1.6;">
                {{ .ConfirmationURL }}
              </p>
              
              <div style="margin: 32px 0 0 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Importante:</strong> Este link expira em 1 hora por motivos de segurança. 
                  Se você não solicitou esta redefinição, ignore este e-mail.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Este é um e-mail automático, por favor não responda.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2025 PEI Collab. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## ✅ 2. Confirm Signup (Confirmação de Cadastro)

### Subject:
```
Confirme seu cadastro - PEI Collab
```

### Body:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmar Cadastro - PEI Collab</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                PEI Collab
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Sistema de Planos Educacionais Individualizados
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); border-radius: 50%; line-height: 64px; font-size: 32px;">
                  ✓
                </div>
              </div>
              
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 600; text-align: center;">
                Bem-vindo ao PEI Collab!
              </h2>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
                Olá,
              </p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Obrigado por se cadastrar no <strong>PEI Collab</strong>! Para ativar sua conta e começar a usar o sistema, 
                confirme seu e-mail clicando no botão abaixo:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                      Confirmar E-mail
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Ou copie e cole este link no seu navegador:
              </p>
              <p style="margin: 8px 0 0 0; color: #3b82f6; font-size: 14px; word-break: break-all; line-height: 1.6; text-align: center;">
                {{ .ConfirmationURL }}
              </p>
              
              <div style="margin: 32px 0 0 0; padding: 20px; background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 6px;">
                <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                  <strong>💡 Dica:</strong> Após confirmar seu e-mail, você poderá acessar todas as funcionalidades do sistema 
                  e começar a criar e gerenciar Planos Educacionais Individualizados.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Este é um e-mail automático, por favor não responda.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2025 PEI Collab. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🎫 3. Invite (Convite)

### Subject:
```
Você foi convidado para o PEI Collab
```

### Body:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite - PEI Collab</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                PEI Collab
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Sistema de Planos Educacionais Individualizados
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); border-radius: 50%; line-height: 64px; font-size: 32px; color: #ffffff;">
                  ✉️
                </div>
              </div>
              
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 600; text-align: center;">
                Você foi convidado!
              </h2>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Olá,
              </p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Você foi convidado para criar uma conta no <strong>PEI Collab</strong> em <strong>{{ .SiteURL }}</strong>. 
                Este sistema permite criar e gerenciar Planos Educacionais Individualizados de forma colaborativa.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
                      Aceitar Convite
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Ou copie e cole este link no seu navegador:
              </p>
              <p style="margin: 8px 0 0 0; color: #3b82f6; font-size: 14px; word-break: break-all; line-height: 1.6; text-align: center;">
                {{ .ConfirmationURL }}
              </p>
              
              <div style="margin: 32px 0 0 0; padding: 20px; background-color: #f3e8ff; border-left: 4px solid #8b5cf6; border-radius: 6px;">
                <p style="margin: 0; color: #6b21a8; font-size: 14px; line-height: 1.6;">
                  <strong>📋 O que você poderá fazer:</strong>
                </p>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #6b21a8; font-size: 14px; line-height: 1.8;">
                  <li>Criar e editar Planos Educacionais Individualizados</li>
                  <li>Colaborar com outros profissionais da educação</li>
                  <li>Acompanhar o progresso dos alunos</li>
                  <li>Gerar relatórios e documentos</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Este é um e-mail automático, por favor não responda.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2025 PEI Collab. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🔮 4. Magic Link (Link Mágico)

### Subject:
```
Seu link de acesso - PEI Collab
```

### Body:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link de Acesso - PEI Collab</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                PEI Collab
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Sistema de Planos Educacionais Individualizados
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); border-radius: 50%; line-height: 64px; font-size: 32px; color: #ffffff;">
                  ✨
                </div>
              </div>
              
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 600; text-align: center;">
                Seu link de acesso
              </h2>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Olá,
              </p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Clique no botão abaixo para fazer login no <strong>PEI Collab</strong> sem precisar de senha:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(6, 182, 212, 0.3);">
                      Entrar no Sistema
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Ou copie e cole este link no seu navegador:
              </p>
              <p style="margin: 8px 0 0 0; color: #3b82f6; font-size: 14px; word-break: break-all; line-height: 1.6; text-align: center;">
                {{ .ConfirmationURL }}
              </p>
              
              <div style="margin: 32px 0 0 0; padding: 20px; background-color: #ecfeff; border-left: 4px solid #06b6d4; border-radius: 6px;">
                <p style="margin: 0; color: #164e63; font-size: 14px; line-height: 1.6;">
                  <strong>🔒 Segurança:</strong> Este link é único e expira em 1 hora. 
                  Se você não solicitou este acesso, ignore este e-mail.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Este é um e-mail automático, por favor não responda.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2025 PEI Collab. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📧 5. Confirm Email Change (Confirmar Mudança de E-mail)

### Subject:
```
Confirme a alteração do seu e-mail - PEI Collab
```

### Body:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmar Alteração de E-mail - PEI Collab</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                PEI Collab
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Sistema de Planos Educacionais Individualizados
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Confirmar alteração de e-mail
              </h2>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Olá,
              </p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Você solicitou a alteração do e-mail da sua conta no <strong>PEI Collab</strong>.
              </p>
              
              <div style="margin: 24px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;">
                  E-mail atual:
                </p>
                <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">
                  {{ .Email }}
                </p>
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;">
                  Novo e-mail:
                </p>
                <p style="margin: 0; color: #1f2937; font-size: 16px;">
                  {{ .NewEmail }}
                </p>
              </div>
              
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Para confirmar esta alteração, clique no botão abaixo:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">
                      Confirmar Alteração
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Ou copie e cole este link no seu navegador:
              </p>
              <p style="margin: 8px 0 0 0; color: #3b82f6; font-size: 14px; word-break: break-all; line-height: 1.6; text-align: center;">
                {{ .ConfirmationURL }}
              </p>
              
              <div style="margin: 32px 0 0 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Atenção:</strong> Se você não solicitou esta alteração, ignore este e-mail e entre em contato 
                  com o suporte imediatamente.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Este é um e-mail automático, por favor não responda.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2025 PEI Collab. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🔐 6. Confirm Reauthentication (Confirmar Reautenticação)

### Subject:
```
Código de verificação - PEI Collab
```

### Body:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificação - PEI Collab</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                PEI Collab
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Sistema de Planos Educacionais Individualizados
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; line-height: 80px; font-size: 36px; color: #ffffff; font-weight: 700; letter-spacing: 4px;">
                  {{ .Token }}
                </div>
              </div>
              
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 600; text-align: center;">
                Código de verificação
              </h2>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
                Olá,
              </p>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Você solicitou uma reautenticação no <strong>PEI Collab</strong>. 
                Use o código abaixo para confirmar sua identidade:
              </p>
              
              <!-- Code Display -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <div style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 2px dashed #6366f1; border-radius: 12px;">
                      <p style="margin: 0; color: #6366f1; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        {{ .Token }}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <div style="margin: 32px 0 0 0; padding: 20px; background-color: #eef2ff; border-left: 4px solid #6366f1; border-radius: 6px;">
                <p style="margin: 0; color: #4338ca; font-size: 14px; line-height: 1.6;">
                  <strong>🔒 Segurança:</strong> Este código é válido por apenas 10 minutos. 
                  Não compartilhe este código com ninguém. Se você não solicitou esta verificação, 
                  ignore este e-mail e entre em contato com o suporte.
                </p>
              </div>
              
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Site: <strong>{{ .SiteURL }}</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Este é um e-mail automático, por favor não responda.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2025 PEI Collab. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📋 Variáveis Disponíveis

Todas as variáveis que podem ser usadas nos templates:

- `{{ .ConfirmationURL }}` - URL completa para confirmação/ação
- `{{ .Token }}` - Token de verificação (para reautenticação)
- `{{ .TokenHash }}` - Hash do token
- `{{ .SiteURL }}` - URL base do site
- `{{ .Email }}` - E-mail do usuário
- `{{ .NewEmail }}` - Novo e-mail (para mudança de e-mail)
- `{{ .Data }}` - Dados adicionais em JSON
- `{{ .RedirectTo }}` - URL de redirecionamento após confirmação

---

## 🎨 Características dos Templates

✅ **Design Responsivo** - Funciona em desktop, tablet e mobile  
✅ **Compatibilidade** - Testado em principais clientes de e-mail  
✅ **Acessibilidade** - Cores com bom contraste e estrutura semântica  
✅ **Branding** - Cores e identidade visual do PEI Collab  
✅ **Segurança** - Avisos claros sobre expiração e segurança  
✅ **Profissional** - Layout limpo e moderno  

---

## 📝 Como Configurar no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **Authentication** → **Email Templates**
3. Selecione o tipo de template (Reset Password, Confirm Signup, etc.)
4. Cole o HTML correspondente no campo **Body**
5. Atualize o **Subject** com o assunto correspondente
6. Clique em **Save**

---

**Última atualização:** Janeiro 2025
