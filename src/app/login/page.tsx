"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/button"


export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const { login, isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (isAuthenticated) {
            router.push("/")
        }
    }, [isAuthenticated, router])

    // Opcional: mostrar un loading mientras redirige
    if (isAuthenticated) {
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
            router.push("/")
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
                    <Button type="submit" disabled={loading} variant="primary" className="w-full">
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
