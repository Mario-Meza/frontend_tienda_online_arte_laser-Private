"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const { login, isAuthenticated, user, isAdmin, isLoading } = useAuth()
    const router = useRouter()

    // ✅ Redirigir si ya está autenticado
    useEffect(() => {
        if (isAuthenticated && user) {
            if (isAdmin) {
                router.push("/admin/admin/dashboard") // o "/admin/dashboard"
            } else {
                router.push("/") // Página principal del cliente
            }
        }
    }, [isAuthenticated, user, isAdmin, router])

    // Mostrar mensaje de carga
    if (isAuthenticated && user) {
        return (
            <div className="container py-12 flex items-center justify-center min-h-[calc(100vh-64px)]">
                <div className="text-center">Redirigiendo...</div>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            await login(email, password)

            // ⚡ Espera un poco a que se actualice el contexto
            setTimeout(() => {
                if (isAdmin) {
                    router.push("/admin/admin/dashboard")
                } else {
                    router.push("/")
                }
            }, 300)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al iniciar sesión")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container py-12 flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="card w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center">Iniciar Sesión</h1>

                {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                            required
                        />
                    </div>

                    <Button type="submit" disabled={loading || isLoading} variant="primary" className="w-full">
                        {loading ? "Cargando..." : "Iniciar Sesión"}
                    </Button>
                </form>

                <p className="text-center text-muted-foreground mt-6">
                    ¿No tienes cuenta?{" "}
                    <Link href="/register" className="text-accent hover:underline">
                        Regístrate aquí
                    </Link>
                </p>
            </div>
        </div>
    )
}
