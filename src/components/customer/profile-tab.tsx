"use client"

import { useAuth } from "@/context/auth_context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useState } from "react"

export function ProfileTab() {
    const { user } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
    })

    const handleSave = () => {
        // TODO: Implement save functionality
        setIsEditing(false)
    }

    return (
        <div className="max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>Administra tu información personal y de contacto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">


                    <div className="flex gap-3 pt-4">
                        {isEditing ? (
                            <>
                                <Button onClick={handleSave}>Guardar cambios</Button>
                                <Button variant="outline" onClick={() => setIsEditing(false)}>
                                    Cancelar
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setIsEditing(true)}>Editar perfil</Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
