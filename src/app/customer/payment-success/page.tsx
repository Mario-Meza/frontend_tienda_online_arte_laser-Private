"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth_context"
import { CheckCircle, Package, Truck, CreditCard, Calendar, Home } from "lucide-react"
import { API_URL } from "@/lib/api-config"

interface OrderDetails {
    _id: string
    subtotal: number
    shipping_total: number
    total: number
    status: string
    order_date: string
    shipping_address: string
    details: Array<{
        product_name: string
        quantity: number
        unit_price: number
        subtotal: number
    }>
}

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams()
    const sessionId = searchParams.get("session_id")
    const [loading, setLoading] = useState(true)
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
    const { isAuthenticated, user, token } = useAuth()
    const router = useRouter()

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!sessionId || !token) {
                setLoading(false)
                return
            }

            try {
                // Obtener detalles de la sesión de Stripe desde tu backend
                const response = await fetch(`${API_URL}/api/v1/stripe/session/${sessionId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    setOrderDetails(data.order)
                }
            } catch (error) {
                console.error('Error al cargar detalles:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchOrderDetails()
    }, [sessionId, token])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12">
            <div className="container max-w-4xl mx-auto px-4">
                {/* Success Header */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <CheckCircle className="w-16 h-16 text-emerald-500" />
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-3">¡Pago Exitoso!</h1>
                        <p className="text-white/90 text-lg">Tu pedido ha sido confirmado y está siendo procesado</p>
                    </div>

                    {/* Order Info */}
                    {orderDetails && (
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Package className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">ID de Pedido</p>
                                        <p className="font-mono text-sm font-semibold text-gray-900">{orderDetails._id}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Fecha</p>
                                        <p className="font-semibold text-gray-900">
                                            {new Date(orderDetails.order_date).toLocaleDateString('es-MX', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <CreditCard className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Estado</p>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
                                            Procesando
                                        </span>
                                    </div>
                                </div>

                                {orderDetails.shipping_address && (
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Home className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Dirección de Envío</p>
                                            <p className="font-semibold text-gray-900 text-sm">{orderDetails.shipping_address}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Products List */}
                            <div className="border-t border-gray-200 pt-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-emerald-600" />
                                    Productos del Pedido
                                </h3>
                                <div className="space-y-3">
                                    {orderDetails.details.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center bg-gray-50 rounded-xl p-4">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{item.product_name}</p>
                                                <p className="text-sm text-gray-500">Cantidad: {item.quantity} × ${item.unit_price.toFixed(2)}</p>
                                            </div>
                                            <p className="font-bold text-gray-900">${item.subtotal.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total Breakdown */}
                            <div className="border-t border-gray-200 mt-8 pt-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Subtotal:</span>
                                        <span className="font-semibold">${orderDetails.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-700">
                                        <span className="flex items-center gap-2">
                                            <Truck className="w-4 h-4" />
                                            Envío:
                                        </span>
                                        {orderDetails.shipping_total > 0 ? (
                                            <span className="font-semibold text-blue-600">${orderDetails.shipping_total.toFixed(2)}</span>
                                        ) : (
                                            <span className="font-semibold text-emerald-600">Gratis</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                                        <span>Total Pagado:</span>
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                                            ${orderDetails.total.toFixed(2)} MXN
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Session ID fallback */}
                    {!orderDetails && sessionId && (
                        <div className="p-8">
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <p className="text-sm text-gray-600 mb-1">ID de Sesión:</p>
                                <p className="font-mono text-xs text-gray-900 break-all">{sessionId}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/customer/orders"
                        className="flex-1 max-w-xs py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl text-center hover:shadow-xl transition-all"
                    >
                        Ver Mis Pedidos
                    </Link>
                    <Link
                        href="/"
                        className="flex-1 max-w-xs py-4 bg-white text-gray-700 font-semibold rounded-2xl text-center border-2 border-gray-200 hover:border-emerald-500 hover:text-emerald-600 transition-all"
                    >
                        Volver al Inicio
                    </Link>
                </div>

                {/* Additional Info */}
                <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
                    <p className="text-blue-800 text-sm">
                        📧 <strong>Recibirás un correo de confirmación</strong> con los detalles de tu pedido y el seguimiento del envío.
                    </p>
                </div>
            </div>
        </div>
    )
}