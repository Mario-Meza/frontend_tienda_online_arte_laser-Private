"use client"

import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart()
    const { user, token, isAuthenticated } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isAuthenticated) {
        return (
            <div className="container py-12">
                <div className="card text-center">
                    <h2 className="text-2xl font-bold mb-4">Debes iniciar sesión</h2>
                    <Link href="/login" className="btn btn-primary">
                        Ir a Iniciar Sesión
                    </Link>
                </div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="container py-12">
                <div className="card text-center">
                    <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
                    <Link href="/products" className="btn btn-primary">
                        Ver Productos
                    </Link>
                </div>
            </div>
        )
    }

    const handleCreateOrder = async () => {
        setLoading(true)
        setError(null)

        try {
            // Crear la orden
            const orderData = {
                customer_id: user?._id,
                details: items.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                })),
            }

            const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(orderData),
            })

            if (!orderResponse.ok) {
                throw new Error("Error al crear la orden")
            }

            const order = await orderResponse.json()

            // Redirigir a Stripe checkout
            const checkoutResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/stripe/checkout/${order._id}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!checkoutResponse.ok) {
                throw new Error("Error al crear sesión de pago")
            }

            const checkoutData = await checkoutResponse.json()

            // Limpiar carrito y redirigir a Stripe
            clearCart()
            window.location.href = checkoutData.checkout_url
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container py-12">
            <h1 className="text-4xl font-bold mb-12">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="card mb-6">
                        <h2 className="text-2xl font-bold mb-4">Información de Envío</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Nombre</label>
                                <input type="text" value={user?.name || ""} disabled className="input opacity-50" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input type="email" value={user?.email || ""} disabled className="input opacity-50" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Teléfono</label>
                                <input type="tel" value={user?.phone || ""} disabled className="input opacity-50" />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="text-2xl font-bold mb-4">Resumen de Productos</h2>
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.product_id} className="flex justify-between pb-3 border-b border-border">
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted">Cantidad: {item.quantity}</p>
                                    </div>
                                    <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card h-fit">
                    <h2 className="text-2xl font-bold mb-6">Resumen de Pago</h2>

                    {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">{error}</div>}

                    <div className="space-y-4 mb-6 pb-6 border-b border-border">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Envío:</span>
                            <span>Gratis</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-accent">${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button onClick={handleCreateOrder} disabled={loading} className="btn btn-primary w-full mb-3">
                        {loading ? "Procesando..." : "Ir a Pagar con Stripe"}
                    </button>

                    <Link href="/cart" className="btn btn-secondary w-full">
                        Volver al Carrito
                    </Link>
                </div>
            </div>
        </div>
    )
}
