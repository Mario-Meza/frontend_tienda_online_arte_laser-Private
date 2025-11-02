// app/layout.tsx
"use client" // ✅ Agregar esto

import { AuthProvider } from "@/context/auth_context"
import { CartProvider } from "@/context/cart-context"
import Navbar from "@/components/layout/Navbar"
import "./globals.css"
import {Button} from "@/components/ui/Button";

export default function RootLayout({children,}: { children: React.ReactNode }) {
    return (
        <html lang="es">
        <body>
        <AuthProvider>
            <CartProvider>
                <Navbar />
                {children}
            </CartProvider>
        </AuthProvider>
        </body>
        </html>
    )
}




