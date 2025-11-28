"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Mail, ShieldCheck, ArrowLeft } from "lucide-react"
import { API_URL } from "@/lib/api-config" // ✅ Importar API_URL


export default function RegisterPage() {
    const [step, setStep] = useState(1) // 1: Email, 2: Código, 3: Registro
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const [last_name, setLastName] = useState("")
    const [code, setCode] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const { register, isAuthenticated, login } = useAuth()
    const router = useRouter()


    useEffect(() => {
        if (isAuthenticated) {
            router.push("/")
        }
    }, [isAuthenticated, router])

    // Paso 1: Enviar código de verificación
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccessMessage(null)
        setLoading(true)

        try {
            // Usa la URL completa del backend (cambia el puerto si es diferente)
            const response = await fetch(`${API_URL}/api/v1/customers/send-verification-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name, last_name })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail?.message || data.detail || "Error al enviar código")
            }

            setSuccessMessage("¡Código enviado! Revisa tu email.")
            setStep(2)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al enviar código")
        } finally {
            setLoading(false)
        }
    }

    // Paso 2: Verificar código
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccessMessage(null)
        setLoading(true)

        try {
            const response = await fetch(`${API_URL}/api/v1/customers/verify-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail?.message || data.detail || "Código inválido")
            }

            setSuccessMessage("¡Email verificado! Completa tu registro.")
            setStep(3)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al verificar código")
        } finally {
            setLoading(false)
        }
    }

    // Paso 3: Registro final
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            // 1. Registrar con email verificado
            const registerResponse = await fetch(`${API_URL}/api/v1/customers/register-verified`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name, last_name })
            })

            const registerData = await registerResponse.json()

            if (!registerResponse.ok) {
                throw new Error(registerData.detail?.message || registerData.detail || "Error al registrarse")
            }

            setSuccessMessage("¡Cuenta creada exitosamente! Iniciando sesión...")

            // 2. ✅ Usar la función login del contexto (más confiable)
            await login(email, password)

            // 3. La redirección la maneja el useEffect de isAuthenticated
            // No necesitas router.push aquí porque el useEffect lo hace

        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al registrarse")
        } finally {
            setLoading(false)
        }
    }

    const handleResendCode = async () => {
        setError(null)
        setLoading(true)

        try {
            const response = await fetch(`${API_URL}/api/v1/customers/send-verification-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name, last_name })
            })

            if (!response.ok) throw new Error("Error al reenviar código")

            setSuccessMessage("Código reenviado exitosamente")
        } catch (err) {
            setError("Error al reenviar código")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container py-12 flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="card w-full max-w-md">
                {/* Header con progreso */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-center mb-4">Crear Cuenta</h1>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <div className={`flex items-center gap-1 ${step >= 1 ? 'text-accent' : ''}`}>
                            <Mail className="w-4 h-4" />
                            <span>Email</span>
                        </div>
                        <span>→</span>
                        <div className={`flex items-center gap-1 ${step >= 2 ? 'text-accent' : ''}`}>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verificar</span>
                        </div>
                        <span>→</span>
                        <div className={`flex items-center gap-1 ${step >= 3 ? 'text-accent' : ''}`}>
                            <span>Contraseña</span>
                        </div>
                    </div>
                </div>

                {/* Mensajes */}
                {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-500/10 text-green-600 p-4 rounded-lg mb-6">
                        {successMessage}
                    </div>
                )}

                {/* Paso 1: Email y Nombre */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Nombre</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input"
                                required
                                minLength={2}
                                placeholder="Tu nombre completo"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Apellidos</label>
                            <input
                                type="text"
                                value={last_name}
                                onChange={(e) => setLastName(e.target.value)}
                                className="input"
                                required
                                minLength={2}
                                placeholder="Apellidos"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                required
                                placeholder="tu@email.com"
                            />
                        </div>

                        <Button
                            onClick={handleSendCode}
                            disabled={loading || !name || !email || !last_name}
                            variant="primary"
                            className="w-full"
                        >
                            {loading ? "Enviando..." : "Enviar código de verificación"}
                        </Button>
                    </div>
                )}

                {/* Paso 2: Verificar Código */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                                Enviamos un código de 6 dígitos a:
                            </p>
                            <p className="font-semibold">{email}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Código de verificación
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                className="input text-center text-2xl tracking-widest"
                                required
                                maxLength={6}
                                minLength={6}
                                placeholder="000000"
                                autoFocus
                            />
                        </div>

                        <Button
                            onClick={handleVerifyCode}
                            disabled={loading || code.length !== 6}
                            variant="primary"
                            className="w-full"
                        >
                            {loading ? "Verificando..." : "Verificar código"}
                        </Button>

                        <div className="flex items-center justify-between text-sm">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="text-muted-foreground hover:text-accent flex items-center gap-1"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Cambiar email
                            </button>

                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={loading}
                                className="text-accent hover:underline"
                            >
                                Reenviar código
                            </button>
                        </div>
                    </div>
                )}

                {/* Paso 3: Contraseña */}
                {step === 3 && (
                    <div className="space-y-4">
                        <div className="bg-green-500/10 p-4 rounded-lg text-center mb-4">
                            <ShieldCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm text-green-600 font-medium">
                                Email verificado correctamente
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Crear contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                required
                                minLength={6}
                                placeholder="Mínimo 6 caracteres"
                                autoFocus
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Usa al menos 6 caracteres con letras y números
                            </p>
                        </div>

                        <Button
                            onClick={handleRegister}
                            disabled={loading || password.length < 6}
                            variant="primary"
                            className="w-full"
                        >
                            {loading ? "Creando cuenta..." : "Completar registro"}
                        </Button>
                    </div>
                )}

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