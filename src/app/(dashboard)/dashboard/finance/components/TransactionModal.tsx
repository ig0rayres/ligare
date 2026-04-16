import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, DollarSign, UploadCloud, ChevronRight, File, Loader2 } from "lucide-react";
import { createFinancialTransaction } from "../actions";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: any[];
  categories: any[];
  events: any[];
}

export default function TransactionModal({ isOpen, onClose, onSuccess, accounts, categories, events }: Props) {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"culto" | "avulso">("culto");
  const [entryType, setEntryType] = useState<"in" | "out">("in");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted || !isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === entryType);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("type", entryType);
    
    if (tab === "avulso") {
      formData.delete("event_id"); // Garante que não envie evento no modo avulso
    }

    try {
      const resp = await createFinancialTransaction(formData);
      if (resp.error) {
        toast.error(resp.error);
      } else {
        toast.success("Lançamento registrado e enviado para validação dupla!");
        onSuccess();
        onClose();
        setSelectedFile(null);
      }
    } catch (err) {
      toast.error("Erro interno ao processar lançamento.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-slide-up flex flex-col overflow-hidden my-auto" style={{ maxHeight: 'calc(100dvh - 2rem)' }}>
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--lg-border-light)] flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
          <div>
            <h2 className="text-xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
              Novo Lançamento
            </h2>
            <p className="text-sm text-lg-text-muted">Preencha os dados e anexe o comprovante.</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-8 custom-scrollbar">
          
          {/* Tabs: Culto vs Avulso */}
          <div className="flex bg-gray-100/80 p-1.5 rounded-xl">
            <button
              onClick={() => setTab("culto")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === "culto" ? "bg-white text-lg-midnight shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Lançamento de Culto
            </button>
            <button
              onClick={() => setTab("avulso")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === "avulso" ? "bg-white text-lg-midnight shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Lançamento Avulso
            </button>
          </div>

          <form id="financial-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Top Configs (Type & Event) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-lg-midnight mb-2">Natureza</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEntryType("in")}
                    className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-colors`}
                    style={entryType === "in" 
                      ? { borderColor: "var(--lg-care)", backgroundColor: "color-mix(in srgb, var(--lg-care) 10%, transparent)", color: "var(--lg-care)" }
                      : { borderColor: "var(--lg-border)", color: "var(--lg-text-secondary)" }}
                  >
                    Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryType("out")}
                    className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-colors`}
                    style={entryType === "out" 
                      ? { borderColor: "var(--lg-danger)", backgroundColor: "color-mix(in srgb, var(--lg-danger) 10%, transparent)", color: "var(--lg-danger)" }
                      : { borderColor: "var(--lg-border)", color: "var(--lg-text-secondary)" }}
                  >
                    Despesa
                  </button>
                </div>
              </div>

              {tab === "culto" && (
                <div>
                  <label className="block text-sm font-semibold text-lg-midnight mb-2">Culto / Evento</label>
                  {events.length === 0 ? (
                    <div className="text-sm text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      Nenhum culto ativo. Crie um evento primeiro.
                    </div>
                  ) : (
                  <select 
                    name="event_id" 
                    defaultValue={events[0]?.id ?? ""}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-lg-primary focus:border-lg-primary outline-none" 
                    required
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} — {new Date(ev.starts_at).toLocaleDateString('pt-BR')}
                      </option>
                    ))}
                  </select>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-lg-midnight mb-2">Valor (R$)</label>
                <input 
                  type="number" 
                  name="amount"
                  step="0.01" 
                  min="0.01"
                  placeholder="0,00"
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lg-primary focus:border-lg-primary text-2xl font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-lg-midnight mb-2">Data do Lançamento</label>
                <input 
                  type="date" 
                  name="transaction_date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lg-primary focus:border-lg-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[var(--lg-border-light)] pt-6">
              <div className="col-span-1">
                <label className="block text-sm font-semibold text-lg-midnight mb-2">Conta Origem/Destino</label>
                <select name="account_id" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lg-primary focus:border-lg-primary" required>
                  <option value="">Selecione...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-semibold text-lg-midnight mb-2">Categoria</label>
                <select name="category_id" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lg-primary focus:border-lg-primary" required>
                  <option value="">Selecione...</option>
                  {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-semibold text-lg-midnight mb-2">Método Form</label>
                <select name="payment_method" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lg-primary focus:border-lg-primary" required>
                  <option value="pix">PIX</option>
                  <option value="cash">Dinheiro Base</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="debit_card">Cartão de Débito</option>
                  <option value="bank_transfer">Transf. Bancária (TED)</option>
                  <option value="other">Outro / Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-lg-midnight mb-2">Descrição (Opcional)</label>
              <textarea 
                name="description"
                placeholder={`Ex: ${tab === 'culto' ? 'Dízimo cultão da noite...' : 'Compra de mantimentos da semana...'}`}
                rows={2}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lg-primary focus:border-lg-primary resize-none"
              />
            </div>

            {/* Upload Area */}
            <div>
              <label className="block text-sm font-semibold text-lg-midnight mb-2">
                Anexar Comprovante / Foto do Boleto (Obrigatório)
              </label>
              <div 
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${
                  selectedFile ? "border-lg-primary bg-lg-primary-light/50" : "border-gray-300 hover:border-lg-primary hover:bg-gray-50"
                }`}
              >
                {selectedFile ? (
                   <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <File className="w-6 h-6 text-lg-primary" />
                      </div>
                      <p className="text-sm font-semibold text-lg-midnight truncate max-w-[250px]">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button 
                        type="button"
                        onClick={() => setSelectedFile(null)} 
                        className="text-xs text-red-500 hover:underline mt-2"
                      >
                        Remover e escolher outro
                      </button>
                   </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <UploadCloud className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-lg-midnight mb-1">Clique para buscar na galeria ou use a câmera</p>
                    <p className="text-xs text-gray-400 mb-4">Fotos de comprovantes, PIX, Extratos...</p>
                    
                    <label className="bg-white border border-gray-200 hover:border-lg-primary text-gray-700 px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer shadow-sm transition-all focus-within:ring-2 focus-within:ring-lg-primary">
                      Selecionar Arquivo
                      <input 
                        type="file" 
                        name="proof_file"
                        className="sr-only" 
                        accept="image/*,.pdf"
                        required
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--lg-border-light)] bg-[var(--lg-surface-raised)] rounded-b-3xl shrink-0 flex items-center justify-end gap-3">
           <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="btn btn-ghost bg-[var(--lg-surface)]"
            >
             Cancelar
           </button>
           <button 
              form="financial-form"
              type="submit"
              disabled={loading}
              className="btn btn-primary shadow-md"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Registrar Lançamento"}
              {!loading && <ChevronRight className="w-4 h-4" />}
           </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
