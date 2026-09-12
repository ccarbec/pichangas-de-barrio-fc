import sharp from "sharp";

export function aDataUrl(bytes: Uint8Array | null, mime: string | null) {
  if (!bytes || !mime) return null;
  return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}

// Redimensiona una foto subida al lado máximo indicado (sin agrandar fotos
// más chicas), corrige la rotación según el EXIF de la cámara y la
// convierte a JPEG, para no guardar ni servir fotos de celular a
// resolución completa cuando la pantalla solo necesita una miniatura o
// una vista mediana.
export async function redimensionarImagen(
  bytes: Buffer,
  ladoMaximo: number
): Promise<{ bytes: Uint8Array<ArrayBuffer>; mime: string }> {
  const salida = await sharp(bytes)
    .rotate()
    .resize({ width: ladoMaximo, height: ladoMaximo, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
  const buferPlano = salida.buffer.slice(salida.byteOffset, salida.byteOffset + salida.byteLength) as ArrayBuffer;
  return { bytes: new Uint8Array(buferPlano), mime: "image/jpeg" };
}
