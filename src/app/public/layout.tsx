// app/layout.tsx
import { AuthProvider } from "@/context/auth_context"
import { CartProvider } from "@/context/cart-context"
import "../globals.css"

export const metadata = {
    title: "TiendaOnline - Tu tienda de confianza",
    description: "Compra productos de calidad con envío rápido",
}

export default function RootLayout(
    {children,}:
    { children: React.ReactNode
}) {
    return (
        <AuthProvider>
            <CartProvider>
                {children}
            </CartProvider>
        </AuthProvider>
    )
}