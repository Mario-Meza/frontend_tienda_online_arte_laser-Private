"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
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

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
    const { user, token, isAuthenticated, refreshUser } = useAuth()
    const router = useRouter()

    const fetchOrders = async (showLoader = true) => {
        if (!user) {
            console.log("No hay usuario disponible")
            return
        }

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

            console.log(`✅ Pedidos actualizados: ${userOrders.length}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido")
        } finally {
            if (showLoader) setLoading(false)
        }
    }

    // ✅ Carga inicial
    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login")
            return
        }

        if (user) {
            fetchOrders()
        }
    }, [isAuthenticated, user])

    // ✅ Polling automático cada 10 segundos
    useEffect(() => {
        if (!isAuthenticated || !user) return

        const interval = setInterval(() => {
            console.log("🔄 Actualizando pedidos automáticamente...")
            fetchOrders(false) // No mostrar loader en actualizaciones automáticas
        }, 10000) // 10 segundos

        return () => clearInterval(interval)
    }, [isAuthenticated, user, token])

    // ✅ Refrescar cuando la página vuelve a estar visible (cambio de pestaña)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                console.log("👁️ Página visible, refrescando pedidos...")
                fetchOrders(false)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [user])

    if (!isAuthenticated) {
        return null
    }

    if (loading) {
        return (
            <div className="container py-12">
                <div className="text-center">Cargando pedidos...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container py-12">
                <div className="text-center text-destructive">
                    <p>Error: {error}</p>
                </div>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className="container py-12">
                <div className="card text-center">
                    <h2 className="text-2xl font-bold mb-4">No tienes pedidos</h2>
                    <p className="text-muted-foreground mb-6">
                        Comienza a comprar para ver tus pedidos aquí
                    </p>
                    <Link href="/public/products" className="btn btn-primary">
                        Ver Productos
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="container py-12">
            <div className="flex items-center justify-between mb-12">
                <h1 className="text-4xl font-bold">Mis Pedidos</h1>
                <p className="text-sm text-muted-foreground">
                    Última actualización: {lastUpdate.toLocaleTimeString("es-ES")}
                </p>
            </div>

            <div className="space-y-6">
                {orders.map((order) => (
                    <div key={order._id} className="card">
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
                            <div>
                                <h3 className="text-xl font-bold">Pedido #{order._id.slice(-8)}</h3>
                                <p className="text-sm text-muted">
                                    {new Date(order.order_date).toLocaleDateString("es-ES")}
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
                            <h4 className="font-bold mb-3">Productos</h4>
                            <div className="space-y-2">
                                {order.details.map((detail, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span>Producto ID: {detail.product_id.slice(-8)}</span>
                                        <span>
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