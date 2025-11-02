"use client"

import {useRouter, useSearchParams} from "next/navigation"
import Link from "next/link"
import {useEffect} from "react";
import {useAuth} from "@/context/auth_context";

export default function PaymentCancelPage() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get("order_id")
    const { isAuthenticated, user, isAdmin } = useAuth()
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
