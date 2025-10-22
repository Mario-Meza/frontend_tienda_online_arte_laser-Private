"use client"

import Link from "next/link"
import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"

export default function AdminNavbar() {
    const { user, logout } = useAuth()
    const router = useRouter()

    const handleLogout = () => {
        logout()
        router.push("/login")
    }

    return (
        <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-800">
                    Panel de Administración
                </h2>

                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Ver Tienda
                    </Link>

                    <div className="flex items-center gap-3 border-l pl-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Salir
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}