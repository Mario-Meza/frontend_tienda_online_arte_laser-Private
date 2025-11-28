"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { API_URL } from "@/api_config"

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

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const { addItem, items } = useCart()
    const { isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${API_URL}/api/v1/products`)

                if (!response.ok) throw new Error("Error al cargar productos")
                const data = await response.json()
                setProducts(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [])

    const getProductImage = (product: Product) => {
        if (product.main_image) return product.main_image
        if (product.images && product.images.length > 0) return product.images[0]
        return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=10"
    }

    const getProductImages = (product: Product) => {
        if (product.images && product.images.length > 0) return product.images
        if (product.main_image) return [product.main_image]
        return ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=10"]
    }

    const handleImageError = (productId: string) => {
        setImageErrors((prev) => ({ ...prev, [productId]: true }))
    }

    const openProductDetails = (product: Product) => {
        setSelectedProduct(product)
        setCurrentImageIndex(0)
        document.body.style.overflow = "hidden"
    }

    const closeProductDetails = () => {
        setSelectedProduct(null)
        setCurrentImageIndex(0)
        document.body.style.overflow = "unset"
    }

    const handleAddToCart = (product: Product) => {
        if (!isAuthenticated) {
            router.push("/login")
            return
        }

        const existingItem = items.find((item) => item.product_id === product._id)
        const currentQuantityInCart = existingItem ? existingItem.quantity : 0

        if (currentQuantityInCart >= product.stock) {
            alert(`No puedes agregar más de ${product.stock} unidades de este producto.`)
            return
        }

        addItem({
            product_id: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: getProductImage(product),
        })
    }

    const categories = ["all", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]

    const filteredProducts =
        selectedCategory === "all" ? products : products.filter((p) => p.category === selectedCategory)

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-border border-t-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground font-medium">Cargando productos...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="text-destructive mb-4 text-lg font-medium">Error: {error}</div>
                    <Button onClick={() => window.location.reload()}>Reintentar</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container py-16 px-4 md:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-light mb-6 text-foreground tracking-tight text-balance">
                        Nuestros Productos
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                        Descubre piezas únicas creadas con amor y dedicación
                    </p>
                </div>

                {/* Filtros */}
                {categories.length > 1 && (
                    <div className="mb-12 flex justify-center">
                        <div className="inline-flex gap-2 flex-wrap justify-center">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                                        selectedCategory === cat
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-accent"
                                    }`}
                                >
                                    {cat === "all" ? "Todos" : cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Grid de productos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredProducts.map((product) => {
                        const itemInCart = items.find((item) => item.product_id === product._id)
                        const quantityInCart = itemInCart?.quantity || 0
                        const isOutOfStock = product.stock === 0

                        return (
                            <div key={product._id} onClick={() => openProductDetails(product)} className="group cursor-pointer">
                                {/* Imagen */}
                                <div className="relative aspect-[3/4] overflow-hidden bg-accent mb-4 rounded-lg">
                                    {imageErrors[product._id] ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-16 h-16 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                    ) : (
                                        <img
                                            src={getProductImage(product) || "/placeholder.svg"}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={() => handleImageError(product._id)}
                                        />
                                    )}

                                    {/* Overlay en hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                                    {/* Badges */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                                        {isOutOfStock && (
                                            <div className="bg-background/95 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full text-xs font-medium border border-border">
                                                Agotado
                                            </div>
                                        )}
                                        {!isOutOfStock && product.stock < 10 && (
                                            <div className="bg-accent/95 backdrop-blur-sm text-accent-foreground px-3 py-1.5 rounded-full text-xs font-medium border border-border">
                                                Solo {product.stock}
                                            </div>
                                        )}
                                    </div>

                                    {quantityInCart > 0 && (
                                        <div className="absolute top-3 left-3">
                                            <div className="bg-primary text-primary-foreground px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                                </svg>
                                                {quantityInCart}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Información del producto */}
                                <div className="space-y-2">
                                    {product.category && (
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                            {product.category}
                                        </p>
                                    )}
                                    <h3 className="text-base font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                        {product.name}
                                    </h3>
                                    <p className="text-lg font-semibold text-foreground">
                                        ${product.price.toFixed(2)} <span className="text-sm text-muted-foreground font-normal">MXN</span>
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Mensaje cuando no hay productos */}
                {filteredProducts.length === 0 && (
                    <div className="text-center py-20">
                        <div className="inline-block p-12 bg-accent rounded-lg">
                            <svg className="w-16 h-16 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                            </svg>
                            <h3 className="text-xl font-medium text-foreground mb-2">
                                {selectedCategory === "all"
                                    ? "No hay productos disponibles"
                                    : `No hay productos en "${selectedCategory}"`}
                            </h3>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de detalles del producto */}
            {selectedProduct && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={closeProductDetails}
                >
                    <div
                        className="bg-background rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                            {/* Galería de imágenes */}
                            <div className="md:w-1/2 bg-accent relative">
                                {/* Imagen principal */}
                                <div className="h-96 md:h-full flex items-center justify-center">
                                    <img
                                        src={getProductImages(selectedProduct)[currentImageIndex] || "/placeholder.svg"}
                                        alt={selectedProduct.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Miniaturas */}
                                {getProductImages(selectedProduct).length > 1 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {getProductImages(selectedProduct).map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentImageIndex(idx)}
                                                    className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                                                        currentImageIndex === idx
                                                            ? "border-white scale-105"
                                                            : "border-transparent opacity-60 hover:opacity-100"
                                                    }`}
                                                >
                                                    <img
                                                        src={img || "/placeholder.svg"}
                                                        alt={`${selectedProduct.name} ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Botón cerrar */}
                                <button
                                    onClick={closeProductDetails}
                                    className="absolute top-4 right-4 bg-background/90 hover:bg-background p-2 rounded-full shadow-lg transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Información del producto */}
                            <div className="md:w-1/2 p-8 md:p-10 overflow-y-auto">
                                {/* Categoría */}
                                {selectedProduct.category && (
                                    <span className="inline-block px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-medium uppercase tracking-wider mb-4">
                    {selectedProduct.category}
                  </span>
                                )}

                                {/* Nombre */}
                                <h2 className="text-3xl md:text-4xl font-serif font-light text-foreground mb-6 leading-tight">
                                    {selectedProduct.name}
                                </h2>

                                {/* Precio */}
                                <div className="mb-8">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-semibold text-foreground">${selectedProduct.price.toFixed(2)}</span>
                                        <span className="text-base text-muted-foreground">MXN</span>
                                    </div>
                                </div>

                                {/* Detalles */}
                                <div className="space-y-4 mb-8 pb-8 border-b border-border">
                                    {/* Stock */}
                                    <div className="flex items-center gap-3 text-sm">
                                        <svg
                                            className="w-4 h-4 text-muted-foreground"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                            />
                                        </svg>
                                        <span className="text-muted-foreground">Stock:</span>
                                        <span className="text-foreground font-medium">
                      {selectedProduct.stock > 0 ? (
                          <>{selectedProduct.stock} disponibles</>
                      ) : (
                          <span className="text-destructive">Agotado</span>
                      )}
                    </span>
                                    </div>

                                    {/* Materiales */}
                                    {selectedProduct.materials && selectedProduct.materials.length > 0 && (
                                        <div className="flex items-start gap-3 text-sm">
                                            <svg className="w-4 h-4 text-muted-foreground mt-0.5" fill="currentColor" viewBox="0 0 16 16">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M15 4.5A3.5 3.5 0 0 1 11.435 8c-.99-.019-2.093.132-2.7.913l-4.13 5.31a2.015 2.015 0 1 1-2.827-2.828l5.309-4.13c.78-.607.932-1.71.914-2.7L8 4.5a3.5 3.5 0 0 1 4.477-3.362c.325.094.39.497.15.736L10.6 3.902a.48.48 0 0 0-.033.653c.271.314.565.608.879.879a.48.48 0 0 0 .653-.033l2.027-2.027c.239-.24.642-.175.736.15.09.31.138.637.138.976ZM3.75 13a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span className="text-muted-foreground">Materiales:</span>
                                            <span className="text-foreground">{selectedProduct.materials.join(", ")}</span>
                                        </div>
                                    )}

                                    {/* Envío */}
                                    {selectedProduct.shipping_cost !== undefined && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M2.908 2.067A.978.978 0 0 0 2 3.05V8h6V3.05a.978.978 0 0 0-.908-.983 32.481 32.481 0 0 0-4.184 0ZM12.919 4.722A.98.98 0 0 0 11.968 4H10a1 1 0 0 0-1 1v6.268A2 2 0 0 1 12 13h1a.977.977 0 0 0 .985-1 31.99 31.99 0 0 0-1.066-7.278Z" />
                                                <path d="M11 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM2 12V9h6v3a1 1 0 0 1-1 1 2 2 0 1 0-4 0 1 1 0 0 1-1-1Z" />
                                                <path d="M6 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                                            </svg>
                                            <span className="text-muted-foreground">Envío:</span>
                                            <span className="text-foreground font-medium">
                        {selectedProduct.shipping_cost === 0
                            ? "Gratis"
                            : `$${selectedProduct.shipping_cost.toFixed(2)} MXN`}
                      </span>
                                        </div>
                                    )}
                                </div>

                                {/* Descripción */}
                                {selectedProduct.full_description && (
                                    <div className="mb-8">
                                        <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium mb-3">
                                            Descripción
                                        </h3>
                                        <p className="text-foreground leading-relaxed">{selectedProduct.full_description}</p>
                                    </div>
                                )}

                                {/* Botón agregar al carrito */}
                                <Button
                                    onClick={() => {
                                        handleAddToCart(selectedProduct)
                                        closeProductDetails()
                                    }}
                                    disabled={
                                        selectedProduct.stock === 0 ||
                                        (items.find((item) => item.product_id === selectedProduct._id)?.quantity || 0) >=
                                        selectedProduct.stock
                                    }
                                    className="w-full py-6 text-base font-medium"
                                >
                                    {selectedProduct.stock === 0
                                        ? "Agotado"
                                        : (items.find((item) => item.product_id === selectedProduct._id)?.quantity || 0) >=
                                        selectedProduct.stock
                                            ? "Máximo en carrito"
                                            : "Agregar al Carrito"}
                                </Button>

                                {/* Cantidad en carrito */}
                                {items.find((item) => item.product_id === selectedProduct._id) && (
                                    <div className="mt-4 p-4 bg-accent rounded-lg border border-border">
                                        <p className="text-accent-foreground text-center text-sm">
                                            Ya tienes{" "}
                                            <strong>{items.find((item) => item.product_id === selectedProduct._id)?.quantity}</strong> en tu
                                            carrito
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
