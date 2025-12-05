// src/api_config.ts

const getApiUrl = () => {
    // 1. Entorno de Desarrollo (Localhost)
    if (process.env.NODE_ENV === 'development') {
        return "http://localhost:8000";
    }

    // 2. PRODUCCIÓN: Hardcode directo a HTTPS.
    // Ignoramos process.env.NEXT_PUBLIC_API_URL para evitar errores de inyección en el build.
    return "https://apitiendaonlineartelaser-production.up.railway.app";
};

export const API_URL = getApiUrl();

// Logs para depuración en la consola del navegador
if (typeof window !== 'undefined') {
    console.log('🚀 API URL forzada:', API_URL);
}