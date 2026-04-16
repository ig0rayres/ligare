"use client";

import { useState } from "react";
import {
  Baby,
  Search,
  QrCode,
  Check,
  AlertTriangle,
  Phone,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";

export default function KidsPainelPage() {
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [alertModal, setAlertModal] = useState<number | null>(null);
  const [alertSent, setAlertSent] = useState<Set<number>>(new Set());

  function handleCallParent(kidId: number) {
    setAlertSent((prev) => new Set(prev).add(kidId));
    setAlertModal(null);
  }

  // TODO: Replace with real data from Supabase
  const checkedInKids: any[] = [];
  const classrooms: string[] = [];

  const filteredKids = checkedInKids.filter((kid) => {
    const matchRoom = selectedRoom === "all" || kid.room === selectedRoom;
    const matchSearch = kid.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRoom && matchSearch;
  });

  const alertKid = checkedInKids.find((k) => k.id === alertModal);

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Presentes", value: checkedInKids.length, icon: UserCheck, color: "var(--lg-care)" },
          { label: "Salas ativas", value: 0, icon: Baby, color: "var(--lg-primary)" },
          { label: "Check-outs", value: 0, icon: UserX, color: "var(--lg-slate)" },
          { label: "Alertas", value: alertSent.size, icon: AlertTriangle, color: "var(--lg-danger)" },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}14` }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-lg font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>{s.value}</p>
              <p className="text-xs text-lg-text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lg-text-muted" />
          <input
            type="text"
            placeholder="Buscar criança..."
            className="input pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn btn-success">
          <QrCode className="w-4 h-4" />
          Fazer Check-in
        </button>
      </div>

      {/* Filters */}
      {classrooms.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedRoom("all")}
            className={`btn btn-sm whitespace-nowrap ${selectedRoom === "all" ? "btn-primary" : "btn-ghost"}`}
          >
            Todas
          </button>
          {classrooms.map((room) => (
            <button
              key={room}
              onClick={() => setSelectedRoom(room)}
              className={`btn btn-sm whitespace-nowrap ${selectedRoom === room ? "btn-primary" : "btn-ghost"}`}
            >
              {room}
            </button>
          ))}
        </div>
      )}

      {/* Kids List */}
      <div className="card divide-y divide-[var(--lg-border-light)]">
        {filteredKids.length === 0 && (
          <div className="p-12 text-center">
            <Baby className="w-10 h-10 text-lg-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-lg-text-muted">
              Nenhuma criança com check-in ativo hoje
            </p>
            <p className="text-xs text-lg-text-muted mt-1">
              Use o botão acima para fazer o check-in das crianças.
            </p>
          </div>
        )}

        {filteredKids.map((kid) => (
          <div key={kid.id} className="p-4 flex items-center justify-between hover:bg-lg-surface-raised transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-lg-secondary-light flex items-center justify-center text-sm font-bold text-lg-care">
                {kid.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-semibold text-lg-midnight">{kid.name}</p>
                <p className="text-xs text-lg-text-muted">
                  {kid.room} • Responsável: {kid.guardian}
                </p>
                {kid.allergies && (
                  <span className="badge badge-warning text-[10px] mt-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {kid.allergies}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-lg-text-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {kid.time}
              </span>
              {alertSent.has(kid.id) ? (
                <span className="badge badge-danger"><Phone className="w-3 h-3" /> Chamado</span>
              ) : (
                <button onClick={() => setAlertModal(kid.id)} className="btn btn-danger btn-sm">
                  <Phone className="w-3.5 h-3.5" /> Chamar
                </button>
              )}
              <button className="btn btn-ghost btn-sm">
                <Check className="w-3.5 h-3.5" /> Check-out
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Modal */}
      {alertModal !== null && alertKid && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="card p-8 max-w-sm w-full text-center animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-lg-danger" />
            </div>
            <h3 className="text-xl font-bold text-lg-midnight mb-2" style={{ fontFamily: "var(--lg-font-heading)" }}>
              Chamar Responsável
            </h3>
            <p className="text-sm text-lg-text-secondary mb-1">
              Criança: <strong>{alertKid.name}</strong>
            </p>
            <p className="text-sm text-lg-text-secondary mb-6">
              Responsável: <strong>{alertKid.guardian}</strong>
            </p>
            <p className="text-xs text-lg-text-muted mb-6">
              Uma mensagem automática será enviada pelo WhatsApp e notificação push solicitando que o responsável se dirija à sala.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setAlertModal(null)} className="btn btn-ghost flex-1">
                Cancelar
              </button>
              <button onClick={() => handleCallParent(alertKid.id)} className="btn btn-danger flex-1">
                <Phone className="w-4 h-4" /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
