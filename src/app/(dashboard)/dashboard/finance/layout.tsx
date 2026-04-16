"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Tag, Building2, Landmark } from "lucide-react";

const tabs = [
  { name: "Painel", href: "/dashboard/finance", icon: BarChart3, exact: true },
  { name: "Categorias", href: "/dashboard/finance/categories", icon: Tag },
  { name: "Contas", href: "/dashboard/finance/accounts", icon: Building2 },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6 animate-fade-in flex flex-col min-h-0">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[color-mix(in_srgb,var(--lg-warning)_12%,transparent)]">
            <Landmark className="w-5 h-5 text-lg-warning" style={{ color: "var(--lg-warning)" }} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold text-lg-midnight"
              style={{ fontFamily: "var(--lg-font-heading)" }}
            >
              Financeiro
            </h1>
            <p className="text-sm text-lg-text-muted">
              Controle de caixa, receitas e transparência total.
            </p>
          </div>
        </div>

        {/* Tabs — mesmo padrão do Kids */}
        <div className="mt-4 flex bg-lg-off-white p-1.5 rounded-xl w-max shadow-sm border border-[var(--glass-border)] hide-scrollbar overflow-x-auto gap-1">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white shadow-sm text-lg-midnight scale-[1.02]"
                    : "text-lg-text-muted hover:text-lg-midnight hover:bg-white/50"
                }`}
              >
                <tab.icon
                  className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-70"}`}
                  style={isActive ? { color: "var(--lg-warning)" } : {}}
                />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-[var(--glass-border)] bg-gradient-to-b from-[var(--glass-bg)] to-white/50 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.03)] p-6">
        {children}
      </div>
    </div>
  );
}
