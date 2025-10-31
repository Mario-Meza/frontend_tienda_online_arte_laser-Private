"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/context/auth_context"
import { AdminRoute } from "@/components/shared/AdminRoute"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Search, Package, Truck, CheckCircle, XCircle, Clock, Eye } from "lucide-react"

interface OrderDetail {
    product_id: string
    product_name?: string
    quantity: number
    unit_price: number
    subtotal: number
}

interface Order {
    _id: string
    customer_id: string
    customer_name?: string
    customer_email?: string
    status: string
    order_date: string
    total: number
    details: OrderDetail[]
    shipping_address?: string
}

interface Customer {
    _id: string
    name: string
    email: string
    address?: string
}

interface Product {
    _id: string
    name: string
    price: number
}

type NotificationType = 'success' | 'error' | 'info'

const statusConfig = {
    pending: {
        label: "Pendiente",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        nextStatus: "processing"
    },
    processing: {
        label: "Procesando",
        color: "bg-blue-100 text-blue-800",
        icon: Package,
        nextStatus: "sent"
    },
    sent: {
        label: "Enviado",
        color: "bg-purple-100 text-purple-800",
        icon: Truck,
        nextStatus: "delivered"
    },
    delivered: {
        label: "Entregado",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        nextStatus: null
    },
    canceled: {
        label: "Cancelado",
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        nextStatus: null
    }
}

export default function AdminOrdersPage() {
    const { token } = useAuth()
    const [orders, setOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [customers, setCustomers] = useState<Record<string, Customer>>({})
    const [products, setProducts] = useState<Record<string, Product>>({})
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [notification, setNotification] = useState<{type: NotificationType, message: string} | null>(null)

    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [updatingStatus, setUpdatingStatus] = useState(false)

    const showNotification = (type: NotificationType, message: string) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 5000)
    }

    // Cargar órdenes, clientes y productos
    useEffect(() => {
        fetchAllData()
    }, [token])

    // Filtrar órdenes
    useEffect(() => {
        let filtered = orders

        // Filtrar por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(order =>
                order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Filtrar por estado
        if (statusFilter !== "all") {
            filtered = filtered.filter(order => order.status === statusFilter)
        }

        setFilteredOrders(filtered)
    }, [searchTerm, statusFilter, orders])

    const fetchAllData = async () => {
        setLoading(true)
        try {
            // Cargar órdenes
            const ordersResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            )
            if (!ordersResponse.ok) throw new Error("Error al cargar órdenes")
            const ordersData = await ordersResponse.json()

            // Cargar clientes - inicializar fuera del if
            const customersMap: Record<string, Customer> = {}
            const customersResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/customers`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            )
            if (customersResponse.ok) {
                const customersData = await customersResponse.json()
                customersData.forEach((customer: Customer) => {
                    customersMap[customer._id] = customer
                })
                setCustomers(customersMap)
            }

            // Cargar productos - inicializar fuera del if
            const productsMap: Record<string, Product> = {}
            const productsResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/all`
            )
            if (productsResponse.ok) {
                const productsData = await productsResponse.json()
                productsData.forEach((product: Product) => {
                    productsMap[product._id] = product
                })
                setProducts(productsMap)
            }

            // Enriquecer órdenes con información de clientes y productos
            const enrichedOrders = ordersData.map((order: Order) => {
                const customer = customersMap[order.customer_id]
                const enrichedDetails = order.details.map(detail => ({
                    ...detail,
                    product_name: productsMap[detail.product_id]?.name || 'Producto no encontrado'
                }))

                return {
                    ...order,
                    customer_name: customer?.name || 'Cliente no encontrado',
                    customer_email: customer?.email || '',
                    shipping_address: customer?.address || '',
                    details: enrichedDetails
                }
            })

            setOrders(enrichedOrders)
            setFilteredOrders(enrichedOrders)
        } catch (err) {
            console.error("Error:", err)
            showNotification('error', 'Error al cargar datos')
        } finally {
            setLoading(false)
        }
    }

    const openDetailModal = (order: Order) => {
        setSelectedOrder(order)
        setShowDetailModal(true)
    }

    const closeDetailModal = () => {
        setShowDetailModal(false)
        setSelectedOrder(null)
    }

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdatingStatus(true)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${orderId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: newStatus })
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "Error al actualizar estado")
            }

            showNotification('success', `✅ Estado actualizado a: ${statusConfig[newStatus as keyof typeof statusConfig].label}`)
            fetchAllData()
            closeDetailModal()
        } catch (err) {
            console.error("Error:", err)
            showNotification('error', err instanceof Error ? err.message : 'Error al actualizar estado')
        } finally {
            setUpdatingStatus(false)
        }
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

    if (loading) {
        return (
            <AdminRoute>
                <div className="container py-12">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Cargando órdenes...</p>
                        </div>
                    </div>
                </div>
            </AdminRoute>
        )
    }

    const stats = getStatusStats()

    return (
        <AdminRoute>
            <div className="container py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Gestión de Órdenes</h1>
                    <p className="text-muted-foreground">
                        {filteredOrders.length} {filteredOrders.length === 1 ? 'orden' : 'órdenes'}
                    </p>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                        <p className="text-sm text-gray-600">Pendientes</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                        <p className="text-sm text-gray-600">Procesando</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                        <p className="text-sm text-gray-600">Enviadas</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.sent}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                        <p className="text-sm text-gray-600">Entregadas</p>
                        <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                        <p className="text-sm text-gray-600">Canceladas</p>
                        <p className="text-2xl font-bold text-red-600">{stats.canceled}</p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {/* Búsqueda */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Buscar por ID, cliente o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filtro por estado */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="processing">Procesando</option>
                        <option value="sent">Enviado</option>
                        <option value="delivered">Entregado</option>
                        <option value="canceled">Cancelado</option>
                    </select>
                </div>

                {/* Tabla de órdenes */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    ID Orden
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Cliente
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Total
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
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm || statusFilter !== "all"
                                            ? 'No se encontraron órdenes con los filtros aplicados'
                                            : 'No hay órdenes registradas'}
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock
                                    const statusInfo = statusConfig[order.status as keyof typeof statusConfig]

                                    return (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-sm font-medium">
                                                    #{order._id.slice(-8)}
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
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">
                                                ${order.total.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusInfo?.label || order.status}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openDetailModal(order)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
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
                </div>

                {/* Modal de Detalles */}
                {showDetailModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">
                                            Orden #{selectedOrder._id.slice(-8)}
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
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
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Estado actual */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Estado de la orden
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${statusConfig[selectedOrder.status as keyof typeof statusConfig]?.color}`}>
                                            {React.createElement(statusConfig[selectedOrder.status as keyof typeof statusConfig]?.icon || Clock, { className: "w-4 h-4" })}
                                            {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.label || selectedOrder.status}
                                        </span>

                                        {/* Botón para avanzar estado */}
                                        {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.nextStatus && (
                                            <Button
                                                onClick={() => updateOrderStatus(
                                                    selectedOrder._id,
                                                    statusConfig[selectedOrder.status as keyof typeof statusConfig].nextStatus!
                                                )}
                                                disabled={updatingStatus}
                                                className="text-sm"
                                            >
                                                {updatingStatus ? 'Actualizando...' : `Marcar como ${statusConfig[statusConfig[selectedOrder.status as keyof typeof statusConfig].nextStatus! as keyof typeof statusConfig]?.label}`}
                                            </Button>
                                        )}

                                        {/* Botón cancelar (solo si no está cancelada ni entregada) */}
                                        {selectedOrder.status !== 'canceled' && selectedOrder.status !== 'delivered' && (
                                            <Button
                                                onClick={() => updateOrderStatus(selectedOrder._id, 'canceled')}
                                                disabled={updatingStatus}
                                                className="text-sm bg-red-600 hover:bg-red-700"
                                            >
                                                Cancelar Orden
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Información del cliente */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-3">Información del Cliente</h3>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-gray-600">Nombre:</span>
                                            <span className="ml-2 font-medium">{selectedOrder.customer_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Email:</span>
                                            <span className="ml-2">{selectedOrder.customer_email}</span>
                                        </div>
                                        {selectedOrder.shipping_address && (
                                            <div>
                                                <span className="text-gray-600">Dirección de envío:</span>
                                                <span className="ml-2">{selectedOrder.shipping_address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Productos */}
                                <div>
                                    <h3 className="font-semibold mb-3">Productos</h3>
                                    <div className="space-y-3">
                                        {selectedOrder.details.map((detail, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="font-medium">{detail.product_name}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {detail.quantity} x ${detail.unit_price.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="font-semibold">
                                                    ${detail.subtotal.toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between text-xl font-bold">
                                        <span>Total:</span>
                                        <span className="text-blue-600">${selectedOrder.total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Botón cerrar */}
                                <div className="border-t pt-4">
                                    <Button
                                        onClick={closeDetailModal}
                                        className="w-full bg-gray-500 hover:bg-gray-600"
                                    >
                                        Cerrar
                                    </Button>
                                </div>
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