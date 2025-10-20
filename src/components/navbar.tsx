"use client"

import Link from "next/link"
import { useAuth } from "@/context/auth_context"
import { useCart } from "@/context/cart-context"
import { useRouter } from "next/navigation"
import { Button, LinkButton } from "@/components/button"

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth()
    const { itemCount } = useCart()
    const router = useRouter()

    const handleLogout = () => {
        logout()
        router.push("/")
    }

    return (
        <nav className="bg-primary text-primary-foreground border-b border-neutral-200">
            <div className="container flex items-center justify-between h-16">
                <Link href="/" className="text-2xl font-bold">
                    TiendaOnline
                </Link>

                <div className="flex items-center gap-6">
                    <Link href="/products" className="hover:text-accent transition-colors">
                        Productos
                    </Link>

                    {isAuthenticated ? (
                        <>
                            <Link href="/orders" className="hover:text-accent transition-colors">
                                Mis Pedidos
                            </Link>
                            <Link href="/cart" className="relative hover:text-accent transition-colors">
                                Carrito
                                {itemCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                                )}
                            </Link>
                            <div className="flex items-center gap-3">
                                <span className="text-sm">{user?.email}</span>
                                <Button variant="secondary" size="sm" onClick={handleLogout}>
                                    Salir
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <LinkButton href="/login" className="btn btn-secondary text-sm">
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
