export function aDataUrl(bytes: Uint8Array | null, mime: string | null) {
  if (!bytes || !mime) return null;
  return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}
