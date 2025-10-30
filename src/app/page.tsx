"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { StarRating } from "@/components/ui/Stars"
import { Heart, Star } from "lucide-react"


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
    created_at?: string
    updated_at?: string
}

type NotificationType = 'success' | 'error' | 'info'

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const { addItem, items } = useCart()
    const { isAuthenticated, user, token } = useAuth()
    const router = useRouter()
    const [ratings, setRatings] = useState<Record<string, number>>({})
    const [favorites, setFavorites] = useState<Set<string>>(new Set())
    const [userRatings, setUserRatings] = useState<Record<string, number>>({})
    const [notification, setNotification] = useState<{type: NotificationType, message: string} | null>(null)

    // Función para mostrar notificaciones
    const showNotification = (type: NotificationType, message: string) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 5000)
    }

    // Cargar ratings
    useEffect(() => {
        const fetchRatings = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/rating`)
                if (!response.ok) throw new Error("Error al cargar ratings")
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


    // ✅ Cargar favorites del usuario autenticado
    useEffect(() => {
        if (!isAuthenticated || !token) return

        const fetchFavorites = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/favorites`,
                    {
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    }
                )

                if (response.ok) {
                    const data = await response.json()
                    const favProductIds = new Set(data.map((fav: any) => fav.product_id))
                    setFavorites(favProductIds)
                }
            } catch (error) {
                console.error("Error al cargar favoritos:", error)
            }
        }

        fetchFavorites()
    }, [isAuthenticated, token])


    // Cargar productos
    useEffect(() => {
        const controller = new AbortController()

        const fetchProducts = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/all`,
                    { signal: controller.signal }
                )

                if (!response.ok) throw new Error("Error al cargar productos")
                const data = await response.json()
                setProducts(Array.isArray(data) ? data : [])
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    setError(err instanceof Error ? err.message : "Error desconocido")
                }
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
        return () => controller.abort()
    }, [])


    // ✅ Toggle favorito (agregar o eliminar)
    const toggleFavorite = async (productId: string, e: React.MouseEvent) => {
        e.stopPropagation()

        if (!isAuthenticated || !token) {
            showNotification('info', '🔐 Debes iniciar sesión para agregar favoritos')
            router.push("/login")
            return
        }

        const isFavorite = favorites.has(productId)

        try {
            if (isFavorite) {
                // ✅ ELIMINAR favorito
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
                    setFavorites(prev => {
                        const newSet = new Set(prev)
                        newSet.delete(productId)
                        return newSet
                    })
                    showNotification('success', '💔 Eliminado de favoritos')
                }
            } else {
                // ✅ AGREGAR favorito
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/favorites`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            product_id: productId
                        })
                    }
                )

                if (response.ok) {
                    setFavorites(prev => new Set(prev).add(productId))
                    showNotification('success', '❤️ Agregado a favoritos')
                } else if (response.status === 409) {
                    showNotification('info', 'Este producto ya está en favoritos')
                } else if (response.status === 404) {
                    showNotification('error', 'Producto no encontrado')
                }
            }
        } catch (error) {
            console.error("Error al actualizar favorito:", error)
            showNotification('error', '❌ Error de conexión')
        }
    }

    const getProductImage = (product: Product) => {
        if (product.main_image) return product.main_image
        if (product.images && product.images.length > 0) return product.images[0]
        return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=10'
    }

    const getProductImages = (product: Product) => {
        if (product.images && product.images.length > 0) return product.images
        if (product.main_image) return [product.main_image]
        return ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=10']
    }

    const handleImageError = (productId: string) => {
        setImageErrors(prev => ({ ...prev, [productId]: true }))
    }

    const openProductDetails = (product: Product) => {
        setSelectedProduct(product)
        setCurrentImageIndex(0)
        document.body.style.overflow = 'hidden'
    }

    const closeProductDetails = () => {
        setSelectedProduct(null)
        setCurrentImageIndex(0)
        document.body.style.overflow = 'unset'
    }

    const handleAddToCart = (product: Product) => {
        if (!isAuthenticated) {
            router.push("/login")
            return
        }

        const existingItem = items.find(item => item.product_id === product._id)
        const currentQuantityInCart = existingItem ? existingItem.quantity : 0

        if (currentQuantityInCart >= product.stock) {
            showNotification('error', `No puedes agregar más de ${product.stock} unidades de este producto`)
            return
        }

        addItem({
            product_id: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: getProductImage(product),
        })
        showNotification('success', '¡Producto agregado al carrito!')
    }

    const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]

    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesCategory && matchesSearch
    })

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600 mx-auto mb-4"></div>
                    <p className="text-amber-800 font-medium">Cargando productos...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-rose-600 mb-4 text-lg font-medium">Error: {error}</div>
                    <Button onClick={() => window.location.reload()}>Reintentar</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
            <div className="container py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-700 via-orange-600 to-rose-600">
                        Nuestros Productos
                    </h1>
                    <p className="text-lg text-amber-800/70 max-w-2xl mx-auto">
                        Descubre piezas únicas creadas con amor y dedicación
                    </p>
                </div>

                {/* Barra de búsqueda */}
                <div className="flex justify-center mb-8">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar producto..."
                        className="w-full max-w-md px-5 py-3 rounded-full shadow-md border border-amber-200 focus:ring-2 focus:ring-amber-400 focus:outline-none text-amber-900 placeholder:text-gray-400 bg-white/80 backdrop-blur-sm"
                    />
                </div>

                {/* Filtros */}
                {categories.length > 1 && (
                    <div className="mb-10 flex justify-center">
                        <div className="inline-flex gap-2 bg-white/60 backdrop-blur-sm p-2 rounded-full shadow-lg">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                                        selectedCategory === cat
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md transform scale-105'
                                            : 'text-amber-800 hover:bg-white/80'
                                    }`}
                                >
                                    {cat === 'all' ? '✨ Todos' : cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Grid de productos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => {
                        const itemInCart = items.find(item => item.product_id === product._id)
                        const quantityInCart = itemInCart?.quantity || 0
                        const isOutOfStock = product.stock === 0
                        const isFavorite = favorites.has(product._id)

                        return (
                            <div
                                key={product._id}
                                onClick={() => openProductDetails(product)}
                                className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer"
                            >
                                <div className="relative aspect-square overflow-hidden bg-gradient-to-br">
                                    {imageErrors[product._id] ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-24 h-24 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <img
                                            src={getProductImage(product)}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            onError={() => handleImageError(product._id)}
                                        />
                                    )}
                                    {/* ✅ Botón de favorito */}
                                    <button
                                        onClick={(e) => toggleFavorite(product._id, e)}
                                        className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all z-10"
                                    >
                                        <Heart
                                            className={`w-6 h-6 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`}
                                        />
                                    </button>

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

                                    {isOutOfStock && (
                                        <div className="absolute top-4 right-4">
                                            <div className="bg-rose-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm">
                                                AGOTADO
                                            </div>
                                        </div>
                                    )}



                                    {quantityInCart > 0 && (
                                        <div className="absolute top-4 left-4">
                                            <div className="bg-emerald-500 text-white px-3 py-2 rounded-full shadow-lg font-bold text-sm flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                                </svg>
                                                {quantityInCart}
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white px-6 py-3 rounded-full shadow-xl">
                                            <span className="text-amber-700 font-bold">Ver Detalles</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 text-center">
                                    <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                                        {product.name}
                                    </h3>
                                    <StarRating value={ratings[product._id] || 0} />
                                </div>
                            </div>
                        )
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-20">
                        <div className="inline-block p-8 bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl">
                            <svg className="w-24 h-24 text-amber-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                {selectedCategory === 'all'
                                    ? 'No hay productos disponibles'
                                    : `No hay productos en "${selectedCategory}"`}
                            </h3>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de detalles del producto */}
            {selectedProduct && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={closeProductDetails}
                >
                    <div
                        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                            <div className="md:w-1/2 bg-gray-100 relative">
                                <div className="h-96 md:h-full flex items-center justify-center bg-gradient-to-br">
                                    <img
                                        src={getProductImages(selectedProduct)[currentImageIndex]}
                                        alt={selectedProduct.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {getProductImages(selectedProduct).length > 1 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                            {getProductImages(selectedProduct).map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentImageIndex(idx)}
                                                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                                        currentImageIndex === idx
                                                            ? 'border-white scale-110'
                                                            : 'border-transparent opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`${selectedProduct.name} ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={closeProductDetails}
                                    className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="md:w-1/2 p-8 overflow-y-auto">
                                {selectedProduct.category && (
                                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold uppercase tracking-wide mb-4">
                                        {selectedProduct.category}
                                    </span>
                                )}

                                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                    {selectedProduct.name}
                                </h2>
                                {/* ✅ Botón de favorito */}


                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
                                            ${selectedProduct.price.toFixed(2)}
                                        </span>
                                        <span className="text-lg text-gray-500">MXN</span>
                                    </div>
                                </div>

                                <div className="mb-6 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <span className="text-gray-700">
                                        {selectedProduct.stock > 0 ? (
                                            <span><strong>{selectedProduct.stock}</strong> disponibles</span>
                                        ) : (
                                            <span className="text-rose-600 font-semibold">Agotado</span>
                                        )}
                                    </span>
                                </div>

                                <div className="mb-5 flex items-center gap-3">
                                    <svg viewBox="0 0 16 16" fill="currentColor" className="size-4 text-gray-500">
                                        <path fillRule="evenodd" d="M15 4.5A3.5 3.5 0 0 1 11.435 8c-.99-.019-2.093.132-2.7.913l-4.13 5.31a2.015 2.015 0 1 1-2.827-2.828l5.309-4.13c.78-.607.932-1.71.914-2.7L8 4.5a3.5 3.5 0 0 1 4.477-3.362c.325.094.39.497.15.736L10.6 3.902a.48.48 0 0 0-.033.653c.271.314.565.608.879.879a.48.48 0 0 0 .653-.033l2.027-2.027c.239-.24.642-.175.736.15.09.31.138.637.138.976ZM3.75 13a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
                                        <path d="M11.5 9.5c.313 0 .62-.029.917-.084l1.962 1.962a2.121 2.121 0 0 1-3 3l-2.81-2.81 1.35-1.734c.05-.064.158-.158.426-.233.278-.078.639-.11 1.062-.102l.093.001ZM5 4l1.446 1.445a2.256 2.256 0 0 1-.047.21c-.075.268-.169.377-.233.427l-.61.474L4 5H2.655a.25.25 0 0 1-.224-.139l-1.35-2.7a.25.25 0 0 1 .047-.289l.745-.745a.25.25 0 0 1 .289-.047l2.7 1.35A.25.25 0 0 1 5 2.654V4Z" />
                                    </svg>
                                    <span className="text-sm text-gray-500">Materiales:</span>
                                    <span className="text-gray-700">
                                        {selectedProduct.materials?.join(", ") || "No disponibles"}
                                    </span>
                                </div>

                                <div className="mb-5 flex items-center gap-3">
                                    <svg viewBox="0 0 16 16" fill="currentColor" className="size-4 text-gray-500">
                                        <path d="M2.908 2.067A.978.978 0 0 0 2 3.05V8h6V3.05a.978.978 0 0 0-.908-.983 32.481 32.481 0 0 0-4.184 0ZM12.919 4.722A.98.98 0 0 0 11.968 4H10a1 1 0 0 0-1 1v6.268A2 2 0 0 1 12 13h1a.977.977 0 0 0 .985-1 31.99 31.99 0 0 0-1.066-7.278Z" />
                                        <path d="M11 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM2 12V9h6v3a1 1 0 0 1-1 1 2 2 0 1 0-4 0 1 1 0 0 1-1-1Z" />
                                        <path d="M6 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                                    </svg>
                                    <span className="text-sm text-gray-500">Envío:</span>
                                    <span className="text-gray-700">
                                        ${selectedProduct.shipping_cost || "Envio gratis"}
                                    </span>
                                </div>

                                {selectedProduct.full_description && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Descripción</h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            {selectedProduct.full_description}
                                        </p>
                                    </div>
                                )}

                                {/* Calificación del usuario */}
                                <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Tu calificación</h3>
                                    <div className="flex gap-2 justify-center">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={async () => {
                                                    if (!isAuthenticated) {
                                                        showNotification('info', '🔐 Debes iniciar sesión para calificar productos')
                                                        router.push("/login")
                                                        return
                                                    }

                                                    try {
                                                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/rating`, {
                                                            method: "POST",
                                                            headers: {
                                                                "Content-Type": "application/json",
                                                                "Authorization": `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({
                                                                product_id: selectedProduct._id,
                                                                score: star,
                                                                comment: "Calificación desde frontend"
                                                            })
                                                        })

                                                        if (response.status === 403) {
                                                            showNotification('error', '🛒 Solo puedes calificar productos que hayas comprado y recibido')
                                                            return
                                                        }

                                                        if (response.status === 409) {
                                                            showNotification('info', 'ℹ️ Ya has calificado este producto anteriormente')
                                                            return
                                                        }

                                                        if (response.status === 404) {
                                                            showNotification('error', '❌ Producto no encontrado')
                                                            return
                                                        }

                                                        if (response.status === 401) {
                                                            showNotification('error', '🔐 Tu sesión ha expirado. Inicia sesión nuevamente')
                                                            router.push("/login")
                                                            return
                                                        }

                                                        if (!response.ok) {
                                                            const errorData = await response.json().catch(() => ({}))
                                                            console.error("Error del servidor:", errorData)
                                                            showNotification('error', '❌ Error al guardar la calificación')
                                                            return
                                                        }

                                                        setUserRatings(prev => ({ ...prev, [selectedProduct._id]: star }))
                                                        showNotification('success', `✅ ¡Gracias por tu calificación de ${star} ${star === 1 ? 'estrella' : 'estrellas'}!`)

                                                    } catch (err) {
                                                        console.error("Error:", err)
                                                        showNotification('error', '❌ Error de conexión. Verifica tu internet')
                                                    }
                                                }}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill={star <= (userRatings[selectedProduct._id] || 0) ? "gold" : "none"}
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="gold"
                                                    className="w-8 h-8 transition-transform hover:scale-110 cursor-pointer"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499l2.264 4.587 5.065.736-3.664 3.572.865 5.04L11.48 14.9l-4.53 2.375.865-5.04-3.664-3.572 5.065-.736 2.264-4.587z" />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        Haz clic en las estrellas para calificar
                                    </p>
                                </div>

                                {/* Botón agregar al carrito */}
                                <Button
                                    onClick={() => {
                                        handleAddToCart(selectedProduct)
                                        closeProductDetails()
                                    }}
                                    disabled={
                                        selectedProduct.stock === 0 ||
                                        (items.find(item => item.product_id === selectedProduct._id)?.quantity || 0) >= selectedProduct.stock
                                    }
                                    className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                                        selectedProduct.stock === 0 ||
                                        (items.find(item => item.product_id === selectedProduct._id)?.quantity || 0) >= selectedProduct.stock
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                    }`}
                                >
                                    {selectedProduct.stock === 0
                                        ? "🚫 Agotado"
                                        : (items.find(item => item.product_id === selectedProduct._id)?.quantity || 0) >= selectedProduct.stock
                                            ? "✓ Máximo en carrito"
                                            : "🛒 Agregar al Carrito"}
                                </Button>

                                {items.find(item => item.product_id === selectedProduct._id) && (
                                    <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                                        <p className="text-emerald-700 text-center font-medium">
                                            ✓ Ya tienes <strong>{items.find(item => item.product_id === selectedProduct._id)?.quantity}</strong> en tu carrito
                                        </p>
                                    </div>
                                )}
                            </div>
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