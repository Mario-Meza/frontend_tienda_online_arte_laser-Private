"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth_context"
import { Button } from "@/components/ui/Button"

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

interface NewProduct {
    name: string
    price: number
    stock: number
    category: string
    images: string[]
    main_image?: string
    materials: string[]
    full_description?: string
    shipping_cost?: number
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [creating, setCreating] = useState(false)
    const [uploadingImages, setUploadingImages] = useState(false)

    const { token, isAuthenticated, isAdmin, user } = useAuth()
    const router = useRouter()

    // Form state
    const [newProduct, setNewProduct] = useState<NewProduct>({
        name: "",
        price: 0,
        stock: 0,
        category: "",
        images: [],
        main_image: "",
        materials: [],
        full_description: "",
        shipping_cost: 0
    })

    const [materialInput, setMaterialInput] = useState("")

    // Verificar autenticación y permisos de admin
    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login")
            return
        }

        if (!isAdmin) {
            alert("⚠️ No tienes permisos de administrador")
            router.push("/")
            return
        }
    }, [isAuthenticated, isAdmin, router])

    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            fetchProducts()
        }
    }, [isAuthenticated, isAdmin])

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/all`)
            if (!response.ok) throw new Error("Error al cargar productos")
            const data = await response.json()
            setProducts(Array.isArray(data) ? data : [])
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido")
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        if (!token) {
            alert("No estás autenticado. Por favor inicia sesión.")
            router.push("/login")
            return
        }

        // Validar que no exceda el límite de 5 imágenes
        if (newProduct.images.length + files.length > 5) {
            alert(`Solo puedes subir un máximo de 5 imágenes. Ya tienes ${newProduct.images.length}`)
            return
        }

        try {
            setUploadingImages(true)
            const formData = new FormData()

            // Agregar todas las imágenes al FormData
            Array.from(files).forEach(file => {
                formData.append('files', file)
            })

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/upload/images`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error?.message || "Error al subir imágenes")
            }

            const result = await response.json()

            // Agregar las URLs de las imágenes subidas
            const uploadedUrls = result.images.map((img: any) => img.url)
            const updatedImages = [...newProduct.images, ...uploadedUrls]

            setNewProduct({
                ...newProduct,
                images: updatedImages,
                main_image: newProduct.images.length === 0 ? uploadedUrls[0] : newProduct.main_image
            })

            if (result.errors && result.errors.length > 0) {
                alert(`Algunas imágenes fallaron:\n${result.errors.join('\n')}`)
            } else {
                alert(`✅ ${result.count} imagen(es) subida(s) correctamente`)
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "Error al subir imágenes")
        } finally {
            setUploadingImages(false)
        }
    }

    const handleCreateProduct = async () => {
        try {
            setCreating(true)

            // Validaciones básicas
            if (!newProduct.name || newProduct.price <= 0 || newProduct.stock < 0) {
                alert("Por favor completa todos los campos requeridos correctamente")
                return
            }

            if (newProduct.images.length === 0) {
                alert("Debes subir al menos una imagen del producto")
                return
            }

            if (!token) {
                alert("No estás autenticado. Por favor inicia sesión.")
                router.push("/login")
                return
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(newProduct)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "Error al crear producto")
            }

            const createdProduct = await response.json()
            setProducts([createdProduct, ...products])
            setShowCreateModal(false)
            resetForm()
            alert("✅ Producto creado exitosamente")
        } catch (err) {
            alert(err instanceof Error ? err.message : "Error al crear producto")
        } finally {
            setCreating(false)
        }
    }

    const resetForm = () => {
        setNewProduct({
            name: "",
            price: 0,
            stock: 0,
            category: "",
            images: [],
            main_image: "",
            materials: [],
            full_description: "",
            shipping_cost: 0
        })
        setMaterialInput("")
    }

    const removeImage = (index: number) => {
        const updatedImages = newProduct.images.filter((_, i) => i !== index)
        setNewProduct({
            ...newProduct,
            images: updatedImages,
            main_image: newProduct.main_image === newProduct.images[index]
                ? (updatedImages[0] || "")
                : newProduct.main_image
        })
    }

    const setAsMainImage = (index: number) => {
        setNewProduct({
            ...newProduct,
            main_image: newProduct.images[index]
        })
    }

    const addMaterial = () => {
        if (materialInput.trim()) {
            setNewProduct({
                ...newProduct,
                materials: [...newProduct.materials, materialInput.trim()]
            })
            setMaterialInput("")
        }
    }

    const removeMaterial = (index: number) => {
        setNewProduct({
            ...newProduct,
            materials: newProduct.materials.filter((_, i) => i !== index)
        })
    }

    // Mostrar loading mientras verifica autenticación
    if (!isAuthenticated || !isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Verificando permisos...</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Cargando productos...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4 text-lg font-medium">Error: {error}</div>
                    <Button onClick={fetchProducts}>Reintentar</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            Administrar Productos
                        </h1>
                        <p className="text-gray-600">
                            Total de productos: <span className="font-semibold">{products.length}</span>
                        </p>
                        {user && (
                            <p className="text-sm text-gray-500 mt-1">
                                Conectado como: <span className="font-medium">{user.email}</span>
                            </p>
                        )}
                    </div>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-lg"
                    >
                        + Crear Producto
                    </Button>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Imagen</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Categoría</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Precio</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Stock</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {products.map((product) => (
                                <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <img
                                            src={product.main_image || product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=10'}
                                            alt={product.name}
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{product.name}</div>
                                        {product.materials && product.materials.length > 0 && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {product.materials.join(", ")}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                            <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                {product.category}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4">
                                            <span className="font-semibold text-gray-900">
                                                ${product.price.toFixed(2)}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                                product.stock === 0
                                                    ? 'bg-red-100 text-red-800'
                                                    : product.stock < 10
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-green-100 text-green-800'
                                            }`}>
                                                {product.stock} unidades
                                            </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {products.length === 0 && (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                No hay productos
                            </h3>
                            <p className="text-gray-500">Crea tu primer producto para comenzar</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Product Modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => !creating && !uploadingImages && setShowCreateModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-bold text-gray-900">Crear Nuevo Producto</h2>
                                <button
                                    onClick={() => !creating && !uploadingImages && setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                    disabled={creating || uploadingImages}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Nombre */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Nombre del Producto *
                                    </label>
                                    <input
                                        type="text"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ej: Laptop Gaming Pro"
                                        disabled={creating}
                                    />
                                </div>

                                {/* Precio y Stock */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Precio (MXN) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0.00"
                                            disabled={creating}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Stock *
                                        </label>
                                        <input
                                            type="number"
                                            value={newProduct.stock}
                                            onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0"
                                            disabled={creating}
                                        />
                                    </div>
                                </div>

                                {/* Categoría y Costo de Envío */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Categoría *
                                        </label>
                                        <input
                                            type="text"
                                            value={newProduct.category}
                                            onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ej: Electrónica"
                                            disabled={creating}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Costo de Envío (MXN)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newProduct.shipping_cost}
                                            onChange={(e) => setNewProduct({...newProduct, shipping_cost: parseFloat(e.target.value) || 0})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0.00"
                                            disabled={creating}
                                        />
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Descripción Completa
                                    </label>
                                    <textarea
                                        value={newProduct.full_description}
                                        onChange={(e) => setNewProduct({...newProduct, full_description: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={4}
                                        placeholder="Describe el producto..."
                                        disabled={creating}
                                    />
                                </div>

                                {/* Materiales */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Materiales
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={materialInput}
                                            onChange={(e) => setMaterialInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ej: Aluminio, Plástico..."
                                            disabled={creating}
                                        />
                                        <button
                                            onClick={addMaterial}
                                            disabled={creating}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {newProduct.materials.map((material, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                            >
                                                {material}
                                                <button
                                                    onClick={() => removeMaterial(index)}
                                                    className="hover:text-blue-900"
                                                    disabled={creating}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Imágenes - Upload desde archivo */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Imágenes del Producto * (máximo 5)
                                    </label>

                                    {/* Upload Area */}
                                    <div className="mb-4">
                                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                            uploadingImages || newProduct.images.length >= 5
                                                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                                                : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                                        }`}>
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                {uploadingImages ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-2"></div>
                                                        <p className="text-sm text-blue-600 font-medium">Subiendo imágenes...</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-10 h-10 mb-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                        <p className="mb-2 text-sm text-gray-700">
                                                            <span className="font-semibold">Click para subir</span> o arrastra archivos
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            PNG, JPG, WEBP hasta 5MB ({5 - newProduct.images.length} disponibles)
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                multiple
                                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                                onChange={(e) => handleImageUpload(e.target.files)}
                                                disabled={uploadingImages || creating || newProduct.images.length >= 5}
                                            />
                                        </label>
                                    </div>

                                    {/* Preview de imágenes */}
                                    {newProduct.images.length > 0 && (
                                        <div className="grid grid-cols-5 gap-2">
                                            {newProduct.images.map((img, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={img}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-20 object-cover rounded-lg"
                                                    />
                                                    {/* Botones de acción */}
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => setAsMainImage(index)}
                                                            disabled={creating}
                                                            className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-blue-600 text-xs disabled:opacity-50"
                                                            title="Establecer como principal"
                                                        >
                                                            ★
                                                        </button>
                                                        <button
                                                            onClick={() => removeImage(index)}
                                                            disabled={creating}
                                                            className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                                                            title="Eliminar"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                    {/* Badge de imagen principal */}
                                                    {newProduct.main_image === img && (
                                                        <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded font-medium">
                                                            Principal
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Botones */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={handleCreateProduct}
                                        disabled={creating || uploadingImages}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {creating ? "Creando..." : "Crear Producto"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCreateModal(false)
                                            resetForm()
                                        }}
                                        disabled={creating || uploadingImages}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}