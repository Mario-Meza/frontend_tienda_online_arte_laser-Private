"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import { Button, LinkButton } from "@/components/ui/Button"

interface Product {
    _id: string
    stock: number
}

export default function CartPage() {
    const { items, removeItem, updateQuantity, total, clearCart } = useCart()
    const { isAuthenticated } = useAuth()
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    // ✅ Obtener stock actual de los productos
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // ✅ Usar el mismo endpoint que products page
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/all`)
                if (response.ok) {
                    const data = await response.json()
                    // ✅ Asegurar que siempre sea un array
                    setProducts(Array.isArray(data) ? data : [])
                }
            } catch (error) {
                console.error("Error al cargar productos:", error)
                setProducts([]) // ✅ En caso de error, establecer array vacío
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

    // ✅ Función para obtener el stock de un producto con validación
    const getProductStock = (productId: string): number => {
        // ✅ CRÍTICO: Validar que products sea un array antes de usar .find()
        if (!Array.isArray(products) || products.length === 0) return 0

        const product = products.find(p => p._id === productId)
        return product?.stock || 0
    }

    // ✅ Manejar incremento de cantidad con validación de stock
    const handleIncrement = (productId: string, currentQuantity: number) => {
        const availableStock = getProductStock(productId)

        if (currentQuantity >= availableStock) {
            alert(`No hay más stock disponible. Máximo: ${availableStock} unidades`)
            return
        }

        updateQuantity(productId, currentQuantity + 1)
    }

    // ✅ Manejar decremento de cantidad
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
                    <LinkButton href="/public/products" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all">
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
                            const availableStock = getProductStock(item.product_id)
                            const isOutOfStock = availableStock === 0
                            const isMaxReached = item.quantity >= availableStock

                            return (
                                <div key={item.product_id} className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        {/* Imagen del producto */}
                                        {item.image && (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-24 h-24 object-cover rounded-2xl"
                                            />
                                        )}

                                        {/* Info del producto */}
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                                            <p className="text-gray-600">${item.price.toFixed(2)} c/u</p>

                                            {/* Indicador de stock */}
                                            {loading ? (
                                                <p className="text-xs text-gray-400 mt-1">Verificando stock...</p>
                                            ) : (
                                                <div className="mt-1">
                                                    {isOutOfStock ? (
                                                        <p className="text-xs text-rose-600 font-semibold">⚠️ Sin stock disponible</p>
                                                    ) : isMaxReached ? (
                                                        <p className="text-xs text-amber-600 font-semibold">⚠️ Stock máximo alcanzado ({availableStock} disponibles)</p>
                                                    ) : (
                                                        <p className="text-xs text-gray-500">{availableStock} disponibles</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Controles de cantidad */}
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

                                            {/* Subtotal */}
                                            <span className="font-bold text-xl text-gray-900 w-28 text-right">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </span>

                                            {/* Botón eliminar */}
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
                                    <span className="font-semibold">${total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>Envío:</span>
                                    <span className="text-emerald-600 font-semibold">Gratis</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold text-gray-900 pt-4">
                                    <span>Total:</span>
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
                                        ${total.toFixed(2)}
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
                                href="/products"
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