import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTenantFromDomain } from '../hooks/useTenantFromDomain';

interface Tenant {
  id: string;
  name: string;
  city?: string;
  state?: string;
  customization?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    institution_name?: string;
    theme?: string;
  };
}

interface TenantContextValue {
  tenant: Tenant | null;
  tenantId: string | null;
  loading: boolean;
  isMultiTenant: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  tenantId: null,
  loading: true,
  isMultiTenant: false,
});

export const useTenant = () => useContext(TenantContext);

interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { data: tenantDomain, isLoading } = useTenantFromDomain();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    if (tenantDomain?.tenant) {
      setTenant(tenantDomain.tenant as Tenant);
      setTenantId(tenantDomain.tenant_id);
      
      // Salvar no localStorage para cache
      localStorage.setItem('tenant_id', tenantDomain.tenant_id);
      localStorage.setItem('tenant_data', JSON.stringify(tenantDomain.tenant));
    } else {
      // Tentar recuperar do localStorage (fallback)
      const cachedTenantId = localStorage.getItem('tenant_id');
      const cachedTenant = localStorage.getItem('tenant_data');
      
      if (cachedTenantId && cachedTenant) {
        setTenantId(cachedTenantId);
        setTenant(JSON.parse(cachedTenant));
      }
    }
  }, [tenantDomain]);

  const value: TenantContextValue = {
    tenant,
    tenantId,
    loading: isLoading,
    isMultiTenant: !!tenantDomain,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

