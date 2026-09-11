import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Fotos de perfil y comprobantes de pago pueden pesar varios MB —
      // el límite por defecto de Next (1MB) los rechazaría.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
