"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams()
    const sessionId = searchParams.get("session_id")
    const [orderDetails, setOrderDetails] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (sessionId) {
            // Aquí podrías hacer una llamada a tu API para obtener detalles del pago
            setLoading(false)
        }
    }, [sessionId])

    return (
        <div className="container py-12 flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="card w-full max-w-md text-center">
                <div className="text-6xl mb-6">✓</div>
                <h1 className="text-3xl font-bold mb-4 text-success">¡Pago Exitoso!</h1>
                <p className="text-muted mb-6">Tu pedido ha sido confirmado y está siendo procesado.</p>

                {sessionId && (
                    <div className="bg-neutral-100 p-4 rounded-lg mb-6 text-left">
                        <p className="text-sm text-muted">ID de Sesión:</p>
                        <p className="font-mono text-xs break-all">{sessionId}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <Link href="/orders" className="btn btn-primary w-full">
                        Ver Mis Pedidos
                    </Link>
                    <Link href="/products" className="btn btn-secondary w-full">
                        Seguir Comprando
                    </Link>
                </div>
            </div>
        </div>
    )
}
