"use client";

import { useState, useTransition } from "react";
import {
  Package, Boxes, Plus, Edit2, X, Check, ChevronRight,
  Zap, Infinity, Hash, DollarSign, Percent, Clock, ShieldCheck,
  ToggleLeft, ToggleRight, Trash2, Save,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────
interface Plan {
  id: string; name: string; description: string | null;
  monthly_price: number; discount_quarterly: number;
  discount_semiannual: number; discount_annual: number;
  trial_days: number; grace_period_days: number;
  allow_trial_upgrades: boolean; is_active: boolean; sort_order: number;
}

interface Addon {
  id: string; name: string; slug: string; description: string | null;
  type: "feature_toggle" | "volume_limit"; monthly_price: number;
  is_active: boolean; sort_order: number;
}

interface Link { plan_id: string; addon_id: string; included_quantity: number; }

// ─── Helper ───────────────────────────────────────────────────
function formatQty(qty: number) {
  if (qty === -1) return "∞";
  if (qty === 0)  return "Não incluso";
  return qty.toString();
}

function planTotalCalc(plan: Plan, period: "quarterly" | "semiannual" | "annual") {
  const months = period === "quarterly" ? 3 : period === "semiannual" ? 6 : 12;
  const disc    = period === "quarterly" ? plan.discount_quarterly
                : period === "semiannual" ? plan.discount_semiannual
                : plan.discount_annual;
  return (plan.monthly_price * months * (1 - disc / 100)).toFixed(2);
}

// ─── Plan Composition Drawer ──────────────────────────────────
function PlanDrawer({
  plan, addons, links, onClose, onSaved,
}: {
  plan: Plan | null; addons: Addon[]; links: Link[];
  onClose: () => void; onSaved: () => void;
}) {
  const isNew = !plan;
  const [, startTransition] = useTransition();

  const [form, setForm] = useState<Partial<Plan>>(
    plan ?? {
      name: "", description: "", monthly_price: 97,
      discount_quarterly: 10, discount_semiannual: 15, discount_annual: 20,
      trial_days: 7, grace_period_days: 3, allow_trial_upgrades: false, is_active: true,
    }
  );

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    addons.forEach((a) => {
      const link = links.find((l) => l.plan_id === plan?.id && l.addon_id === a.id);
      init[a.id] = link?.included_quantity ?? 0;
    });
    return init;
  });

  async function handleSave() {
    if (!form.name?.trim()) { toast.error("Nome do plano é obrigatório."); return; }
    const supabase = createClient();

    startTransition(async () => {
      try {
        let planId = plan?.id;

        if (isNew) {
          const { data, error } = await supabase
            .from("platform_plans")
            .insert({ ...form })
            .select("id")
            .single();
          if (error) throw error;
          planId = data!.id;
        } else {
          const { error } = await supabase
            .from("platform_plans")
            .update({ ...form })
            .eq("id", plan!.id);
          if (error) throw error;
        }

        // Upsert all link quantities
        const upsertData = addons.map((a) => ({
          plan_id: planId!,
          addon_id: a.id,
          included_quantity: quantities[a.id] ?? 0,
        }));

        const { error: linkErr } = await supabase
          .from("plans_addons_link")
          .upsert(upsertData, { onConflict: "plan_id,addon_id" });

        if (linkErr) throw linkErr;

        toast.success(isNew ? "Plano criado com sucesso!" : "Plano atualizado!");
        onSaved();
      } catch (e: any) {
        toast.error(e.message || "Erro ao salvar plano.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg h-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--lg-border-light)] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg-midnight text-lg">
              {isNew ? "Criar Novo Plano" : `Editar: ${plan!.name}`}
            </h2>
            <p className="text-xs text-lg-text-muted mt-0.5">Configure preços, descontos e composição de módulos</p>
          </div>
          <button onClick={onClose} className="text-lg-text-muted hover:text-lg-text p-1 rounded-lg hover:bg-lg-surface-raised">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-lg-text-muted font-semibold">Informações</h3>
            <input
              className="input"
              placeholder="Nome do plano (ex: Ligare Pro)"
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Descrição curta"
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-lg-text-muted mb-1.5 block font-medium">Valor mensal (R$)</label>
                <input type="number" className="input" step="0.01"
                  value={form.monthly_price ?? 0}
                  onChange={(e) => setForm({ ...form, monthly_price: parseFloat(e.target.value) })}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-lg-text-muted mb-1.5 block font-medium">Status</label>
                <button
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 w-full text-sm font-medium transition-all ${form.is_active ? "border-lg-success bg-green-50 text-lg-success" : "border-gray-200 bg-gray-50 text-gray-500"}`}
                >
                  {form.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  {form.is_active ? "Ativo" : "Inativo"}
                </button>
              </div>
            </div>
          </section>

          {/* Discounts */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-lg-text-muted font-semibold flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5" /> Descontos por Ciclo
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Trimestral", key: "discount_quarterly" as const, months: 3 },
                { label: "Semestral",  key: "discount_semiannual" as const, months: 6 },
                { label: "Anual",      key: "discount_annual" as const,     months: 12 },
              ].map(({ label, key, months }) => {
                const disc  = (form[key] as number) ?? 0;
                const total = (((form.monthly_price ?? 0) * months) * (1 - disc / 100)).toFixed(2).replace(".", ",");
                return (
                  <div key={key} className="card p-3 text-center">
                    <p className="text-[10px] text-lg-text-muted uppercase tracking-wider mb-2">{label}</p>
                    <div className="relative">
                      <input
                        type="number" min={0} max={100}
                        className="input text-center pr-6 py-2 text-sm"
                        value={disc}
                        onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) || 0 })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-lg-text-muted">%</span>
                    </div>
                    <p className="text-[10px] text-lg-text-muted mt-1.5">Total: R$ {total}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Trial & Grace */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-lg-text-muted font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Trial & Inadimplência
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-lg-text-muted mb-1.5 block font-medium">Dias de Trial</label>
                <input type="number" min={0} className="input"
                  value={form.trial_days ?? 7}
                  onChange={(e) => setForm({ ...form, trial_days: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-xs text-lg-text-muted mb-1.5 block font-medium">Grace Period (dias)</label>
                <input type="number" min={0} className="input"
                  value={form.grace_period_days ?? 3}
                  onChange={(e) => setForm({ ...form, grace_period_days: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <button
              onClick={() => setForm({ ...form, allow_trial_upgrades: !form.allow_trial_upgrades })}
              className={`flex items-center gap-2.5 p-3 rounded-xl border-2 w-full text-sm transition-all ${form.allow_trial_upgrades ? "border-lg-primary bg-blue-50 text-lg-primary" : "border-gray-200 bg-gray-50 text-gray-400"}`}
            >
              {form.allow_trial_upgrades ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              Permitir contratação de Addons durante o Trial
            </button>
          </section>

          {/* Addon Composition */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-lg-text-muted font-semibold flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5" /> Itens Inclusos (Buffet)
            </h3>
            <p className="text-xs text-lg-text-muted">Use -1 para ilimitado, 0 para não incluso.</p>
            <div className="space-y-2">
              {addons.filter((a) => a.is_active).map((addon) => (
                <div key={addon.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--lg-border-light)] bg-lg-surface-raised">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-lg-midnight">{addon.name}</p>
                    <p className="text-xs text-lg-text-muted">{addon.type === "feature_toggle" ? "Feature" : "Volume"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {quantities[addon.id] === -1 && (
                      <span className="text-xs text-lg-primary font-semibold">∞</span>
                    )}
                    <input
                      type="number"
                      className="input w-20 text-center py-2 text-sm"
                      value={quantities[addon.id] ?? 0}
                      onChange={(e) => setQuantities({ ...quantities, [addon.id]: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--lg-border-light)] space-y-3">
          <button onClick={handleSave} className="btn btn-primary w-full">
            <Save className="w-4 h-4" />
            {isNew ? "Criar Plano" : "Salvar Configuração"}
          </button>
          <button onClick={onClose} className="btn btn-ghost w-full btn-sm">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Addon Drawer ─────────────────────────────────────────────
function AddonDrawer({
  addon, onClose, onSaved,
}: { addon: Addon | null; onClose: () => void; onSaved: () => void; }) {
  const isNew = !addon;
  const [, startTransition] = useTransition();

  const [form, setForm] = useState<Partial<Addon>>(
    addon ?? { name: "", slug: "", description: "", type: "volume_limit", monthly_price: 0, is_active: true }
  );

  async function handleSave() {
    if (!form.name?.trim() || !form.slug?.trim()) {
      toast.error("Nome e slug são obrigatórios."); return;
    }
    const supabase = createClient();

    startTransition(async () => {
      try {
        if (isNew) {
          const { error } = await supabase.from("platform_addons").insert({ ...form });
          if (error) throw error;
        } else {
          const { error } = await supabase.from("platform_addons").update({ ...form }).eq("id", addon!.id);
          if (error) throw error;
        }
        toast.success(isNew ? "Addon criado!" : "Addon atualizado!");
        onSaved();
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col">
        <div className="p-6 border-b border-[var(--lg-border-light)] flex items-center justify-between">
          <h2 className="font-bold text-lg-midnight text-lg">{isNew ? "Novo Add-on" : `Editar: ${addon!.name}`}</h2>
          <button onClick={onClose} className="text-lg-text-muted hover:text-lg-text p-1 rounded-lg hover:bg-lg-surface-raised">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <input className="input" placeholder="Nome do Addon" value={form.name ?? ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <label className="text-xs text-lg-text-muted mb-1.5 block font-medium">Slug (único, sem espaços)</label>
            <input className="input font-mono" placeholder="ex: whatsapp_channel" value={form.slug ?? ""}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "_") })} />
          </div>
          <textarea className="input resize-none" rows={2} placeholder="Descrição"
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div>
            <label className="text-xs text-lg-text-muted mb-1.5 block font-medium">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "volume_limit",   label: "Volume / Limite", icon: Hash },
                { val: "feature_toggle", label: "Feature (on/off)", icon: ToggleRight },
              ].map(({ val, label, icon: Icon }) => (
                <button key={val}
                  onClick={() => setForm({ ...form, type: val as any })}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.type === val ? "border-lg-primary bg-blue-50 text-lg-primary" : "border-gray-200 text-lg-text-muted hover:border-gray-300"}`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-lg-text-muted mb-1.5 block font-medium">Preço unitário/mês (R$)</label>
            <input type="number" className="input" step="0.01" value={form.monthly_price ?? 0}
              onChange={(e) => setForm({ ...form, monthly_price: parseFloat(e.target.value) })} />
            <p className="text-xs text-lg-text-muted mt-1">Use 0 se o addon não for vendido avulsamente.</p>
          </div>
          <button onClick={() => setForm({ ...form, is_active: !form.is_active })}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 w-full text-sm font-medium transition-all ${form.is_active ? "border-lg-success bg-green-50 text-lg-success" : "border-gray-200 bg-gray-50 text-gray-400"}`}
          >
            {form.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {form.is_active ? "Ativo" : "Inativo"}
          </button>
        </div>

        <div className="p-6 border-t border-[var(--lg-border-light)] space-y-3">
          <button onClick={handleSave} className="btn btn-primary w-full">
            <Save className="w-4 h-4" /> {isNew ? "Criar Addon" : "Salvar Addon"}
          </button>
          <button onClick={onClose} className="btn btn-ghost w-full btn-sm">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function PlansClient({
  plans: initialPlans,
  addons: initialAddons,
  links: initialLinks,
}: {
  plans: Plan[]; addons: Addon[]; links: Link[];
}) {
  const [tab, setTab] = useState<"plans" | "addons">("plans");
  const [plans,  setPlans]  = useState(initialPlans);
  const [addons, setAddons] = useState(initialAddons);
  const [links,  setLinks]  = useState(initialLinks);

  const [editPlan,  setEditPlan]  = useState<Plan | null | "new">(null);
  const [editAddon, setEditAddon] = useState<Addon | null | "new">(null);

  async function reload() {
    const supabase = createClient();
    const [pr, ar, lr] = await Promise.all([
      supabase.from("platform_plans").select("*").order("sort_order"),
      supabase.from("platform_addons").select("*").order("sort_order"),
      supabase.from("plans_addons_link").select("*"),
    ]);
    if (pr.data) setPlans(pr.data);
    if (ar.data) setAddons(ar.data);
    if (lr.data) setLinks(lr.data);
    setEditPlan(null);
    setEditAddon(null);
  }

  const totalMrr = plans.filter((p) => p.is_active).reduce((acc, p) => acc + p.monthly_price, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
            Precificação & Planos
          </h1>
          <p className="text-sm text-lg-text-muted mt-1">
            Configure regras de negócio, addons e composição dos planos
          </p>
        </div>
        <button
          onClick={() => tab === "plans" ? setEditPlan("new") : setEditAddon("new")}
          className="btn btn-primary btn-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {tab === "plans" ? "Criar Novo Plano" : "Novo Add-on"}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Planos Ativos",   value: plans.filter((p) => p.is_active).length,  icon: Package  },
          { label: "Total de Addons", value: addons.filter((a) => a.is_active).length, icon: Boxes    },
          { label: "Plano mais barato", value: `R$ ${Math.min(...plans.map((p) => p.monthly_price)).toFixed(0)}`, icon: DollarSign },
          { label: "Plano mais caro", value: `R$ ${Math.max(...plans.map((p) => p.monthly_price)).toFixed(0)}`, icon: Zap },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-lg-text-muted font-medium">{kpi.label}</p>
              <div className="w-8 h-8 rounded-lg bg-lg-mist flex items-center justify-center">
                <kpi.icon className="w-4 h-4 text-lg-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--lg-border-light)]">
        {[
          { key: "plans",  label: "Planos Base",               icon: Package },
          { key: "addons", label: "Catálogo de Módulos (Add-ons)", icon: Boxes },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              tab === key
                ? "border-lg-primary text-lg-primary"
                : "border-transparent text-lg-text-muted hover:text-lg-text"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Plans Tab ── */}
      {tab === "plans" && (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
          {plans.map((plan) => {
            const planLinks = links.filter((l) => l.plan_id === plan.id);
            const totalAddons = planLinks.length;

            return (
              <div key={plan.id} className={`card p-6 flex flex-col gap-4 ${!plan.is_active ? "opacity-60" : ""}`}>
                {/* Plan Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
                        {plan.name}
                      </h3>
                      {!plan.is_active && (
                        <span className="badge badge-danger text-[10px]">Inativo</span>
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-xs text-lg-text-muted leading-relaxed">{plan.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setEditPlan(plan)}
                    className="p-2 rounded-lg text-lg-text-muted hover:bg-lg-surface-raised hover:text-lg-primary transition-colors shrink-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Price */}
                <div className="bg-lg-mist rounded-xl p-4">
                  <p className="text-3xl font-black text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
                    R$ {plan.monthly_price.toFixed(2).replace(".", ",")}
                    <span className="text-sm font-normal text-lg-text-muted">/mês</span>
                  </p>
                  <div className="flex gap-3 mt-2 flex-wrap">
                    {[
                      { label: "Trim", disc: plan.discount_quarterly },
                      { label: "Sem",  disc: plan.discount_semiannual },
                      { label: "Anual",disc: plan.discount_annual },
                    ].filter((d) => d.disc > 0).map((d) => (
                      <span key={d.label} className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                        {d.label} -{d.disc}%
                      </span>
                    ))}
                  </div>
                </div>

                {/* Trial & Grace */}
                <div className="flex gap-3">
                  <div className="flex-1 text-center p-3 rounded-xl bg-lg-surface-raised">
                    <p className="text-[10px] text-lg-text-muted uppercase tracking-wider mb-0.5">Trial</p>
                    <p className="text-lg font-bold text-lg-midnight">{plan.trial_days}d</p>
                  </div>
                  <div className="flex-1 text-center p-3 rounded-xl bg-lg-surface-raised">
                    <p className="text-[10px] text-lg-text-muted uppercase tracking-wider mb-0.5">Grace</p>
                    <p className="text-lg font-bold text-lg-midnight">{plan.grace_period_days}d</p>
                  </div>
                  <div className="flex-1 text-center p-3 rounded-xl bg-lg-surface-raised">
                    <p className="text-[10px] text-lg-text-muted uppercase tracking-wider mb-0.5">Addons</p>
                    <p className="text-lg font-bold text-lg-midnight">{totalAddons}</p>
                  </div>
                </div>

                {/* Addon Preview */}
                <div className="space-y-1.5">
                  {planLinks.slice(0, 4).map((link) => {
                    const addon = addons.find((a) => a.id === link.addon_id);
                    if (!addon) return null;
                    return (
                      <div key={link.addon_id} className="flex items-center justify-between text-xs">
                        <span className="text-lg-text-muted">{addon.name}</span>
                        <span className={`font-semibold ${link.included_quantity === -1 ? "text-lg-primary" : link.included_quantity === 0 ? "text-lg-text-muted" : "text-lg-midnight"}`}>
                          {link.included_quantity === -1 ? "∞ Ilimitado" : link.included_quantity === 0 ? "Não incluso" : link.included_quantity}
                        </span>
                      </div>
                    );
                  })}
                  {planLinks.length > 4 && (
                    <button onClick={() => setEditPlan(plan)}
                      className="text-xs text-lg-primary hover:underline flex items-center gap-1 mt-1">
                      +{planLinks.length - 4} módulos <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <button onClick={() => setEditPlan(plan)} className="btn btn-ghost btn-sm w-full mt-auto">
                  Editar Composição
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Addons Tab ── */}
      {tab === "addons" && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--lg-border-light)] bg-lg-surface-raised">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Módulo</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Tipo</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Preço</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-lg-text-muted uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--lg-border-light)]">
              {addons.map((addon) => (
                <tr key={addon.id} className="hover:bg-lg-surface-raised transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-lg-midnight">{addon.name}</p>
                    <p className="text-xs text-lg-text-muted font-mono">{addon.slug}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs ${addon.type === "feature_toggle" ? "badge-primary" : "badge-success"}`}>
                      {addon.type === "feature_toggle" ? "Feature" : "Volume"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-lg-midnight">
                    {addon.monthly_price > 0 ? `R$ ${addon.monthly_price.toFixed(2).replace(".", ",")}` : <span className="text-lg-text-muted">Gratuito</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs ${addon.is_active ? "badge-success" : "badge-danger"}`}>
                      {addon.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => setEditAddon(addon)}
                      className="btn btn-ghost btn-sm px-3 py-1.5 text-xs flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawers */}
      {editPlan !== null && (
        <PlanDrawer
          plan={editPlan === "new" ? null : editPlan}
          addons={addons}
          links={links}
          onClose={() => setEditPlan(null)}
          onSaved={reload}
        />
      )}
      {editAddon !== null && (
        <AddonDrawer
          addon={editAddon === "new" ? null : editAddon}
          onClose={() => setEditAddon(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}
