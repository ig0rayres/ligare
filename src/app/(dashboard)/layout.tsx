"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Baby,
  Calendar,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Heart,
  Shield,
  Smartphone,
  BarChart3,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Toaster } from "sonner";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Membros", href: "/dashboard/members", icon: Users },
  { name: "Kids", href: "/dashboard/kids", icon: Baby },
  { name: "Células", href: "/dashboard/cells", icon: Heart },
  { name: "Cultos & Eventos", href: "/dashboard/events", icon: Calendar },
  { name: "Financeiro", href: "/dashboard/finance", icon: BarChart3 },
  { name: "Follow-up", href: "/dashboard/followup", icon: MessageCircle },
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
  { name: "WhatsApp", href: "/dashboard/settings/whatsapp", icon: Smartphone },
];

interface UserProfile {
  full_name: string;
  role: string;
  is_platform_admin: boolean;
  church_name: string;
  plan: string;
  primary_color: string | null;
  secondary_color: string | null;
  logo_url: string | null;
  cell_term: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, role, is_platform_admin, church_id")
        .eq("id", user.id)
        .single();

      if (!data) return;

      const { data: church } = await supabase
        .from("churches")
        .select("name, primary_color, secondary_color, logo_url, cell_term")
        .eq("id", data.church_id)
        .single();

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("church_id", data.church_id)
        .single();

      setProfile({
        full_name: data.full_name || "Usuário",
        role: data.role || "member",
        is_platform_admin: data.is_platform_admin || false,
        church_name: church?.name || "Minha Igreja",
        plan: sub?.plan || "free",
        primary_color: church?.primary_color || null,
        secondary_color: church?.secondary_color || null,
        logo_url: church?.logo_url || null,
        cell_term: church?.cell_term || "Células",
      });
    }
    loadProfile();
  }, []);

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "..";

  const planLabels: Record<string, string> = {
    free: "Free",
    start: "Start",
    growth: "Growth",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  const themeStyles = {
    ...(profile?.primary_color ? { 
      '--lg-primary': profile.primary_color,
      '--color-lg-primary': profile.primary_color,
      '--lg-primary-light': `color-mix(in srgb, ${profile.primary_color} 15%, white)`,
      '--color-lg-primary-light': `color-mix(in srgb, ${profile.primary_color} 15%, white)`,
      '--lg-primary-dark': `color-mix(in srgb, ${profile.primary_color} 80%, black)`,
      '--color-lg-primary-dark': `color-mix(in srgb, ${profile.primary_color} 80%, black)`
    } as React.CSSProperties : {}),
    ...(profile?.secondary_color ? { 
      '--lg-secondary': profile.secondary_color,
      '--color-lg-secondary': profile.secondary_color,
      '--lg-secondary-light': `color-mix(in srgb, ${profile.secondary_color} 15%, white)`,
      '--color-lg-secondary-light': `color-mix(in srgb, ${profile.secondary_color} 15%, white)`,
    } as React.CSSProperties : {})
  };

  return (
    <div className="min-h-screen bg-lg-cloud" style={themeStyles}>
      <Toaster position="top-right" richColors />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-[var(--lg-border-light)] z-50 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--lg-border-light)]">
          <div className="flex items-center gap-2">
            <img
              src={profile?.logo_url || "/brand/ligare-brasao.png"}
              alt="Logo"
              className="h-[40px] w-auto object-contain"
            />
            {!profile?.logo_url && (
              <span
                className="text-xl font-bold text-lg-midnight"
                style={{ fontFamily: "var(--lg-font-heading)" }}
              >
                Ligare
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-lg-text-muted hover:text-lg-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Church Info - Dynamic */}
        <div className="px-5 py-4 border-b border-[var(--lg-border-light)]">
          {profile ? (
            <>
              <p
                className="text-sm font-semibold text-lg-midnight truncate"
                style={{ fontFamily: "var(--lg-font-heading)" }}
              >
                {profile.church_name}
              </p>
              <p className="text-xs text-lg-text-muted">
                Plano {planLabels[profile.plan] || profile.plan}
              </p>
            </>
          ) : (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1 flex-1">
          {!profile?.is_platform_admin && navigation.map((item) => {
            
            // RBAC Filtering
            if (profile?.role === 'leader') {
              if (['Membros', 'Kids', 'Configurações', 'Células', 'WhatsApp', 'Financeiro'].includes(item.name)) return null;
            }
            if (profile?.role === 'kids_team') {
              if (['Follow-up', 'Configurações', 'Células', 'WhatsApp', 'Financeiro'].includes(item.name)) return null;
            }
            if (profile?.role === 'member') {
              if (['Configurações', 'WhatsApp', 'Financeiro'].includes(item.name)) return null;
            }

            const isActive = pathname?.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
            
            // Applica nomenclaturas dinâmicas
            let displayName = item.name;
            if (item.name === 'Células') {
              displayName = profile?.cell_term || 'Células';
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-lg-primary-light text-lg-primary"
                    : "text-lg-text-secondary hover:bg-lg-surface-raised hover:text-lg-text"
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-lg-primary" : ""}`} />
                {displayName}
              </Link>
            );
          })}
        </nav>

        {/* Master Admin Link — Only for platform admins */}
        {profile?.is_platform_admin && (
          <div className="px-3 mt-2">
            <Link
              href="/dashboard/master-admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/dashboard/master-admin"
                  ? "bg-lg-midnight text-white"
                  : "text-lg-text-muted hover:bg-lg-surface-raised hover:text-lg-midnight"
              }`}
            >
              <Shield className="w-[18px] h-[18px]" />
              Master Admin
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[var(--lg-border-light)]">
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-lg-text-muted hover:text-lg-danger hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-lg border-b border-[var(--lg-border-light)] flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-lg-text-secondary"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-4">
            <button className="relative text-lg-text-muted hover:text-lg-text transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-lg-danger rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                3
              </span>
            </button>
            <div className="w-8 h-8 rounded-full bg-lg-primary-light flex items-center justify-center text-sm font-bold text-lg-primary">
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
