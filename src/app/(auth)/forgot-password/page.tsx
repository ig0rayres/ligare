"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setSuccess(false);

    try {
      const supabase = createClient();
      const origin = window.location.origin;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${origin}/update-password`,
        }
      );

      if (resetError) {
        throw new Error(resetError.message);
      }

      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Falha ao enviar e-mail. Tente novamente.";
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
          Recuperar Senha
        </h1>
        <p className="text-sm text-lg-text-muted mt-1">
          Informe seu e-mail para enviarmos o link
        </p>
      </div>

      {/* Form */}
      <div className="card p-8">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              Link de redefinição enviado com sucesso! Verifique sua caixa de entrada ou spam.
            </div>
            <Link href="/login" className="btn btn-outline w-full justify-center">
              Voltar ao Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-lg-text-secondary mb-1.5"
              >
                E-mail cadastrado
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

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full btn-lg mt-2"
            >
              {isLoading ? (
                <span className="animate-pulse-soft">Enviando link...</span>
              ) : (
                <>
                  Enviar E-mail
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-lg-text-muted hover:text-lg-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Lembrei minha senha
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
