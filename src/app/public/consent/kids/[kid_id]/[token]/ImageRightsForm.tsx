"use client";

import { useTransition, useState } from "react";
import { signImageRightsConsent } from "../../actions";
import { Loader2, CheckCircle } from "lucide-react";

export default function ImageRightsForm({ kidId, token }: { kidId: string, token: string }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    startTransition(async () => {
      try {
        const result = await signImageRightsConsent(kidId, token);
        if (result.success) {
          setSuccess(true);
        } else {
          setErrorMsg(result.message || "Erro desconhecido.");
        }
      } catch (err) {
        setErrorMsg("Erro na rede. Tente novamente.");
      }
    });
  };

  if (success) {
    return (
      <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center animate-fade-in">
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
        <h3 className="font-bold text-green-800">Muito Obrigado!</h3>
        <p className="text-sm text-green-700 mt-1">Sua autorização de direitos de imagem foi assinada e arquivada eletronicamente de forma segura nos registros da Igreja.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold border border-red-200">
          {errorMsg}
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#16A34A]/30 transition-all flex items-center justify-center gap-2"
      >
        {isPending ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Assinando...</>
        ) : (
          <><CheckCircle className="w-5 h-5" /> LI E AUTORIZO O USO DA IMAGEM</>
        )}
      </button>
      
      <p className="text-[10px] text-gray-500 text-center mt-4">
        Ao clicar em "Li e autorizo", seu consentimento será registrado com o seu Endereço IP e Data/Hora atual ({new Date().toLocaleDateString()}) como assinatura digital validada.
      </p>
    </form>
  );
}
