import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8000/api/:path*', // Cambia el puerto si es diferente
            },
        ]
    },
}

module.exports = nextConfig
export default nextConfig;
