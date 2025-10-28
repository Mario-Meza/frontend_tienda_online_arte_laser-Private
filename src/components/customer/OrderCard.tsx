"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth_context"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

interface Order {
    id: string
    orderNumber: string
    date: string
    status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
    total: number
    items: number
}

const statusLabels = {
    pending: "Pendiente",
    processing: "Procesando",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
}

const statusVariants = {
    pending: "secondary" as const,
    processing: "default" as const,
    shipped: "default" as const,
    delivered: "default" as const,
    cancelled: "destructive" as const,
}

export function OrdersTab() {
    const { token } = useAuth()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/my-orders`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const data = await response.json()
                setOrders(data)
            } catch (error) {
                console.error("[v0] Error fetching orders:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchOrders()
    }, [token])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Cargando pedidos...</div>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold mb-2">No tienes pedidos aún</h3>
                    <p className="text-muted-foreground mb-6 text-center">Cuando realices tu primera compra, aparecerá aquí</p>
                    <Button>Explorar productos</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1 space-y-2">
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>Fecha: {new Date(order.date).toLocaleDateString("es-ES")}</p>
                                    <p>
                                        {order.items} {order.items === 1 ? "artículo" : "artículos"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Total</p>
                                    <p className="text-xl font-bold">${order.total.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
