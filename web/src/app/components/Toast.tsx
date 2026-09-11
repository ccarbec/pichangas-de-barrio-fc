"use client";

import { useEffect } from "react";

export function Toast({ mensaje, onCerrar }: { mensaje: string; onCerrar: () => void }) {
  useEffect(() => {
    const t = setTimeout(onCerrar, 3000);
    return () => clearTimeout(t);
  }, [onCerrar]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950 px-4 py-3 text-sm text-emerald-300 shadow-2xl">
      ✅ {mensaje}
    </div>
  );
}
