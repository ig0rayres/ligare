"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface ChurchData {
  id: string;
  name: string;
  logo_url: string | null;
}

interface LoginFormProps {
  church: ChurchData;
}

export default function LoginForm({ church }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw new Error("Credenciais inválidas. Verifique seu e-mail e senha.");
      if (!data.user) throw new Error("Erro ao autenticar usuário.");

      // Redireciona de volta par ao dashboard, a validação de segurança continuará
      // lá via RLS para garantir que as querys dele sejam dessa church.
      router.push("/dashboard");
      router.refresh();
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado. Tente novamente.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

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
          Acessar <span style={{ color: "var(--lg-primary)" }}>{church.name}</span>
        </h1>
        <p className="text-sm text-lg-text-muted mt-1">
          Informe suas credenciais de membro.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
           <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-semibold text-lg-midnight">
              Senha
            </label>
            <a href="/esqueci" className="text-xs font-semibold hover:underline" style={{ color: "var(--lg-primary)" }}>
              Esqueceu?
            </a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Sua senha"
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
            <span className="animate-pulse">Acessando...</span>
          ) : (
            <>
              Entrar
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-lg-text-muted">
          Novo por aqui?{" "}
          <a href="/register" className="font-bold hover:underline" style={{ color: "var(--lg-primary)" }}>
            Cadastre-se na Igreja
          </a>
        </p>
      </div>
    </div>
  );
}
