// src/api_config.ts

const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    if (process.env.NODE_ENV === 'production') {
        return "https://apitiendaonlineartelaser-production.up.railway.app";
    }
    
    return "http://localhost:8000";
};

export const API_URL = getApiUrl();