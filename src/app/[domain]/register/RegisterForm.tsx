"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, Hash } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

// Regex validação básica
function maskCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
}

function isValidCPF(cpf: string) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  return true;
}

interface ChurchData {
  id: string;
  name: string;
  logo_url: string | null;
}

interface RegisterFormProps {
  church: ChurchData;
  domain: string;
}

export default function RegisterForm({ church, domain }: RegisterFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validação de CPF antes de seguir
    if (!isValidCPF(cpf)) {
      setError("Por favor, informe um CPF válido.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // 1. Criar usuário na Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            whatsapp,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário.");

      // 2. Chamar RPC segura para cadastrar na Igreja exata
      const { data: rpcData, error: tenantError } = await supabase.rpc("register_tenant_member", {
        p_subdomain: domain,
        p_user_id: authData.user.id,
        p_full_name: fullName,
        p_email: email,
        p_whatsapp: whatsapp,
        p_cpf: cpf.replace(/\D/g, '') // Salva apenas números no banco
      });

      if (tenantError) throw tenantError;
      
      // O Supabase retorna json { error: '...' } da RPC caso haja erro lógico
      if (rpcData && (rpcData as any).error) {
        throw new Error((rpcData as any).error);
      }

      // 3. Redirecionar para o dashboard que ele terá acesso via RLS
      router.push("/dashboard");
      router.refresh();
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado. Tente novamente.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="card p-8 animate-slide-up shadow-[var(--lg-shadow-xl)] border border-[color-mix(in_srgb,var(--lg-primary)_20%,transparent)]">
      {/* Logos Dinâmicos */}
      <div className="text-center mb-8">
        {church.logo_url ? (
          <Image
            src={church.logo_url}
            alt={church.name}
            width={120}
            height={60}
            className="h-[60px] w-auto mx-auto mb-4 object-contain"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-[color-mix(in_srgb,var(--lg-primary)_15%,transparent)] text-[var(--lg-primary)] mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl font-bold">{church.name.charAt(0)}</span>
          </div>
        )}
        
        <h1 className="text-xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
          Criar conta em <span style={{ color: "var(--lg-primary)" }}>{church.name}</span>
        </h1>
        <p className="text-sm text-lg-text-muted mt-1">
          Preencha seus dados para acessar.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-lg-midnight mb-1.5">
            Nome completo
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
            <input
              id="name"
              type="text"
              required
              placeholder="Seu nome"
              className="input pl-10 w-full"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="cpf" className="block text-sm font-semibold text-lg-midnight mb-1.5">
            CPF
          </label>
          <div className="relative">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
            <input
              id="cpf"
              type="text"
              required
              placeholder="000.000.000-00"
              className="input pl-10 w-full"
              value={cpf}
              maxLength={14}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-lg-midnight mb-1.5">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
            <input
              id="email"
              type="email"
              required
              placeholder="seu@email.com"
              className="input pl-10 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="whatsapp" className="block text-sm font-semibold text-lg-midnight mb-1.5">
            WhatsApp
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
            <input
              id="whatsapp"
              type="tel"
              required
              placeholder="(11) 99999-9999"
              className="input pl-10 w-full"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-semibold text-lg-midnight mb-1.5">
            Senha segura
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="input pl-10 pr-10 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lg-text-muted hover:text-lg-text-secondary transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn w-full btn-lg mt-2 font-bold shadow-md hover:shadow-lg transition-all text-white flex items-center justify-center gap-2"
          style={{ backgroundColor: "var(--lg-primary)" }}
        >
          {isLoading ? (
            <span className="animate-pulse">Registrando...</span>
          ) : (
            <>
              Continuar para o Portal
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-lg-text-muted">
          Já possui conta?{" "}
          <a href="/login" className="font-bold hover:underline" style={{ color: "var(--lg-primary)" }}>
            Fazer login
          </a>
        </p>
      </div>
    </div>
  );
}
