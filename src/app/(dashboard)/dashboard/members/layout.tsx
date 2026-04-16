"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Shield } from "lucide-react";

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-lg-midnight"
          style={{ fontFamily: "var(--lg-font-heading)" }}
        >
          Gestão de Equipe & Membros
        </h1>
        <p className="text-sm text-lg-text-muted mt-1 mb-4">
          Acompanhe todos os membros, suas respectivas lideranças e os cargos ministeriais.
        </p>

        {/* Tabs */}
        <div className="flex bg-lg-off-white p-1.5 rounded-xl w-max shadow-sm border border-[var(--glass-border)] hide-scrollbar overflow-x-auto gap-1">
           <Link href="/dashboard/members"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === "/dashboard/members"
                  ? "bg-white shadow-sm text-lg-midnight scale-[1.02]"
                  : "text-lg-text-muted hover:text-lg-midnight hover:bg-white/50"
              }`}
            >
              <Users className={`w-4 h-4 ${pathname === "/dashboard/members" ? "text-lg-primary" : "opacity-70"}`} />
              Visão Geral
            </Link>
            <Link href="/dashboard/members/roles"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === "/dashboard/members/roles"
                  ? "bg-white shadow-sm text-lg-midnight scale-[1.02]"
                  : "text-lg-text-muted hover:text-lg-midnight hover:bg-white/50"
              }`}
            >
              <Shield className={`w-4 h-4 ${pathname === "/dashboard/members/roles" ? "text-lg-primary" : "opacity-70"}`} />
              Encargos & Funções
            </Link>
        </div>
      </div>
      
      {/* Content area: grow to fill available space, but allow scrolling inside if needed */}
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-6 rounded-2xl border border-[var(--glass-border)] bg-gradient-to-b from-[var(--glass-bg)] to-white/50 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.03)] p-6">
        {children}
      </div>
    </div>
  );
}
