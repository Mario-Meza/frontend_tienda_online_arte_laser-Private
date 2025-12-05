// src/api_config.ts

const getApiUrl = () => {
    let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // 1. Detección automática de entorno Producción en Railway
    // Si la URL pública contiene tu dominio de Railway, FORZAMOS HTTPS ignorando la variable
    if (url.includes('railway.app') || (typeof window !== 'undefined' && window.location.hostname.includes('railway.app'))) {
        // Hardcodeamos la URL correcta de producción para evitar errores de variables
        return 'https://apitiendaonlineartelaser-production.up.railway.app';
    }

    // 2. Fallback para desarrollo local
    if (process.env.NODE_ENV === 'development') {
        return url; // Devuelve localhost
    }

    // 3. Limpieza final por si acaso (para otros entornos)
    if (url.startsWith('http://') && !url.includes('localhost')) {
        return url.replace('http://', 'https://');
    }

    return url.replace(/\/$/, '');
};

export const API_URL = getApiUrl();

if (typeof window !== 'undefined') {
    console.log('🚀 API URL en uso:', API_URL);
}