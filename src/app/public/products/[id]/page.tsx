"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth_context"
import { Button } from "@/components/ui/Button"
import { StarRating } from "@/components/ui/Stars"
import { Heart, Star, MessageSquare } from "lucide-react"

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
    shipping_cost?: number
}

interface Rating {
    _id: string
    username?: string
    product_id: string
    customer_id: string
    score: number
    comment?: string
    created_at: string
}

interface Customer {
    _id: string
    name: string
}

type NotificationType = 'success' | 'error' | 'info'

export default function ProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { addItem, items } = useCart()
    const { isAuthenticated, token } = useAuth()

    const [product, setProduct] = useState<Product | null>(null)
    const [ratings, setRatings] = useState<Rating[]>([])
    const [averageRating, setAverageRating] = useState(0)
    const [loading, setLoading] = useState(true)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isFavorite, setIsFavorite] = useState(false)
    const [notification, setNotification] = useState<{type: NotificationType, message: string} | null>(null)

    // Modal de reseña
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [reviewScore, setReviewScore] = useState(0)
    const [reviewComment, setReviewComment] = useState("")
    const [submittingReview, setSubmittingReview] = useState(false)

    const showNotification = (type: NotificationType, message: string) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 5000)
    }

    // Cargar producto
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${params.id}`
                )
                if (!response.ok) throw new Error("Producto no encontrado")
                const data = await response.json()
                setProduct(data)
            } catch (err) {
                showNotification('error', 'Error al cargar el producto')
                router.push('/products')
            } finally {
                setLoading(false)
            }
        }
        fetchProduct()
    }, [params.id])

    // Cargar ratings y calcular promedio
    useEffect(() => {
        const fetchRatings = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/rating?product_id=${params.id}`
                )
                if (response.ok) {
                    const data = await response.json()
                    setRatings(data)

                    // Obtener nombres de los usuarios que dejaron reseña
                    const ratingsWithNames = await Promise.all(
                        data.map(async (r: Rating) => {
                            try {
                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/customers/public/${r.customer_id}`)
                                if (res.ok) {
                                    const customer: Customer = await res.json()
                                    return { ...r, username: customer.name } // agregamos el nombre al rating
                                }
                            } catch (error) {
                                console.error("Error al obtener nombre de cliente:", error)
                            }
                            return r
                        })
                    )

                    setRatings(ratingsWithNames)



                    if (data.length > 0) {
                        const avg = data.reduce((sum: number, r: Rating) => sum + r.score, 0) / data.length
                        setAverageRating(avg)
                    }
                }
            } catch (err) {
                console.error("Error al cargar ratings:", err)
            }
        }
        fetchRatings()
    }, [params.id])

    // Verificar si es favorito
    useEffect(() => {
        if (!isAuthenticated || !token) return

        const checkFavorite = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/favorites`,
                    { headers: { "Authorization": `Bearer ${token}` } }
                )
                if (response.ok) {
                    const data = await response.json()
                    setIsFavorite(data.some((fav: any) => fav.product_id === params.id))
                }
            } catch (err) {
                console.error("Error al verificar favorito:", err)
            }
        }
        checkFavorite()
    }, [isAuthenticated, token, params.id])

    const toggleFavorite = async () => {
        if (!isAuthenticated || !token) {
            showNotification('info', '🔐 Debes iniciar sesión para agregar favoritos')
            router.push("/login")
            return
        }

        try {
            if (isFavorite) {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/favorites/product/${params.id}`,
                    {
                        method: "DELETE",
                        headers: { "Authorization": `Bearer ${token}` }
                    }
                )
                if (response.ok || response.status === 204) {
                    setIsFavorite(false)
                    showNotification('success', '💔 Eliminado de favoritos')
                }
            } else {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/favorites`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ product_id: params.id })
                    }
                )
                if (response.ok) {
                    setIsFavorite(true)
                    showNotification('success', '❤️ Agregado a favoritos')
                }
            }
        } catch (err) {
            showNotification('error', '❌ Error de conexión')
        }
    }

    const handleAddToCart = () => {
        if (!product) return
        if (!isAuthenticated) {
            router.push("/login")
            return
        }

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
        showNotification('success', '¡Producto agregado al carrito!')
    }

    // Calcular cantidad en carrito en tiempo real
    const quantityInCart = items.find(item => item.product_id === product?._id)?.quantity || 0

    const handleSubmitReview = async () => {
        if (!isAuthenticated || !token) {
            showNotification('info', '🔐 Debes iniciar sesión para calificar')
            router.push("/login")
            return
        }

        if (reviewScore === 0) {
            showNotification('error', 'Debes seleccionar una calificación')
            return
        }

        setSubmittingReview(true)

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/rating`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        product_id: params.id,
                        score: reviewScore,
                        comment: reviewComment.trim() || undefined
                    })
                }
            )

            if (response.status === 403) {
                showNotification('error', '🛒 Solo puedes calificar productos que hayas comprado y recibido')
            } else if (response.status === 409) {
                showNotification('info', 'ℹ️ Ya has calificado este producto')
            } else if (response.ok) {
                showNotification('success', '✅ ¡Gracias por tu reseña!')
                setShowReviewModal(false)
                setReviewScore(0)
                setReviewComment("")

                // Recargar ratings
                const ratingsResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/rating?product_id=${params.id}`
                )
                if (ratingsResponse.ok) {
                    const data = await ratingsResponse.json()
                    setRatings(data)
                    if (data.length > 0) {
                        const avg = data.reduce((sum: number, r: Rating) => sum + r.score, 0) / data.length
                        setAverageRating(avg)
                    }
                }
            } else {
                showNotification('error', '❌ Error al guardar la reseña')
            }
        } catch (err) {
            showNotification('error', '❌ Error de conexión')
        } finally {
            setSubmittingReview(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600"></div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-2xl text-gray-800 mb-4">Producto no encontrado</p>
                    <Button onClick={() => router.push('/products')}>Volver a productos</Button>
                </div>
            </div>
        )
    }

    const productImages = product.images?.length > 0 ? product.images :
        product.main_image ? [product.main_image] :
            ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=10']

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
            {/* Breadcrumb */}
            <div className="container py-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <button onClick={() => router.push('/products')} className="hover:text-amber-600">
                        Productos
                    </button>
                    <span>/</span>
                    <span className="text-gray-900">{product.name}</span>
                </div>
            </div>

            <div className="container pb-12">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-8 p-8">
                        {/* Galería de imágenes */}
                        <div>
                            <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden mb-4">
                                <img
                                    src={productImages[currentImageIndex]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={toggleFavorite}
                                    className="absolute top-4 right-4 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
                                >
                                    <Heart
                                        className={`w-7 h-7 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`}
                                    />
                                </button>
                            </div>

                            {productImages.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {productImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                                currentImageIndex === idx
                                                    ? 'border-amber-500 scale-110'
                                                    : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Información del producto */}
                        <div className="flex flex-col">
                            {product.category && (
                                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold uppercase tracking-wide mb-4 self-start">
                                    {product.category}
                                </span>
                            )}

                            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                {product.name}
                            </h1>

                            {/* Rating promedio */}
                            <div className="flex items-center gap-3 mb-6">
                                <StarRating value={averageRating} />
                                <span className="text-gray-600">
                                    ({ratings.length} {ratings.length === 1 ? 'reseña' : 'reseñas'})
                                </span>
                            </div>

                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
                                    ${product.price.toFixed(2)}
                                </span>
                                <span className="text-xl text-gray-500">MXN</span>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <span className="text-gray-700">
                                        {product.stock > 0 ? (
                                            <span><strong>{product.stock}</strong> disponibles</span>
                                        ) : (
                                            <span className="text-rose-600 font-semibold">Agotado</span>
                                        )}
                                    </span>
                                </div>

                                {product.materials && (
                                    <div className="flex items-center gap-3">
                                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5 text-gray-500">
                                            <path fillRule="evenodd" d="M15 4.5A3.5 3.5 0 0 1 11.435 8c-.99-.019-2.093.132-2.7.913l-4.13 5.31a2.015 2.015 0 1 1-2.827-2.828l5.309-4.13c.78-.607.932-1.71.914-2.7L8 4.5a3.5 3.5 0 0 1 4.477-3.362c.325.094.39.497.15.736L10.6 3.902a.48.48 0 0 0-.033.653c.271.314.565.608.879.879a.48.48 0 0 0 .653-.033l2.027-2.027c.239-.24.642-.175.736.15.09.31.138.637.138.976ZM3.75 13a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-gray-700">{product.materials.join(", ")}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5 text-gray-500">
                                        <path d="M2.908 2.067A.978.978 0 0 0 2 3.05V8h6V3.05a.978.978 0 0 0-.908-.983 32.481 32.481 0 0 0-4.184 0ZM12.919 4.722A.98.98 0 0 0 11.968 4H10a1 1 0 0 0-1 1v6.268A2 2 0 0 1 12 13h1a.977.977 0 0 0 .985-1 31.99 31.99 0 0 0-1.066-7.278Z" />
                                    </svg>
                                    <span className="text-gray-700">
                                        Envío: ${product.shipping_cost?.toFixed(2) || 'Gratis'}
                                    </span>
                                </div>
                            </div>

                            {product.full_description && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Descripción</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {product.full_description}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 mt-auto">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    className={`flex-1 py-4 rounded-2xl font-semibold text-lg ${
                                        product.stock === 0
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg hover:shadow-xl'
                                    }`}
                                >
                                    {product.stock === 0 ? "🚫 Agotado" : "🛒 Agregar al Carrito"}
                                </Button>

                                <button
                                    onClick={() => setShowReviewModal(true)}
                                    className="px-6 py-4 rounded-2xl font-semibold bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50 transition-all flex items-center gap-2"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    Escribir reseña
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sección de reseñas */}
                    <div className="border-t border-gray-200 p-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">
                            Reseñas de clientes
                        </h2>

                        {ratings.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl">
                                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">Aún no hay reseñas para este producto</p>
                                <p className="text-gray-400 text-sm mt-2">¡Sé el primero en compartir tu opinión!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {ratings.map((rating) => (
                                    <div key={rating._id} className="bg-gray-50 rounded-2xl p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <StarRating value={rating.score} />
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(rating.created_at).toLocaleDateString('es-MX')}
                                                    </span>
                                                </div>
                                                {rating.username && (
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {rating.username}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {rating.comment && (
                                            <p className="text-gray-700 leading-relaxed">
                                                {rating.comment}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de reseña */}
            {showReviewModal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowReviewModal(false)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-md w-full p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Escribe tu reseña</h3>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Calificación
                            </label>
                            <div className="flex gap-2 justify-center">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setReviewScore(star)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-10 h-10 ${
                                                star <= reviewScore
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comentario (opcional)
                            </label>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                maxLength={300}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"
                                placeholder="Comparte tu experiencia con este producto..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {reviewComment.length}/300 caracteres
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="flex-1 px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                disabled={submittingReview || reviewScore === 0}
                                className={`flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all ${
                                    submittingReview || reviewScore === 0
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg'
                                }`}
                            >
                                {submittingReview ? 'Enviando...' : 'Enviar reseña'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
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