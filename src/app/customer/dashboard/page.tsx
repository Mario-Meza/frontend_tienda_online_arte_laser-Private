"use client"
import { useAuth } from "@/context/auth_context"
import { ProtectedRoute } from "@/components/shared/ProtectedRoute"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileTab } from "@/components/customer/profile-tab"
import { FavoritesTab } from "@/components/customer/favorites-tab"
import { OrdersList } from "@/components/customer/OrderList"
import {useEffect} from "react";
import {useRouter} from "next/navigation";
export default function CustomerProfile() {
    const { user } = useAuth()
    const { isAdmin, isAuthenticated, token } = useAuth()
    const router = useRouter()

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }
    useEffect(() => {
        if (isAdmin) {
            router.push("/admin/admin/dashboard"); // o la ruta que prefieras
        }
    }, [isAdmin, router]);

    const getMemberSince = () => {
        if (!user?.createdAt) return "Miembro desde 2024"
        const date = new Date(user.createdAt)
        return `Miembro desde ${date.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}`
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <div className="border-b border-border">
                    <div className="container py-8 md:py-12">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <Avatar className="h-24 w-24 md:h-32 md:w-32">
                                <AvatarFallback className="text-2xl md:text-3xl font-bold bg-primary text-primary-foreground">
                                    {user?.name ? getInitials(user.name) : "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-balance">{user?.name || "Usuario"}</h1>
                                <p className="text-muted-foreground text-sm md:text-base">{getMemberSince()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container py-6">
                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 mb-8">
                            <TabsTrigger
                                value="profile"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                            >
                                Perfil
                            </TabsTrigger>
                            <TabsTrigger
                                value="orders"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                            >
                                Pedidos
                            </TabsTrigger>
                            <TabsTrigger
                                value="favorites"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                            >
                                Favoritos
                            </TabsTrigger>
                            <TabsTrigger
                                value="settings"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                            >
                                Configuración
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="mt-0">
                            <ProfileTab />
                        </TabsContent>

                        <TabsContent value="orders" className="mt-0">
                            <OrdersList />
                        </TabsContent>

                        <TabsContent value="favorites" className="mt-0">
                            <FavoritesTab />
                        </TabsContent>

                    </Tabs>
                </div>
            </div>
        </ProtectedRoute>
    )
}
