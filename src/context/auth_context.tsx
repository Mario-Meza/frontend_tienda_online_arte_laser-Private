"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
    _id: string
    email: string
    name: string
    phone?: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    register: (email: string, password: string, name: string) => Promise<void>
    isAuthenticated: boolean
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
            // Decodificar el token para obtener el email (sin verificar en el frontend)
            const tokenParts = authToken.split('.')
            if (tokenParts.length !== 3) {
                console.error("Token mal formado")
                setToken(null)
                setUser(null)
                localStorage.removeItem("auth_token")
                return
            }

            const payload = JSON.parse(atob(tokenParts[1]))
            const userEmail = payload.sub

            if (!userEmail) {
                console.error("Token no contiene email (sub)")
                setToken(null)
                setUser(null)
                localStorage.removeItem("auth_token")
                return
            }

            // Obtener todos los customers y buscar el actual
            const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/customers`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            })

            if (userResponse.ok) {
                const customers = await userResponse.json()
                const currentUser = customers.find((c: any) => c.email === userEmail)

                if (currentUser) {
                    setUser(currentUser)
                    return currentUser
                } else {
                    console.error("Usuario no encontrado en la base de datos")
                    setToken(null)
                    setUser(null)
                    localStorage.removeItem("auth_token")
                }
            } else if (userResponse.status === 401) {
                console.warn("Token expirado o inválido. Cerrando sesión...")
                setToken(null)
                setUser(null)
                localStorage.removeItem("auth_token")
            } else {
                console.error("Error del servidor al obtener usuario:", userResponse.status)
            }
        } catch (error) {
            console.error("Error al obtener usuario:", error)
            // En caso de error al decodificar o red, limpiar sesión por seguridad
            setToken(null)
            setUser(null)
            localStorage.removeItem("auth_token")
        }
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

    // ✅ Función pública para refrescar usuario
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

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth`, {
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

            // Obtener datos del usuario
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
            console.log("Registrando usuario:", { email, name })
            const registerUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`

            const response = await fetch(registerUrl, {
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
                    console.error("Error del servidor:", errorData)

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
                    console.error("No se pudo parsear el error:", e)
                    errorMessage = `Error al registrar (${response.status})`
                }

                throw new Error(errorMessage)
            }

            const newUser = await response.json()
            console.log("Usuario registrado:", newUser)

            // Auto-login después del registro
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
        setUser(null)
        setToken(null)
        localStorage.removeItem("auth_token")
        // No limpiar el carrito aquí, se limpiará automáticamente en cart-context cuando user sea null
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