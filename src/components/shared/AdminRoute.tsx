"use client"

import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AdminRouteProps {
    children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
    const { isAuthenticated, isAdmin, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            // Si no está autenticado, redirigir a login
            if (!isAuthenticated) {
                router.push("/login")
            }
            // Si está autenticado pero NO es admin, redirigir a home
            else if (!isAdmin) {
                router.push("/")
            }
        }
    }, [isAuthenticated, isAdmin, isLoading, router])

    // Mostrar loading mientras verifica
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Verificando permisos...</p>
                </div>
            </div>
        )
    }

    // Si no es admin o no está autenticado, no mostrar nada
    // (el useEffect se encargará de redirigir)
    if (!isAuthenticated || !isAdmin) {
        return null
    }

    // Si todo está bien, mostrar el contenido
    return <>{children}</>
}