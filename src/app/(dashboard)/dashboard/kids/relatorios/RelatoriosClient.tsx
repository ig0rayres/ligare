"use client";

import { useState, useTransition } from "react";
import { BarChart3, CalendarClock, Baby, AlertTriangle, Users, DoorOpen, Loader2 } from "lucide-react";

interface ReportData {
  totalKids: number;
  totalCheckins: number;
  totalAlerts: number;
  classroomCounts: Array<{ name: string; count: number }>;
}

export default function RelatoriosClient() {
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);

  function getDateRange() {
    const now = new Date();
    if (period === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: start.toISOString().split("T")[0], end: now.toISOString().split("T")[0] };
    } else if (period === "quarter") {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { start: start.toISOString().split("T")[0], end: now.toISOString().split("T")[0] };
    } else {
      return { start: customStart, end: customEnd };
    }
  }

  async function generateReport() {
    const { start, end } = getDateRange();
    if (!start || !end) return;

    startTransition(async () => {
      const { getKidsReport } = await import("../actions");
      const data = await getKidsReport(start, end);
      setReport(data);
    });
  }

  const maxCount = report ? Math.max(...report.classroomCounts.map((c) => c.count), 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
          Relatórios Kids
        </h2>
        <p className="text-sm text-lg-text-muted">Consulte métricas de frequência e presença do ministério infantil.</p>
      </div>

      {/* Period Selector */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-lg-midnight mb-3 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-lg-care" />
          Selecione o Período
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex gap-2">
            {[
              { value: "month", label: "Este Mês" },
              { value: "quarter", label: "Trimestre" },
              { value: "custom", label: "Personalizado" },
            ].map((p) => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${period === p.value ? "bg-lg-care text-white" : "bg-white/50 text-lg-text-muted border border-[var(--glass-border)] hover:bg-white"}`}>
                {p.label}
              </button>
            ))}
          </div>

          {period === "custom" && (
            <div className="flex gap-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-xs" />
              <span className="text-xs text-lg-text-muted self-center">até</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-2 bg-white/50 border border-[var(--glass-border)] rounded-xl text-xs" />
            </div>
          )}

          <button onClick={generateReport} disabled={isPending}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white flex items-center gap-2 disabled:opacity-60" style={{ background: "var(--lg-care)" }}>
            {isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</> : <><BarChart3 className="w-3.5 h-3.5" /> Gerar Relatório</>}
          </button>
        </div>
      </div>

      {/* Report Results */}
      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total de Crianças", value: report.totalKids, icon: Baby, color: "var(--lg-care)" },
              { label: "Check-ins no Período", value: report.totalCheckins, icon: Users, color: "var(--lg-primary)" },
              { label: "Alertas Emitidos", value: report.totalAlerts, icon: AlertTriangle, color: "var(--lg-danger)" },
            ].map((s) => (
              <div key={s.label} className="card p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}14` }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>{s.value}</p>
                  <p className="text-xs text-lg-text-muted">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Classroom Distribution */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-lg-midnight mb-4 flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-lg-care" />
              Crianças por Sala
            </h3>
            {report.classroomCounts.length === 0 ? (
              <p className="text-sm text-lg-text-muted text-center py-4">Nenhuma sala encontrada.</p>
            ) : (
              <div className="space-y-3">
                {report.classroomCounts.map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-xs text-lg-text-muted w-24 text-right shrink-0">{c.name}</span>
                    <div className="flex-1 h-8 bg-lg-off-white rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg flex items-center px-3 transition-all duration-500"
                        style={{ width: `${Math.max((c.count / maxCount) * 100, 8)}%`, background: "var(--lg-care)" }}
                      >
                        <span className="text-xs font-bold text-white">{c.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!report && (
        <div className="card text-center p-12">
          <BarChart3 className="w-10 h-10 text-lg-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm text-lg-text-muted">Selecione um período e clique em "Gerar Relatório".</p>
        </div>
      )}
    </div>
  );
}
