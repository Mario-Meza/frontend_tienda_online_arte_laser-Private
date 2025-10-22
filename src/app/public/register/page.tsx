"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"

export default function RegisterPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const { register, isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (isAuthenticated) {
            router.push("/")
        }
    }, [isAuthenticated, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            await register(email, password, name)
            router.push("/")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al registrarse")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container py-12 flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="card w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center">Crear Cuenta</h1>

                {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Nombre</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" required />
                    </div>

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
                        {loading ? "Cargando..." : "Registrarse"}
                    </Button>
                </form>

                <p className="text-center text-muted-foreground mt-6">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="text-accent hover:underline">
                        Inicia sesión aquí
                    </Link>
                </p>
            </div>
        </div>
    )
}
