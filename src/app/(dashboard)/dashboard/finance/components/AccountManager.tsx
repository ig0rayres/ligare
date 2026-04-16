"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Building2, Plus, Pencil, Trash2, X, Check, Loader2,
  Landmark, Wallet, CreditCard, PiggyBank, QrCode, Key, Upload, ImageIcon, Building
} from "lucide-react";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  type: string;
  initial_balance: number;
  is_active: boolean;
  pix_key?: string | null;
  qr_code_url?: string | null;
  bank_code?: string | null;
  bank_name?: string | null;
  agency?: string | null;
  account_number?: string | null;
}

const ACCOUNT_TYPES = [
  { value: "checking", label: "Conta Corrente",    icon: Building2 },
  { value: "savings",  label: "Conta Poupança",    icon: PiggyBank },
  { value: "cash",     label: "Caixa Físico",      icon: Wallet },
  { value: "credit",   label: "Cartão de Crédito", icon: CreditCard },
  { value: "other",    label: "Outro",              icon: Landmark },
];

const TYPE_COLORS: Record<string, string> = {
  checking: "var(--lg-primary)",
  savings:  "var(--lg-care)",
  cash:     "var(--lg-warning)",
  credit:   "var(--lg-danger)",
  other:    "var(--lg-slate)",
};

const BRAZILIAN_BANKS = [
  { code: "001", name: "Banco do Brasil" },
  { code: "033", name: "Santander" },
  { code: "104", name: "Caixa Econômica Federal" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú Unibanco" },
  { code: "077", name: "Banco Inter" },
  { code: "260", name: "Nubank" },
  { code: "336", name: "C6 Bank" },
  { code: "380", name: "PicPay" },
  { code: "323", name: "Mercado Pago" },
  { code: "422", name: "Banco Safra" },
  { code: "041", name: "Banrisul" },
  { code: "748", name: "Sicredi" },
  { code: "756", name: "Sicoob" }
];

interface Props { accounts: Account[]; }

export default function AccountManager({ accounts: initialAccounts }: Props) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);

  const [bankSearch, setBankSearch] = useState("");
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: "", type: "checking", initial_balance: "0,00", pix_key: "",
    bank_code: "", bank_name: "", agency: "", account_number: ""
  });

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const typeLabel = (t: string) => ACCOUNT_TYPES.find(a => a.value === t)?.label ?? t;
  const typeIcon  = (t: string) => ACCOUNT_TYPES.find(a => a.value === t)?.icon ?? Building2;

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", type: "checking", initial_balance: "0,00", pix_key: "", bank_code: "", bank_name: "", agency: "", account_number: "" });
    setQrPreview(null);
    setBankSearch("");
    setIsBankDropdownOpen(false);
    if (qrFileRef.current) qrFileRef.current.value = "";
    setIsModalOpen(true);
  };

  const openEdit = (acc: Account) => {
    setEditing(acc);
    setForm({
      name: acc.name,
      type: acc.type,
      initial_balance: String(acc.initial_balance).replace(".", ","),
      pix_key: acc.pix_key ?? "",
      bank_code: acc.bank_code ?? "",
      bank_name: acc.bank_name ?? "",
      agency: acc.agency ?? "",
      account_number: acc.account_number ?? "",
    });
    setQrPreview(acc.qr_code_url ?? null);
    setBankSearch(acc.bank_code && acc.bank_name ? `${acc.bank_code} - ${acc.bank_name}` : "");
    setIsBankDropdownOpen(false);
    if (qrFileRef.current) qrFileRef.current.value = "";
    setIsModalOpen(true);
  };

  const selectBank = (code: string, name: string) => {
    setForm(f => ({ ...f, bank_code: code, bank_name: name }));
    setBankSearch(`${code} - ${name}`);
    setIsBankDropdownOpen(false);
  };

  const handleQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setQrPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name",            form.name.trim());
      fd.append("type",            form.type);
      fd.append("initial_balance", String(parseFloat(form.initial_balance.replace(",", ".")) || 0));
      fd.append("pix_key",         form.pix_key.trim());
      fd.append("bank_code",       form.bank_code.trim());
      fd.append("bank_name",       form.bank_name.trim());
      fd.append("agency",          form.agency.trim());
      fd.append("account_number",  form.account_number.trim());
      const qrFile = qrFileRef.current?.files?.[0];
      if (qrFile) fd.append("qr_code", qrFile);

      const url    = editing ? `/api/finance/accounts/${editing.id}` : "/api/finance/accounts";
      const method = editing ? "PATCH" : "POST";
      const resp   = await fetch(url, { method, body: fd });
      const result = await resp.json();
      if (result.error) { toast.error(result.error); return; }

      const updatedAccount: Partial<Account> = {
        name:            form.name.trim(),
        type:            form.type,
        initial_balance: parseFloat(form.initial_balance.replace(",", ".")) || 0,
        pix_key:         form.pix_key.trim() || null,
        bank_code:       form.bank_code.trim() || null,
        bank_name:       form.bank_name.trim() || null,
        agency:          form.agency.trim() || null,
        account_number:  form.account_number.trim() || null,
        qr_code_url:     qrPreview,
      };

      if (editing) {
        setAccounts(prev => prev.map(a => a.id === editing.id ? { ...a, ...updatedAccount } : a));
        toast.success("Conta atualizada!");
      } else {
        setAccounts(prev => [...prev, { ...result.data }]);
        toast.success("Conta criada!");
      }
      // Fecha dropdown de banco ao salvar
      setIsBankDropdownOpen(false);
      setIsModalOpen(false);
    } catch {
      toast.error("Erro ao salvar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (acc: Account) => {
    if (!confirm(`Desativar a conta "${acc.name}"?`)) return;
    try {
      const resp   = await fetch(`/api/finance/accounts/${acc.id}`, { method: "DELETE" });
      const result = await resp.json();
      if (result.error) { toast.error(result.error); return; }
      setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, is_active: false } : a));
      toast.success("Conta desativada");
    } catch { toast.error("Erro ao desativar"); }
  };

  const active = accounts.filter(a => a.is_active);
  const total  = active.reduce((s, a) => s + Number(a.initial_balance), 0);
  const showBankFields = form.type === "checking" || form.type === "savings";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-lg-primary-light text-lg-primary">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>Contas & Caixas</h2>
            <p className="text-sm text-lg-text-muted">Gerencie as contas bancárias e caixas físicos</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Nova Conta
        </button>
      </div>

      {/* Saldo total */}
      {active.length > 0 && (
        <div className="card p-5 flex items-center gap-4" style={{ borderLeft: "3px solid var(--lg-primary)" }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-lg-primary-light text-lg-primary">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-lg-text-muted uppercase tracking-wider font-medium">Saldo Total em Contas</p>
            <p className="text-2xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>{fmt(total)}</p>
          </div>
        </div>
      )}

      {/* List */}
      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-lg-surface-raised flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-lg-text-muted opacity-40" />
          </div>
          <p className="text-sm font-medium text-lg-text">Nenhuma conta cadastrada</p>
          <p className="text-xs text-lg-text-muted mt-1">Cadastre as contas bancárias e caixas físicos da sua igreja.</p>
          <button onClick={openCreate} className="btn btn-primary mt-4">
            <Plus className="w-4 h-4" /> Criar primeira conta
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {active.map(acc => {
            const Icon  = typeIcon(acc.type);
            const color = TYPE_COLORS[acc.type] ?? "var(--lg-slate)";
            return (
              <div key={acc.id} className="card p-5 group flex flex-col justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg-midnight truncate">{acc.name}</p>
                    <p className="text-xs text-lg-text-muted mb-2">{typeLabel(acc.type)}</p>
                   
                    {acc.bank_name && (
                      <p className="text-xs font-medium text-lg-midnight truncate" title={acc.bank_name}>
                        <Building className="w-3 h-3 inline mr-1 text-lg-text-muted" /> {acc.bank_name}
                      </p>
                    )}
                    {(acc.agency || acc.account_number) && (
                      <p className="text-xs text-lg-text-muted mb-1">
                        Ag: {acc.agency || "—"} • Cc: {acc.account_number || "—"}
                      </p>
                    )}
                    {acc.pix_key && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-1"
                        style={{ backgroundColor: "color-mix(in srgb, var(--lg-primary) 10%, transparent)", color: "var(--lg-primary)" }}>
                        <Key className="w-3 h-3" /> PIX: {acc.pix_key}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="font-bold text-lg-midnight">{fmt(Number(acc.initial_balance))}</p>
                      <p className="text-xs text-lg-text-muted">Saldo inicial</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(acc)} className="p-1.5 text-lg-text-muted hover:text-lg-primary hover:bg-lg-primary-light rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(acc)} className="p-1.5 text-lg-text-muted hover:text-lg-danger hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* QR preview no card */}
                {acc.qr_code_url && (
                  <div className="mt-4 pt-4 border-t border-[var(--lg-border-light)] flex items-center gap-3">
                    <QrCode className="w-4 h-4 text-lg-text-muted" />
                    <span className="text-xs text-lg-text-muted">QR Code PIX cadastrado</span>
                    <a href={acc.qr_code_url} target="_blank" rel="noopener noreferrer"
                      className="ml-auto text-xs font-semibold hover:underline" style={{ color: "var(--lg-primary)" }}>
                      Visualizar
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-[var(--lg-surface-overlay)] backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[var(--lg-surface)] rounded-2xl w-full max-w-lg shadow-[var(--lg-shadow-xl)] flex flex-col border border-[var(--lg-border)]" style={{ maxHeight: "calc(100dvh - 2rem)" }}>
            {/* Modal header */}
            <div className="p-5 sm:p-6 border-b border-[var(--lg-border-light)] flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
                {editing ? "Editar Conta" : "Nova Conta"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-lg-surface-raised rounded-full transition-colors">
                <X className="w-4 h-4 text-lg-text-muted" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-semibold text-lg-midnight mb-2">Tipo de Conta</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map(({ value, label, icon: Icon }) => {
                    const color = TYPE_COLORS[value];
                    const sel   = form.type === value;
                    return (
                      <button key={value} type="button" onClick={() => setForm(f => ({ ...f, type: value }))}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
                        style={sel
                          ? { borderColor: color, backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`, color }
                          : { borderColor: "var(--lg-border)", color: "var(--lg-text-secondary)" }}>
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nome & Saldo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-lg-midnight mb-2">Nome da Conta</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Conta Bradesco, Caixa Sede..." className="input w-full" />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-semibold text-lg-midnight mb-2">Saldo Inicial (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-lg-text-muted font-medium">R$</span>
                    <input type="text" value={form.initial_balance}
                      onChange={e => setForm(f => ({ ...f, initial_balance: e.target.value }))}
                      placeholder="0,00" className="input w-full pl-10" />
                  </div>
                </div>
              </div>

              {/* Dados Bancários */}
              {showBankFields && (
                <div className="p-4 bg-lg-surface-raised border border-[var(--lg-border-light)] rounded-xl space-y-4">
                  <div className="relative" ref={bankDropdownRef}>
                    <label className="block text-sm font-semibold text-lg-midnight mb-2">Banco</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={bankSearch}
                        onChange={(e) => {
                          setBankSearch(e.target.value);
                          setIsBankDropdownOpen(true);
                        }}
                        onFocus={() => setIsBankDropdownOpen(true)}
                        placeholder="Busque pelo código ou nome do banco..."
                        className="input w-full pr-10"
                      />
                      <Building className="w-4 h-4 text-lg-text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {isBankDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsBankDropdownOpen(false)} />
                        
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--lg-border)] shadow-[var(--lg-shadow-lg)] rounded-xl max-h-48 overflow-y-auto z-50 py-1">
                          {BRAZILIAN_BANKS.filter(b => 
                            `${b.code} ${b.name}`.toLowerCase().includes(bankSearch.toLowerCase())
                          ).length === 0 ? (
                            <div className="p-3 text-sm text-lg-text-muted text-center">Nenhum banco encontrado.</div>
                          ) : (
                            BRAZILIAN_BANKS.filter(b => 
                              `${b.code} ${b.name}`.toLowerCase().includes(bankSearch.toLowerCase())
                            ).map(b => (
                              <button
                                key={b.code}
                                type="button"
                                onClick={() => selectBank(b.code, b.name)}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-lg-surface-raised transition-colors ${form.bank_code === b.code ? 'font-bold text-lg-primary bg-lg-primary-light/30' : 'text-lg-midnight font-medium'}`}
                              >
                                <span className="text-lg-text-muted mr-1.5">{b.code}</span> {b.name}
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-lg-midnight mb-2">Agência / Dígito</label>
                      <input type="text" value={form.agency} onChange={e => setForm(f => ({ ...f, agency: e.target.value }))}
                        placeholder="Ex: 0001-9" className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-lg-midnight mb-2">Conta / Dígito</label>
                      <input type="text" value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
                        placeholder="Ex: 12345-6" className="input w-full" />
                    </div>
                  </div>
                </div>
              )}

              {/* PIX */}
              <div className="pt-4 border-t border-[var(--lg-border-light)]">
                <label className="block text-sm font-semibold text-lg-midnight mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4 text-lg-primary" />
                  Chave PIX
                </label>
                <input type="text" value={form.pix_key}
                  onChange={e => setForm(f => ({ ...f, pix_key: e.target.value }))}
                  placeholder="CPF, CNPJ, e-mail, telefone..."
                  className="input w-full" />
                <p className="text-xs text-lg-text-muted mt-1.5">
                  Esta chave poderá ser enviada automaticamente em botões de ofertas.
                </p>
              </div>

              {/* QR Code Upload */}
              <div>
                <label className="block text-sm font-semibold text-lg-midnight mb-2 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-lg-primary" />
                  QR Code PIX (imagem)
                </label>
                <input ref={qrFileRef} type="file" accept="image/*" onChange={handleQrChange} className="hidden" id="qr-upload" />

                {qrPreview ? (
                  <div className="flex items-start gap-4 p-4 border border-[var(--lg-border)] rounded-xl bg-[var(--lg-surface)]">
                    <div className="w-24 h-24 rounded-lg border border-[var(--lg-border-light)] flex items-center justify-center overflow-hidden bg-white shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrPreview} alt="QR Code" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="qr-upload" className="btn btn-ghost btn-sm cursor-pointer inline-flex w-max disabled">
                        <Upload className="w-3 h-3" /> Trocar
                      </label>
                      <button type="button" onClick={() => { setQrPreview(null); if (qrFileRef.current) qrFileRef.current.value = ""; }}
                        className="btn btn-ghost btn-sm inline-flex w-max text-lg-danger border-[var(--lg-border-light)]">
                        <X className="w-3 h-3" /> Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="qr-upload"
                    className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[var(--lg-border)] rounded-xl py-8 cursor-pointer hover:border-[var(--lg-primary)] bg-lg-surface-raised transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-[var(--lg-border-light)] shadow-sm">
                      <ImageIcon className="w-6 h-6 text-lg-text-muted" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-lg-midnight">Clique para enviar o QR Code</p>
                      <p className="text-xs text-lg-text-muted mt-0.5">PNG, JPG ou WEBP · Máx. 2MB</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 sm:p-6 border-t border-[var(--lg-border-light)] flex justify-end gap-3 shrink-0 bg-[var(--lg-surface-raised)] rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost bg-[var(--lg-surface)]">Cancelar</button>
              <button onClick={handleSave} disabled={loading} className="btn btn-primary">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editing ? "Salvar Conta" : "Criar Conta"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
