"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Baby, Users, DoorOpen, CalendarClock, BarChart3, ScanLine } from "lucide-react";

const tabs = [
  { name: "Painel", href: "/dashboard/kids", icon: Baby, exact: true },
  { name: "Estação de Check-in", href: "/dashboard/kids/checkin", icon: ScanLine },
  { name: "Crianças", href: "/dashboard/kids/criancas", icon: Users },
  { name: "Salas", href: "/dashboard/kids/salas", icon: DoorOpen },
  { name: "Escalas", href: "/dashboard/kids/escalas", icon: CalendarClock },
  { name: "Relatórios", href: "/dashboard/kids/relatorios", icon: BarChart3 },
];

export default function KidsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6 animate-fade-in flex flex-col min-h-0">
      {/* Header */}
      <div className="shrink-0">
        <h1
          className="text-2xl font-bold text-lg-midnight"
          style={{ fontFamily: "var(--lg-font-heading)" }}
        >
          Ministério Kids
        </h1>
        <p className="text-sm text-lg-text-muted mt-1 mb-4">
          Gestão completa do ministério infantil: crianças, salas, escalas e check-in.
        </p>

        {/* Tabs */}
        <div className="flex bg-lg-off-white p-1.5 rounded-xl w-max shadow-sm border border-[var(--glass-border)] hide-scrollbar overflow-x-auto gap-1">
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
                  className={`w-4 h-4 ${
                    isActive ? "text-lg-care" : "opacity-70"
                  }`}
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
