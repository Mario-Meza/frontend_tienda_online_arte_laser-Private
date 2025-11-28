"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth_context"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { API_URL } from "@/api_config"


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

const statusSteps = ["pending", "processing", "sent", "delivered"]

export default function OrderDetailPage() {
    const params = useParams()
    const orderId = params.id as string
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { token, isAuthenticated, user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login")
            return
        }

        const fetchOrder = async () => {
            try {
                const response = await fetch(`${API_URL}/api/v1/orders/${orderId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (!response.ok) throw new Error("Error al cargar el pedido")
                const data = await response.json()

                // Check if the order belongs to the current user
                if (data.customer_id !== user?._id) {
                    throw new Error("No tienes permiso para ver este pedido")
                }

                setOrder(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        fetchOrder()
    }, [orderId, isAuthenticated, token, router, user])

    if (!isAuthenticated) {
        return null
    }

    if (loading) {
        return (
            <div className="container py-12">
                <div className="text-center">Cargando pedido...</div>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="container py-12">
                <div className="card text-center">
                    <h2 className="text-2xl font-bold mb-4 text-destructive">Error</h2>
                    <p className="text-muted mb-6">{error || "Pedido no encontrado"}</p>
                    <Link href="/orders" className="btn btn-primary">
                        Volver a Pedidos
                    </Link>
                </div>
            </div>
        )
    }

    const currentStepIndex = statusSteps.indexOf(order.status)

    return (
        <div className="container py-12">
            <Link href="/orders" className="text-accent hover:underline mb-6 inline-block">
                ← Volver a Pedidos
            </Link>

            <h1 className="text-4xl font-bold mb-12">Pedido #{order._id.slice(-8)}</h1>

            {/* Timeline de Estado */}
            <div className="card mb-8">
                <h2 className="text-2xl font-bold mb-8">Estado del Pedido</h2>
                <div className="flex items-center justify-between">
                    {statusSteps.map((step, index) => (
                        <div key={step} className="flex flex-col items-center flex-1">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${
                                    index <= currentStepIndex ? "bg-success text-white" : "bg-neutral-200 text-neutral-600"
                                }`}
                            >
                                {index < currentStepIndex ? "✓" : index + 1}
                            </div>
                            <span className="text-sm font-medium capitalize">{step}</span>
                            {index < statusSteps.length - 1 && (
                                <div className={`h-1 flex-1 mx-2 mt-2 ${index < currentStepIndex ? "bg-success" : "bg-neutral-200"}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {/* Productos */}
                    <div className="card mb-8">
                        <h2 className="text-2xl font-bold mb-6">Productos</h2>
                        <div className="space-y-4">
                            {order.details.map((detail, idx) => (
                                <div key={idx} className="flex justify-between pb-4 border-b border-border last:border-0">
                                    <div>
                                        <p className="font-bold">Producto ID: {detail.product_id.slice(-8)}</p>
                                        <p className="text-sm text-muted">Cantidad: {detail.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">${detail.unit_price.toFixed(2)}</p>
                                        <p className="text-sm text-muted">Subtotal: ${detail.subtotal.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Información de Envío */}
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-6">Información de Envío</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-muted">Fecha de Pedido</p>
                                <p className="font-bold">{new Date(order.order_date).toLocaleDateString("es-ES")}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted">Estado</p>
                                <p className="font-bold capitalize">{order.status}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen */}
                <div className="card h-fit">
                    <h2 className="text-2xl font-bold mb-6">Resumen</h2>

                    <div className="space-y-4 pb-6 border-b border-border">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${order.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Envío:</span>
                            <span>Gratis</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-accent">${order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Link href="/orders" className="btn btn-secondary w-full">
                            Volver a Pedidos
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
