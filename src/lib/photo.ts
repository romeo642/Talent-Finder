import { DOC_BYTES_MAX, DOC_URL_MAX, PHOTO_EDGE, PHOTO_URL_MAX } from "@/lib/media";

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

async function drawPhoto(file: File, edge: number, quality: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that photo.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

/** Keep a sharp photo. Long edge stays up to 2560px. Quality drops only if the file is still too large. */
export async function compressPhoto(file: File): Promise<string> {
  const image = file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
  if (!image) throw new Error("Choose a photo.");
  if (file.size > 25 * 1024 * 1024) throw new Error("That photo is larger than 25 MB.");
  try {
    if (file.type === "image/png" && file.size <= 1_500_000) {
      const original = await readFile(file);
      if (original.startsWith("data:image/png") && original.length <= PHOTO_URL_MAX) return original;
    }
    const passes: [number, number][] = [
      [PHOTO_EDGE, 0.92],
      [PHOTO_EDGE, 0.86],
      [2048, 0.88],
      [1600, 0.84],
    ];
    let url = "";
    for (const [edge, quality] of passes) {
      url = await drawPhoto(file, edge, quality);
      if (url.length <= PHOTO_URL_MAX) return url;
    }
    throw new Error("That photo is still too large. Try a slightly smaller picture.");
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("That photo")) throw error;
    throw new Error("Use a JPG, PNG, or WEBP photo.");
  }
}

/** A real photo of finished work, or a PDF of that work. */
export async function prepareDocument(file: File): Promise<{ dataUrl: string; name: string }> {
  const name = file.name.replace(/[^\w.\- ]+/g, "").trim().slice(0, 80) || "work-photo";
  const pdf = file.type === "application/pdf" || name.toLowerCase().endsWith(".pdf");
  if (pdf) {
    if (file.size > DOC_BYTES_MAX) throw new Error("That document is larger than 8 MB.");
    const dataUrl = await readFile(file);
    if (!dataUrl.startsWith("data:application/pdf") || dataUrl.length > DOC_URL_MAX) {
      throw new Error("Use a PDF under 8 MB.");
    }
    return { dataUrl, name: name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf` };
  }
  if (!file.type.startsWith("image/")) throw new Error("Upload a PDF, JPG, PNG, or WEBP.");
  const dataUrl = await compressPhoto(file);
  return { dataUrl, name };
}
