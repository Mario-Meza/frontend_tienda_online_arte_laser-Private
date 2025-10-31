"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"

interface Product {
    _id: string
    name: string
    price: number
    stock: number
    category: string
    images: string[]
    main_image?: string
}

export default function HomePage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('all')
    const { addItem, items } = useCart()
    const { isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products`)
                if (response.ok) {
                    const data = await response.json()
                    setProducts(data)
                }
            } catch (error) {
                console.error("Error al cargar productos:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [])

    const handleAddToCart = (product: Product) => {
        if (!isAuthenticated) {
            router.push("/login")
            return
        }

        const existingItem = items.find(item => item.product_id === product._id)
        const currentQuantity = existingItem ? existingItem.quantity : 0

        if (currentQuantity >= product.stock) {
            alert(`No puedes agregar más de ${product.stock} unidades`)
            return
        }

        addItem({
            product_id: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.main_image || product.images?.[0],
        })
    }

    const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]
    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter(p => p.category === selectedCategory)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p>Cargando productos...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white py-20">
                <div className="container text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        Bienvenido a TiendaOnline
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 opacity-90">
                        Descubre productos únicos hechos con amor ✨
                    </p>
                </div>
            </section>

            {/* Productos */}
            <div className="container py-12">
                {/* Filtros de categoría */}
                {categories.length > 1 && (
                    <div className="mb-10 flex justify-center">
                        <div className="inline-flex gap-2 bg-white/60 backdrop-blur-sm p-2 rounded-full shadow-lg">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                                        selectedCategory === cat
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
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

                        return (
                            <div
                                key={product._id}
                                className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                            >
                                {/* Imagen */}
                                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100">
                                    <img
                                        src={product.main_image || product.images?.[0] || 'https://via.placeholder.com/400'}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />

                                    {/* Badge de stock */}
                                    {isOutOfStock && (
                                        <div className="absolute top-4 right-4 bg-rose-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm">
                                            AGOTADO
                                        </div>
                                    )}

                                    {quantityInCart > 0 && (
                                        <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-2 rounded-full shadow-lg font-bold text-sm">
                                            🛒 {quantityInCart}
                                        </div>
                                    )}
                                </div>

                                {/* Info del producto */}
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                                        {product.name}
                                    </h3>

                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
                                            ${product.price.toFixed(2)}
                                        </span>
                                        <span className="text-sm text-gray-500">MXN</span>
                                    </div>

                                    <Button
                                        onClick={() => handleAddToCart(product)}
                                        disabled={isOutOfStock || quantityInCart >= product.stock}
                                        className={`w-full py-3 rounded-2xl font-semibold transition-all ${
                                            isOutOfStock || quantityInCart >= product.stock
                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-xl'
                                        }`}
                                    >
                                        {isOutOfStock
                                            ? "🚫 Agotado"
                                            : quantityInCart >= product.stock
                                                ? "✓ Máximo alcanzado"
                                                : "🛒 Agregar al Carrito"}
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-2xl text-gray-600">
                            No hay productos en esta categoría
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

