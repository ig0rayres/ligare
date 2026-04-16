"use client";

import { useState, useEffect, useTransition } from "react";
import {
  MessageCircle, Zap, Shield, Clock, CheckCircle2,
  QrCode, Loader2, CreditCard, Copy, Check, RefreshCw, Wifi
} from "lucide-react";
import { createWhatsAppCharge, createWhatsAppCreditCardLink } from "./actions";
import { toast } from "sonner";

interface WhatsAppFeatures {
  whatsapp_active?: boolean;
  hp_instance_id?: string;
  whatsapp_activated_at?: string;
}

interface Props {
  churchId: string;
  churchName: string;
  features: WhatsAppFeatures;
}

type Screen = "paywall" | "checkout" | "pix" | "creditcard" | "qrcode";
type QrStatus = "QRCODE" | "CONNECTED" | "DISCONNECTED" | "loading";

// ──────────────────────────────────────────────────────────────────────────────
// Paywall Screen
// ──────────────────────────────────────────────────────────────────────────────
function PaywallScreen({ onChoose }: { onChoose: (s: Screen) => void }) {
  const benefits = [
    { icon: Shield, label: "Canal oficial da sua igreja" },
    { icon: Zap, label: "Ativação imediata após pagamento" },
    { icon: MessageCircle, label: "Follow-up automático de visitantes" },
    { icon: Clock, label: "Botão 'Chamar responsável' no Kids" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="card p-8 text-center mb-6 bg-gradient-to-br from-[#075E54]/10 to-[#128C7E]/5 border border-[#128C7E]/20">
        <div className="w-16 h-16 rounded-2xl bg-[#25D366] flex items-center justify-center mx-auto mb-4 shadow-lg">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-lg-midnight mb-2">Canal WhatsApp Oficial</h2>
        <p className="text-sm text-lg-text-muted leading-relaxed max-w-sm mx-auto">
          Conecte o número oficial da sua igreja e envie mensagens estruturadas para membros, 
          visitantes e responsáveis de crianças — tudo de dentro da plataforma.
        </p>
      </div>

      {/* Benefits */}
      <div className="card p-6 mb-6 border border-[var(--glass-border)]">
        <h3 className="text-sm font-bold text-lg-midnight mb-4">O que você recebe:</h3>
        <ul className="space-y-3">
          {benefits.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm text-lg-text">
              <div className="w-7 h-7 rounded-lg bg-[#25D366]/10 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-[#128C7E]" />
              </div>
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* Pricing */}
      <div className="card p-6 border border-[var(--glass-border)] text-center mb-4">
        <p className="text-xs text-lg-text-muted uppercase tracking-widest mb-1">Mensalidade</p>
        <div className="text-4xl font-black text-lg-midnight mb-1">
          R$ 79<span className="text-lg text-lg-text-muted font-semibold">,90</span>
        </div>
        <p className="text-xs text-lg-text-muted mb-6">por mês · cancele quando quiser</p>
        <button
          onClick={() => onChoose("checkout")}
          className="btn-primary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Zap className="w-4 h-4" />
          Ativar Canal WhatsApp
        </button>
      </div>
      <p className="text-center text-[11px] text-lg-text-muted">
        Cobrança mensal recorrente. Ao contratar, você concorda com os termos da plataforma.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Checkout Screen (choose method)
// ──────────────────────────────────────────────────────────────────────────────
function CheckoutScreen({
  churchId,
  onPix,
  onCreditCard,
  onBack,
}: {
  churchId: string;
  onPix: (data: { pixKey: string | null; pixQrImage: string | null; chargeId: string }) => void;
  onCreditCard: (url: string) => void;
  onBack: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState<"pix" | "card" | null>(null);

  function handlePix() {
    setLoading("pix");
    startTransition(async () => {
      try {
        const result = await createWhatsAppCharge(churchId);
        onPix(result);
      } catch (e: any) {
        toast.error(e.message || "Erro ao gerar cobrança PIX.");
        setLoading(null);
      }
    });
  }

  function handleCard() {
    setLoading("card");
    startTransition(async () => {
      try {
        const result = await createWhatsAppCreditCardLink(churchId);
        onCreditCard(result.invoiceUrl);
      } catch (e: any) {
        toast.error(e.message || "Erro ao gerar link de pagamento.");
        setLoading(null);
      }
    });
  }

  return (
    <div className="max-w-md mx-auto">
      <button onClick={onBack} className="text-xs text-lg-text-muted mb-4 hover:text-lg-primary flex items-center gap-1">
        ← Voltar
      </button>
      <div className="card p-8 border border-[var(--glass-border)]">
        <h2 className="text-lg font-bold text-lg-midnight mb-1">Finalizar contratação</h2>
        <p className="text-sm text-lg-text-muted mb-6">Canal WhatsApp Oficial · R$ 79,90/mês</p>

        <div className="space-y-3">
          <button
            onClick={handlePix}
            disabled={isPending}
            className="w-full flex items-center gap-4 p-4 border-2 border-[var(--glass-border)] hover:border-[#128C7E] rounded-xl transition-all group disabled:opacity-60"
          >
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-[#128C7E]" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-lg-midnight">PIX</p>
              <p className="text-xs text-lg-text-muted">Aprovação instantânea • Ativação imediata</p>
            </div>
            {loading === "pix" && <Loader2 className="w-4 h-4 animate-spin text-[#128C7E]" />}
          </button>

          <button
            onClick={handleCard}
            disabled={isPending}
            className="w-full flex items-center gap-4 p-4 border-2 border-[var(--glass-border)] hover:border-lg-primary rounded-xl transition-all group disabled:opacity-60"
          >
            <div className="w-10 h-10 rounded-xl bg-lg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-lg-primary" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-lg-midnight">Cartão de Crédito</p>
              <p className="text-xs text-lg-text-muted">Link seguro via Asaas</p>
            </div>
            {loading === "card" && <Loader2 className="w-4 h-4 animate-spin text-lg-primary" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// PIX Waiting Screen
// ──────────────────────────────────────────────────────────────────────────────
function PixWaitingScreen({
  pixKey,
  pixQrImage,
  onBack,
}: {
  pixKey: string | null;
  pixQrImage: string | null;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-md mx-auto">
      <button onClick={onBack} className="text-xs text-lg-text-muted mb-4 hover:text-lg-primary flex items-center gap-1">
        ← Voltar
      </button>
      <div className="card p-8 border border-[var(--glass-border)] text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mx-auto">
          <QrCode className="w-6 h-6 text-[#128C7E]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-lg-midnight">Pague via PIX</h2>
          <p className="text-sm text-lg-text-muted mt-1">
            Escaneie o QR Code ou copie o código PIX. A ativação é automática após a confirmação.
          </p>
        </div>

        {pixQrImage && (
          <img
            src={`data:image/png;base64,${pixQrImage}`}
            alt="QR Code PIX"
            className="w-48 h-48 mx-auto border border-[var(--glass-border)] rounded-xl p-2"
          />
        )}

        {pixKey && (
          <div className="bg-lg-off-white border border-[var(--glass-border)] rounded-xl p-3">
            <p className="text-[10px] text-lg-text-muted uppercase tracking-wider mb-1">Copia e Cola PIX</p>
            <p className="text-xs font-mono text-lg-text break-all leading-relaxed">{pixKey}</p>
            <button
              onClick={handleCopy}
              className="mt-2 w-full btn-ghost text-xs py-1.5 rounded-lg flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copiado!" : "Copiar código"}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-lg-text-muted bg-amber-50 border border-amber-100 rounded-xl p-3">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <p>Após o pagamento, o canal será provisionado automaticamente em segundos.</p>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// QR Code Scanner Screen (WhatsApp linking)
// ──────────────────────────────────────────────────────────────────────────────
function QrCodeScannerScreen({ instanceId }: { instanceId: string }) {
  const [qrStatus, setQrStatus] = useState<QrStatus>("loading");
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  async function fetchQr() {
    try {
      const res = await fetch("/api/whatsapp/qrcode");
      if (!res.ok) throw new Error("Erro ao buscar QR Code");
      const json = await res.json() as { data: { connection_status: QrStatus; base64?: string } };
      setQrStatus(json.data.connection_status);
      setQrBase64(json.data.base64 || null);
    } catch (e) {
      setQrStatus("DISCONNECTED");
    }
  }

  useEffect(() => {
    fetchQr();
    if (!polling) return;
    const interval = setInterval(fetchQr, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, [polling]);

  useEffect(() => {
    if (qrStatus === "CONNECTED") {
      setPolling(false);
      toast.success("WhatsApp conectado com sucesso! 🎉");
    }
  }, [qrStatus]);

  if (qrStatus === "CONNECTED") {
    return (
      <div className="max-w-md mx-auto">
        <div className="card p-10 border border-[var(--glass-border)] text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#25D366] flex items-center justify-center mx-auto shadow-lg">
            <Wifi className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-lg-midnight">WhatsApp Conectado!</h2>
          <p className="text-sm text-lg-text-muted">
            O canal oficial da sua igreja está ativo. Você já pode enviar mensagens através da plataforma.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#128C7E]">
            <CheckCircle2 className="w-4 h-4" />
            Canal ativo e operacional
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-8 border border-[var(--glass-border)] text-center space-y-5">
        <div>
          <h2 className="text-lg font-bold text-lg-midnight">Vincular Número Oficial</h2>
          <p className="text-sm text-lg-text-muted mt-1">
            Abra o WhatsApp no telefone oficial da igreja, vá em <strong>Dispositivos Conectados</strong> e escaneie o QR Code.
          </p>
        </div>

        <div className="relative w-52 h-52 mx-auto">
          {qrStatus === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-lg-off-white rounded-xl border border-[var(--glass-border)]">
              <Loader2 className="w-8 h-8 animate-spin text-lg-primary" />
            </div>
          )}
          {qrBase64 && qrStatus === "QRCODE" && (
            <img
              src={qrBase64}
              alt="QR Code WhatsApp"
              className="w-full h-full object-contain border border-[var(--glass-border)] rounded-xl p-2"
            />
          )}
          {qrStatus === "DISCONNECTED" && !qrBase64 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-lg-off-white rounded-xl border border-[var(--glass-border)] gap-2">
              <p className="text-xs text-lg-text-muted">QR Code expirado</p>
              <button onClick={fetchQr} className="btn-ghost text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Atualizar
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-lg-text-muted">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Aguardando leitura...
        </div>
        <p className="text-[11px] text-lg-text-muted">
          O QR Code é atualizado automaticamente a cada 8 segundos.
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Orchestrator Component
// ──────────────────────────────────────────────────────────────────────────────
export default function WhatsAppSettingsClient({ churchId, churchName, features }: Props) {
  const isActive = features?.whatsapp_active === true;
  const instanceId = features?.hp_instance_id;

  const [screen, setScreen] = useState<Screen>(isActive ? "qrcode" : "paywall");
  const [pixData, setPixData] = useState<{ pixKey: string | null; pixQrImage: string | null; chargeId: string } | null>(null);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
          Canal WhatsApp Oficial
        </h2>
        <p className="text-sm text-lg-text-muted mt-1">
          Conecte o número oficial da sua igreja e centralize toda a comunicação através da plataforma.
        </p>
      </div>

      {screen === "paywall" && (
        <PaywallScreen onChoose={setScreen} />
      )}

      {screen === "checkout" && (
        <CheckoutScreen
          churchId={churchId}
          onPix={(data) => { setPixData(data); setScreen("pix"); }}
          onCreditCard={(url) => { window.open(url, "_blank"); setScreen("paywall"); }}
          onBack={() => setScreen("paywall")}
        />
      )}

      {screen === "pix" && pixData && (
        <PixWaitingScreen
          pixKey={pixData.pixKey}
          pixQrImage={pixData.pixQrImage}
          onBack={() => setScreen("checkout")}
        />
      )}

      {(screen === "qrcode" || isActive) && instanceId && (
        <QrCodeScannerScreen instanceId={instanceId} />
      )}
    </div>
  );
}
