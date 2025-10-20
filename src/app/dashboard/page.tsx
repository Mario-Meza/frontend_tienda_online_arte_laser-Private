"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Order {
    _id: string
    status: string
    total: number
    order_date: string
}

interface Payment {
    _id: string
    order_id: string
    amount: number
    payment_status: string
    payment_date: string
}

export default function DashboardPage() {
    const { user, token, isAuthenticated } = useAuth()
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>([])
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
    })

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login")
            return
        }

        const fetchData = async () => {
            try {
                // Obtener órdenes
                const ordersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (ordersResponse.ok) {
                    const ordersData = await ordersResponse.json()
                    setOrders(ordersData.slice(0, 5)) // Últimas 5 órdenes

                    // Calcular estadísticas
                    setStats({
                        totalOrders: ordersData.length,
                        totalSpent: ordersData.reduce((sum: number, order: Order) => sum + order.total, 0),
                        pendingOrders: ordersData.filter((o: Order) => o.status === "pending").length,
                    })
                }

                // Obtener pagos
                const paymentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (paymentsResponse.ok) {
                    const paymentsData = await paymentsResponse.json()
                    setPayments(paymentsData.slice(0, 5))
                }
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [isAuthenticated, token, router])

    if (!isAuthenticated) {
        return null
    }

    if (loading) {
        return (
            <div className="container py-12">
                <div className="text-center">Cargando dashboard...</div>
            </div>
        )
    }

    return (
        <div className="container py-12">
            <div className="mb-12">
                <h1 className="text-4xl font-bold mb-2">Bienvenido, {user?.name}</h1>
                <p className="text-muted">{user?.email}</p>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="card">
                    <h3 className="text-sm font-medium text-muted mb-2">Total de Pedidos</h3>
                    <p className="text-3xl font-bold">{stats.totalOrders}</p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-muted mb-2">Total Gastado</h3>
                    <p className="text-3xl font-bold text-accent">${stats.totalSpent.toFixed(2)}</p>
                </div>
                <div className="card">
                    <h3 className="text-sm font-medium text-muted mb-2">Pedidos Pendientes</h3>
                    <p className="text-3xl font-bold text-warning">{stats.pendingOrders}</p>
                </div>
            </div>

            {/* Órdenes Recientes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Órdenes Recientes</h2>
                        <Link href="/orders" className="text-accent hover:underline">
                            Ver todas
                        </Link>
                    </div>

                    {orders.length > 0 ? (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div key={order._id} className="card">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold">Pedido #{order._id.slice(-8)}</p>
                                            <p className="text-sm text-muted">{new Date(order.order_date).toLocaleDateString("es-ES")}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-accent">${order.total.toFixed(2)}</p>
                                            <p className="text-sm text-muted capitalize">{order.status}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card text-center py-8">
                            <p className="text-muted mb-4">No tienes pedidos aún</p>
                            <Link href="/products" className="btn btn-primary">
                                Empezar a Comprar
                            </Link>
                        </div>
                    )}
                </div>

                {/* Pagos Recientes */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Pagos Recientes</h2>
                    </div>

                    {payments.length > 0 ? (
                        <div className="space-y-4">
                            {payments.map((payment) => (
                                <div key={payment._id} className="card">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold">Pago #{payment._id.slice(-8)}</p>
                                            <p className="text-sm text-muted">{new Date(payment.payment_date).toLocaleDateString("es-ES")}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-success">${payment.amount.toFixed(2)}</p>
                                            <p className="text-sm text-muted capitalize">{payment.payment_status}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card text-center py-8">
                            <p className="text-muted">No tienes pagos registrados</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="mt-12 pt-12 border-t border-border">
                <h2 className="text-2xl font-bold mb-6">Acciones Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/products" className="btn btn-primary w-full">
                        Seguir Comprando
                    </Link>
                    <Link href="/orders" className="btn btn-secondary w-full">
                        Ver Todos los Pedidos
                    </Link>
                    <Link href="/cart" className="btn btn-secondary w-full">
                        Ver Carrito
                    </Link>
                </div>
            </div>
        </div>
    )
}
