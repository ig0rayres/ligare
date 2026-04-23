import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RegisterForm from "./RegisterForm";

interface Props {
  params: Promise<{ domain: string }>;
}

export default async function TenantRegisterPage({ params }: Props) {
  const { domain } = await params;
  
  const supabase = await createClient();
  
  // Buscar os dados da igreja pelo subdomínio (domain)
  const { data: church } = await supabase
    .from("churches")
    .select("id, name, logo_url, primary_color, secondary_color")
    .eq("subdomain", domain)
    .single();

  if (!church) {
    // Se a igreja não existir (ex: igrejax.ligare.app não encontrada)
    return notFound();
  }

  // Prepara variáveis dinâmicas de estilo
  const themeVars = {
    "--lg-primary": church.primary_color || "#1F6FEB",
    "--lg-secondary": church.secondary_color || "#18B37E",
  } as React.CSSProperties;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-lg-mist fade-in relative overflow-hidden"
      style={themeVars}
    >
      {/* Decoração de Fundo com as cores da Igreja */}
      <div className="absolute top-0 right-0 p-32 opacity-10 blur-[100px] rounded-full bg-[var(--lg-primary)] w-96 h-96 transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-32 opacity-10 blur-[100px] rounded-full bg-[var(--lg-secondary)] w-96 h-96 transform -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <RegisterForm church={church} domain={domain} />
      </div>
    </div>
  );
}
