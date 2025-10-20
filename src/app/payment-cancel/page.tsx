"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function PaymentCancelPage() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get("order_id")

    return (
        <div className="container py-12 flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="card w-full max-w-md text-center">
                <div className="text-6xl mb-6">✕</div>
                <h1 className="text-3xl font-bold mb-4 text-destructive">Pago Cancelado</h1>
                <p className="text-muted mb-6">Has cancelado el proceso de pago. Tu carrito sigue disponible.</p>

                <div className="space-y-3">
                    <Link href="/cart" className="btn btn-primary w-full">
                        Volver al Carrito
                    </Link>
                    <Link href="/products" className="btn btn-secondary w-full">
                        Seguir Comprando
                    </Link>
                </div>
            </div>
        </div>
    )
}
