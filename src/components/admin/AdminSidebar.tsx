"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
    {
        label: "Dashboard",
        href: "/admin/admin/dashboard",
        icon: "📊"
    },
    {
        label: "Productos",
        href: "/admin/admin/products",
        icon: "📦"
    },
    {
        label: "Órdenes",
        href: "/admin/admin/orders",
        icon: "📋"
    },
    {
        label: "Clientes",
        href: "/admin/admin/customers",
        icon: "👥"
    },
]

export default function AdminSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-gray-900 text-white">
            <div className="p-6">
                <h1 className="text-2xl font-bold">TiendaOnline</h1>
                <p className="text-xs text-gray-400 mt-1">Panel Admin</p>
            </div>

            <nav className="mt-6">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={false}
                            className={`
                flex items-center gap-3 px-6 py-3 text-sm
                transition-colors
                ${isActive
                                ? 'bg-gray-800 text-white border-l-4 border-blue-500'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }
              `}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}