"use client"

import { useAuth } from "@/context/auth_context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useState, useEffect } from "react"
import { Eye, EyeOff, User, Mail, Phone, MapPin, Lock } from "lucide-react"

type NotificationType = 'success' | 'error' | 'info'

export function ProfileTab() {
    const { user, token, refreshUser } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [notification, setNotification] = useState<{type: NotificationType, message: string} | null>(null)

    const [formData, setFormData] = useState({
        name: user?.name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: user?.address || "",
    })

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    // Actualizar formData cuando cambie el usuario
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                phone: user.phone || "",
                address: user.address || "",
            })
        }
    }, [user])

    const showNotification = (type: NotificationType, message: string) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), 5000)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({
            ...passwordData,
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
        return true
    }

    const validatePassword = () => {
        if (!passwordData.currentPassword) {
            showNotification('error', 'Debes ingresar tu contraseña actual')
            return false
        }
        if (!passwordData.newPassword) {
            showNotification('error', 'Debes ingresar una nueva contraseña')
            return false
        }
        if (passwordData.newPassword.length < 6) {
            showNotification('error', 'La contraseña debe tener al menos 6 caracteres')
            return false
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showNotification('error', 'Las contraseñas no coinciden')
            return false
        }
        return true
    }

    const handleSaveProfile = async () => {
        if (!validateForm()) return

        setLoading(true)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/customers/${user?._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        last_name: formData.last_name,
                        email: formData.email,
                        phone: formData.phone || undefined,
                        address: formData.address || undefined,
                    })
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "Error al actualizar perfil")
            }

            showNotification('success', '✅ Perfil actualizado correctamente')
            setIsEditing(false)

            // Refrescar datos del usuario
            if (refreshUser) {
                await refreshUser()
            }
        } catch (err) {
            console.error("Error al actualizar perfil:", err)
            showNotification('error', err instanceof Error ? err.message : 'Error al actualizar perfil')
        } finally {
            setLoading(false)
        }
    }

    const handleChangePassword = async () => {
        if (!validatePassword()) return

        setLoading(true)
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/customers/${user?._id}/change-password`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        current_password: passwordData.currentPassword,
                        new_password: passwordData.newPassword
                    })
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "Error al cambiar contraseña")
            }

            showNotification('success', '✅ Contraseña actualizada correctamente')
            setIsChangingPassword(false)
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            })
        } catch (err) {
            console.error("Error al cambiar contraseña:", err)
            showNotification('error', err instanceof Error ? err.message : 'Error al cambiar contraseña')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setFormData({
            name: user?.name || "",
            last_name: user?.last_name || "",
            email: user?.email || "",
            phone: user?.phone || "",
            address: user?.address || "",
        })
        setIsEditing(false)
    }

    const handleCancelPassword = () => {
        setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        })
        setIsChangingPassword(false)
    }

    return (
        <div className="max-w-2xl space-y-6">
            {/* Información Personal */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Información Personal
                    </CardTitle>
                    <CardDescription>
                        Administra tu información personal y de contacto
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Nombre */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Nombre completo
                        </label>
                        {isEditing ? (
                            <Input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Tu nombre completo"
                            />
                        ) : (
                            <p className="text-muted-foreground">{formData.name || "No especificado"}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Apellidos
                        </label>
                        {isEditing ? (
                            <Input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                placeholder="Apellidos"
                            />
                        ) : (
                            <p className="text-muted-foreground">{formData.last_name || "No especificado"}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                        </label>
                        {isEditing ? (
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="tu@email.com"
                            />
                        ) : (
                            <p className="text-muted-foreground">{formData.email || "No especificado"}</p>
                        )}
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Teléfono
                        </label>
                        {isEditing ? (
                            <Input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="(123) 456-7890"
                            />
                        ) : (
                            <p className="text-muted-foreground">{formData.phone || "No especificado"}</p>
                        )}
                    </div>

                    {/* Dirección */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Dirección
                        </label>
                        {isEditing ? (
                            <Input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Calle, número, colonia, ciudad"
                            />
                        ) : (
                            <p className="text-muted-foreground">{formData.address || "No especificado"}</p>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-4 border-t border-border">
                        {isEditing ? (
                            <>
                                <Button onClick={handleSaveProfile} disabled={loading}>
                                    {loading ? "Guardando..." : "Guardar cambios"}
                                </Button>
                                <Button onClick={handleCancel} disabled={loading}>
                                    Cancelar
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setIsEditing(true)}>
                                Editar perfil
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Cambiar Contraseña */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Seguridad
                    </CardTitle>
                    <CardDescription>
                        Actualiza tu contraseña para mantener tu cuenta segura
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isChangingPassword ? (
                        <>
                            {/* Contraseña actual */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Contraseña actual
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Tu contraseña actual"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Nueva contraseña */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Nueva contraseña
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showNewPassword ? "text" : "password"}
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirmar contraseña */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Confirmar nueva contraseña
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Repite tu nueva contraseña"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3 pt-4 border-t border-border">
                                <Button onClick={handleChangePassword} disabled={loading}>
                                    {loading ? "Actualizando..." : "Cambiar contraseña"}
                                </Button>
                                <Button  onClick={handleCancelPassword} disabled={loading}>
                                    Cancelar
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div>
                            <p className="text-sm text-muted-foreground mb-4">
                                Es recomendable cambiar tu contraseña periódicamente para mantener tu cuenta segura.
                            </p>
                            <Button  onClick={() => setIsChangingPassword(true)}>
                                Cambiar contraseña
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Notificación Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-2xl shadow-2xl transition-all duration-300 ${
                    notification.type === 'success' ? 'bg-emerald-500' :
                        notification.type === 'error' ? 'bg-rose-500' :
                            'bg-blue-500'
                } text-white animate-slide-in`}>
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            {notification.type === 'success' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {notification.type === 'error' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            {notification.type === 'info' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm leading-relaxed">{notification.message}</p>
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            className="flex-shrink-0 hover:bg-white/20 rounded-full p-1 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
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