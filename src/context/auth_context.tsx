"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { API_URL } from "@/api_config"

interface User {
    _id: string
    email: string
    name: string
    last_name: string
    phone?: string
    address?: string
    createdAt?: string   // ✅ Añadido
    updatedAt?: string
    role: 'admin' | 'customer' // ✅ Agregar role
}

interface AuthContextType {
    user: User | null
    token: string | null
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    register: (email: string, password: string, name: string) => Promise<void>
    isAuthenticated: boolean
    isAdmin: boolean // ✅ Helper para verificar si es admin
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // ✅ Función para obtener datos del usuario actual
    const fetchCurrentUser = async (authToken: string) => {
        try {
            const tokenParts = authToken.split('.')
            if (tokenParts.length !== 3) {
                console.error("Token mal formado")
                clearAuth()
                return
            }

            const payload = JSON.parse(atob(tokenParts[1]))
            const userEmail = payload.sub
            const userRole = payload.role || 'customer' // ✅ Obtener role del token

            if (!userEmail) {
                console.error("Token no contiene email (sub)")
                clearAuth()
                return
            }

            // ✅ Usar endpoint /auth/me en lugar de listar todos los customers
            const userResponse = await fetch(`${API_URL}/api/v1/auth/me`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            })

            if (userResponse.ok) {
                const currentUser = await userResponse.json()

                setUser({
                    ...currentUser,
                    _id: currentUser.id || currentUser._id, // Normalizar ID
                    role: userRole // ✅ Usar role del token (más confiable)
                })
                return currentUser
            } else if (userResponse.status === 401) {
                console.warn("Token expirado o inválido. Cerrando sesión...")
                clearAuth()
            } else {
                console.error("Error del servidor al obtener usuario:", userResponse.status)
            }
        } catch (error) {
            console.error("Error al obtener usuario:", error)
            clearAuth()
        }
    }

    // ✅ Función helper para limpiar autenticación
    const clearAuth = () => {
        setToken(null)
        setUser(null)
        localStorage.removeItem("auth_token")
    }

    // ✅ Cargar token y usuario del localStorage al montar
    useEffect(() => {
        const initAuth = async () => {
            const savedToken = localStorage.getItem("auth_token")
            if (savedToken) {
                setToken(savedToken)
                await fetchCurrentUser(savedToken)
            }
            setIsLoading(false)
        }

        initAuth()
    }, [])

    const refreshUser = async () => {
        if (token) {
            await fetchCurrentUser(token)
        }
    }

    const login = async (email: string, password: string) => {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("username", email)
            formData.append("password", password)

            const response = await fetch(`${API_URL}/api/v1/auth`, {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || errorData.message || "Credenciales inválidas")
            }

            const data = await response.json()

            setToken(data.access_token)

            localStorage.setItem("auth_token", data.access_token)

            await fetchCurrentUser(data.access_token)


        } catch (error) {
            console.error("Error en login:", error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const register = async (email: string, password: string, name: string) => {
        setIsLoading(true)
        try {
            const response = await fetch(`${API_URL}/api/v1/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                    name,
                }),
            })

            if (!response.ok) {
                let errorMessage = "Error al registrar"
                try {
                    const errorData = await response.json()
                    if (errorData.detail) {
                        if (typeof errorData.detail === 'string') {
                            errorMessage = errorData.detail
                        } else if (Array.isArray(errorData.detail)) {
                            errorMessage = errorData.detail.map((err: any) => err.msg).join(", ")
                        }
                    } else if (errorData.message) {
                        errorMessage = errorData.message
                    }
                } catch (e) {
                    errorMessage = `Error al registrar (${response.status})`
                }
                throw new Error(errorMessage)
            }

            await login(email, password)
        } catch (error) {
            console.error("Error en registro:", error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const logout = () => {
        console.log("👋 Cerrando sesión...")
        clearAuth()
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                login,
                logout,
                register,
                refreshUser,
                isAuthenticated: !!token && !!user,
                isAdmin: user?.role === 'admin' // ✅ Helper para verificar admin
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth debe ser usado dentro de AuthProvider")
    }
    return context
}