"use client";

import { useState } from "react";
import {
  Users,
  Clock,
  Check,
  AlertCircle,
  Send,
  Heart,
  MapPin,
  ChevronRight,
  MessageCircle,
  UserPlus,
  Eye,
  Filter,
} from "lucide-react";

type FollowupTab = "pending" | "all" | "visitors" | "absent";

const followupData = [
  { id: 1, name: "Maria Clara", type: "visitor" as const, status: "pending" as const, whatsapp: "(11) 98765-4321", time: "Domingo, 09:30", notes: "Primeira vez. Veio com amigas." },
  { id: 2, name: "Roberto Lima", type: "absent" as const, status: "pending" as const, whatsapp: "(11) 91234-5678", time: "Faltou 2 domingos", notes: null },
  { id: 3, name: "Camila Torres", type: "new_member" as const, status: "contacted" as const, whatsapp: "(11) 99999-0000", time: "Cadastro há 5 dias", notes: "Quer entrar em uma célula" },
  { id: 4, name: "André Souza", type: "absent" as const, status: "awaiting" as const, whatsapp: "(11) 97777-8888", time: "Faltou 3 domingos", notes: null },
  { id: 5, name: "Juliana Mendes", type: "visitor" as const, status: "pending" as const, whatsapp: "(11) 96666-5555", time: "Domingo, 19:00", notes: "Pediu oração" },
];

const actionButtons = [
  { label: "Enviar boas-vindas", icon: Heart, color: "var(--lg-care)" },
  { label: "Sentimos sua falta", icon: MessageCircle, color: "var(--lg-primary)" },
  { label: "Convite para célula", icon: MapPin, color: "#8B5CF6" },
  { label: "Como posso orar por você?", icon: Heart, color: "#F59E0B" },
  { label: "Convite para evento", icon: Send, color: "var(--lg-primary)" },
];

export default function FollowupPage() {
  const [activeTab, setActiveTab] = useState<FollowupTab>("pending");
  const [actionModal, setActionModal] = useState<number | null>(null);

  const filtered = followupData.filter((item) => {
    if (activeTab === "pending") return item.status === "pending";
    if (activeTab === "visitors") return item.type === "visitor";
    if (activeTab === "absent") return item.type === "absent";
    return true;
  });

  const selectedPerson = followupData.find((f) => f.id === actionModal);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-lg-midnight"
          style={{ fontFamily: "var(--lg-font-heading)" }}
        >
          Follow-up
        </h1>
        <p className="text-sm text-lg-text-muted mt-1">
          Acompanhe visitantes, novos membros e quem está faltando
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: "pending" as const, label: "Pendentes", count: followupData.filter(f => f.status === "pending").length },
          { key: "visitors" as const, label: "Visitantes", count: followupData.filter(f => f.type === "visitor").length },
          { key: "absent" as const, label: "Faltantes", count: followupData.filter(f => f.type === "absent").length },
          { key: "all" as const, label: "Todos", count: followupData.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn btn-sm whitespace-nowrap ${activeTab === tab.key ? "btn-primary" : "btn-ghost"}`}
          >
            {tab.label}
            <span className={`ml-1 text-xs ${activeTab === tab.key ? "text-white/70" : "text-lg-text-muted"}`}>
              ({tab.count})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card divide-y divide-[var(--lg-border-light)]">
        {filtered.map((item) => (
          <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-lg-surface-raised transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-lg-mist flex items-center justify-center text-sm font-bold text-lg-primary shrink-0">
                {item.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-semibold text-lg-midnight">{item.name}</p>
                <p className="text-xs text-lg-text-muted mt-0.5">{item.time}</p>
                {item.notes && (
                  <p className="text-xs text-lg-text-secondary mt-1 italic">"{item.notes}"</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`badge ${
                    item.type === "visitor" ? "badge-primary" :
                    item.type === "absent" ? "badge-danger" :
                    "badge-success"
                  }`}>
                    {item.type === "visitor" && "Visitante"}
                    {item.type === "absent" && "Faltante"}
                    {item.type === "new_member" && "Novo membro"}
                  </span>
                  <span className={`badge ${
                    item.status === "pending" ? "badge-warning" :
                    item.status === "contacted" ? "badge-success" :
                    "badge-primary"
                  }`}>
                    {item.status === "pending" && <><Clock className="w-2.5 h-2.5" /> Pendente</>}
                    {item.status === "contacted" && <><Check className="w-2.5 h-2.5" /> Contatado</>}
                    {item.status === "awaiting" && <><AlertCircle className="w-2.5 h-2.5" /> Aguardando</>}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActionModal(item.id)}
              className="btn btn-secondary btn-sm shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Agir
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center">
            <Check className="w-8 h-8 text-lg-care mx-auto mb-2" />
            <p className="text-sm text-lg-text-muted">Tudo em dia! Nenhum follow-up pendente.</p>
          </div>
        )}
      </div>

      {/* Action Modal — Leader sees ONLY buttons, NO free text */}
      {actionModal !== null && selectedPerson && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="card p-6 max-w-md w-full animate-slide-up">
            <h3
              className="text-lg font-bold text-lg-midnight mb-1"
              style={{ fontFamily: "var(--lg-font-heading)" }}
            >
              Ação para {selectedPerson.name}
            </h3>
            <p className="text-sm text-lg-text-muted mb-6">
              Escolha uma mensagem pré-definida. O envio será feito pelo WhatsApp oficial da igreja.
            </p>

            <div className="space-y-2">
              {actionButtons.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    // TODO: Dispatch structured message via webhook
                    setActionModal(null);
                  }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[var(--lg-border)] hover:border-[var(--lg-primary)] hover:bg-lg-primary-light transition-all text-left group"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${action.color}14` }}
                  >
                    <action.icon className="w-4 h-4" style={{ color: action.color }} />
                  </div>
                  <span className="text-sm font-medium text-lg-text">
                    {action.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-lg-text-muted ml-auto" />
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-lg-mist border border-[var(--lg-primary)]/10">
              <p className="text-xs text-lg-primary">
                💡 As mensagens são enviadas pelo número oficial da igreja. Seu número pessoal nunca é exposto.
              </p>
            </div>

            <button
              onClick={() => setActionModal(null)}
              className="btn btn-ghost w-full mt-4"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
