"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { Paintbrush, Image as ImageIcon, Save, Loader2, Upload, AlertTriangle } from "lucide-react";
import { updateChurchSettings, uploadChurchLogo } from "./actions";
import { compressImage } from "@/lib/image/compress";
import ImageCropper from "@/components/ui/ImageCropper";

interface ChurchConfig {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  cell_term: string | null;
}

export default function ConfigClient({ church }: { church: ChurchConfig }) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(church.logo_url);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const [name, setName] = useState(church.name || "");
  const [primaryColor, setPrimaryColor] = useState(church.primary_color || "#1F6FEB");
  const [secondaryColor, setSecondaryColor] = useState(church.secondary_color || "#18B37E");
  const [cellTerm, setCellTerm] = useState(church.cell_term || "Células");

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateChurchSettings(church.id, {
          name,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          cell_term: cellTerm,
        });
        toast.success("Configurações de identidade visual salvas com sucesso!");
        setTimeout(() => window.location.reload(), 1500); // Reload root layout css vars
      } catch (e: any) {
        toast.error(e.message || "Erro ao salvar configurações");
      }
    });
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // SVGs don't need cropping
    if (file.type === "image/svg+xml") {
      handleLogoUpload(file);
    } else {
      setCropSrc(URL.createObjectURL(file));
    }
  }

  async function handleLogoUpload(file: File) {
    setPreviewLogo(URL.createObjectURL(file));
    setIsUploading(true);

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      
      const newUrl = await uploadChurchLogo(church.id, formData);
      toast.success("Logo atualizada com sucesso!");
      setPreviewLogo(newUrl);
    } catch (e: any) {
      toast.error(e.message || "Erro ao fazer upload da logo");
      setPreviewLogo(church.logo_url);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-lg-midnight" style={{ fontFamily: "var(--lg-font-heading)" }}>
          Configurações da Plataforma
        </h2>
        <p className="text-sm text-lg-text-muted mt-1">
          Customize a identidade visual da sua igreja. As cores escolhidas se refletirão em toda a plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Logo Customization section */}
        <div className="col-span-1 space-y-4">
          <div className="card p-6 border border-[var(--glass-border)]">
            <h3 className="text-sm font-bold text-lg-midnight mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-lg-primary" />
              Logomarca
            </h3>
            <p className="text-xs text-lg-text-muted mb-4 leading-relaxed">
              Recomendamos usar uma logo com fundo transparente (PNG) ou SVG nativo, focada na legibilidade.
            </p>

            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-video bg-lg-off-white border border-[var(--glass-border)] rounded-xl flex items-center justify-center overflow-hidden mb-4 group ring-2 ring-transparent transition-all hover:ring-lg-primary-light">
                {previewLogo ? (
                  <img src={previewLogo} alt="Logo" className="max-w-[80%] max-h-[80%] object-contain" />
                ) : (
                  <span className="text-lg-text-muted text-sm font-medium">Ligare Logo</span>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-lg-primary" />
                  </div>
                )}
              </div>

              <input 
                type="file" 
                accept="image/png, image/jpeg, image/svg+xml, image/webp" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleLogoSelect}
                disabled={isUploading}
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full btn-ghost px-4 py-2 rounded-xl text-sm font-medium flex justify-center items-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Trocar Logo
              </button>
            </div>
          </div>

          <div className="card p-4 bg-amber-50 border-amber-200 flex gap-3">
             <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
             <p className="text-xs text-amber-800">Cuidado: Trocar a logomarca e as cores alterará a experiência visual de todos os líderes instantaneamente.</p>
          </div>
        </div>

        {/* Form Identity */}
        <div className="col-span-1 md:col-span-2">
          <form onSubmit={handleSaveSettings} className="card p-6 border border-[var(--glass-border)] h-full">
            <h3 className="text-sm font-bold text-lg-midnight mb-4 flex items-center gap-2 border-b border-[var(--glass-border)] pb-4">
              <Paintbrush className="w-4 h-4 text-lg-primary" />
              Identidade Visual
            </h3>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-2">
                  Nome da Igreja
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome Fantasia"
                  className="w-full px-4 py-2.5 bg-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary"
                />
              </div>

              {/* Cell Term */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-2">
                  Terminologia de Grupos
                </label>
                <select
                  value={cellTerm}
                  onChange={(e) => setCellTerm(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lg-primary appearance-none"
                >
                  <option value="Células">Células</option>
                  <option value="Equipes">Equipes</option>
                  <option value="Grupos Familiares">Grupos Familiares</option>
                  <option value="Redes">Redes</option>
                  <option value="Pequenos Grupos (PGs)">Pequenos Grupos (PGs)</option>
                </select>
                <p className="text-[11px] text-lg-text-muted mt-1">Essa nomenclatura será usada em relatórios e menus de todos os líderes.</p>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-2">
                    Cor Primária
                  </label>
                  <p className="text-[11px] text-lg-text-muted mb-2">Usada em botões e destaques principais.</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 p-1 bg-white border border-[var(--glass-border)] rounded-xl cursor-pointer shadow-sm"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-lg-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-lg-text-muted mb-2">
                    Cor Secundária (Apoio)
                  </label>
                  <p className="text-[11px] text-lg-text-muted mb-2">Usada em fundos sutis e ações positivas.</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-12 p-1 bg-white border border-[var(--glass-border)] rounded-xl cursor-pointer shadow-sm"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-lg-off-white border border-[var(--glass-border)] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-lg-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--glass-border)] flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-70 shadow-md hover:shadow-lg transition-all"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Configurações
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Crop Modal */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          aspect={16 / 9}
          onCropComplete={(file) => {
            setCropSrc(null);
            handleLogoUpload(file);
          }}
          onCancel={() => setCropSrc(null)}
          outputFileName="church-logo.webp"
        />
      )}
    </div>
  );
}
