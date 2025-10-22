"use client"

import { AdminRoute } from "@/components/shared/AdminRoute"
import AdminNavbar from "@/components/admin/AdminNavbar"
import AdminSidebar from "@/components/admin/AdminSidebar"

export default function AdminLayout(
    {children,}:
    { children: React.ReactNode })
{
    return (
        <AdminRoute>
            <div className="flex h-screen bg-gray-100">
                <AdminSidebar />
                <div className="flex-1 flex flex-col">
                    <AdminNavbar />  {/* ✅ Navbar de admin diferente */}
                    <main className="flex-1 overflow-y-auto p-6">
                        {children}
                    </main>
                </div>
            </div>
        </AdminRoute>
    )
}