"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth_context"

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

    // ✅ Cargar carrito específico del usuario desde localStorage
    useEffect(() => {
        if (user) {
            const cartKey = `cart_${user._id}`
            const savedCart = localStorage.getItem(cartKey)
            if (savedCart) {
                try {
                    const parsedCart = JSON.parse(savedCart)
                    setItems(parsedCart)
                    console.log(`✅ Carrito cargado para usuario ${user._id}:`, parsedCart)
                } catch (error) {
                    console.error("Error al cargar carrito:", error)
                    setItems([])
                }
            } else {
                // No hay carrito guardado para este usuario
                setItems([])
                console.log(`ℹ️ No hay carrito guardado para usuario ${user._id}`)
            }
        } else {
            // Si no hay usuario, limpiar carrito
            setItems([])
            console.log("ℹ️ No hay usuario, carrito limpiado")
        }
    }, [user?._id]) // ⚠️ Dependencia en user._id para detectar cambios de usuario

    // ✅ Guardar carrito específico del usuario en localStorage
    useEffect(() => {
        if (user) {
            const cartKey = `cart_${user._id}`
            localStorage.setItem(cartKey, JSON.stringify(items))
            console.log(`💾 Carrito guardado para usuario ${user._id}:`, items)
        }
    }, [items, user?._id])

    const addItem = (item: CartItem) => {
        setItems((prevItems) => {
            const existingItem = prevItems.find((i) => i.product_id === item.product_id)
            if (existingItem) {
                return prevItems.map((i) =>
                    i.product_id === item.product_id ? { ...i, quantity: i.quantity + item.quantity } : i,
                )
            }
            return [...prevItems, item]
        })
    }

    const removeItem = (productId: string) => {
        setItems((prevItems) => prevItems.filter((i) => i.product_id !== productId))
    }

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId)
            return
        }
        setItems((prevItems) => prevItems.map((i) => (i.product_id === productId ? { ...i, quantity } : i)))
    }

    const clearCart = () => {
        setItems([])
        if (user) {
            const cartKey = `cart_${user._id}`
            localStorage.removeItem(cartKey)
            console.log(`🗑️ Carrito eliminado para usuario ${user._id}`)
        }
    }

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

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

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart debe ser usado dentro de CartProvider")
    }
    return context
}