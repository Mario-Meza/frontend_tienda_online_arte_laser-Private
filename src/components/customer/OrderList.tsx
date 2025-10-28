// components/customer/OrdersList.tsx
"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth_context"
import Link from "next/link"

interface OrderDetail {
    product_id: string
    quantity: number
    unit_price: number
    subtotal: number
}

interface Order {
    _id: string
    customer_id: string
    status: string
    order_date: string
    total: number
    details: OrderDetail[]
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    sent: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    canceled: "bg-red-100 text-red-800",
}

const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    processing: "Procesando",
    sent: "Enviado",
    delivered: "Entregado",
    canceled: "Cancelado",
}

interface OrdersListProps {
    showHeader?: boolean
    maxOrders?: number
}

export function OrdersList({ showHeader = true, maxOrders }: OrdersListProps) {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
    const { user, token } = useAuth()

    const fetchOrders = async (showLoader = true) => {
        if (!user) return

        if (showLoader) setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) throw new Error("Error al cargar pedidos")
            const data = await response.json()

            const userOrders = data.filter((order: Order) => order.customer_id === user._id)
            setOrders(userOrders)
            setLastUpdate(new Date())
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido")
        } finally {
            if (showLoader) setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchOrders()
        }
    }, [user])

    // Polling automático cada 10 segundos
    useEffect(() => {
        if (!user) return

        const interval = setInterval(() => {
            fetchOrders(false)
        }, 10000)

        return () => clearInterval(interval)
    }, [user, token])

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando pedidos...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-destructive">
                    <p>Error: {error}</p>
                    <button
                        onClick={() => fetchOrders()}
                        className="mt-4 btn btn-secondary"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className="card text-center py-12">
                <div className="text-4xl mb-4">📦</div>
                <h2 className="text-2xl font-bold mb-4">No tienes pedidos</h2>
                <p className="text-muted-foreground mb-6">
                    Comienza a comprar para ver tus pedidos aquí
                </p>
                <Link href="/products" className="btn btn-primary">
                    Ver Productos
                </Link>
            </div>
        )
    }

    const displayOrders = maxOrders ? orders.slice(0, maxOrders) : orders

    return (
        <div>
            {showHeader && (
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Mis Pedidos</h2>
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            Última actualización: {lastUpdate.toLocaleTimeString("es-ES")}
                        </p>
                        {maxOrders && orders.length > maxOrders && (
                            <Link href="/orders" className="text-sm text-accent hover:underline">
                                Ver todos ({orders.length})
                            </Link>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {displayOrders.map((order) => (
                    <div key={order._id} className="card">
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
                            <div>
                                <h3 className="text-xl font-bold">Pedido #{order._id.slice(-8)}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(order.order_date).toLocaleDateString("es-ES", {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className="text-right">
                                <span
                                    className={`inline-block px-4 py-2 rounded-lg font-medium ${
                                        statusColors[order.status] || "bg-gray-100"
                                    }`}
                                >
                                    {statusLabels[order.status] || order.status}
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="font-semibold mb-3 text-muted-foreground">Productos</h4>
                            <div className="space-y-2">
                                {order.details.map((detail, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Producto ID: {detail.product_id.slice(-8)}
                                        </span>
                                        <span className="font-medium">
                                            {detail.quantity}x ${detail.unit_price.toFixed(2)} = $
                                            {detail.subtotal.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-border">
                            <span className="text-lg font-bold">Total:</span>
                            <span className="text-2xl font-bold text-accent">
                                ${order.total.toFixed(2)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}