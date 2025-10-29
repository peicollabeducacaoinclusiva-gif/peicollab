// src/components/debug/DebugUser.tsx
// COMPONENTE TEMPORÁRIO PARA DEBUG - REMOVER DEPOIS

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

const DebugUser = () => {
  const [userData, setUserData] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadDebugData();
  }, []);

  const loadDebugData = async () => {
    // 1. Dados do usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    setUserData(user);

    if (!user) return;

    // 2. Roles do usuário (da tabela profiles)
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    setRoles(profileData ? [{ role: profileData.role }] : []);

    // 3. Tenants associados
    const { data: tenantsData } = await supabase
      .from("user_tenants")
      .select(`
        *,
        tenants (*)
      `)
      .eq("user_id", user.id);
    setTenants(tenantsData || []);

    // 4. Profile
    const { data: fullProfileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(fullProfileData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado!");
  };

  if (!userData) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle>🔍 Debug - Carregando...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Informações de Debug do Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User ID */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <strong className="text-blue-900">User ID:</strong>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(userData.id)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <code className="text-sm bg-white px-2 py-1 rounded block">
              {userData.id}
            </code>
          </div>

          {/* Email */}
          <div className="p-4 bg-gray-50 border rounded-lg">
            <strong>Email:</strong>
            <p className="text-sm mt-1">{userData.email}</p>
          </div>

          {/* Roles */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <strong className="text-green-900">Roles:</strong>
            {roles.length === 0 ? (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ NENHUMA ROLE ENCONTRADA! O usuário precisa ter uma role.
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {roles.map((role) => (
                  <li key={role.id} className="text-sm">
                    • {role.role}
                    {role.role === "coordinator" && " ✅"}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tenants */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <strong className="text-purple-900">Tenants Associados:</strong>
            {tenants.length === 0 ? (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ NENHUM TENANT ASSOCIADO! O coordenador precisa estar vinculado a uma escola.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {tenants.map((tenant: any) => (
                  <li key={tenant.id} className="text-sm bg-white p-2 rounded">
                    <div className="flex items-center justify-between">
                      <span>• {tenant.tenants?.name || "N/A"}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(tenant.tenant_id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <code className="text-xs text-gray-500">
                      ID: {tenant.tenant_id}
                    </code>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Profile */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <strong className="text-yellow-900">Profile:</strong>
            {!profile ? (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ PROFILE NÃO ENCONTRADO!
              </p>
            ) : (
              <div className="mt-2 text-sm space-y-1">
                <p>• Nome: {profile.full_name}</p>
                <p>• Role (user_roles): {profile.user_roles?.[0]?.role || 'Nenhum'}</p>
                <p>• Tenant ID: {profile.tenant_id || "Nenhum"}</p>
                <p>• Ativo: {profile.is_active ? "Sim" : "Não"}</p>
              </div>
            )}
          </div>

          {/* SQL para corrigir */}
          {(roles.length === 0 || tenants.length === 0) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <strong className="text-red-900">📋 SQL para Corrigir:</strong>
              <div className="mt-2 space-y-2">
                {roles.length === 0 && (
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm font-semibold mb-1">
                      1. Adicionar Role de Coordenador:
                    </p>
                    <code className="text-xs block bg-gray-100 p-2 rounded overflow-x-auto">
                      {`UPDATE profiles 
SET role = 'coordinator' 
WHERE id = '${userData.id}';`}
                    </code>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        copyToClipboard(
                          `INSERT INTO user_roles (user_id, role) VALUES ('${userData.id}', 'coordinator');`
                        )
                      }
                    >
                      Copiar SQL
                    </Button>
                  </div>
                )}

                {tenants.length === 0 && (
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm font-semibold mb-1">
                      2. Associar a um Tenant:
                    </p>
                    <code className="text-xs block bg-gray-100 p-2 rounded overflow-x-auto">
                      {`-- Primeiro, veja os tenants disponíveis:
SELECT id, name FROM tenants;

-- Depois, associe o usuário (substitua TENANT_ID):
INSERT INTO user_tenants (user_id, tenant_id)
VALUES ('${userData.id}', 'TENANT_ID_AQUI')
ON CONFLICT (user_id, tenant_id) DO NOTHING;`}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Teste de Acesso */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <strong className="text-indigo-900">🧪 Teste de Acesso:</strong>
            <Button
              className="mt-2 w-full"
              onClick={async () => {
                const { data, error } = await supabase
                  .from("peis")
                  .select("*")
                  .limit(5);

                if (error) {
                  alert("❌ Erro: " + error.message);
                } else {
                  alert(`✅ Sucesso! Encontrados ${data?.length || 0} PEIs`);
                  console.log("PEIs:", data);
                }
              }}
            >
              Testar Acesso aos PEIs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugUser;