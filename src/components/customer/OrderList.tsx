"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth_context"
import { Package, Truck, CheckCircle, XCircle, Clock, Eye, X, AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { API_URL } from "@/api_config"


interface Address {
    street: string;
    number?: string;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
    references?: string;
}

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
    status: string
    order_date: string
    total: number
    details: OrderDetail[]
    deleted?: boolean
}

interface Product {
    _id: string
    name: string
    price: number
    stock: number
    category: string
    images: string[]
    main_image?: string
}

interface Customer {
    _id: string
    name: string
    email: string
    address: Address | string; // 👈 ACTUALIZA ESTO: Puede ser objeto o string
    phone: string
}

const statusConfig = {
    pending: {
        label: "Pendiente de pago",
        description: "Completa el pago para procesar tu pedido",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        step: 1,
        canCancel: false
    },
    processing: {
        label: "Procesando",
        description: "Estamos preparando tu pedido",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Package,
        step: 2,
        canCancel: true
    },
    sent: {
        label: "Enviado",
        description: "Tu pedido está en camino",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Truck,
        step: 3,
        canCancel: false
    },
    delivered: {
        label: "Entregado",
        description: "Tu pedido ha sido entregado",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        step: 4,
        canCancel: false
    },
    canceled: {
        label: "Cancelado",
        description: "Este pedido fue cancelado",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        step: 0,
        canCancel: false
    }
}

interface OrdersListProps {
    showHeader?: boolean
    maxOrders?: number
    showCanceled?: boolean
}

export function OrdersList({ showHeader = true, maxOrders, showCanceled = false }: OrdersListProps) {
    const [orders, setOrders] = useState<Order[]>([])
    const [products, setProducts] = useState<Record<string, Product>>({})
    const [customerData, setCustomerData] = useState<Customer | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

    // Modal states
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [canceling, setCanceling] = useState(false)

    // Notification state
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info'
        message: string
    } | null>(null)

    const { user, token } = useAuth()

    // 👇 AGREGA ESTA FUNCIÓN AQUÍ
    const formatAddress = (address: Address | string | undefined | null): string => {
        if (!address) return "Dirección no disponible";

        // Si es string (datos viejos), devolverlo tal cual
        if (typeof address === 'string') return address;

        // Si es objeto, formatearlo
        return `${address.street} ${address.number ? '#' + address.number : ''}, ${address.city}, ${address.state}, CP ${address.postal_code}`;
    }

    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 5000)
    }

    const enrichOrdersWithProducts = (orders: Order[], productsMap: Record<string, Product>): Order[] => {
        return orders.map(order => ({
            ...order,
            details: order.details.map(detail => ({
                ...detail,
                product_name: productsMap[detail.product_id]?.name || 'Producto no disponible'
            }))
        }))
    }

    const fetchCustomerData = async () => {
        if (!user) return

        try {
            const response = await fetch(
                `${API_URL}/api/v1/customers/me`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (response.ok) {
                const data = await response.json()
                setCustomerData(data)
            }
        } catch (err) {
            console.error("Error cargando datos del cliente:", err)
        }
    }

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${API_URL}/api/v1/products/all`)
            if (!response.ok) throw new Error("Error al cargar productos")

            const productsData: Product[] = await response.json()
            const productsMap: Record<string, Product> = {}
            productsData.forEach((product) => {
                productsMap[product._id] = product
            })
            setProducts(productsMap)
            return productsMap
        } catch (err) {
            console.error("Error cargando productos:", err)
            return {}
        }
    }

    const fetchOrders = async (showLoader = true, productsMap?: Record<string, Product>) => {
        if (!user) return

        if (showLoader) setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${API_URL}/api/v1/orders`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) throw new Error("Error al cargar pedidos")
            const data: Order[] = await response.json()

            let userOrders = data.filter((order) => order.customer_id === user._id)

            if (!showCanceled) {
                userOrders = userOrders.filter(order =>
                    order.status !== 'canceled' &&
                    order.status !== 'pending' &&
                    !order.deleted
                )
            }

            const currentProducts = productsMap || products
            const enrichedOrders = enrichOrdersWithProducts(userOrders, currentProducts)

            enrichedOrders.sort((a, b) =>
                new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
            )

            setOrders(enrichedOrders)
            setLastUpdate(new Date())
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido")
        } finally {
            if (showLoader) setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            const loadData = async () => {
                const productsMap = await fetchProducts()
                await fetchOrders(true, productsMap)
                fetchCustomerData()
            }
            loadData()
        }
    }, [user, showCanceled])

    useEffect(() => {
        if (orders.length > 0 && Object.keys(products).length > 0) {
            setOrders(prevOrders => enrichOrdersWithProducts(prevOrders, products))
        }
    }, [products])

    useEffect(() => {
        if (!user) return

        const interval = setInterval(() => {
            fetchOrders(false, products)
        }, 30000)

        return () => clearInterval(interval)
    }, [user, token, products, showCanceled])

    const handleCancelOrder = async () => {
        if (!selectedOrder) return

        setCanceling(true)
        try {
            const response = await fetch(
                `${API_URL}/api/v1/orders/${selectedOrder._id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status: "canceled" }),
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "Error al cancelar el pedido")
            }

            showNotification('success', '✅ Pedido cancelado exitosamente')
            await fetchOrders(false)
            closeCancelModal()
        } catch (err) {
            showNotification('error', err instanceof Error ? err.message : 'Error al cancelar pedido')
        } finally {
            setCanceling(false)
        }
    }

    const handleReorder = async (order: Order) => {
        try {
            showNotification('info', '🛒 Función de reordenar próximamente')
            console.log("Reordenando productos:", order.details)
        } catch (err) {
            showNotification('error', 'Error al reordenar')
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

    const openCancelModal = (order: Order) => {
        setSelectedOrder(order)
        setShowCancelModal(true)
    }

    const closeCancelModal = () => {
        setShowCancelModal(false)
        setSelectedOrder(null)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando pedidos...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-6">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-semibold mb-2">Error al cargar pedidos</p>
                    <p className="text-sm mb-4">{error}</p>
                    <button
                        onClick={() => fetchOrders()}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                    {showCanceled ? 'No tienes pedidos cancelados' : 'No tienes pedidos activos'}
                </h3>
                <p className="text-gray-600 mb-6">
                    {showCanceled
                        ? 'Todos tus pedidos están en buen estado'
                        : 'Comienza a comprar para ver tus pedidos aquí'
                    }
                </p>
                {!showCanceled && (
                    <Link href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Ver Productos
                    </Link>
                )}
            </div>
        )
    }

    const displayOrders = maxOrders ? orders.slice(0, maxOrders) : orders

    return (
        <div>
            {showHeader && (
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Mis Pedidos</h2>
                        <p className="text-gray-600">{orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-500">
                            Última actualización: {lastUpdate.toLocaleTimeString("es-ES")}
                        </p>
                        {maxOrders && orders.length > maxOrders && (
                            <Link href="/customer/orders" className="text-sm text-blue-600 hover:underline">
                                Ver todos ({orders.length})
                            </Link>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {displayOrders.map((order) => {
                    const statusInfo = statusConfig[order.status as keyof typeof statusConfig]
                    const StatusIcon = statusInfo.icon

                    return (
                        <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold">
                                                Pedido #{order._id.slice(-8).toUpperCase()}
                                            </h3>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}>
                                                <StatusIcon className="w-4 h-4" />
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {new Date(order.order_date).toLocaleDateString('es-MX', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-blue-600">
                                            ${order.total.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {order.details.length} {order.details.length === 1 ? 'producto' : 'productos'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {order.status !== 'canceled' && (
                                <div className="px-6 py-4 bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                        {['pending', 'processing', 'sent', 'delivered'].map((status, index) => {
                                            const config = statusConfig[status as keyof typeof statusConfig]
                                            const isActive = config.step <= statusInfo.step
                                            const isCurrent = config.step === statusInfo.step

                                            return (
                                                <div key={status} className="flex-1 flex items-center">
                                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                                                        isActive
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'bg-white border-gray-300 text-gray-400'
                                                    } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}>
                                                        {isActive && <config.icon className="w-4 h-4" />}
                                                    </div>
                                                    {index < 3 && (
                                                        <div className={`flex-1 h-1 mx-2 rounded ${
                                                            config.step < statusInfo.step ? 'bg-blue-600' : 'bg-gray-300'
                                                        }`} />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <p className="text-sm text-gray-600 text-center mt-2">
                                        {statusInfo.description}
                                    </p>
                                </div>
                            )}

                            <div className="p-6 border-b border-gray-200">
                                <div className="space-y-2">
                                    {order.details.slice(0, 2).map((detail, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700">
                                                {detail.quantity}x {detail.product_name}
                                            </span>
                                            <span className="font-medium">
                                                ${detail.subtotal.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                    {order.details.length > 2 && (
                                        <p className="text-sm text-gray-500">
                                            +{order.details.length - 2} producto(s) más
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 flex items-center justify-between gap-3">
                                <button
                                    onClick={() => openDetailModal(order)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    Ver Detalles
                                </button>

                                {statusInfo.canCancel && (
                                    <button
                                        onClick={() => openCancelModal(order)}
                                        className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Cancelar
                                    </button>
                                )}

                                {order.status === 'delivered' && (
                                    <button
                                        onClick={() => handleReorder(order)}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Reordenar
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal de Detalles */}
            {showDetailModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Pedido #{selectedOrder._id.slice(-8).toUpperCase()}
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

                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="font-semibold mb-3">Estado del Pedido</h3>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${statusConfig[selectedOrder.status as keyof typeof statusConfig].color}`}>
                                    {(() => {
                                        const StatusIcon = statusConfig[selectedOrder.status as keyof typeof statusConfig].icon
                                        return <StatusIcon className="w-5 h-5" />
                                    })()}
                                    <span className="font-medium">
                                        {statusConfig[selectedOrder.status as keyof typeof statusConfig].label}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    {statusConfig[selectedOrder.status as keyof typeof statusConfig].description}
                                </p>
                            </div>

                            {/* Busca esto alrededor de la línea 430-435 */}
                            {customerData?.address && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <Truck className="w-5 h-5 text-gray-600" />
                                        Dirección de Envío
                                    </h3>
                                    {/* 👇 AQUÍ ESTÁ EL FIX 👇 */}
                                    <p className="text-gray-700">
                                        {formatAddress(customerData.address)}
                                    </p>
                                    {customerData.phone && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Tel: {customerData.phone}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold mb-3">Productos</h3>
                                <div className="space-y-3">
                                    {selectedOrder.details.map((detail, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{detail.product_name}</p>
                                                <p className="text-sm text-gray-600">
                                                    Cantidad: {detail.quantity} × ${detail.unit_price.toFixed(2)}
                                                </p>
                                                <Link
                                                    href={`/public/products/${detail.product_id}`}
                                                    className="text-sm font-medium text-blue-600 hover:underline"
                                                >
                                                    Ver producto
                                                </Link>
                                            </div>
                                            <div className="font-semibold text-gray-900">
                                                ${detail.subtotal.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex items-center justify-between text-xl">
                                    <span className="font-bold">Total:</span>
                                    <span className="font-bold text-blue-600">
                                        ${selectedOrder.total.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t pt-4 flex gap-3">
                                {statusConfig[selectedOrder.status as keyof typeof statusConfig].canCancel && (
                                    <button
                                        onClick={() => {
                                            closeDetailModal()
                                            openCancelModal(selectedOrder)
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <XCircle className="w-5 h-5" />
                                        Cancelar Pedido
                                    </button>
                                )}
                                {selectedOrder.status === 'delivered' && (
                                    <button
                                        onClick={() => {
                                            handleReorder(selectedOrder)
                                            closeDetailModal()
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                        Volver a Pedir
                                    </button>
                                )}
                                <button
                                    onClick={closeDetailModal}
                                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Cancelación */}
            {showCancelModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">¿Cancelar Pedido?</h3>
                                <p className="text-gray-600">
                                    ¿Estás seguro de que deseas cancelar el pedido <span className="font-mono font-semibold">#{selectedOrder._id.slice(-8).toUpperCase()}</span>?
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={closeCancelModal}
                                disabled={canceling}
                                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                No, Mantener
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={canceling}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {canceling ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Cancelando...
                                    </>
                                ) : (
                                    'Sí, Cancelar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notificación Toast */}
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