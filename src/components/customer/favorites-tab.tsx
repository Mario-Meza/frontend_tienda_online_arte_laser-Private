"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"
import { Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { StarRating } from "@/components/ui/Stars"

interface Product {
    _id: string
    name: string
    price: number
    stock: number
    category: string
    images: string[]
    main_image?: string
    materials?: string[]
    full_description?: string
}

interface Favorite {
    _id: string
    user_id: string
    product_id: string
    created_at: string
}

type NotificationType = 'success' | 'error' | 'info'

export function FavoritesTab() {
    const [favorites, setFavorites] = useState<Favorite[]>([])
    const [products, setProducts] = useState<Record<string, Product>>({})
    const [ratings, setRatings] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [notification, setNotification] = useState<{type: NotificationType, message: string} | null>(null)

    const { token } = useAuth()
    const { addItem, items } = useCart()
    const router = useRouter()

    const showNotification = (type: NotificationType, message: string) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 5000)
    }

    // Cargar favoritos
    useEffect(() => {
        const fetchFavorites = async () => {
            setLoading(true)
            setError(null)
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/favorites`,
                    {
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    }
                )

                if (!response.ok) throw new Error("Error al cargar favoritos")
                const data = await response.json()
                setFavorites(data)

                // Cargar información de productos
                if (data.length > 0) {
                    const productPromises = data.map((fav: Favorite) =>
                        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${fav.product_id}`)
                            .then(res => res.ok ? res.json() : null)
                            .catch(err => {
                                console.error(`Error cargando producto ${fav.product_id}:`, err)
                                return null
                            })
                    )

                    const productsData = await Promise.all(productPromises)
                    const productsMap: Record<string, Product> = {}
                    productsData.forEach(product => {
                        if (product) {
                            productsMap[product._id] = product
                        }
                    })
                    setProducts(productsMap)
                }

            } catch (err) {
                console.error("Error en fetchFavorites:", err)
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        if (token) {
            fetchFavorites()
        }
    }, [token])

    // Cargar ratings
    useEffect(() => {
        const fetchRatings = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/rating`)
                if (!response.ok) return

                const data = await response.json()
                const grouped: Record<string, number[]> = {}

                data.forEach((r: any) => {
                    if (!grouped[r.product_id]) grouped[r.product_id] = []
                    grouped[r.product_id].push(r.score)
                })

                const avg: Record<string, number> = {}
                for (const [productId, vals] of Object.entries(grouped)) {
                    avg[productId] = vals.reduce((a, b) => a + b, 0) / vals.length
                }
                setRatings(avg)
            } catch (err) {
                console.error("Error cargando ratings:", err)
            }
        }
        fetchRatings()
    }, [])

    const removeFavorite = async (productId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setRemovingId(productId)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/favorites/product/${productId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            )

            if (response.ok || response.status === 204) {
                setFavorites(prev => prev.filter(fav => fav.product_id !== productId))
                showNotification('success', '💔 Eliminado de favoritos')
            } else {
                showNotification('error', '❌ Error al eliminar favorito')
            }
        } catch (err) {
            console.error("Error en removeFavorite:", err)
            showNotification('error', '❌ Error de conexión')
        } finally {
            setRemovingId(null)
        }
    }

    const handleAddToCart = (product: Product, e: React.MouseEvent) => {
        e.stopPropagation()

        const existingItem = items.find(item => item.product_id === product._id)
        const currentQuantityInCart = existingItem ? existingItem.quantity : 0

        if (currentQuantityInCart >= product.stock) {
            showNotification('error', `No puedes agregar más de ${product.stock} unidades`)
            return
        }

        addItem({
            product_id: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.main_image || product.images[0] || '',
        })
        showNotification('success', '🛒 ¡Agregado al carrito!')
    }

    const getProductImage = (product: Product) => {
        if (product.main_image) return product.main_image
        if (product.images && product.images.length > 0) return product.images[0]
        return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=10'
    }

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600 mx-auto mb-4"></div>
                    <p className="text-amber-800 font-medium">Cargando favoritos...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-rose-600 mb-4 text-lg font-medium">Error: {error}</div>
                    <Button onClick={() => window.location.reload()}>Reintentar</Button>
                </div>
            </div>
        )
    }

    if (favorites.length === 0) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="bg-white rounded-3xl p-12 shadow-xl">
                        <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">
                            No tienes favoritos
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Explora nuestros productos y guarda tus favoritos para verlos aquí
                        </p>
                        <button
                            onClick={() => router.push('/public/products')}
                            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold hover:shadow-lg transition-all"
                        >
                            Explorar Productos
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-700 via-orange-600 to-rose-600">
                        Mis Favoritos
                    </h2>
                    <p className="text-amber-800/70 mt-1">
                        {favorites.length} {favorites.length === 1 ? 'producto guardado' : 'productos guardados'}
                    </p>
                </div>
            </div>

            {/* Grid de productos favoritos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favorites.map((favorite) => {
                    const product = products[favorite.product_id]

                    // Si el producto no se cargó, mostrar placeholder
                    if (!product) {
                        return (
                            <div key={favorite._id} className="bg-white rounded-3xl p-6 shadow-lg text-center">
                                <p className="text-gray-500 text-sm mb-4">Producto no disponible</p>
                                <button
                                    onClick={(e) => removeFavorite(favorite.product_id, e)}
                                    className="px-4 py-2 bg-rose-100 text-rose-600 rounded-lg text-sm font-semibold hover:bg-rose-200 transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        )
                    }

                    const quantityInCart = items.find(item => item.product_id === product._id)?.quantity || 0
                    const isOutOfStock = product.stock === 0
                    const isRemoving = removingId === product._id

                    return (
                        <div
                            key={favorite._id}
                            onClick={() => router.push(`/public/products/${product._id}`)}
                            className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer"
                        >
                            {/* Imagen del producto */}
                            <div className="relative aspect-square overflow-hidden bg-gradient-to-br">
                                <img
                                    src={getProductImage(product)}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />

                                {/* Botón eliminar favorito */}
                                <button
                                    onClick={(e) => removeFavorite(product._id, e)}
                                    disabled={isRemoving}
                                    className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all z-10"
                                >
                                    {isRemoving ? (
                                        <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
                                    )}
                                </button>

                                {/* Precio */}
                                <div className="absolute bottom-4 left-4">
                                    <div className="bg-white/95 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-xl border-2 border-amber-200">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
                                                ${product.price.toFixed(2)}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium">MXN</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Badge agotado */}
                                {isOutOfStock && (
                                    <div className="absolute top-4 left-4">
                                        <div className="bg-rose-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm">
                                            AGOTADO
                                        </div>
                                    </div>
                                )}

                                {/* Cantidad en carrito */}
                                {quantityInCart > 0 && !isOutOfStock && (
                                    <div className="absolute top-4 left-4">
                                        <div className="bg-emerald-500 text-white px-3 py-2 rounded-full shadow-lg font-bold text-sm flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                            </svg>
                                            {quantityInCart}
                                        </div>
                                    </div>
                                )}

                                {/* Overlay hover */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white px-6 py-3 rounded-full shadow-xl">
                                        <span className="text-amber-700 font-bold">Ver Detalles</span>
                                    </div>
                                </div>
                            </div>

                            {/* Info del producto */}
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-gray-800 line-clamp-2 text-center mb-2">
                                    {product.name}
                                </h3>

                                <StarRating value={ratings[product._id] || 0} />

                                {product.category && (
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        {product.category}
                                    </p>
                                )}

                                {/* Botón agregar al carrito */}
                                <button
                                    onClick={(e) => handleAddToCart(product, e)}
                                    disabled={isOutOfStock || quantityInCart >= product.stock}
                                    className={`w-full mt-3 py-2 rounded-xl font-semibold text-sm transition-all ${
                                        isOutOfStock || quantityInCart >= product.stock
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:scale-105'
                                    }`}
                                >
                                    {isOutOfStock
                                        ? '🚫 Agotado'
                                        : quantityInCart >= product.stock
                                            ? '✓ Máximo en carrito'
                                            : '🛒 Agregar al Carrito'}
                                </button>

                                {/* Fecha agregado */}
                                <p className="text-xs text-gray-400 text-center mt-3">
                                    Agregado el {new Date(favorite.created_at).toLocaleDateString('es-MX')}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Notificación Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-2xl shadow-2xl transition-all duration-300 ${
                    notification.type === 'success' ? 'bg-emerald-500' :
                        notification.type === 'error' ? 'bg-rose-500' :
                            'bg-blue-500'
                } text-white animate-slide-in`}>
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            {notification.type === 'success' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {notification.type === 'error' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            {notification.type === 'info' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm leading-relaxed">{notification.message}</p>
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            className="flex-shrink-0 hover:bg-white/20 rounded-full p-1 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </div>
    )
}