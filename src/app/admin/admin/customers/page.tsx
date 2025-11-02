"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth_context"
import { AdminRoute } from "@/components/shared/AdminRoute"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Search, Plus, Edit, Trash2, Mail, Phone, MapPin, User, Eye, EyeOff } from "lucide-react"

interface Customer {
    _id: string
    name: string
    email: string
    phone?: string
    address?: string
    role: string
    createdAt?: string
}

type NotificationType = 'success' | 'error' | 'info'

export default function AdminCustomersPage() {
    const { token } = useAuth()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [notification, setNotification] = useState<{type: NotificationType, message: string} | null>(null)

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        role: "customer"
    })
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const showNotification = (type: NotificationType, message: string) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 5000)
    }

    // Cargar clientes
    useEffect(() => {
        fetchCustomers()
    }, [token])

    // Filtrar clientes
    useEffect(() => {
        if (searchTerm) {
            const filtered = customers.filter(customer =>
                customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setFilteredCustomers(filtered)
        } else {
            setFilteredCustomers(customers)
        }
    }, [searchTerm, customers])

    const fetchCustomers = async () => {
        setLoading(true)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/customers`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            )

            if (!response.ok) throw new Error("Error al cargar clientes")
            const data = await response.json()
            setCustomers(data)
            setFilteredCustomers(data)
        } catch (err) {
            console.error("Error:", err)
            showNotification('error', 'Error al cargar clientes')
        } finally {
            setLoading(false)
        }
    }

    const openCreateModal = () => {
        setModalMode('create')
        setFormData({
            name: "",
            email: "",
            password: "",
            phone: "",
            address: "",
            role: "customer"
        })
        setShowModal(true)
    }

    const openEditModal = (customer: Customer) => {
        setModalMode('edit')
        setSelectedCustomer(customer)
        setFormData({
            name: customer.name,
            email: customer.email,
            password: "",
            phone: customer.phone || "",
            address: customer.address || "",
            role: customer.role
        })
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedCustomer(null)
        setShowPassword(false)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const validateForm = () => {
        if (!formData.name.trim()) {
            showNotification('error', 'El nombre es requerido')
            return false
        }
        if (!formData.email.trim()) {
            showNotification('error', 'El email es requerido')
            return false
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            showNotification('error', 'Email inválido')
            return false
        }
        if (modalMode === 'create' && !formData.password) {
            showNotification('error', 'La contraseña es requerida')
            return false
        }
        if (formData.password && formData.password.length < 6) {
            showNotification('error', 'La contraseña debe tener al menos 6 caracteres')
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
                await createCustomer()
            } else {
                await updateCustomer()
            }
        } finally {
            setSubmitting(false)
        }
    }

    const createCustomer = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/customers/admin/create-with-role?role=${formData.role}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        password: formData.password,
                        phone: formData.phone || undefined,
                        address: formData.address || undefined,
                    })
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail?.message || errorData.detail || "Error al crear cliente")
            }

            showNotification('success', '✅ Cliente creado correctamente')
            closeModal()
            fetchCustomers()
        } catch (err) {
            console.error("Error:", err)
            showNotification('error', err instanceof Error ? err.message : 'Error al crear cliente')
        }
    }

    const updateCustomer = async () => {
        if (!selectedCustomer) return

        try {
            const body: any = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                address: formData.address || undefined,
            }

            if (formData.password) {
                body.password = formData.password
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/customers/${selectedCustomer._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(body)
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail?.message || errorData.detail || "Error al actualizar cliente")
            }

            if (formData.role !== selectedCustomer.role) {
                await updateCustomerRole(selectedCustomer._id, formData.role)
            }

            showNotification('success', '✅ Cliente actualizado correctamente')
            closeModal()
            fetchCustomers()
        } catch (err) {
            console.error("Error:", err)
            showNotification('error', err instanceof Error ? err.message : 'Error al actualizar cliente')
        }
    }

    const updateCustomerRole = async (customerId: string, newRole: string) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/customers/${customerId}/role?new_role=${newRole}`,
                {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            )

            if (!response.ok) {
                throw new Error("Error al actualizar role")
            }
        } catch (err) {
            console.error("Error actualizando role:", err)
        }
    }

    const openDeleteConfirm = (customer: Customer) => {
        setCustomerToDelete(customer)
        setShowDeleteConfirm(true)
    }

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false)
        setCustomerToDelete(null)
    }

    const handleDelete = async () => {
        if (!customerToDelete) return

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/customers/${customerToDelete._id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail?.message || errorData.detail || "Error al eliminar cliente")
            }

            showNotification('success', '✅ Cliente eliminado correctamente')
            closeDeleteConfirm()
            fetchCustomers()
        } catch (err) {
            console.error("Error:", err)
            showNotification('error', err instanceof Error ? err.message : 'Error al eliminar cliente')
        }
    }

    if (loading) {
        return (
            <AdminRoute>
                <div className="container py-12 max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Cargando clientes...</p>
                        </div>
                    </div>
                </div>
            </AdminRoute>
        )
    }

    return (
        <AdminRoute>
            <div className="container py-8 max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Gestión de Clientes</h1>
                            <p className="text-gray-600">
                                {filteredCustomers.length} {filteredCustomers.length === 1 ? 'cliente' : 'clientes'}
                            </p>
                        </div>
                        <Button onClick={openCreateModal} className="flex items-center gap-2 whitespace-nowrap shrink-0">
                            <Plus className="w-5 h-5" />
                            Nuevo Cliente
                        </Button>
                    </div>
                </div>

                {/* Búsqueda */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                </div>

                {/* Tabla de clientes */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contacto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dirección
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha Registro
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-gray-900">{customer.name}</div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{customer.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {customer.phone ? (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone className="w-4 h-4 flex-shrink-0" />
                                                    {customer.phone}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">Sin teléfono</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {customer.address ? (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                                    <span className="line-clamp-1">{customer.address}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">Sin dirección</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                customer.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {customer.role === 'admin' ? '👑 Admin' : '👤 Customer'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {customer.createdAt
                                                ? new Date(customer.createdAt).toLocaleDateString('es-MX')
                                                : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(customer)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteConfirm(customer)}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-2xl font-bold">
                                    {modalMode === 'create' ? 'Crear Nuevo Cliente' : 'Editar Cliente'}
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Nombre completo
                                    </label>
                                    <Input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Nombre del cliente"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Email
                                    </label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="email@ejemplo.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Contraseña {modalMode === 'edit' && '(dejar vacío para no cambiar)'}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder={modalMode === 'create' ? "Mínimo 6 caracteres" : "Nueva contraseña (opcional)"}
                                            required={modalMode === 'create'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        Teléfono (opcional)
                                    </label>
                                    <Input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="(123) 456-7890"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Dirección (opcional)
                                    </label>
                                    <Input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Calle, número, colonia, ciudad"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tipo de usuario
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="customer">👤 Cliente</option>
                                        <option value="admin">👑 Administrador</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <Button type="submit" disabled={submitting} className="flex-1">
                                        {submitting ? 'Guardando...' : modalMode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
                                    </Button>
                                    <Button type="button" onClick={closeModal} disabled={submitting} className="flex-1 bg-gray-500 hover:bg-gray-600">
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Confirmar Eliminación */}
                {showDeleteConfirm && customerToDelete && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-rose-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">¿Eliminar Cliente?</h3>
                                <p className="text-gray-600">
                                    ¿Estás seguro de que quieres eliminar a <strong>{customerToDelete.name}</strong>?
                                    Esta acción no se puede deshacer.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleDelete}
                                    className="flex-1 bg-rose-600 hover:bg-rose-700"
                                >
                                    Sí, Eliminar
                                </Button>
                                <Button
                                    onClick={closeDeleteConfirm}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600"
                                >
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