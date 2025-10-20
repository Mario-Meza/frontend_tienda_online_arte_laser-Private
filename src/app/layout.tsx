import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/auth_context"
import { CartProvider } from "@/context/cart-context"
import Navbar from "@/components/navbar"
import { ToastContainer } from "@/components/notification_toast"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "E-Commerce - Tienda Online",
    description: "Plataforma de compras con integración Stripe",
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
        <body className={`${geistSans.className} bg-background text-foreground`}>
        <AuthProvider>
            <CartProvider>
                <Navbar />
                <main className="min-h-screen">{children}</main>
                <ToastContainer />
            </CartProvider>
        </AuthProvider>
        </body>
        </html>
    )
}
