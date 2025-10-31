"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth_context"

// 🛒 Modelo de producto en el carrito
export interface CartItem {
    product_id: string
    name: string
    price: number
    quantity: number
    image?: string
}

interface CartContextType {
    items: CartItem[]
    addItem: (item: CartItem) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    total: number
    itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const { user } = useAuth()

    // 🧩 Clave dinámica del carrito por usuario
    const getCartKey = () => (user ? `cart_${user._id}` : "cart_guest")

    // ✅ Cargar carrito al iniciar sesión o al montar
    useEffect(() => {
        const cartKey = getCartKey()
        const savedCart = localStorage.getItem(cartKey)
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart)
                setItems(parsed)
                console.log(`✅ Carrito cargado (${cartKey})`, parsed)
            } catch (error) {
                console.error("❌ Error al cargar carrito:", error)
                setItems([])
            }
        } else {
            setItems([])
            console.log(`ℹ️ No hay carrito guardado para ${cartKey}`)
        }
    }, [user?._id])

    // ✅ Guardar carrito cada vez que cambia
    useEffect(() => {
        const cartKey = getCartKey()
        localStorage.setItem(cartKey, JSON.stringify(items))
        console.log(`💾 Carrito actualizado (${cartKey})`, items)
    }, [items, user?._id])

    // 🧠 Agregar producto o actualizar cantidad
    const addItem = (newItem: CartItem) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.product_id === newItem.product_id)
            if (existing) {
                // ✅ Crear nueva referencia para forzar re-render
                return prev.map((i) =>
                    i.product_id === newItem.product_id
                        ? { ...i, quantity: i.quantity + newItem.quantity }
                        : i
                )
            }
            // ✅ Nuevo producto, nueva referencia
            return [...prev, newItem]
        })
    }

    // 🗑️ Eliminar producto
    const removeItem = (productId: string) => {
        setItems((prev) => prev.filter((i) => i.product_id !== productId))
    }

    // ✏️ Actualizar cantidad manualmente
    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId)
            return
        }
        setItems((prev) =>
            prev.map((i) =>
                i.product_id === productId ? { ...i, quantity } : i
            )
        )
    }

    // 🧹 Vaciar carrito
    const clearCart = () => {
        const cartKey = getCartKey()
        localStorage.removeItem(cartKey)
        setItems([])
        console.log(`🗑️ Carrito limpiado (${cartKey})`)
    }

    // 🧾 Cálculos derivados
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                total,
                itemCount,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

// 🧩 Hook de acceso rápido al carrito
export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error("useCart debe ser usado dentro de un CartProvider")
    }
    return context
}
