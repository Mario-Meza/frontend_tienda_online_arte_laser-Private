"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth_context"
import { AdminRoute } from "@/components/shared/AdminRoute"
import Link from "next/link"

interface Stats {
    totalProducts: number
    totalOrders: number
    totalCustomers: number
    totalRevenue: number
    pendingOrders: number
}

export default function AdminDashboard() {
    const { user, token } = useAuth()
    const [stats, setStats] = useState<Stats>({
        totalProducts: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        pendingOrders: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Obtener productos
                const productsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/all`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const products = await productsRes.json()

                // Obtener órdenes
                const ordersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const orders = await ordersRes.json()

                // Obtener clientes
                const customersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/customers`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const customers = await customersRes.json()

                setStats({
                    totalProducts: products.length,
                    totalOrders: orders.length,
                    totalCustomers: customers.length,
                    totalRevenue: orders.reduce((sum: number, order: any) => sum + order.total, 0),
                    pendingOrders: orders.filter((o: any) => o.status === "pending").length,
                })
            } catch (error) {
                console.error("Error fetching stats:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [token])

    return (
        <AdminRoute>
            <div className="container py-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-2">Panel de Administración</h1>
                    <p className="text-muted">Bienvenido, {user?.name}</p>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <h3 className="text-sm font-medium mb-2 opacity-90">Total Productos</h3>
                        <p className="text-4xl font-bold">{stats.totalProducts}</p>
                    </div>

                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <h3 className="text-sm font-medium mb-2 opacity-90">Total Órdenes</h3>
                        <p className="text-4xl font-bold">{stats.totalOrders}</p>
                    </div>

                    <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <h3 className="text-sm font-medium mb-2 opacity-90">Clientes</h3>
                        <p className="text-4xl font-bold">{stats.totalCustomers}</p>
                    </div>

                    <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <h3 className="text-sm font-medium mb-2 opacity-90">Ingresos Totales</h3>
                        <p className="text-4xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                    </div>
                </div>

                {/* Alertas */}
                {stats.pendingOrders > 0 && (
                    <div className="card bg-yellow-50 border-yellow-200 mb-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-yellow-800 mb-1">
                                    ⚠️ Atención Requerida
                                </h3>
                                <p className="text-yellow-700">
                                    Tienes {stats.pendingOrders} órdenes pendientes de procesar
                                </p>
                            </div>
                            <Link href="/admin/admin/orders" className="btn btn-primary">
                                Ver Órdenes
                            </Link>
                        </div>
                    </div>
                )}

                {/* Acciones Rápidas */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">Acciones Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link href="/admin/admin/products" className="card hover:shadow-lg transition-shadow">
                            <div className="text-center">
                                <div className="text-4xl mb-3">📦</div>
                                <h3 className="font-bold mb-2">Gestionar Productos</h3>
                                <p className="text-sm text-gray-500">Ver y editar productos</p>
                            </div>
                        </Link>

                        <Link href="/admin/admin/orders" className="card hover:shadow-lg transition-shadow">
                            <div className="text-center">
                                <div className="text-4xl mb-3">📋</div>
                                <h3 className="font-bold mb-2">Gestionar Órdenes</h3>
                                <p className="text-sm text-gray-500">Ver y actualizar órdenes</p>
                            </div>
                        </Link>

                        <Link href="/admin/admin/customers" className="card hover:shadow-lg transition-shadow">
                            <div className="text-center">
                                <div className="text-4xl mb-3">👥</div>
                                <h3 className="font-bold mb-2">Ver Clientes</h3>
                                <p className="text-sm text-gray-500">Administrar usuarios</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </AdminRoute>
    )
}