"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import { Button, LinkButton } from "@/components/ui/Button"
import { API_URL } from "@/api_config"

interface Product {
    _id: string
    stock: number
    shipping_cost?: number
}

export default function CartPage() {
    const { items, removeItem, updateQuantity, total, clearCart } = useCart()
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const { isAuthenticated, user, isAdmin } = useAuth()

    // Redirigir según rol
    useEffect(() => {
        if (isAuthenticated && user) {
            if (isAdmin) {
                router.push("/admin/admin/dashboard")
            } else {
                router.push("/customer/cart")
            }
        }
    }, [isAuthenticated, user, isAdmin, router])

    // Obtener productos con información de envío
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${API_URL}/api/v1/products/all`)
                if (response.ok) {
                    const data = await response.json()
                    setProducts(Array.isArray(data) ? data : [])
                }
            } catch (error) {
                console.error("Error al cargar productos:", error)
                setProducts([])
            } finally {
                setLoading(false)
            }
        }

        if (items.length > 0) {
            fetchProducts()
        } else {
            setLoading(false)
        }
    }, [items.length])

    // ✅ Obtener información del producto
    const getProductInfo = (productId: string) => {
        if (!Array.isArray(products) || products.length === 0)
            return { stock: 0, shippingCost: 0 }

        const product = products.find(p => p._id === productId)
        return {
            stock: product?.stock || 0,
            shippingCost: product?.shipping_cost || 0
        }
    }

    // ✅ Calcular totales CON ENVÍO INTELIGENTE
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // 📦 REGLAS DE ENVÍO (igual que backend)
    const FREE_SHIPPING_THRESHOLD = 300.0

    // Obtener el costo de envío MÁS ALTO (no se suma por cantidad)
    const maxShippingCost = items.reduce((max, item) => {
        const { shippingCost } = getProductInfo(item.product_id)
        return Math.max(max, shippingCost)
    }, 0)

    // Si subtotal >= $300 → envío gratis, sino se cobra el más alto
    const shippingTotal = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : maxShippingCost

    const grandTotal = subtotal + shippingTotal

    // Manejadores
    const handleIncrement = (productId: string, currentQuantity: number) => {
        const { stock } = getProductInfo(productId)

        if (currentQuantity >= stock) {
            alert(`No hay más stock disponible. Máximo: ${stock} unidades`)
            return
        }

        updateQuantity(productId, currentQuantity + 1)
    }

    const handleDecrement = (productId: string, currentQuantity: number) => {
        if (currentQuantity > 1) {
            updateQuantity(productId, currentQuantity - 1)
        } else {
            removeItem(productId)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md">
                    <svg className="w-20 h-20 text-amber-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">Debes iniciar sesión</h2>
                    <p className="text-gray-600 mb-6">Por favor inicia sesión para ver tu carrito</p>
                    <LinkButton href="/login" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all">
                        Ir a Iniciar Sesión
                    </LinkButton>
                </div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md">
                    <svg className="w-20 h-20 text-amber-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">Tu carrito está vacío</h2>
                    <p className="text-gray-600 mb-6">Agrega productos para comenzar a comprar</p>
                    <LinkButton href="/" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all">
                        Ver Productos
                    </LinkButton>
                </div>
            </div>
        )
    }

    const handleCheckout = () => {
        router.push("/customer/checkout")
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 py-12">
            <div className="container">
                <h1 className="text-4xl md:text-5xl font-bold mb-12 bg-clip-text text-transparent bg-gradient-to-r from-amber-700 via-orange-600 to-rose-600">
                    Tu Carrito
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Lista de productos */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => {
                            const { stock, shippingCost } = getProductInfo(item.product_id)
                            const isOutOfStock = stock === 0
                            const isMaxReached = item.quantity >= stock

                            return (
                                <div key={item.product_id} className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        {item.image && (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-24 h-24 object-cover rounded-2xl"
                                            />
                                        )}

                                        <div className="flex-grow">
                                            <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                                            <p className="text-gray-600">${item.price.toFixed(2)} c/u</p>

                                            {/* ✅ Mostrar costo de envío */}
                                            {shippingCost > 0 && (
                                                <p className="text-sm text-blue-600 mt-1">
                                                    📦 Envío: ${shippingCost.toFixed(2)} por unidad
                                                </p>
                                            )}

                                            {loading ? (
                                                <p className="text-xs text-gray-400 mt-1">Verificando stock...</p>
                                            ) : (
                                                <div className="mt-1">
                                                    {isOutOfStock ? (
                                                        <p className="text-xs text-rose-600 font-semibold">⚠️ Sin stock disponible</p>
                                                    ) : isMaxReached ? (
                                                        <p className="text-xs text-amber-600 font-semibold">⚠️ Stock máximo alcanzado ({stock} disponibles)</p>
                                                    ) : (
                                                        <p className="text-xs text-gray-500">{stock} disponibles</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
                                                <button
                                                    onClick={() => handleDecrement(item.product_id, item.quantity)}
                                                    className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 transition-colors flex items-center justify-center font-bold text-gray-700"
                                                >
                                                    {item.quantity === 1 ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </button>
                                                <span className="w-10 text-center font-bold text-gray-900">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleIncrement(item.product_id, item.quantity)}
                                                    disabled={isMaxReached || isOutOfStock || loading}
                                                    className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center font-bold ${
                                                        isMaxReached || isOutOfStock || loading
                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                            : 'bg-white hover:bg-amber-100 text-gray-700'
                                                    }`}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <span className="font-bold text-xl text-gray-900 w-28 text-right">
                                                ${((item.price + shippingCost) * item.quantity).toFixed(2)}
                                            </span>

                                            <button
                                                onClick={() => removeItem(item.product_id)}
                                                className="text-rose-500 hover:text-rose-700 transition-colors p-2"
                                                title="Eliminar del carrito"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Resumen del pedido */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl p-8 shadow-lg sticky top-4">
                            <h2 className="text-2xl font-bold mb-6 text-gray-900">Resumen del Pedido</h2>

                            <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                                <div className="flex justify-between text-gray-700">
                                    <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} productos):</span>
                                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                                </div>

                                {/* ✅ Mostrar envío */}
                                <div className="flex justify-between text-gray-700">
                                    <span>Envío:</span>
                                    {shippingTotal > 0 ? (
                                        <span className="font-semibold text-blue-600">${shippingTotal.toFixed(2)}</span>
                                    ) : (
                                        <span className="text-emerald-600 font-semibold">Gratis</span>
                                    )}
                                </div>

                                <div className="flex justify-between text-xl font-bold text-gray-900 pt-4">
                                    <span>Total:</span>
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
                                        ${grandTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <Button
                                onClick={handleCheckout}
                                className="w-full mb-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
                            >
                                🛒 Proceder al Pago
                            </Button>

                            <Button
                                onClick={clearCart}
                                className="w-full mb-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-semibold transition-all"
                            >
                                🗑️ Vaciar Carrito
                            </Button>

                            <LinkButton
                                href="/"
                                className="w-full text-center py-3 text-amber-700 hover:text-amber-900 font-medium transition-colors"
                            >
                                ← Seguir Comprando
                            </LinkButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}