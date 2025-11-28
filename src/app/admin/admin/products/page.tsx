"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth_context"
import { AdminRoute } from "@/components/shared/AdminRoute"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Search, Plus, Edit, Trash2, Image as ImageIcon, Star, Upload } from "lucide-react"
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

type NotificationType = 'success' | 'error' | 'info'

export default function AdminProductsPage() {
    const { token } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [notification, setNotification] = useState<{type: NotificationType, message: string} | null>(null)

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [productToDelete, setProductToDelete] = useState<Product | null>(null)

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        price: 0,
        stock: 0,
        category: "",
        images: [] as string[],
        main_image: "",
        materials: [] as string[],
        full_description: "",
        shipping_cost: 0
    })

    const [materialInput, setMaterialInput] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [uploadingImages, setUploadingImages] = useState(false)

    const showNotification = (type: NotificationType, message: string) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 5000)
    }

    // Cargar productos
    useEffect(() => {
        fetchProducts()
    }, [token])

    // Filtrar productos
    useEffect(() => {
        if (searchTerm) {
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setFilteredProducts(filtered)
        } else {
            setFilteredProducts(products)
        }
    }, [searchTerm, products])

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const response = await fetch(
                `${API_URL}/api/v1/products/all`
            )

            if (!response.ok) throw new Error("Error al cargar productos")
            const data = await response.json()
            setProducts(Array.isArray(data) ? data : [])
            setFilteredProducts(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error("Error:", err)
            showNotification('error', 'Error al cargar productos')
        } finally {
            setLoading(false)
        }
    }

    const openCreateModal = () => {
        setModalMode('create')
        setFormData({
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
        setShowModal(true)
    }

    const openEditModal = (product: Product) => {
        setModalMode('edit')
        setSelectedProduct(product)
        setFormData({
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: product.category,
            images: product.images || [],
            main_image: product.main_image || "",
            materials: product.materials || [],
            full_description: product.full_description || "",
            shipping_cost: product.shipping_cost || 0
        })
        setMaterialInput("")
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedProduct(null)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: name === 'price' || name === 'stock' || name === 'shipping_cost'
                ? parseFloat(value) || 0
                : value
        })
    }

    const addMaterial = () => {
        if (materialInput.trim()) {
            setFormData({
                ...formData,
                materials: [...formData.materials, materialInput.trim()]
            })
            setMaterialInput("")
        }
    }

    const removeMaterial = (index: number) => {
        setFormData({
            ...formData,
            materials: formData.materials.filter((_, i) => i !== index)
        })
    }

    const handleImageUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        if (formData.images.length + files.length > 5) {
            showNotification('error', `Solo puedes subir máximo 5 imágenes. Ya tienes ${formData.images.length}`)
            return
        }

        setUploadingImages(true)
        try {
            const formDataUpload = new FormData()
            Array.from(files).forEach(file => {
                formDataUpload.append('files', file)
            })

            const response = await fetch(
                `${API_URL}/api/v1/upload/images`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: formDataUpload
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error?.message || "Error al subir imágenes")
            }

            const result = await response.json()
            const uploadedUrls = result.images.map((img: any) => img.url)

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...uploadedUrls],
                main_image: prev.images.length === 0 ? uploadedUrls[0] : prev.main_image
            }))

            showNotification('success', `✅ ${result.count} imagen(es) subida(s)`)
        } catch (err) {
            showNotification('error', err instanceof Error ? err.message : 'Error al subir imágenes')
        } finally {
            setUploadingImages(false)
        }
    }

    const removeImage = (index: number) => {
        const imageToRemove = formData.images[index]
        const updatedImages = formData.images.filter((_, i) => i !== index)

        setFormData({
            ...formData,
            images: updatedImages,
            main_image: formData.main_image === imageToRemove
                ? (updatedImages[0] || "")
                : formData.main_image
        })
    }

    const setAsMainImage = (index: number) => {
        setFormData({
            ...formData,
            main_image: formData.images[index]
        })
    }

    const validateForm = () => {
        if (!formData.name.trim()) {
            showNotification('error', 'El nombre es requerido')
            return false
        }
        if (formData.price <= 0) {
            showNotification('error', 'El precio debe ser mayor a 0')
            return false
        }
        if (formData.stock < 0) {
            showNotification('error', 'El stock no puede ser negativo')
            return false
        }
        if (!formData.category.trim()) {
            showNotification('error', 'La categoría es requerida')
            return false
        }
        if (formData.images.length === 0) {
            showNotification('error', 'Debes subir al menos una imagen')
            return false
        }
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setSubmitting(true)
        try {
            if (modalMode === 'create') {
                await createProduct()
            } else {
                await updateProduct()
            }
        } finally {
            setSubmitting(false)
        }
    }

    const createProduct = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/v1/products/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "Error al crear producto")
            }

            showNotification('success', '✅ Producto creado correctamente')
            closeModal()
            fetchProducts()
        } catch (err) {
            console.error("Error:", err)
            showNotification('error', err instanceof Error ? err.message : 'Error al crear producto')
        }
    }

    const updateProduct = async () => {
        if (!selectedProduct) return

        try {
            const response = await fetch(
                `${API_URL}/api/v1/products/${selectedProduct._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "Error al actualizar producto")
            }

            showNotification('success', '✅ Producto actualizado correctamente')
            closeModal()
            fetchProducts()
        } catch (err) {
            console.error("Error:", err)
            showNotification('error', err instanceof Error ? err.message : 'Error al actualizar producto')
        }
    }

    const openDeleteConfirm = (product: Product) => {
        setProductToDelete(product)
        setShowDeleteConfirm(true)
    }

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false)
        setProductToDelete(null)
    }

    const handleDelete = async () => {
        if (!productToDelete) return

        try {
            const response = await fetch(
                `${API_URL}/api/v1/products/${productToDelete._id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,

                    }
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "Error al eliminar producto")
            }

            showNotification('success', '✅ Producto eliminado correctamente')
            closeDeleteConfirm()
            fetchProducts()
        } catch (err) {
            console.error("Error:", err)
            showNotification('error', err instanceof Error ? err.message : 'Error al eliminar producto')
        }
    }

    if (loading) {
        return (
            <AdminRoute>
                <div className="container py-12">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Cargando productos...</p>
                        </div>
                    </div>
                </div>
            </AdminRoute>
        )
    }

    return (
        <AdminRoute>
            <div className="container py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Gestión de Productos</h1>
                        <p className="text-muted-foreground">
                            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
                        </p>
                    </div>
                    <Button onClick={openCreateModal} className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Nuevo Producto
                    </Button>
                </div>

                {/* Búsqueda */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Buscar por nombre o categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Tabla de productos */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Imagen
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Producto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Categoría
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Precio
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Stock
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Acciones
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <img
                                                src={product.main_image || product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=10'}
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
                                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {product.category}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">
                                            ${product.price.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteConfirm(product)}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal Crear/Editar */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-2xl font-bold">
                                    {modalMode === 'create' ? 'Crear Nuevo Producto' : 'Editar Producto'}
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Nombre */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Nombre del Producto *
                                    </label>
                                    <Input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Ej: Laptop Gaming Pro"
                                        required
                                    />
                                </div>

                                {/* Precio y Stock */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Precio (MXN) *
                                        </label>
                                        <Input
                                            type="number"
                                            name="price"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Stock *
                                        </label>
                                        <Input
                                            type="number"
                                            name="stock"
                                            value={formData.stock}
                                            onChange={handleInputChange}
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Categoría y Envío */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Categoría *
                                        </label>
                                        <Input
                                            type="text"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            placeholder="Ej: Electrónica"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Costo de Envío (MXN)
                                        </label>
                                        <Input
                                            type="number"
                                            name="shipping_cost"
                                            step="0.01"
                                            value={formData.shipping_cost}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Descripción Completa
                                    </label>
                                    <textarea
                                        name="full_description"
                                        value={formData.full_description}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-sans"
                                        rows={8}
                                        maxLength={5000}
                                        placeholder="Describe el producto en detalle...

                                    ✅ Puedes usar saltos de línea
                                    ✅ Puedes usar emojis
                                    ✅ Organiza la información en párrafos"
                                    />
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-xs text-gray-500">
                                            {formData.full_description?.length || 0}/5000 caracteres
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Usa Enter para separar párrafos
                                        </p>
                                    </div>
                                </div>

                                {/* Materiales */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Materiales
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <Input
                                            type="text"
                                            value={materialInput}
                                            onChange={(e) => setMaterialInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                                            placeholder="Ej: Aluminio"
                                            className="flex-1"
                                        />
                                        <Button type="button" onClick={addMaterial}>
                                            Agregar
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.materials.map((material, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                            >
                                                {material}
                                                <button
                                                    type="button"
                                                    onClick={() => removeMaterial(index)}
                                                    className="hover:text-blue-900"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Imágenes */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Imágenes * (máximo 5)
                                    </label>

                                    {/* Upload Area */}
                                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer mb-4 ${
                                        uploadingImages || formData.images.length >= 5
                                            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                                            : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                                    }`}>
                                        <div className="flex flex-col items-center justify-center">
                                            {uploadingImages ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-2"></div>
                                                    <p className="text-sm text-blue-600">Subiendo...</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-10 h-10 mb-2 text-blue-400" />
                                                    <p className="text-sm text-gray-700">
                                                        Click para subir o arrastra archivos
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        PNG, JPG, WEBP ({5 - formData.images.length} disponibles)
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e.target.files)}
                                            disabled={uploadingImages || formData.images.length >= 5}
                                        />
                                    </label>

                                    {/* Preview */}
                                    {formData.images.length > 0 && (
                                        <div className="grid grid-cols-5 gap-2">
                                            {formData.images.map((img, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={img}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-20 object-cover rounded-lg"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setAsMainImage(index)}
                                                            className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-blue-600"
                                                            title="Principal"
                                                        >
                                                            <Star className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                    {formData.main_image === img && (
                                                        <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                                                            Principal
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Botones */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button type="submit" disabled={submitting || uploadingImages} className="flex-1">
                                        {submitting ? 'Guardando...' : modalMode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
                                    </Button>
                                    <Button type="button" onClick={closeModal} disabled={submitting || uploadingImages} className="flex-1 bg-gray-500 hover:bg-gray-600">
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Eliminar */}
                {showDeleteConfirm && productToDelete && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-rose-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">¿Eliminar Producto?</h3>
                                <p className="text-gray-600">
                                    ¿Estás seguro de eliminar <strong>{productToDelete.name}</strong>?
                                    Esta acción no se puede deshacer.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button onClick={handleDelete} className="flex-1 bg-rose-600 hover:bg-rose-700">
                                    Sí, Eliminar
                                </Button>
                                <Button onClick={closeDeleteConfirm} className="flex-1 bg-gray-500 hover:bg-gray-600">
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notificación Toast */}
                {notification && (
                    <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-2xl shadow-2xl ${
                        notification.type === 'success' ? 'bg-emerald-500' :
                            notification.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
                    } text-white animate-slide-in`}>
                        <div className="flex items-center gap-3">
                            <p className="font-semibold text-sm flex-1">{notification.message}</p>
                            <button
                                onClick={() => setNotification(null)}
                                className="hover:bg-white/20 rounded p-1 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

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
        </AdminRoute>
    )
}