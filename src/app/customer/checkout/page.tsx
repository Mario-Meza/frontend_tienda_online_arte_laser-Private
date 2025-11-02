"use client"

import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { ShoppingBag, Lock, CreditCard, Package, User, Mail, Phone, Home, House, ArrowLeft, CheckCircle } from "lucide-react"

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart()
    const { user, token, isAuthenticated } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-amber-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Debes iniciar sesión</h2>
                    <p className="text-gray-600 mb-8">Para continuar con tu compra, primero inicia sesión en tu cuenta</p>
                    <Link
                        href="/login"
                        className="inline-block w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-semibold rounded-2xl hover:shadow-xl transition-all"
                    >
                        Ir a Iniciar Sesión
                    </Link>
                </div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h2>
                    <p className="text-gray-600 mb-8">Agrega productos a tu carrito para continuar con la compra</p>
                    <Link
                        href="/products"
                        className="inline-block w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-semibold rounded-2xl hover:shadow-xl transition-all"
                    >
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

            clearCart()
            window.location.href = checkoutData.checkout_url
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 py-12">
            <div className="container max-w-7xl mx-auto px-4">
                {/* Header con breadcrumb */}
                <div className="mb-8">
                    <Link
                        href="/cart"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver al carrito
                    </Link>
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 mb-2">
                        Finalizar Compra
                    </h1>
                    <p className="text-gray-600 text-lg">Completa tu pedido de forma segura</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna izquierda - Información */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Información de envío */}
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <User className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Información de Envío</h2>
                                </div>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <User className="w-4 h-4 text-amber-600" />
                                        Nombre Completo
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={user?.name || ""}
                                            disabled
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-700 font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Mail className="w-4 h-4 text-amber-600" />
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        value={user?.email || ""}
                                        disabled
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-700 font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Phone className="w-4 h-4 text-amber-600" />
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        value={user?.phone || "No registrado"}
                                        disabled
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-700 font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Home className="w-4 h-4 text-amber-600" />
                                        Dirección
                                    </label>
                                    <input
                                        type="tel"
                                        value={user?.address || "No registrado"}
                                        disabled
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-700 font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Resumen de productos */}
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Package className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Resumen del Pedido</h2>
                                        <p className="text-white/80 text-sm">{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="space-y-4">
                                    {items.map((item) => (
                                        <div key={item.product_id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                                            <img
                                                src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=10'}
                                                alt={item.name}
                                                className="w-20 h-20 object-cover rounded-xl"
                                            />
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
                                                <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                                                <p className="text-sm text-amber-600 font-semibold mt-1">
                                                    ${item.price.toFixed(2)} c/u
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-xl text-gray-900">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna derecha - Resumen de pago */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden sticky top-6">
                            <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <CreditCard className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Resumen de Pago</h2>
                                </div>
                            </div>

                            <div className="p-6">
                                {error && (
                                    <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-white text-xs font-bold">!</span>
                                            </div>
                                            <p className="text-rose-700 text-sm font-medium">{error}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4 mb-6 pb-6 border-b-2 border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-semibold text-gray-900">${total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Envío:</span>
                                        <span className="font-semibold text-emerald-600 flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" />
                                            Gratis
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-xl font-bold text-gray-900">Total:</span>
                                        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-rose-600">
                                            ${total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateOrder}
                                    disabled={loading}
                                    className={`w-full py-4 rounded-2xl font-bold text-lg mb-3 transition-all ${
                                        loading
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg hover:shadow-2xl hover:scale-105'
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                            Procesando...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Lock className="w-5 h-5" />
                                            Pagar con Stripe
                                        </span>
                                    )}
                                </button>

                                <Link
                                    href="/customer/cart"
                                    className="block w-full py-4 rounded-2xl font-semibold text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                                >
                                    Volver al Carrito
                                </Link>

                                <div className="mt-6 pt-6 border-t-2 border-gray-100">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Lock className="w-4 h-4" />
                                        <span>Pago 100% seguro con Stripe</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}