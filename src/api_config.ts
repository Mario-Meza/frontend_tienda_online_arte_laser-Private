// ✅ Configuración centralizada de la API
const getApiUrl = () => {
    // Si existe la variable de entorno, úsala
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL
    }

    // Fallback según el entorno
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:8000'
    }

    // Producción por defecto
    return 'https://apitiendaonlineartelaser-production.up.railway.app'
}

// ✅ Exportar la constante directamente
export const API_URL = getApiUrl()

// Helper para logs en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🌐 API URL configurada:', API_URL)
}