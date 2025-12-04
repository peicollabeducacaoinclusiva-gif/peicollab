import { useState, useEffect } from "react";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@pei/ui";

type TenantOption = {
  id: string;
  network_name?: string | null;
  name?: string | null;
};

type SchoolFormData = {
  school_name: string;
  tenant_id: string;
  school_address: string;
  school_phone: string;
  school_email: string;
  is_active?: boolean;
};

type CreateSchoolFormProps = {
  tenants: TenantOption[];
  onSubmit: (data: SchoolFormData) => void | Promise<void>;
  loading: boolean;
  onCancel: () => void;
  editingSchool?: SchoolFormData | null;
};

export const CreateSchoolForm = ({
  tenants,
  onSubmit,
  loading,
  onCancel,
  editingSchool,
}: CreateSchoolFormProps) => {
  const [formData, setFormData] = useState<SchoolFormData>({
    school_name: editingSchool?.school_name || "",
    tenant_id: editingSchool?.tenant_id || "",
    school_address: editingSchool?.school_address || "",
    school_phone: editingSchool?.school_phone || "",
    school_email: editingSchool?.school_email || "",
    is_active: editingSchool?.is_active !== undefined ? editingSchool.is_active : true,
  });

  useEffect(() => {
    if (editingSchool) {
      setFormData({
        school_name: editingSchool.school_name || "",
        tenant_id: editingSchool.tenant_id || "",
        school_address: editingSchool.school_address || "",
        school_phone: editingSchool.school_phone || "",
        school_email: editingSchool.school_email || "",
        is_active: editingSchool.is_active !== undefined ? editingSchool.is_active : true,
      });
    }
  }, [editingSchool]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.school_name && formData.tenant_id) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome da Escola *</Label>
        <Input
          value={formData.school_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData({ ...formData, school_name: e.target.value })
          }
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Rede Municipal *</Label>
        <Select
          value={formData.tenant_id}
          onValueChange={(v: string) => setFormData({ ...formData, tenant_id: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.network_name || t.name || `Rede ${t.id.slice(0, 8)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Endereço</Label>
        <Input
          value={formData.school_address}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData({ ...formData, school_address: e.target.value })
          }
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input
            value={formData.school_phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, school_phone: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input
            type="email"
            value={formData.school_email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, school_email: e.target.value })
            }
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !formData.school_name || !formData.tenant_id}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
};

