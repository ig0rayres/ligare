"use client";

import { useState } from "react";
import { BarChart3, Plus, ArrowUpCircle, ArrowDownCircle, CheckCircle2, Clock, Ban, Wallet, Settings } from "lucide-react";
import TransactionModal from "./components/TransactionModal";
import CategoryManager from "./components/CategoryManager";

interface Props {
  accounts: any[];
  categories: any[];
  transactions: any[];
  events: any[];
}

type Tab = "dashboard" | "config";

export default function FinanceClient({ accounts, categories, transactions, events }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const totalBalance = accounts.reduce((acc, a) => acc + Number(a.initial_balance), 0);
  const totalIn = transactions.filter(t => t.type === "in" && t.status === "verified").reduce((acc, t) => acc + Number(t.amount), 0);
  const totalOut = transactions.filter(t => t.type === "out" && t.status === "verified").reduce((acc, t) => acc + Number(t.amount), 0);

  const fmt = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-6 animate-fade-in pb-20">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[var(--lg-border-light)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
              Gestão Financeira
            </h1>
            <p className="text-sm text-lg-text-muted">Controle de caixa, receitas e transparência total.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === "dashboard" ? "bg-white text-lg-midnight shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Wallet className="w-4 h-4" />
              Caixa
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === "config" ? "bg-white text-lg-midnight shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Settings className="w-4 h-4" />
              Categorias
            </button>
          </div>

          {activeTab === "dashboard" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-lg-primary hover:bg-lg-primary-dark text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Novo Lançamento
            </button>
          )}
        </div>
      </div>

      {/* TAB: DASHBOARD */}
      {activeTab === "dashboard" && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 border-l-4" style={{ borderColor: "var(--lg-primary)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-lg-text-muted mb-1">Saldo em Contas</p>
                  <h2 className="text-3xl font-bold text-lg-midnight">{fmt(totalBalance)}</h2>
                </div>
                <div className="w-10 h-10 bg-lg-primary-light rounded-full flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-lg-primary" />
                </div>
              </div>
            </div>

            <div className="card p-6 border-l-4 border-green-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-lg-text-muted mb-1">Entradas Verificadas</p>
                  <h2 className="text-3xl font-bold text-green-600">{fmt(totalIn)}</h2>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <ArrowUpCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="card p-6 border-l-4 border-red-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-lg-text-muted mb-1">Saídas</p>
                  <h2 className="text-3xl font-bold text-red-600">{fmt(totalOut)}</h2>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <ArrowDownCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* TABELA */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--lg-border-light)] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-lg-midnight flex items-center gap-2">
                <Wallet className="w-5 h-5 text-lg-primary" /> Histórico & Validações
              </h2>
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-lg-text font-medium">Nenhum lançamento ainda</p>
                <p className="text-sm text-lg-text-muted">Use o botão acima para registrar as entradas do culto.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                      <th className="py-4 px-6">Data</th>
                      <th className="py-4 px-6">Descrição / Evento</th>
                      <th className="py-4 px-6">Categoria</th>
                      <th className="py-4 px-6">Valor</th>
                      <th className="py-4 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 text-gray-600">
                          {new Intl.DateTimeFormat("pt-BR").format(new Date(t.transaction_date))}
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-medium text-lg-midnight">{t.description || "Lançamento Contábil"}</p>
                          {t.event?.title
                            ? <p className="text-xs text-blue-600 font-medium">Culto: {t.event.title}</p>
                            : <p className="text-xs text-gray-400">Receita Avulsa</p>
                          }
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex px-2 py-1 rounded text-xs font-semibold"
                            style={{ backgroundColor: `${t.category?.color || "#ccc"}20`, color: t.category?.color }}>
                            {t.category?.name}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-bold ${t.type === "in" ? "text-green-600" : "text-red-600"}`}>
                            {t.type === "in" ? "+" : "-"} {fmt(Number(t.amount))}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {t.status === "pending" && <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full"><Clock className="w-3.5 h-3.5" /> Pendente</span>}
                          {t.status === "verified" && <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> Validado</span>}
                          {t.status === "rejected" && <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full"><Ban className="w-3.5 h-3.5" /> Rejeitado</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB: CATEGORIAS */}
      {activeTab === "config" && (
        <CategoryManager categories={categories} />
      )}

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { window.location.reload(); }}
        accounts={accounts}
        categories={categories}
        events={events}
      />
    </div>
  );
}
