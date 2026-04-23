"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas informadas não coincidem.");
      return;
    }
    if (password.length < 6) {
        setError("A senha deve conter ao menos 6 caracteres.");
        return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Quando o usuário clica no link do e-mail, o Supabase passa na URL 
      // os tokens de reset e converte pra Session via callback, permitindo o updateUser:
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw new Error(updateError.message);
      }
      
      router.push("/dashboard");
      router.refresh();
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Falha ao definir nova senha. O link pode ter expirado.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
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
          Nova Senha
        </h1>
        <p className="text-sm text-lg-text-muted mt-1">
          Defina sua nova senha de acesso ao sistema
        </p>
      </div>

      <div className="card p-8">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-lg-text-secondary mb-1.5">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
              <input
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg-text-muted hover:text-lg-text-secondary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-lg-text-secondary mb-1.5">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="input pl-10 pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full btn-lg mt-2"
          >
            {isLoading ? (
              <span className="animate-pulse-soft">Salvando...</span>
            ) : (
              <>
                Redefinir e Entrar
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
