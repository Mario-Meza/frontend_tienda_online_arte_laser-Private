const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function apiCall(endpoint: string, options: RequestInit & { token?: string } = {}) {
    const { token, ...fetchOptions } = options

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    })

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
}
