import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',

    // Deshabilita ESLint y TypeScript durante el build (solo para producción)
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },

    async rewrites() {
        return [
            {
                source: '/api/:path*',
                // En producción, esto debería apuntar al servicio de API en Docker
                // Si la API está en el mismo docker-compose, usa: http://api:8000/api/:path*
                destination: process.env.API_INTERNAL_URL || 'http://localhost:8000/api/:path*',
            },
        ]
    },
}

export default nextConfig;