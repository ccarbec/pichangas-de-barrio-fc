export function YapeQR({
  qrYape,
  nombreYape,
  telefonoYape,
}: {
  qrYape: string | null;
  nombreYape: string | null;
  telefonoYape: string | null;
}) {
  if (!qrYape && !nombreYape && !telefonoYape) return null;

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-[var(--background)] p-3 sm:flex-row sm:items-center sm:gap-4">
      {qrYape && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrYape}
          alt="QR de Yape"
          className="h-40 w-40 shrink-0 rounded-lg border border-[var(--border)] bg-white object-contain p-1"
        />
      )}
      <div className="text-center text-xs text-[var(--muted)] sm:text-left">
        {qrYape && <p className="mb-1 font-medium text-[var(--foreground)]">📲 Escanea para yapear</p>}
        {nombreYape && <p>{nombreYape}</p>}
        {telefonoYape && <p>{telefonoYape}</p>}
      </div>
    </div>
  );
}
