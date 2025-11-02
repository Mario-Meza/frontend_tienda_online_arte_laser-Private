// components/layout/Navbar.tsx
"use client"

import Link from "next/link"
import { useAuth } from "@/context/auth_context"
import { useCart } from "@/context/cart-context"
import { useRouter } from "next/navigation"
import { Button, LinkButton } from "@/components/ui/Button"

export default function Navbar() {
    const { user, isAuthenticated, isAdmin, logout } = useAuth()
    const { itemCount } = useCart()
    const router = useRouter()

    const handleLogout = () => {
        logout()
        router.push("/")
    }

    return (
        <nav className="bg-orange-500 text-primary-foreground border-b border-neutral-200">
            <div className="container flex items-center justify-between h-16">
                <Link href="/" prefetch={false} className="text-2xl font-bold">
                    Arte Láser
                </Link>

                <div className="flex items-center gap-6">
                    {isAdmin ? (
                        <></>
                    ): (

                        <Link href="/" prefetch={false} className="hover:text-accent transition-colors">
                        Inicio
                        </Link>
                    )}

                    {isAuthenticated ? (
                        <>
                            {isAdmin ? (
                                <>
                                    <Link href="/admin/admin/dashboard" prefetch={false} className="hover:text-accent transition-colors">
                                        📊 Dashboard
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/customer/cart" prefetch={false} className="relative hover:text-accent transition-colors">
                                        Carrito
                                        {itemCount > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                {itemCount}
                                            </span>
                                        )}
                                    </Link>
                                </>
                            )}

                            <div className="flex items-center gap-3">
                                <span className="text-sm">
                                    {isAdmin ? (
                                        // ✅ Si es admin, solo muestra el texto sin link
                                        <>Hola, {user?.name}</>
                                    ) : (
                                        // ✅ Si es cliente, que sí sea un link
                                        <Link href="/customer/dashboard" className="hover:text-accent transition-colors" prefetch={false}>
                                            Hola, {user?.name}
                                        </Link>
                                    )}
                                    {isAdmin && (
                                        <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded">
                                            ADMIN
                                        </span>
                                    )}
                                </span>
                                <Button variant="secondary" size="sm" onClick={handleLogout}>
                                    Salir
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <LinkButton href="/login" className="btn btn-primary text-sm">
                                Iniciar Sesión
                            </LinkButton>
                            <LinkButton href="/register" className="btn btn-primary text-sm">
                                Registrarse
                            </LinkButton>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}