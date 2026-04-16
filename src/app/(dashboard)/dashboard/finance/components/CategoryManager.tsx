"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Tag, Plus, Pencil, Trash2, X, Check, Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  type: "in" | "out";
  color: string;
  is_active: boolean;
}

const PRESET_COLORS = [
  "#18B37E", "#1F6FEB", "#F59E0B", "#8B5CF6",
  "#EC4899", "#EF4444", "#F97316", "#0EA5E9",
  "#EAB308", "#A855F7", "#6B7280", "#0D9488",
];

interface Props {
  categories: Category[];
}

export default function CategoryManager({ categories: initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({ name: "", type: "in" as "in" | "out", color: "#1F6FEB" });

  const incomeCategories = categories.filter(c => c.type === "in" && c.is_active);
  const expenseCategories = categories.filter(c => c.type === "out" && c.is_active);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", type: "in", color: "#18B37E" });
    setIsModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, type: cat.type, color: cat.color });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    setLoading(true);
    try {
      const url = editing ? `/api/finance/categories/${editing.id}` : "/api/finance/categories";
      const method = editing ? "PATCH" : "POST";
      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await resp.json();
      if (result.error) { toast.error(result.error); return; }

      if (editing) {
        setCategories(prev => prev.map(c => c.id === editing.id ? { ...c, ...form } : c));
        toast.success("Categoria atualizada!");
      } else {
        setCategories(prev => [...prev, result.data]);
        toast.success("Categoria criada!");
      }
      setIsModalOpen(false);
    } catch {
      toast.error("Erro ao salvar categoria");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Desativar a categoria "${cat.name}"?`)) return;
    try {
      const resp = await fetch(`/api/finance/categories/${cat.id}`, { method: "DELETE" });
      const result = await resp.json();
      if (result.error) { toast.error(result.error); return; }
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: false } : c));
      toast.success("Categoria desativada");
    } catch {
      toast.error("Erro ao desativar");
    }
  };

  const CategoryList = ({ items, label, icon: Icon, accentColor }: { items: Category[], label: string, icon: any, accentColor: string }) => (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--lg-border-light)] flex items-center gap-3" style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}>
        <Icon className="w-4 h-4" style={{ color: accentColor }} />
        <h3 className="font-semibold text-lg-midnight text-sm">{label}</h3>
        <span className="ml-auto text-xs text-lg-text-muted bg-lg-surface-raised px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="divide-y divide-[var(--lg-border-light)]">
        {items.length === 0 ? (
          <p className="text-sm text-lg-text-muted text-center py-8">Nenhuma categoria cadastrada</p>
        ) : items.map(cat => (
          <div key={cat.id} className="flex items-center gap-3 px-5 py-3 hover:bg-lg-surface-raised transition-colors">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="text-sm font-medium text-lg-midnight flex-1">{cat.name}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(cat)} className="p-1.5 text-lg-text-muted hover:text-lg-primary hover:bg-lg-primary-light rounded-lg transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDelete(cat)} className="p-1.5 text-lg-text-muted hover:text-lg-danger hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)" }}>
            <Tag className="w-5 h-5" style={{ color: "var(--lg-primary)" }} />
          </div>
          <div>
            <h2 className="font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>Categorias Financeiras</h2>
            <p className="text-sm text-lg-text-muted">Plano de contas da sua igreja</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <CategoryList items={incomeCategories} label="Receitas (Entradas)" icon={ArrowUpCircle} accentColor="var(--lg-care)" />
        <CategoryList items={expenseCategories} label="Despesas (Saídas)" icon={ArrowDownCircle} accentColor="var(--lg-danger)" />
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-[var(--lg-surface-overlay)] backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[var(--lg-surface)] rounded-2xl w-full max-w-md shadow-[var(--lg-shadow-xl)] border border-[var(--lg-border)]">
            <div className="p-6 border-b border-[var(--lg-border-light)] flex items-center justify-between">
              <h3 className="font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
                {editing ? "Editar Categoria" : "Nova Categoria"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-lg-surface-raised rounded-full transition-colors">
                <X className="w-4 h-4 text-lg-text-muted" />
              </button>
            </div>
            <div className="p-6 space-y-5">

              {/* Tipo */}
              <div>
                <label className="block text-sm font-semibold text-lg-midnight mb-2">Tipo</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: "in" }))}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors flex items-center justify-center gap-2`}
                    style={form.type === "in" 
                      ? { borderColor: "var(--lg-care)", backgroundColor: "color-mix(in srgb, var(--lg-care) 10%, transparent)", color: "var(--lg-care)" }
                      : { borderColor: "var(--lg-border)", color: "var(--lg-text-secondary)" }}
                  >
                    <ArrowUpCircle className="w-4 h-4" /> Receita (Entrada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: "out" }))}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors flex items-center justify-center gap-2`}
                    style={form.type === "out" 
                      ? { borderColor: "var(--lg-danger)", backgroundColor: "color-mix(in srgb, var(--lg-danger) 10%, transparent)", color: "var(--lg-danger)" }
                      : { borderColor: "var(--lg-border)", color: "var(--lg-text-secondary)" }}
                  >
                    <ArrowDownCircle className="w-4 h-4" /> Despesa (Saída)
                  </button>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-lg-midnight mb-2">Nome da Categoria</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Dízimo, Oferta, Material..."
                  className="input w-full"
                />
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-semibold text-lg-midnight mb-3">Cor de Identificação</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color }))}
                      className="w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center border border-black/10"
                      style={{ backgroundColor: color }}
                    >
                      {form.color === color && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[var(--lg-border-light)] flex justify-end gap-3 bg-[var(--lg-surface-raised)] rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost bg-[var(--lg-surface)]">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editing ? "Salvar Alterações" : "Criar Categoria"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
