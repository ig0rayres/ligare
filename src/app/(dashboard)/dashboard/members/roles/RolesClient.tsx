"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, ShieldCheck, HelpCircle, Loader2 } from "lucide-react";
import { createChurchRole, deleteChurchRole } from "../actions";
import { toast } from "sonner";

export default function RolesClient({ initialRoles, error }: { initialRoles: any[], error: any }) {
  const [isPending, startTransition] = useTransition();

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      try {
        await createChurchRole(formData);
        toast.success("Encargo criado com sucesso!");
        // We could clear form here if using a ref
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esse encargo?")) return;
    startTransition(async () => {
      try {
        await deleteChurchRole(id);
        toast.success("Encargo excluído permanentemente!");
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
            Encargos Ministeriais
          </h2>
          <p className="text-sm text-lg-text-muted mt-1">
            Defina os cargos de liderança ou funções disponíveis em sua igreja.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 h-max border border-[var(--glass-border)] bg-gradient-to-br from-white/60 to-white/30">
          <h3 className="text-sm font-bold text-lg-midnight mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-lg-primary" />
            Criar Novo Encargo
          </h3>

          <form action={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-lg-text-muted mb-1">
                Nome do Encargo
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Ex: Líder Infantil"
                className="w-full px-4 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-lg-text-muted mb-1 flex items-center justify-between">
                Nível de Permissão
                <span title="Define o acesso gerencial desta função" className="cursor-help"><HelpCircle className="w-3 h-3"/></span>
              </label>
              <select
                name="permissions_level"
                required
                className="w-full px-4 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary"
              >
                <option value="member">Membro Padrão (Sem acesso gerencial)</option>
                <option value="leader">Líder (Visualiza sua Equipe e Presença)</option>
                <option value="kids_leader">Líder Kids (Supervisão Global Infantil)</option>
                <option value="admin">Administrador (Gestão Global da Igreja)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full btn-primary px-4 py-2 rounded-xl text-sm font-medium flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Salvar Encargo
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-lg-midnight mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-lg-primary" />
            Encargos Ativos
          </h3>

          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">Erro ao carregar encargos: {String(error)}</p>}

          {!initialRoles || initialRoles.length === 0 ? (
            <div className="card text-center p-8 bg-lg-off-white/50 border-dashed">
              <ShieldCheck className="w-8 h-8 text-lg-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-sm text-lg-text-muted">Nenhum encargo cadastrado.</p>
              <p className="text-xs text-lg-text-muted opacity-80 mt-1">Crie o primeiro usando o formulário ao lado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialRoles.map((role: any) => (
                <div key={role.id} className="card p-4 flex items-center justify-between group hover:shadow-md transition-all">
                  <div>
                    <p className="font-semibold text-sm text-lg-midnight">{role.name}</p>
                    <p className="text-xs px-2 py-0.5 mt-1 bg-lg-off-white text-lg-text-muted rounded-md w-max border border-[var(--glass-border)]">
                      Nível: {role.permissions_level === 'leader' ? 'Líder' : role.permissions_level === 'admin' ? 'Administrador' : role.permissions_level === 'kids_leader' ? 'Líder Kids' : 'Membro'}
                    </p>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => handleDelete(role.id)}
                    disabled={isPending}
                    className="p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 disabled:opacity-50"
                    title="Excluir encargo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
