"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from "lucide-react";

interface ImageCropperProps {
  imageSrc: string;
  aspect?: number; // width/height ratio. 1 = square, 16/9 = landscape
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  outputFileName?: string;
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputType = "image/webp"
): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // Fill with white background to avoid transparent/black borders
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
      outputType,
      0.88
    );
  });
}

export default function ImageCropper({
  imageSrc,
  aspect = 1,
  onCropComplete,
  onCancel,
  outputFileName = "cropped.webp",
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropChange = useCallback(
    (_: Area, croppedAreaPx: Area) => {
      setCroppedAreaPixels(croppedAreaPx);
    },
    []
  );

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([blob], outputFileName, { type: "image/webp" });
      onCropComplete(file);
    } catch {
      // fallback: return original
      onCancel();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
        <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
          Ajustar Imagem
        </span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {isSaving ? "Salvando..." : "Confirmar"}
        </button>
      </div>

      {/* Crop Area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          minZoom={0.2}
          restrictPosition={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropChange}
          cropShape="rect"
          showGrid={true}
          style={{
            containerStyle: { background: "#111" },
            cropAreaStyle: {
              border: "2px solid rgba(255,255,255,0.6)",
              borderRadius: "12px",
            },
          }}
        />
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center justify-center gap-4 px-4 py-4 bg-black/60">
        <button
          type="button"
          onClick={() => setZoom(1)}
          className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          title="Resetar zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom(Math.max(0.2, zoom - 0.1))}
          className="p-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 w-48">
          <input
            type="range"
            min={0.2}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-white h-1"
          />
        </div>
        <button
          type="button"
          onClick={() => setZoom(Math.min(3, zoom + 0.2))}
          className="p-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <span className="text-white/50 text-xs font-mono w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
}
