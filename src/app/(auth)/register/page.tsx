"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, Church } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 fields
  const [churchName, setChurchName] = useState("");
  const [churchCity, setChurchCity] = useState("");
  const [churchState, setChurchState] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      setStep(2);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // 1. Create auth user
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

      // 2. Create tenant (Church + Subscription + Profile) via RPC
      const subdomain = churchName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const { error: tenantError } = await supabase.rpc("create_new_tenant", {
        church_name: churchName,
        subdomain: `${subdomain}-${Date.now().toString(36)}`,
        user_id: authData.user.id,
        full_name: fullName,
        email,
      });

      if (tenantError) throw tenantError;

      // 3. Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro inesperado. Tente novamente.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-8">
        <Image
          src="/brand/ligare-brasao.png"
          alt="Ligare"
          width={132}
          height={60}
          className="h-[60px] w-auto mx-auto mb-4"
        />
        <h1
          className="text-2xl font-bold text-lg-midnight"
          style={{ fontFamily: "var(--lg-font-heading)" }}
        >
          Criar sua conta
        </h1>
        <p className="text-sm text-lg-text-muted mt-1">
          {step === 1 ? "Seus dados pessoais" : "Dados da sua igreja"}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 justify-center">
        <div className={`w-8 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-lg-primary' : 'bg-lg-border'}`} />
        <div className={`w-8 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-lg-primary' : 'bg-lg-border'}`} />
      </div>

      {/* Form */}
      <div className="card p-8">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-lg-text-secondary mb-1.5">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Seu nome"
                    className="input pl-10"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-lg-text-secondary mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="seu@email.com"
                    className="input pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-lg-text-secondary mb-1.5">
                  WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
                  <input
                    id="whatsapp"
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    className="input pl-10"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-lg-text-secondary mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    className="input pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg-text-muted hover:text-lg-text-secondary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="church-name" className="block text-sm font-medium text-lg-text-secondary mb-1.5">
                  Nome da igreja
                </label>
                <div className="relative">
                  <Church className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
                  <input
                    id="church-name"
                    type="text"
                    required
                    placeholder="Ex: Igreja Vida Nova"
                    className="input pl-10"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="church-city" className="block text-sm font-medium text-lg-text-secondary mb-1.5">
                  Cidade
                </label>
                <input
                  id="church-city"
                  type="text"
                  required
                  placeholder="Ex: São Paulo"
                  className="input"
                  value={churchCity}
                  onChange={(e) => setChurchCity(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="church-state" className="block text-sm font-medium text-lg-text-secondary mb-1.5">
                  Estado
                </label>
                <input
                  id="church-state"
                  type="text"
                  required
                  placeholder="Ex: SP"
                  className="input"
                  maxLength={2}
                  value={churchState}
                  onChange={(e) => setChurchState(e.target.value.toUpperCase())}
                />
              </div>

              <div className="p-4 rounded-xl bg-lg-mist border border-[var(--lg-primary)]/10">
                <p className="text-sm text-lg-primary font-medium">
                  🎉 Seu plano gratuito inclui: até 100 membros, 3 células e 50 check-ins Kids/mês.
                </p>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full btn-lg mt-2"
          >
            {isLoading ? (
              <span className="animate-pulse-soft">Criando conta...</span>
            ) : step === 1 ? (
              <>
                Continuar
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Criar minha igreja
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-ghost w-full"
            >
              Voltar
            </button>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-lg-text-muted">
            Já tem uma conta?{" "}
            <a href="/login" className="text-lg-primary font-semibold hover:underline">
              Entrar
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
