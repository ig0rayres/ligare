import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar — Ligare",
  description: "Acesse sua conta na plataforma Ligare.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-lg-cloud px-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
