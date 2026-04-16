import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ImageRightsForm from "./ImageRightsForm";

// Server interface for reading Kid before rendering
export default async function ConsentPage({ params }: { params: Promise<{ kid_id: string; token: string }> }) {
  const { kid_id, token } = await params;
  
  const supabase = await createClient();
  
  const { data: kid } = await supabase
    .from("kids")
    .select(`
      id, full_name, image_rights_status,
      church:churches(name)
    `)
    .eq("id", kid_id)
    .eq("image_rights_token", token)
    .single();

  if (!kid) {
    return notFound();
  }

  // Se já assinou, mostra tela de sucesso simples
  if (kid.image_rights_status === "approved_digital") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm text-center border-t-4 border-green-500">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4 text-3xl">✓</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Termo já assinado!</h2>
          <p className="text-sm text-gray-500">A autorização de imagem para {kid.full_name} já foi processada eletronicamente. Muito obrigado!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-4">
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100 animate-slide-up">
        <div className="bg-[#1E293B] px-6 py-6 text-center">
          <h1 className="text-xl font-bold text-white tracking-widest uppercase">Autorização de Imagem</h1>
          <p className="text-gray-300 text-sm mt-1">{(kid.church as any)?.name}</p>
        </div>
        
        <div className="p-6 md:p-8 space-y-6">
          <p className="text-sm text-gray-600 leading-relaxed">
            Nós do(a) <strong>{(kid.church as any)?.name}</strong> zelamos pela privacidade e segurança
            de nossas crianças de acordo com a Lei Geral de Proteção de Dados (LGPD) e o Estatuto da Criança e do Adolescente (ECA).
          </p>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-inner">
            <h3 className="font-bold text-gray-800 text-sm mb-2">Termos de Autorização</h3>
            <ul className="text-gray-600 text-xs space-y-2 list-disc pl-4">
              <li>Permito a captação de fotos e vídeos de meu dependente durante as atividades oficiais do ministério infantil.</li>
              <li>A autorização abrange uso institucional para as mídias sociais, comunicação interna corporativa e materiais impressos.</li>
              <li>Não haverá viés comercial na exposição da imagem do menor.</li>
              <li>Tenho o direito de revogar esta autorização a qualquer momento solicitando à coordenação local.</li>
            </ul>
          </div>

          <div className="bg-[#16A34A]/10 border border-[#16A34A]/20 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-[#16A34A] font-bold uppercase tracking-wider">Dependente (Menor)</p>
              <p className="text-lg font-bold text-gray-800">{kid.full_name}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white flex justify-center items-center font-bold text-[#16A34A] shadow-sm">
              {kid.full_name.substring(0, 2).toUpperCase()}
            </div>
          </div>

          <ImageRightsForm kidId={kid.id} token={token} />
        </div>
      </div>
    </div>
  );
}
