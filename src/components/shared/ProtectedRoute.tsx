"use client"

import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
    children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login")
        }
    }, [isAuthenticated, isLoading, router])

    // Mostrar loading mientras verifica
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Cargando...</p>
                </div>
            </div>
        )
    }

    // Si no está autenticado, no mostrar nada
    if (!isAuthenticated) {
        return null
    }

    // Si está autenticado, mostrar el contenido
    return <>{children}</>
}