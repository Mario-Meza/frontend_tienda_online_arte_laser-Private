import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // 🔥 CRÍTICO: Habilita el modo standalone para Docker
    output: 'standalone',

    // Deshabilita ESLint y TypeScript durante el build
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },

    // Opcional: Configuración de imágenes si usas next/image
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'apitiendaonlineartelaser-production.up.railway.app',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
        ],
        unoptimized: true, // ✅ Deshabilita optimización
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },

    // ❌ NO uses rewrites cuando usas NEXT_PUBLIC_API_URL
    // Los rewrites son para hacer proxy, pero tu api_config.ts ya maneja las URLs directamente
};

export default nextConfig;