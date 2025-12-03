// ✅ Configuración centralizada de la API con validación HTTPS
const getApiUrl = () => {
    let url: string;

    // Si existe la variable de entorno, úsala
    if (process.env.NEXT_PUBLIC_API_URL) {
        url = process.env.NEXT_PUBLIC_API_URL;
    }
    // Fallback según el entorno
    else if (process.env.NODE_ENV === 'development') {
        url = 'http://localhost:8000';
    }
    // Producción por defecto - ⚠️ ASEGÚRATE QUE SEA HTTPS
    else {
        url = 'https://apitiendaonlineartelaser-production.up.railway.app';
    }

    // 🔒 FORZAR HTTPS en CUALQUIER entorno (excepto localhost)
    // Esto corrige el problema si hay alguna variable mal configurada
    if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
        console.warn('⚠️ WARNING: URL HTTP detectada, convirtiendo a HTTPS');
        console.warn('   Original:', url);
        url = url.replace('http://', 'https://');
        console.warn('   Corregida:', url);
    }

    // Validar que sea HTTPS en producción
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        if (!url.startsWith('https://') && !url.includes('localhost')) {
            console.error('❌ CRITICAL ERROR: La URL de la API debe usar HTTPS');
            console.error('   Página actual:', window.location.protocol);
            console.error('   URL de API:', url);
            // Forzar HTTPS de todas formas
            url = url.replace(/^http:/, 'https:');
        }
    }

    // Eliminar barra final si existe
    return url.replace(/\/$/, '');
};

// ✅ Exportar la constante directamente
export const API_URL = getApiUrl();

// Helper para logs (solo en cliente)
if (typeof window !== 'undefined') {
    console.log('🌐 API URL configurada:', API_URL);
    console.log('🔐 Protocolo:', API_URL.startsWith('https://') ? 'HTTPS ✅' : 'HTTP ⚠️');
    console.log('🌍 Entorno:', process.env.NODE_ENV);
}