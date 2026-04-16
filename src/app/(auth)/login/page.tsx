"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
          throw new Error("E-mail ou senha incorretos.");
        }
        throw signInError;
      }

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
          Entrar no Ligare
        </h1>
        <p className="text-sm text-lg-text-muted mt-1">
          Acesse sua conta e continue cuidando
        </p>
      </div>

      {/* Form */}
      <div className="card p-8">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label htmlFor="password" className="block text-sm font-medium text-lg-text-secondary mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="input pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg-text-muted hover:text-lg-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[var(--lg-border)] text-lg-primary focus:ring-lg-primary"
              />
              <span className="text-lg-text-secondary">Lembrar-me</span>
            </label>
            <a href="#" className="text-lg-primary hover:underline font-medium">
              Esqueceu a senha?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full btn-lg mt-2"
          >
            {isLoading ? (
              <span className="animate-pulse-soft">Entrando...</span>
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
            Não tem uma conta?{" "}
            <a href="/register" className="text-lg-primary font-semibold hover:underline">
              Criar conta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
