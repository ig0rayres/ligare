"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ScanLine, User, ShieldAlert, CheckCircle2, ArrowRight, Loader2, Baby, AlertTriangle, Keyboard, Camera, CalendarClock } from "lucide-react";
import { verifyQRCode, registerCheckin, processCheckout } from "../actions";

interface Guardian {
  id: string;
  relationship: string;
  is_primary: boolean;
  guardian: { id: string; full_name: string; phone: string | null };
}

interface Kid {
  id: string;
  full_name: string;
  qr_code: string;
  image_rights_status: string;
  photo_url: string | null;
  classroom: { id: string; name: string } | null;
  guardians: Guardian[];
}

interface EventData { id: string; title: string; starts_at: string; recurrence_type: string; recurrence_day: string; scope: string }

export default function CheckinClient({ kids, classrooms, activeEvents = [] }: { kids: any[]; classrooms: any[]; activeEvents?: EventData[] }) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [scanState, setScanState] = useState<"scanning" | "review_checkin" | "review_checkout">("scanning");
  const [inputMode, setInputMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const manualInputRef = useRef<HTMLInputElement>(null);
  
  // Data populated from verifyQRCode
  const [activeKid, setActiveKid] = useState<Kid | null>(null);
  const [activeCheckinId, setActiveCheckinId] = useState<string | null>(null);
  const [scannedWristbandCode, setScannedWristbandCode] = useState<string | null>(null);
  
  // Throttle scanner
  const [lastScan, setLastScan] = useState<number>(0);
  // Track if URL code was already processed
  const urlProcessed = useRef(false);

  // Selected event (auto-select the first closest one)
  const [selectedEventId, setSelectedEventId] = useState<string>(activeEvents.length > 0 ? activeEvents[0].id : "");

  // Auto-process ?code= URL parameter
  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam && !urlProcessed.current) {
      urlProcessed.current = true;
      processCode(codeParam);
    }
  }, [searchParams]);

  const resetState = () => {
    setScanState("scanning");
    setActiveKid(null);
    setActiveCheckinId(null);
    setScannedWristbandCode(null);
    setManualCode("");
    urlProcessed.current = false;
  };

  const processCode = (code: string) => {
    startTransition(async () => {
      try {
        const res = await verifyQRCode(code);
        if (!res.success) {
          toast.error(res.message);
          return;
        }

        if (res.action === "CHECKIN") {
          setActiveKid(res.kid as any);
          setScanState("review_checkin");
          toast.success(`Criança identificada: ${(res.kid as any)?.full_name}`);
        } else if (res.action === "CHECKOUT") {
          setActiveKid(res.kid as any);
          setActiveCheckinId(res.checkin?.id || null);
          setScanState("review_checkout");
          toast.success("Check-in ativo encontrado — Iniciando Saída.");
        }
      } catch (e) {
        toast.error("Erro ao validar código. Tente novamente.");
      }
    });
  };

  const handleScan = async (detectedCodes: any[]) => {
    if (detectedCodes.length === 0) return;
    const now = Date.now();
    if (now - lastScan < 2000) return;
    setLastScan(now);
    processCode(detectedCodes[0].rawValue);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) {
      toast.error("Digite ou cole o código do crachá.");
      return;
    }
    processCode(code);
  };

  const handleConfirmCheckin = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await registerCheckin(formData);
        toast.success("Check-in realizado com sucesso!");
        resetState();
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  };

  const handleConfirmCheckout = async (formData: FormData) => {
    const guardianId = formData.get("guardian_id") as string;
    startTransition(async () => {
      try {
        if (!activeCheckinId) throw new Error("Sessão não encontrada");
        await processCheckout(activeCheckinId, guardianId);
        toast.success("Check-out realizado e saída autorizada!");
        resetState();
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  };

  // -------------------------
  // VIEW: REVIEW CHECKIN
  // -------------------------
  if (scanState === "review_checkin" && activeKid) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in p-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={resetState} className="text-sm font-medium text-lg-text-muted hover:text-lg-midnight transition-colors bg-white px-3 py-1.5 rounded-full shadow-sm border border-[var(--glass-border)]">
            ← Cancelar
          </button>
          <h2 className="text-xl font-bold text-lg-midnight font-heading">
            Confirmar Entrada
          </h2>
        </div>

        <div className="card p-6 flex flex-col gap-6">
          <div className="flex gap-4 items-start">
             {activeKid.photo_url ? (
                <img src={activeKid.photo_url} alt={activeKid.full_name} className="w-20 h-20 rounded-2xl object-cover shadow-sm bg-lg-off-white" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-lg-secondary-light flex items-center justify-center text-xl font-bold text-lg-care shadow-sm">
                  {activeKid.full_name.substring(0, 2).toUpperCase()}
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-lg-midnight">{activeKid.full_name}</h3>
                <p className="text-lg-text-muted mt-1 flex gap-2 items-center">
                  Crachá LIGARE: <span className="font-mono bg-lg-off-white px-2 py-0.5 rounded text-xs border border-[var(--glass-border)]">{activeKid.qr_code}</span>
                </p>
                
                {activeKid.image_rights_status === "denied" && (
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1.5 rounded-xl border border-red-200 font-bold text-xs tracking-wide shadow-sm">
                    <ShieldAlert className="w-4 h-4" />
                    ⚠️ NÃO FOTOGRAFAR (Direito Negado)
                  </div>
                )}
                {activeKid.image_rights_status === "pending" && (
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200 font-bold text-xs tracking-wide shadow-sm">
                    <AlertTriangle className="w-4 h-4" />
                    ⚠️ AUTORIZAÇÃO PENDENTE
                  </div>
                )}
              </div>
          </div>
          
          <div className="border-t border-[var(--glass-border)] pt-5">
             <form action={handleConfirmCheckin}>
                <input type="hidden" name="kid_id" value={activeKid.id} />
                <input type="hidden" name="event_id" value={selectedEventId} />
                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-lg-care uppercase tracking-wider mb-2">Turma de Destino</label>
                    <select name="classroom_id" defaultValue={activeKid.classroom?.id || ""} className="w-full px-4 py-3 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm font-medium focus:ring-2 focus:ring-lg-care focus:bg-white transition-colors" required>
                      <option value="" disabled>Selecione a sala...</option>
                      {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-lg-primary uppercase tracking-wider mb-2 flex justify-between">
                      <span>Pulseira Aleatória de Sessão</span>
                      <span className="text-lg-text-muted font-normal normal-case">(Opcional)</span>
                    </label>
                    <input type="text" name="wristband_code" placeholder="QR Code da Pulseira descartável..." className="w-full px-4 py-3 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm focus:ring-2 focus:ring-lg-primary font-mono placeholder:font-sans transition-colors" />
                    <p className="text-[11px] text-lg-text-muted mt-2">Dica: Aponte a câmera local para a pulseira e cole o código acima se aplicável.</p>
                  </div>
                </div>
                
                <button type="submit" disabled={isPending} className="w-full mt-6 btn text-white font-semibold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 hover:shadow-lg transition-all" style={{ background: "var(--lg-care)" }}>
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Confirmar Check-in</>}
                </button>
             </form>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------
  // VIEW: REVIEW CHECKOUT
  // -------------------------
  if (scanState === "review_checkout" && activeKid) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in p-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={resetState} className="text-sm font-medium text-lg-text-muted hover:text-lg-midnight transition-colors bg-white px-3 py-1.5 rounded-full shadow-sm border border-[var(--glass-border)]">
            ← Cancelar
          </button>
          <h2 className="text-xl font-bold text-lg-midnight font-heading flex items-center gap-2">
            <DoorOpen className="w-6 h-6 text-orange-500" />
            Autorizar Saída (Check-out)
          </h2>
        </div>

        <div className="card p-6 border-l-4 border-l-orange-500 flex flex-col gap-6">
          <div className="flex gap-4 items-center">
             {activeKid.photo_url ? (
                <img src={activeKid.photo_url} alt={activeKid.full_name} className="w-16 h-16 rounded-full object-cover shadow-sm ring-2 ring-orange-100" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-xl font-bold text-orange-600 shadow-sm ring-2 ring-orange-50">
                  {activeKid.full_name.substring(0, 2).toUpperCase()}
                </div>
              )}
              
              <div>
                <h3 className="text-xl font-bold text-lg-midnight">{activeKid.full_name}</h3>
                <p className="text-sm text-lg-text-muted font-medium">Turma atual: {activeKid.classroom?.name || "Desconhecida"}</p>
              </div>
          </div>
          
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-3">Responsáveis Autorizados</h4>
            <div className="grid sm:grid-cols-2 gap-2">
               {activeKid.guardians.map(g => (
                 <div key={g.id} className="flex gap-2 items-center bg-white p-2.5 rounded-lg border border-orange-100 shadow-sm">
                   <div className={`w-8 h-8 rounded-full flex justify-center items-center font-bold text-xs ${g.is_primary ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'}`}>
                     {g.is_primary ? '1º' : ''}
                     {!g.is_primary && g.relationship.substring(0,3)}
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold text-lg-midnight truncate">{g.guardian.full_name}</p>
                     <p className="text-[10px] text-lg-text-muted">{g.relationship}</p>
                   </div>
                 </div>
               ))}
            </div>
          </div>
          
          <div className="border-t border-[var(--glass-border)] pt-5">
             <form action={handleConfirmCheckout}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-lg-midnight uppercase tracking-wider mb-2">Quem está retirando a criança?</label>
                    <select name="guardian_id" className="w-full px-4 py-3 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-400 focus:bg-white transition-colors" required>
                      <option value="" disabled selected>Confirme visualmente o responsável...</option>
                      {activeKid.guardians.map(g => <option key={g.guardian.id} value={g.guardian.id}>{g.guardian.full_name} ({g.relationship})</option>)}
                    </select>
                  </div>
                </div>
                
                <button type="submit" disabled={isPending} className="w-full mt-6 btn bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all">
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Check-out Finalizado</>}
                </button>
             </form>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------
  // VIEW: QR SCANNER + MANUAL INPUT
  // -------------------------
  return (
    <div className="max-w-xl mx-auto space-y-6 pt-4 sm:pt-[5vh] px-4 pb-10">
      
      {/* Active Event Header */}
      {activeEvents.length > 0 ? (
        <div className="bg-lg-off-white border border-[var(--glass-border)] p-3 rounded-2xl flex items-center justify-between gap-4 shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-[var(--glass-border)] flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-lg-care" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-lg-text-muted uppercase tracking-wider">Evento Ativo</p>
              {activeEvents.length === 1 ? (
                <p className="text-sm font-bold text-lg-midnight">{activeEvents[0].title}</p>
              ) : (
                <select 
                  value={selectedEventId} 
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="bg-transparent font-bold text-sm text-lg-midnight focus:outline-none border-b border-dashed border-gray-300 w-full"
                >
                  {activeEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              )}
            </div>
          </div>
          {activeEvents.length === 1 && (
            <div className="text-xs font-semibold bg-white px-2 py-1 object-center rounded-lg shadow-sm border border-[var(--glass-border)] text-green-600 flex items-center gap-1.5 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5" /> Auto
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center gap-3 shadow-sm mb-6">
           <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
           <p className="text-xs text-amber-800 font-medium leading-tight">Nenhum evento agendado para hoje. Check-ins ficarão avulsos no histórico.</p>
        </div>
      )}

      <div className="text-center space-y-3 mb-6">
        <div className="w-16 h-16 bg-lg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-lg-primary/20 shadow-sm animate-pulse-subtle">
          <ScanLine className="w-8 h-8 text-[var(--lg-primary)]" />
        </div>
        <h2 className="text-2xl font-bold text-lg-midnight font-heading">
          Scanner da Ligare
        </h2>
        <p className="text-sm text-lg-text-muted max-w-sm mx-auto">
          Aponte a câmera para o Crachá ou use o campo manual abaixo para digitar/colar o código.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-lg-off-white rounded-xl p-1 gap-1 border border-[var(--glass-border)]">
        <button 
          onClick={() => setInputMode("camera")} 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${inputMode === "camera" ? "bg-white text-lg-midnight shadow-sm" : "text-lg-text-muted hover:text-lg-midnight"}`}
        >
          <Camera className="w-4 h-4" /> Câmera
        </button>
        <button 
          onClick={() => { setInputMode("manual"); setTimeout(() => manualInputRef.current?.focus(), 100); }} 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${inputMode === "manual" ? "bg-white text-lg-midnight shadow-sm" : "text-lg-text-muted hover:text-lg-midnight"}`}
        >
          <Keyboard className="w-4 h-4" /> Manual
        </button>
      </div>

      {/* Camera Mode */}
      {inputMode === "camera" && (
        <div className="card p-2 sm:p-4 overflow-hidden relative shadow-xl border-[var(--glass-border)]">
          {isPending && (
            <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-lg-care animate-spin mb-4" />
              <p className="font-bold text-lg-midnight">Processando...</p>
            </div>
          )}
          <div className="rounded-2xl overflow-hidden aspect-square sm:aspect-video bg-black relative">
            <Scanner 
              onScan={handleScan}
              components={{
                onOff: true,
                finder: true
              }}
              styles={{
                container: { width: "100%", height: "100%" }
              }}
            />
          </div>
        </div>
      )}

      {/* Manual Mode */}
      {inputMode === "manual" && (
        <div className="card p-6 shadow-xl border-[var(--glass-border)]">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-lg-primary uppercase tracking-wider mb-2">
                Código do Crachá / Pulseira
              </label>
              <input 
                ref={manualInputRef}
                type="text" 
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Ex: KID-LIG-7B53258F" 
                className="w-full px-4 py-4 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-lg font-mono font-bold text-center tracking-widest focus:ring-2 focus:ring-lg-care focus:bg-white transition-colors placeholder:text-sm placeholder:font-sans placeholder:tracking-normal placeholder:font-normal" 
                autoComplete="off"
                autoFocus
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isPending || !manualCode.trim()} 
              className="w-full btn text-white font-semibold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50" 
              style={{ background: "var(--lg-care)" }}
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ScanLine className="w-5 h-5" /> Verificar Código</>}
            </button>
          </form>

          {isPending && (
            <div className="mt-4 text-center">
              <p className="text-sm text-lg-text-muted animate-pulse">Consultando banco de dados...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Emulated Icon Import
function DoorOpen(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/></svg>;
}
