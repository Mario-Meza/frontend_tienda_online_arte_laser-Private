"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth_context"
import { AdminRoute } from "@/components/shared/AdminRoute"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Search, Plus, Edit, Trash2, Mail, Phone, MapPin, User, Eye, EyeOff } from 'lucide-react'
import { API_URL } from "@/api_config"

interface Address {
    street?: string;
    references?: string;
    postal_code?: string;
    city?: string;
    state?: string;
    country?: string;
}

interface Customer {
    _id: string
    name: string
    last_name: string
    email: string
    phone?: string
    address?: string | Address
    role: string
    created_at?: string
    updated_at?: string
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

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        last_name: "",
        password: "",
        phone: "",

        street: "",
        references: "",
        postal_code: "",
        city: "",
        state: "",
        country: "México",
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
                `${API_URL}/api/v1/customers`,
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
            last_name: "",
            email: "",
            password: "",
            phone: "",

            street: "",
            references: "",
            postal_code: "",
            city: "",
            state: "",
            country: "México",
            role: "customer"
        })
        setShowModal(true)
    }

    const openEditModal = (customer: Customer) => {
        setModalMode('edit')
        setSelectedCustomer(customer)
        // Attempt to pre-fill structured address fields if available, otherwise use the general address field
        let street = ""
        let references = ""
        let postal_code = ""
        let city = ""
        let state = ""
        let country = "México"; // Default

        // Verifica si address es un objeto Address
        if (customer.address && typeof customer.address === "object") {
            street = customer.address.street || ""
            references = customer.address.references || ""
            postal_code = customer.address.postal_code || ""
            city = customer.address.city || ""
            state = customer.address.state || ""
            country = customer.address.country || "México"
        }

        // Basic parsing logic for the old 'address' field if structured fields are empty
        if (typeof customer.address === "string" && customer.address){
            const parts = customer.address.split(',');
            street = parts[0]?.trim() || "";
            if (parts.length > 1) references = parts.slice(1, -3).join(',').trim() || ""
            postal_code = parts[parts.length - 3]?.trim() || "";
            city = parts[parts.length - 2]?.trim() || "";
            state = parts[parts.length - 1]?.trim() || "";
        }


        setFormData({
            name: customer.name,
            last_name: customer.last_name,
            email: customer.email,
            password: "",
            phone: customer.phone || "",

            street: street,
            references: references,
            postal_code: postal_code,
            city: city,
            state: state,
            country: country,
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
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Helper to aggregate structured address into a single string for API submission if needed
    const getAggregatedAddress = () => {
        const parts: string[] = [];
        if (formData.street) parts.push(formData.street);
        if (formData.references) parts.push(formData.references);
        if (formData.city) parts.push(formData.city);
        if (formData.state) parts.push(formData.state);
        if (formData.postal_code) parts.push(formData.postal_code);
        if (formData.country && formData.country !== "México") parts.push(formData.country);

        return parts.join(', ');
    };


    const validateForm = () => {
        if (!formData.name.trim()) {
            showNotification('error', 'El nombre es requerido')
            return false
        }
        if (!formData.last_name.trim()) {
            showNotification('error', 'El apellido es requerido')
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
        // Basic validation for address fields if any of them are filled
        if (formData.street || formData.references || formData.postal_code || formData.city || formData.state || formData.country) {
            if (!formData.street.trim()) {
                showNotification('error', 'La calle y número son requeridos si se proporciona una dirección')
                return false;
            }
            if (!formData.postal_code.trim()) {
                showNotification('error', 'El código postal es requerido')
                return false;
            }
            if (!formData.city.trim()) {
                showNotification('error', 'La ciudad es requerida')
                return false;
            }
            if (!formData.state.trim()) {
                showNotification('error', 'El estado es requerido')
                return false;
            }
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

// 4. Actualiza createCustomer para enviar solo el objeto Address
    const createCustomer = async () => {
        try {
            // Construye el objeto Address solo si hay datos
            const addressData = formData.street ? {
                street: formData.street,
                references: formData.references || undefined,
                postal_code: formData.postal_code,
                city: formData.city,
                state: formData.state,
                country: formData.country || "México"
            } : undefined

            const response = await fetch(
                `${API_URL}/api/v1/customers/admin/create-with-role?role=${formData.role}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        last_name: formData.last_name,
                        email: formData.email,
                        password: formData.password,
                        phone: formData.phone || undefined,
                        address: addressData // ✅ Envía el objeto completo o undefined
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
    const adminResetPassword = async (customerId: string, newPassword: string) => {
        try {
            const response = await fetch(
                `${API_URL}/api/v1/customers/${customerId}/admin/reset-password`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        // Solo necesitamos enviar el campo password
                        password: newPassword
                    })
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail?.message || errorData.detail || "Error al restablecer contraseña")
            }
            // Retorna un valor para indicar éxito
            return true;
        } catch (err) {
            console.error("Error al restablecer la contraseña (Admin):", err)
            throw err // Re-lanzar para que updateCustomer maneje la notificación de error
        }
    }

    // 5. Actualiza updateCustomer de la misma forma
    const updateCustomer = async () => {
        if (!selectedCustomer) return

        let passwordChanged = false; // Bandera para rastrear si el cambio de contraseña fue exitoso

        try {
            // Construye el objeto Address solo si hay datos
            const addressData = formData.street ? {
                street: formData.street,
                references: formData.references || undefined,
                postal_code: formData.postal_code,
                city: formData.city,
                state: formData.state,
                country: formData.country || "México"
            } : undefined

            const body: any = {
                name: formData.name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone || undefined,
                address: addressData
            }

            // ⚠️ La actualización de contraseña se maneja por separado
            const hasGeneralUpdates = Object.keys(body).some(key => body[key] !== selectedCustomer[key as keyof Customer] && key !== 'address') || addressData;


            // Solo realizar la llamada PUT si hay campos generales que actualizar
            if (hasGeneralUpdates) {
                const response = await fetch(
                    `${API_URL}/api/v1/customers/${selectedCustomer._id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        // Asegúrate de NO enviar el campo `password` aquí
                        body: JSON.stringify(body)
                    }
                )

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.detail?.message || errorData.detail || "Error al actualizar cliente")
                }
            }


            // 🔑 Llamada CONDICIONAL para CAMBIO DE CONTRASEÑA usando el endpoint de ADMIN
            if (formData.password) {
                // Llama a la nueva función
                await adminResetPassword(selectedCustomer._id, formData.password);
                passwordChanged = true;
            }

            // Actualizar Role si es diferente
            if (formData.role !== selectedCustomer.role) {
                await updateCustomerRole(selectedCustomer._id, formData.role)
            }

            showNotification('success', '✅ Cliente actualizado correctamente' + (passwordChanged ? ' (Incluyendo contraseña)' : ''))
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
                `${API_URL}/api/v1/customers/${customerId}/role?new_role=${newRole}`,
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
                `${API_URL}/api/v1/customers/${customerToDelete._id}`,
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
                                                    <MapPin className="w-4 h-4" />

                                                    {typeof customer.address === "string" ? (
                                                        <span className="line-clamp-1">{customer.address}</span>
                                                    ) : (
                                                        <span className="line-clamp-1">
                                                            {customer.address.street}, {customer.address.city}, {customer.address.state}
                                                        </span>
                                                    )}
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
                                            {customer.created_at
                                                ? new Date(customer.created_at).toLocaleDateString('es-MX')
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
                        <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8 shadow-2xl">
                            <div className="sticky top-0 bg-gradient-to-r from-amber-50 to-orange-50 px-8 py-6 border-b border-gray-200 rounded-t-3xl">
                                <h2 className="text-3xl font-bold text-gray-900">
                                    {modalMode === 'create' ? '✨ Crear Nuevo Cliente' : '✏️ Editar Cliente'}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {modalMode === 'create'
                                        ? 'Completa la información para agregar un nuevo cliente'
                                        : 'Actualiza los detalles del cliente'
                                    }
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8">

                                {/* Información Personal */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm">
                                            1
                                        </div>
                                        Información Personal
                                    </h3>
                                    <div className="bg-gray-50 rounded-2xl p-6 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Nombre <span className="text-rose-500">*</span>
                                                </label>
                                                <Input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    placeholder="Ej: Juan"
                                                    required
                                                    className="h-12 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Apellidos <span className="text-rose-500">*</span>
                                                </label>
                                                <Input
                                                    type="text"
                                                    name="last_name"
                                                    value={formData.last_name}
                                                    onChange={handleInputChange}
                                                    placeholder="Ej: Pérez García"
                                                    required
                                                    className="h-12 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Información de Cuenta */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm">
                                            2
                                        </div>
                                        Información de Cuenta
                                    </h3>
                                    <div className="bg-gray-50 rounded-2xl p-6 space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-amber-600" />
                                                Email <span className="text-rose-500">*</span>
                                            </label>
                                            <Input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="correo@ejemplo.com"
                                                required
                                                className="h-12 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1.5">
                                                Este será el correo para iniciar sesión
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Contraseña {modalMode === 'edit' && <span className="font-normal text-gray-500">(opcional, dejar vacío para mantener actual)</span>}
                                                {modalMode === 'create' && <span className="text-rose-500">*</span>}
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    placeholder={modalMode === 'create' ? "Mínimo 6 caracteres" : "Dejar vacío para no cambiar"}
                                                    required={modalMode === 'create'}
                                                    className="h-12 pr-12 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors p-1.5 rounded-lg hover:bg-amber-50"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            {modalMode === 'create' && (
                                                <p className="text-xs text-gray-500 mt-1.5">
                                                    Debe contener al menos 6 caracteres
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Tipo de Usuario
                                            </label>
                                            <select
                                                name="role"
                                                value={formData.role}
                                                onChange={handleInputChange}
                                                className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-all"
                                            >
                                                <option value="customer">👤 Cliente Regular</option>
                                                <option value="admin">👑 Administrador</option>
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1.5">
                                                Los administradores tienen acceso completo al sistema
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm">
                                            3
                                        </div>
                                        Dirección de Envío
                                        <span className="text-sm font-normal text-gray-500">(Opcional)</span>
                                    </h3>
                                    <div className="bg-gray-50 rounded-2xl p-6 space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Calle y Número
                                            </label>
                                            <Input
                                                type="text"
                                                name="street"
                                                value={formData.street}
                                                onChange={handleInputChange}
                                                placeholder="Ej: Av. Reforma 123"
                                                className="h-12 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Referencias
                                            </label>
                                            <Input
                                                type="text"
                                                name="references"
                                                value={formData.references}
                                                onChange={handleInputChange}
                                                placeholder="Ej: Edificio azul, Depto 3B, entre calles..."
                                                className="h-12 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1.5">
                                                Información adicional para facilitar la entrega
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Código Postal
                                                </label>
                                                <Input
                                                    type="text"
                                                    name="postal_code"
                                                    value={formData.postal_code}
                                                    onChange={handleInputChange}
                                                    placeholder="Ej: 06500"
                                                    maxLength={5}
                                                    className="h-12 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Municipio o alcaldía
                                                </label>
                                                <Input
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    placeholder="Ej: Ciudad de México"
                                                    className="h-12 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Estado
                                                </label>
                                                <select
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleInputChange}
                                                    className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-all"
                                                >
                                                    <option value="">Selecciona un estado</option>
                                                    <option value="Aguascalientes">Aguascalientes</option>
                                                    <option value="Baja California">Baja California</option>
                                                    <option value="Baja California Sur">Baja California Sur</option>
                                                    <option value="Campeche">Campeche</option>
                                                    <option value="Chiapas">Chiapas</option>
                                                    <option value="Chihuahua">Chihuahua</option>
                                                    <option value="Ciudad de México">Ciudad de México</option>
                                                    <option value="Coahuila">Coahuila</option>
                                                    <option value="Colima">Colima</option>
                                                    <option value="Durango">Durango</option>
                                                    <option value="Estado de México">Estado de México</option>
                                                    <option value="Guanajuato">Guanajuato</option>
                                                    <option value="Guerrero">Guerrero</option>
                                                    <option value="Hidalgo">Hidalgo</option>
                                                    <option value="Jalisco">Jalisco</option>
                                                    <option value="Michoacán">Michoacán</option>
                                                    <option value="Morelos">Morelos</option>
                                                    <option value="Nayarit">Nayarit</option>
                                                    <option value="Nuevo León">Nuevo León</option>
                                                    <option value="Oaxaca">Oaxaca</option>
                                                    <option value="Puebla">Puebla</option>
                                                    <option value="Querétaro">Querétaro</option>
                                                    <option value="Quintana Roo">Quintana Roo</option>
                                                    <option value="San Luis Potosí">San Luis Potosí</option>
                                                    <option value="Sinaloa">Sinaloa</option>
                                                    <option value="Sonora">Sonora</option>
                                                    <option value="Tabasco">Tabasco</option>
                                                    <option value="Tamaulipas">Tamaulipas</option>
                                                    <option value="Tlaxcala">Tlaxcala</option>
                                                    <option value="Veracruz">Veracruz</option>
                                                    <option value="Yucatán">Yucatán</option>
                                                    <option value="Zacatecas">Zacatecas</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    País
                                                </label>
                                                <select
                                                    name="country"
                                                    value={formData.country}
                                                    onChange={handleInputChange}
                                                    className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-all"
                                                >
                                                    <option value="México">México</option>
                                                    <option value="Estados Unidos">Estados Unidos</option>
                                                    <option value="Canadá">Canadá</option>
                                                    <option value="Otro">Otro</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-amber-600" />
                                                Teléfono de Contacto
                                            </label>
                                            <Input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="(555) 123-4567"
                                                className="h-12 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1.5">
                                                Para coordinar la entrega del pedido
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6 border-t border-gray-200">
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 h-14 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-200"
                                    >
                                        {submitting ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Guardando...
                                            </span>
                                        ) : (
                                            modalMode === 'create' ? '✨ Crear Cliente' : '💾 Guardar Cambios'
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={submitting}
                                        className="flex-1 h-14 text-base font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-all duration-200"
                                    >
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
