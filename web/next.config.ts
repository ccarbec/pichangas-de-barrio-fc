import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      // Fotos de perfil y comprobantes de pago pueden pesar varios MB, y los
      // videos de la galería hasta 20MB — el límite por defecto de Next
      // (1MB) los rechazaría.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
