/**
 * Client-side image compression utility.
 * Uses Canvas API — zero external dependencies.
 *
 * Compresses any image file to WebP/JPEG under a target size,
 * maintaining aspect ratio and capping resolution.
 */

export interface CompressOptions {
  maxWidthOrHeight?: number; // default 1200px
  maxSizeMB?: number;       // default 0.8 (800KB)
  quality?: number;         // initial quality 0-1, default 0.82
  outputType?: string;      // default "image/webp"
}

const DEFAULTS: Required<CompressOptions> = {
  maxWidthOrHeight: 1200,
  maxSizeMB: 0.8,
  quality: 0.82,
  outputType: "image/webp",
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      type,
      quality
    );
  });
}

/**
 * Compresses an image File and returns a new File ready for FormData.
 * If the original is already under maxSizeMB, it still gets resized/re-encoded
 * to guarantee consistent output.
 */
export async function compressImage(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  const cfg = { ...DEFAULTS, ...opts };

  // Skip non-image files
  if (!file.type.startsWith("image/")) return file;

  // SVGs should not be rasterized
  if (file.type === "image/svg+xml") return file;

  const url = URL.createObjectURL(file);

  try {
    const img = await loadImage(url);

    // Calculate target dimensions
    let { width, height } = img;
    const maxDim = cfg.maxWidthOrHeight;

    if (width > maxDim || height > maxDim) {
      const ratio = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    ctx.drawImage(img, 0, 0, width, height);

    // Progressive quality reduction until under maxSizeMB
    let quality = cfg.quality;
    const maxBytes = cfg.maxSizeMB * 1024 * 1024;
    let blob = await canvasToBlob(canvas, cfg.outputType, quality);

    let attempts = 0;
    while (blob.size > maxBytes && quality > 0.3 && attempts < 6) {
      quality -= 0.1;
      blob = await canvasToBlob(canvas, cfg.outputType, quality);
      attempts++;
    }

    // Determine extension
    const ext = cfg.outputType === "image/webp" ? "webp" : "jpeg";
    const newName = file.name.replace(/\.[^/.]+$/, `.${ext}`);

    return new File([blob], newName, { type: cfg.outputType });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Helper: compress & inject a file field inside a FormData before submission.
 * Returns the same FormData mutated for convenience.
 */
export async function compressFormDataImage(
  formData: FormData,
  fieldName: string,
  opts?: CompressOptions
): Promise<FormData> {
  const file = formData.get(fieldName);
  if (!file || !(file instanceof File) || file.size === 0) return formData;

  const compressed = await compressImage(file, opts);
  formData.set(fieldName, compressed);
  return formData;
}
