import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Testes = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [tenantId, setTenantId] = useState("");

  useEffect(() => {
    // Verifica se o usuário está logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Busca os tenants
    const fetchTenants = async () => {
      const { data, error } = await supabase.from("tenants").select("*");
      if (error) {
        console.error("Erro ao buscar tenants:", error.message);
      } else {
        setTenants(data || []);
      }
    };

    fetchTenants();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
      <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
        Testes
      </h1>
      <select
        value={tenantId}
        onChange={(e) => setTenantId(e.target.value)}
        className="mt-4 p-2 rounded"
      >
        <option value="">Selecione uma escola</option>
        {tenants.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Testes;
