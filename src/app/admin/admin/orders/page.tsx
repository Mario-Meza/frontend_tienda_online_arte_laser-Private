"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/auth_context"
import {
    Search, Package, Truck, CheckCircle, XCircle, Clock, Eye,
    Filter, Download, ChevronLeft, ChevronRight, ArrowUpDown,
    Calendar, DollarSign, X, User, MapPin, ShoppingBag, AlertCircle, Phone, Mail, Navigation
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Address {
    street?: string
    number?: string
    references?: string
    postal_code?: string
    city?: string
    state?: string
    country?: string
    phone?: string
}

interface OrderDetail {
    product_id: string
    product_name?: string
    quantity: number
    unit_price: number
    subtotal: number
}

interface Customer {
    _id: string
    name: string
    email: string
    address?: Address
    phone?: string
}

interface Order {
    _id: string
    id?: string
    customer_id: string
    customer_name?: string
    customer_email?: string
    customer_phone?: string
    customer_address?: Address | string
    status: 'pending' | 'processing' | 'sent' | 'delivered' | 'canceled'
    order_date: string
    total: number
    details: OrderDetail[]
    shipping_address?: Address | string
}

type NotificationType = 'success' | 'error' | 'info'
type SortField = 'order_date' | 'total' | 'customer_name'
type SortOrder = 'asc' | 'desc'

const statusConfig = {
    pending: {
        label: "Pendiente",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Clock,
        nextStatus: "processing"
    },
    processing: {
        label: "Procesando",
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: Package,
        nextStatus: "sent"
    },
    sent: {
        label: "Enviado",
        color: "bg-purple-100 text-purple-800 border-purple-300",
        icon: Truck,
        nextStatus: "delivered"
    },
    delivered: {
        label: "Entregado",
        color: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle,
        nextStatus: null
    },
    canceled: {
        label: "Cancelado",
        color: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
        nextStatus: null
    }
}

export default function AdminOrdersPage() {
    const { token, isAuthenticated, user } = useAuth()
    const [orders, setOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [minTotal, setMinTotal] = useState("")
    const [maxTotal, setMaxTotal] = useState("")
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

    const [sortField, setSortField] = useState<SortField>('order_date')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const [showDetailModal, setShowDetailModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [activeTab, setActiveTab] = useState<'details' | 'customer' | 'products'>('details')

    const [notification, setNotification] = useState<{type: NotificationType, message: string} | null>(null)

    const showNotification = (type: NotificationType, message: string) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 5000)
    }

// Función enrichOrderData actualizada
    const enrichOrderData = async (order: any): Promise<Order> => {
        try {
            const orderId = order._id || order.id

            // Obtener datos del customer
            let customerData: Customer | null = null
            try {
                const customerRes = await fetch(`${API_BASE_URL}/api/v1/customers/public/${order.customer_id}`)
                if (customerRes.ok) {
                    customerData = await customerRes.json()
                }
            } catch (err) {
                console.warn('No se pudo obtener info del customer:', order.customer_id)
            }

            if (!customerData && user && user._id === order.customer_id) {
                // 👇 FIX START: Check if address is a string and convert it to an object
                const userAddress: Address | undefined = typeof user.address === 'string'
                    ? { street: user.address } // Map the string to the 'street' field
                    : user.address as Address | undefined;
                // 👆 FIX END

                customerData = {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    address: userAddress, // Now this is guaranteed to be an Address object or undefined
                    phone: user.phone
                }
            }

            // Enriquecer detalles de productos
            const enrichedDetails = await Promise.all(
                order.details.map(async (detail: OrderDetail) => {
                    try {
                        const productRes = await fetch(`${API_BASE_URL}/api/v1/products/${detail.product_id}`)
                        const productData = productRes.ok ? await productRes.json() : null

                        return {
                            ...detail,
                            product_name: productData?.name || `Producto ${detail.product_id.slice(-6)}`
                        }
                    } catch {
                        return {
                            ...detail,
                            product_name: `Producto ${detail.product_id.slice(-6)}`
                        }
                    }
                })
            )

            // ✅ Manejar dirección: priorizar address del customer sobre shipping_address
            const addressData = customerData?.address || order.shipping_address

            return {
                _id: orderId,
                customer_id: order.customer_id,
                customer_name: customerData?.name || `Cliente ${order.customer_id.slice(-6)}`,
                customer_email: customerData?.email || "Email no disponible",
                customer_phone: customerData?.phone,
                customer_address: addressData,  // ✅ Ahora es el objeto completo de Address
                status: order.status,
                order_date: order.order_date,
                total: order.total,
                details: enrichedDetails,
                shipping_address: addressData
            }
        } catch (err) {
            console.error("Error enriching order:", err)
            return {
                ...order,
                _id: order._id || order.id,
                customer_name: `Cliente ${order.customer_id.slice(-6)}`,
                customer_email: "Email no disponible"
            }
        }
    }

    const fetchOrders = async () => {
        if (!token) {
            setError("No hay token de autenticación")
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            let url = `${API_BASE_URL}/api/v1/orders/`
            const params = new URLSearchParams()

            if (statusFilter !== "all") {
                url = `${API_BASE_URL}/api/v1/orders/filter/status/${statusFilter}`
            }

            if (minTotal || maxTotal) {
                url = `${API_BASE_URL}/api/v1/orders/filter/total`
                if (minTotal) params.append('min_total', minTotal)
                if (maxTotal) params.append('max_total', maxTotal)
            }

            const fullUrl = params.toString() ? `${url}?${params}` : url

            console.log('🔍 Fetching orders from:', fullUrl)
            console.log('🔑 Using token:', token ? 'Token exists' : 'No token')

            const response = await fetch(fullUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            console.log('📡 Response status:', response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ Error response:', errorText)
                throw new Error(`Error ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()
            console.log('✅ Orders received:', data.length)

            const enrichedOrders = await Promise.all(
                data.map((order: any) => enrichOrderData(order))
            )

            setOrders(enrichedOrders)
            setFilteredOrders(enrichedOrders)
        } catch (err) {
            console.error("❌ Error fetching orders:", err)
            setError(err instanceof Error ? err.message : "Error al cargar órdenes")
            showNotification('error', '❌ Error al cargar órdenes')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        console.log('🔐 Auth Status:', {
            isAuthenticated,
            hasToken: !!token,
            user: user?.email,
            role: user?.role
        })

        if (isAuthenticated && token) {
            fetchOrders()
        } else {
            setLoading(false)
            if (!isAuthenticated) {
                setError("No estás autenticado. Por favor, inicia sesión.")
            }
        }
    }, [token, isAuthenticated, statusFilter, minTotal, maxTotal])

    useEffect(() => {
        let filtered = [...orders]

        if (searchTerm) {
            filtered = filtered.filter(order =>
                order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (dateFrom) {
            filtered = filtered.filter(order =>
                new Date(order.order_date) >= new Date(dateFrom)
            )
        }
        if (dateTo) {
            filtered = filtered.filter(order =>
                new Date(order.order_date) <= new Date(dateTo + 'T23:59:59')
            )
        }

        filtered.sort((a, b) => {
            let compareA, compareB

            switch(sortField) {
                case 'order_date':
                    compareA = new Date(a.order_date).getTime()
                    compareB = new Date(b.order_date).getTime()
                    break
                case 'total':
                    compareA = a.total
                    compareB = b.total
                    break
                case 'customer_name':
                    compareA = a.customer_name || ''
                    compareB = b.customer_name || ''
                    break
                default:
                    return 0
            }

            if (sortOrder === 'asc') {
                return compareA > compareB ? 1 : -1
            } else {
                return compareA < compareB ? 1 : -1
            }
        })

        setFilteredOrders(filtered)
        setCurrentPage(1)
    }, [searchTerm, dateFrom, dateTo, sortField, sortOrder, orders])

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc')
        }
    }

    const clearFilters = () => {
        setSearchTerm("")
        setStatusFilter("all")
        setDateFrom("")
        setDateTo("")
        setMinTotal("")
        setMaxTotal("")
    }

    const exportToCSV = () => {
        const headers = ['ID', 'Cliente', 'Email', 'Fecha', 'Total', 'Estado']
        const rows = filteredOrders.map(order => [
            order._id,
            order.customer_name,
            order.customer_email,
            new Date(order.order_date).toLocaleDateString('es-MX'),
            order.total,
            order.status
        ])

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ordenes_${new Date().toISOString().split('T')[0]}.csv`
        a.click()

        showNotification('success', '✅ Archivo CSV descargado')
    }

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdatingStatus(true)
        try {
            // Validar que el nuevo estado sea válido
            const validStatuses = ['pending', 'processing', 'sent', 'delivered', 'canceled']
            if (!validStatuses.includes(newStatus)) {
                throw new Error(`Estado inválido: ${newStatus}`)
            }

            console.log(`🔄 Actualizando orden ${orderId} a estado: ${newStatus}`)

            const response = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            })

            if (!response.ok) {
                const errorData = await response.json()
                const errorMessage = errorData.detail?.message || errorData.detail || 'Error al actualizar estado'
                throw new Error(errorMessage)
            }

            const updatedOrder = await response.json()
            console.log('✅ Orden actualizada:', updatedOrder)

            const enrichedOrder = await enrichOrderData(updatedOrder)

            setOrders(orders.map(o =>
                o._id === orderId ? enrichedOrder : o
            ))

            showNotification('success', `✅ Estado actualizado a: ${statusConfig[newStatus as keyof typeof statusConfig].label}`)
            closeDetailModal()

            // Recargar órdenes para refrescar datos
            fetchOrders()
        } catch (err) {
            console.error("❌ Error updating status:", err)
            showNotification('error', err instanceof Error ? err.message : 'Error al actualizar estado')
        } finally {
            setUpdatingStatus(false)
        }
    }

    const openDetailModal = async (order: Order) => {
        setSelectedOrder(order)
        setShowDetailModal(true)
        setActiveTab('details')

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/orders/${order._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const freshOrder = await response.json()
                const enrichedOrder = await enrichOrderData(freshOrder)
                setSelectedOrder(enrichedOrder)
            }
        } catch (err) {
            console.error("Error fetching order details:", err)
        }
    }

    const closeDetailModal = () => {
        setShowDetailModal(false)
        setSelectedOrder(null)
    }

    const getStatusStats = () => {
        return {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            processing: orders.filter(o => o.status === 'processing').length,
            sent: orders.filter(o => o.status === 'sent').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            canceled: orders.filter(o => o.status === 'canceled').length,
        }
    }

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentOrders = filteredOrders.slice(startIndex, endIndex)

    if (loading) {
        return (
            <div className="container py-12">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando órdenes...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container py-12">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar órdenes</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        {!isAuthenticated ? (
                            <a
                                href="/login"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
                            >
                                Ir a Login
                            </a>
                        ) : (
                            <button
                                onClick={() => fetchOrders()}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Reintentar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const stats = getStatusStats()

    // ✅ Función helper para formatear dirección
    const formatAddress = (address: Address | string | undefined): string => {
        if (!address) return 'No disponible'

        if (typeof address === 'string') {
            return address
        }

        return [
            address.street && address.number
                ? `${address.street} #${address.number}`
                : address.street,
            address.references,
            [address.city, address.state, address.postal_code].filter(Boolean).join(', '),
            address.country
        ].filter(Boolean).join(', ')
    }

    return (
        <div className="container py-8 max-w-7xl mx-auto px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Gestión de Órdenes</h1>
                <p className="text-gray-600">
                    Mostrando {currentOrders.length} de {filteredOrders.length} órdenes
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-gray-400 hover:shadow-md transition-shadow">
                    <p className="text-sm text-gray-600 mb-1">Total</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-400 hover:shadow-md transition-shadow">
                    <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-400 hover:shadow-md transition-shadow">
                    <p className="text-sm text-gray-600 mb-1">Procesando</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.processing}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-400 hover:shadow-md transition-shadow">
                    <p className="text-sm text-gray-600 mb-1">Enviadas</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.sent}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-400 hover:shadow-md transition-shadow">
                    <p className="text-sm text-gray-600 mb-1">Entregadas</p>
                    <p className="text-3xl font-bold text-green-600">{stats.delivered}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-400 hover:shadow-md transition-shadow">
                    <p className="text-sm text-gray-600 mb-1">Canceladas</p>
                    <p className="text-3xl font-bold text-red-600">{stats.canceled}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por ID, cliente o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="processing">Procesando</option>
                        <option value="sent">Enviado</option>
                        <option value="delivered">Entregado</option>
                        <option value="canceled">Cancelado</option>
                    </select>

                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Filter className="w-4 h-4" />
                        Filtros
                    </button>

                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                </div>

                {showAdvancedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Desde
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Hasta
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Total mínimo
                            </label>
                            <input
                                type="number"
                                value={minTotal}
                                onChange={(e) => setMinTotal(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Total máximo
                            </label>
                            <input
                                type="number"
                                value={maxTotal}
                                onChange={(e) => setMaxTotal(e.target.value)}
                                placeholder="9999.99"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="md:col-span-2 lg:col-span-4">
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                ID Orden
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => toggleSort('customer_name')}
                            >
                                <div className="flex items-center gap-1">
                                    Cliente
                                    <ArrowUpDown className="w-3 h-3" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => toggleSort('order_date')}
                            >
                                <div className="flex items-center gap-1">
                                    Fecha
                                    <ArrowUpDown className="w-3 h-3" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                                onClick={() => toggleSort('total')}
                            >
                                <div className="flex items-center gap-1">
                                    Total
                                    <ArrowUpDown className="w-3 h-3" />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Acciones
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {currentOrders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No se encontraron órdenes
                                </td>
                            </tr>
                        ) : (
                            currentOrders.map((order) => {
                                const statusInfo = statusConfig[order.status]
                                const StatusIcon = statusInfo?.icon || Clock

                                return (
                                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-sm font-medium text-gray-900">
                                                #{order._id.slice(-8).toUpperCase()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                {order.customer_name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {order.customer_email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(order.order_date).toLocaleDateString('es-MX', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">
                                            ${order.total.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {statusInfo?.label || order.status}
                                </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openDetailModal(order)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Ver detalles"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                        </tbody>
                    </table>
                </div>
                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Mostrar</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value))
                                    setCurrentPage(1)
                                }}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-sm text-gray-600">por página</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <span className="text-sm text-gray-600">
                                Página {currentPage} de {totalPages}
                            </span>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>


            {/* Modal de detalles */}
            {showDetailModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header del modal */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        Orden #{selectedOrder._id.slice(-8).toUpperCase()}
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {new Date(selectedOrder.order_date).toLocaleDateString('es-MX', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <button
                                    onClick={closeDetailModal}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-4 mt-6 border-b border-gray-200">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'details'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <Package className="w-4 h-4 inline mr-2" />
                                    Detalles
                                </button>
                                <button
                                    onClick={() => setActiveTab('customer')}
                                    className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'customer'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <User className="w-4 h-4 inline mr-2" />
                                    Cliente
                                </button>
                                <button
                                    onClick={() => setActiveTab('products')}
                                    className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'products'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <ShoppingBag className="w-4 h-4 inline mr-2" />
                                    Productos
                                </button>
                            </div>
                        </div>

                        {/* Contenido del modal */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Tab: Detalles */}
                            {activeTab === 'details' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Estado de la orden
                                        </label>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${statusConfig[selectedOrder.status]?.color}`}>
                                                {React.createElement(statusConfig[selectedOrder.status]?.icon || Clock, { className: "w-4 h-4" })}
                                                {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                                            </span>

                                            {statusConfig[selectedOrder.status]?.nextStatus && (
                                                <button
                                                    onClick={() => updateOrderStatus(
                                                        selectedOrder._id,
                                                        statusConfig[selectedOrder.status].nextStatus!
                                                    )}
                                                    disabled={updatingStatus}
                                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {updatingStatus
                                                        ? 'Actualizando...'
                                                        : `Marcar como ${statusConfig[statusConfig[selectedOrder.status].nextStatus! as keyof typeof statusConfig]?.label}`
                                                    }
                                                </button>
                                            )}

                                            {selectedOrder.status !== 'canceled' && selectedOrder.status !== 'delivered' && (
                                                <button
                                                    onClick={() => updateOrderStatus(selectedOrder._id, 'canceled')}
                                                    disabled={updatingStatus}
                                                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                >
                                                    Cancelar Orden
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">ID de Orden</p>
                                            <p className="font-mono font-semibold">#{selectedOrder._id.slice(-8).toUpperCase()}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">Total</p>
                                            <p className="text-2xl font-bold text-blue-600">${selectedOrder.total.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">Fecha de Orden</p>
                                            <p className="font-semibold">
                                                {new Date(selectedOrder.order_date).toLocaleDateString('es-MX', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">Productos</p>
                                            <p className="font-semibold">{selectedOrder.details.length} items</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab: Cliente - ✅ CORREGIDO */}
                            {activeTab === 'customer' && (
                                <div className="space-y-6">
                                    {/* Información principal */}
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                                                {selectedOrder.customer_name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                    {selectedOrder.customer_name}
                                                </h3>
                                                <p className="text-gray-600 mb-1">{selectedOrder.customer_email}</p>
                                                {selectedOrder.customer_phone && (
                                                    <p className="text-gray-600 flex items-center gap-2">
                                                        <Phone className="w-4 h-4" />
                                                        {selectedOrder.customer_phone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ID del cliente */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">ID del Cliente</span>
                                            <span className="font-mono font-semibold text-gray-900">
                                    #{selectedOrder.customer_id.slice(-8).toUpperCase()}
                                </span>
                                        </div>
                                    </div>

                                    {/* Dirección de envío */}
                                    {selectedOrder.customer_address && (
                                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <MapPin className="w-5 h-5 text-blue-600" />
                                                <h4 className="text-lg font-semibold text-gray-900">
                                                    Dirección de Envío
                                                </h4>
                                            </div>

                                            {typeof selectedOrder.customer_address === 'string' ? (
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <p className="text-gray-900">{selectedOrder.customer_address}</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {selectedOrder.customer_address.street && (
                                                        <div className="col-span-2">
                                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                                Calle
                                                            </label>
                                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                                <p className="text-gray-900 font-medium">
                                                                    {selectedOrder.customer_address.street}
                                                                    {selectedOrder.customer_address.number &&
                                                                        ` #${selectedOrder.customer_address.number}`
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {selectedOrder.customer_address.references && (
                                                        <div className="col-span-2">
                                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                                <Navigation className="w-3 h-3 inline mr-1" />
                                                                Referencias
                                                            </label>
                                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                                <p className="text-gray-700 text-sm">
                                                                    {selectedOrder.customer_address.references}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Ciudad</label>
                                                        <div className="bg-gray-50 p-3 rounded-lg">
                                                            <p className="text-gray-900 font-medium">
                                                                {selectedOrder.customer_address.city || 'No especificado'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                                                        <div className="bg-gray-50 p-3 rounded-lg">
                                                            <p className="text-gray-900 font-medium">
                                                                {selectedOrder.customer_address.state || 'No especificado'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Código Postal</label>
                                                        <div className="bg-gray-50 p-3 rounded-lg">
                                                            <p className="text-gray-900 font-medium">
                                                                {selectedOrder.customer_address.postal_code || 'No especificado'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">País</label>
                                                        <div className="bg-gray-50 p-3 rounded-lg">
                                                            <p className="text-gray-900 font-medium">
                                                                {selectedOrder.customer_address.country || 'México'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {selectedOrder.customer_address.phone && (
                                                        <div className="col-span-2">
                                                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                                                <Phone className="w-3 h-3 inline mr-1" />
                                                                Teléfono de contacto
                                                            </label>
                                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                                <p className="text-gray-900 font-medium">
                                                                    {selectedOrder.customer_address.phone}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Dirección completa */}
                                                    <div className="col-span-2 mt-4 pt-4 border-t border-gray-200">
                                                        <label className="block text-xs font-medium text-gray-500 mb-2">
                                                            Dirección completa
                                                        </label>
                                                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                                            <p className="text-gray-900 leading-relaxed">
                                                                {formatAddress(selectedOrder.customer_address)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Estadísticas */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4 text-gray-600" />
                                            Estadísticas del cliente
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-blue-600">
                                                    {orders.filter(o => o.customer_id === selectedOrder.customer_id).length}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">Órdenes totales</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-green-600">
                                                    ${orders
                                                    .filter(o => o.customer_id === selectedOrder.customer_id)
                                                    .reduce((sum, o) => sum + o.total, 0)
                                                    .toFixed(2)}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">Total gastado</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                const address = formatAddress(selectedOrder.customer_address)
                                                navigator.clipboard.writeText(address)
                                                showNotification('success', '📋 Dirección copiada al portapapeles')
                                            }}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <MapPin className="w-4 h-4" />
                                            Copiar dirección
                                        </button>

                                        <button
                                            onClick={() => {
                                                window.location.href = `mailto:${selectedOrder.customer_email}`
                                            }}
                                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Contactar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tab: Productos */}
                            {activeTab === 'products' && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg">Productos en la orden</h3>

                                    <div className="space-y-3">
                                        {selectedOrder.details.map((detail, idx) => (
                                            <div key={idx} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900 mb-1">
                                                            {detail.product_name}
                                                        </h4>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <span>Cantidad: {detail.quantity}</span>
                                                            <span>•</span>
                                                            <span>Precio unitario: ${detail.unit_price.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-gray-900">
                                                            ${detail.subtotal.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t pt-4 mt-4">
                                        <div className="flex items-center justify-between text-xl font-bold">
                                            <span>Total:</span>
                                            <span className="text-blue-600">${selectedOrder.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer del modal */}
                        <div className="border-t p-6">
                            <button
                                onClick={closeDetailModal}
                                className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notificación */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl shadow-2xl ${
                    notification.type === 'success' ? 'bg-green-500' :
                        notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                } text-white animate-slide-in`}>
                    <div className="flex items-center gap-3">
                        <p className="font-semibold text-sm flex-1">{notification.message}</p>
                        <button
                            onClick={() => setNotification(null)}
                            className="hover:bg-white/20 rounded p-1 transition-colors"
                        >
                            <X className="w-4 h-4" />
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