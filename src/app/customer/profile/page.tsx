"use client"

import { useAuth } from "@/context/auth_context"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button, LinkButton } from "@/components/ui/Button"

export default function ProfilePage() {
    const { user, token, isAuthenticated, logout } = useAuth()
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
    })

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login")
        }
    }, [isAuthenticated, router])

    const handleLogout = () => {
        logout()
        router.push("/")
    }

    const handleSave = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/customers/${user?._id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                setIsEditing(false)
                // Aquí podrías actualizar el contexto de autenticación
            }
        } catch (error) {
            console.error("Error updating profile:", error)
        }
    }

    return (
        <div className="container py-12">
            <h1 className="text-4xl font-bold mb-12">Mi Perfil</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Información Personal</h2>
                            <Button onClick={() => setIsEditing(!isEditing)} variant="secondary" size="sm">
                                {isEditing ? "Cancelar" : "Editar"}
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!isEditing}
                                    className="input disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!isEditing}
                                    className="input disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Teléfono</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={!isEditing}
                                    className="input disabled:opacity-50"
                                />
                            </div>

                            {isEditing && (
                                <Button onClick={handleSave} variant="primary" className="w-full">
                                    Guardar Cambios
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-6">Cuenta</h2>

                        <div className="space-y-3">
                            <LinkButton href="/dashboard" variant="secondary" className="w-full">
                                Dashboard
                            </LinkButton>
                            <LinkButton href="/orders" variant="secondary" className="w-full">
                                Mis Pedidos
                            </LinkButton>
                            <Button onClick={handleLogout} variant="ghost" className="w-full text-destructive">
                                Cerrar Sesión
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
