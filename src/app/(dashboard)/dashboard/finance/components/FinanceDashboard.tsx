"use client";

import { useState } from "react";
import { BarChart3, Plus, ArrowUpCircle, ArrowDownCircle, CheckCircle2, Clock, Ban, Wallet } from "lucide-react";
import TransactionModal from "./TransactionModal";

interface Props {
  accounts: any[];
  categories: any[];
  transactions: any[];
  events: any[];
}

export default function FinanceDashboard({ accounts, categories, transactions, events }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalBalance = accounts.reduce((acc, a) => acc + Number(a.initial_balance), 0);
  const totalIn = transactions.filter(t => t.type === "in" && t.status === "verified").reduce((acc, t) => acc + Number(t.amount), 0);
  const totalOut = transactions.filter(t => t.type === "out" && t.status === "verified").reduce((acc, t) => acc + Number(t.amount), 0);
  const fmt = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-6">

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-lg-text-muted">
          {transactions.length} lançamento{transactions.length !== 1 ? "s" : ""} registrado{transactions.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Saldo em Contas", value: fmt(totalBalance), icon: Wallet, color: "var(--lg-primary)" },
          { label: "Entradas Verificadas", value: fmt(totalIn), icon: ArrowUpCircle, color: "var(--lg-care)" },
          { label: "Saídas", value: fmt(totalOut), icon: ArrowDownCircle, color: "var(--lg-danger)" },
        ].map(kpi => (
          <div key={kpi.label} className="card p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${kpi.color} 15%, transparent)` }}>
              <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
            </div>
            <div>
              <p className="text-xs text-lg-text-muted font-medium uppercase tracking-wider">{kpi.label}</p>
              <p className="text-2xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div>
        <h2 className="text-sm font-semibold text-lg-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Histórico & Validações
        </h2>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-lg-surface-raised flex items-center justify-center mb-4">
              <BarChart3 className="w-7 h-7 text-lg-text-muted opacity-40" />
            </div>
            <p className="text-sm font-medium text-lg-text">Nenhum lançamento ainda</p>
            <p className="text-xs text-lg-text-muted mt-1">Use o botão acima para registrar as entradas do culto.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--lg-border-light)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-lg-surface-raised text-xs uppercase text-lg-text-muted font-semibold tracking-wider">
                  <th className="py-3 px-5">Data</th>
                  <th className="py-3 px-5">Descrição / Evento</th>
                  <th className="py-3 px-5">Categoria</th>
                  <th className="py-3 px-5">Valor</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--lg-border-light)]">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-lg-surface-raised transition-colors">
                    <td className="py-4 px-5 text-lg-text-muted">
                      {new Intl.DateTimeFormat("pt-BR").format(new Date(t.transaction_date))}
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-medium text-lg-midnight">{t.description || "Lançamento Contábil"}</p>
                      {t.event?.title
                        ? <p className="text-xs font-medium mt-0.5" style={{ color: "var(--lg-primary)" }}>Culto: {t.event.title}</p>
                        : <p className="text-xs text-lg-text-muted mt-0.5">Receita Avulsa</p>}
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                        style={{ backgroundColor: `color-mix(in srgb, ${t.category?.color || "var(--lg-text-muted)"} 15%, transparent)`, color: t.category?.color || "var(--lg-text-muted)" }}>
                        {t.category?.name || "—"}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-bold" style={{ color: t.type === "in" ? "var(--lg-care)" : "var(--lg-danger)" }}>
                        {t.type === "in" ? "+" : "−"} {fmt(Number(t.amount))}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      {t.status === "pending" && <span className="badge badge-warning"><Clock className="w-3 h-3" /> Pendente</span>}
                      {t.status === "verified" && <span className="badge badge-success"><CheckCircle2 className="w-3 h-3" /> Validado</span>}
                      {t.status === "rejected" && <span className="badge badge-danger"><Ban className="w-3 h-3" /> Rejeitado</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => window.location.reload()}
        accounts={accounts}
        categories={categories}
        events={events}
      />
    </div>
  );
}
