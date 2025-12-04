import { useState } from "react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pei/ui";
import { AlertCircle, CheckCircle2, Plus, RefreshCcw } from "lucide-react";

type TenantOption = {
  id: string;
  network_name?: string | null;
  name?: string | null;
};

type SchoolOption = {
  id: string;
  school_name?: string | null;
  name?: string | null;
};

export type CreateUserFormData = {
  full_name: string;
  email: string;
  role: string;
  tenant_id: string;
  school_id: string;
};

interface CreateUserFormProps {
  tenants: TenantOption[];
  availableSchoolsForUser: SchoolOption[];
  loadingSchools: boolean;
  onTenantChange: (tenantId: string) => void;
  onSubmit: (data: CreateUserFormData) => void;
  loading: boolean;
  onCancel: () => void;
}

const DEFAULT_FORM_DATA: CreateUserFormData = {
  full_name: "",
  email: "",
  role: "teacher",
  tenant_id: "",
  school_id: "",
};

export const CreateUserForm = ({
  tenants,
  availableSchoolsForUser,
  loadingSchools,
  onTenantChange,
  onSubmit,
  loading,
  onCancel,
}: CreateUserFormProps) => {
  const [formData, setFormData] = useState<CreateUserFormData>(DEFAULT_FORM_DATA);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formData.full_name && formData.role && formData.tenant_id) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof CreateUserFormData, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "tenant_id") {
        updated.school_id = "";
        onTenantChange(value);
      }

      return updated;
    });
  };

  const renderTenantLabel = (tenant: TenantOption) =>
    tenant.network_name || tenant.name || `Rede ${tenant.id.slice(0, 8)}`;

  const renderSchoolLabel = (school: SchoolOption) =>
    school.school_name || school.name || `Escola ${school.id.slice(0, 8)}`;

  const isSubmitDisabled =
    loading || !formData.full_name || !formData.role || !formData.tenant_id;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome Completo *</Label>
          <Input
            id="full_name"
            placeholder="Digite o nome completo"
            value={formData.full_name}
            onChange={(event) => handleChange("full_name", event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="usuario@exemplo.com"
            value={formData.email}
            onChange={(event) => handleChange("email", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Função *</Label>
          <Select value={formData.role} onValueChange={(value) => handleChange("role", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="superadmin">Super Admin</SelectItem>
              <SelectItem value="coordinator">Coordenador</SelectItem>
              <SelectItem value="school_manager">Gestor Escolar</SelectItem>
              <SelectItem value="aee_teacher">Professor AEE</SelectItem>
              <SelectItem value="teacher">Professor</SelectItem>
              <SelectItem value="family">Família</SelectItem>
              <SelectItem value="specialist">Especialista</SelectItem>
              <SelectItem value="education_secretary">Secretário</SelectItem>
              <SelectItem value="school_director">Diretor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant_id">Rede Municipal *</Label>
          <Select value={formData.tenant_id} onValueChange={(value) => handleChange("tenant_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a rede" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {renderTenantLabel(tenant)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="school_id">Escola</Label>
          <Select
            value={formData.school_id || "none"}
            onValueChange={(value) => handleChange("school_id", value === "none" ? "" : value)}
            disabled={!formData.tenant_id || loadingSchools}
          >
            <SelectTrigger
              className={!formData.tenant_id || loadingSchools ? "opacity-50 cursor-not-allowed" : ""}
            >
              <SelectValue
                placeholder={
                  !formData.tenant_id
                    ? "Primeiro selecione uma rede"
                    : loadingSchools
                      ? "Carregando escolas..."
                      : availableSchoolsForUser.length === 0
                        ? "Nenhuma escola cadastrada nesta rede"
                        : "Selecione a escola (opcional)"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma escola</SelectItem>
              {!formData.tenant_id ? (
                <SelectItem value="select-tenant" disabled>
                  Selecione uma rede primeiro
                </SelectItem>
              ) : loadingSchools ? (
                <SelectItem value="loading" disabled>
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-3 w-3 animate-spin" />
                    Carregando escolas...
                  </div>
                </SelectItem>
              ) : availableSchoolsForUser.length > 0 ? (
                availableSchoolsForUser.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {renderSchoolLabel(school)}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-schools" disabled>
                  Nenhuma escola cadastrada nesta rede
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {formData.tenant_id && (
            <div className="flex items-center gap-2 text-xs">
              {loadingSchools ? (
                <div className="flex items-center gap-1 text-blue-600">
                  <RefreshCcw className="h-3 w-3 animate-spin" />
                  <span>Carregando escolas...</span>
                </div>
              ) : availableSchoolsForUser.length > 0 ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{availableSchoolsForUser.length} escola(s) encontrada(s)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>Nenhuma escola cadastrada nesta rede</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitDisabled}>
          {loading ? (
            <>
              <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Criar Usuário
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

