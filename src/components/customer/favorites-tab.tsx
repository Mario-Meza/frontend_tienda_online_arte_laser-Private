"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth_context"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Image from "next/image"

interface Product {
    id: string
    name: string
    price: number
    image: string
    inStock: boolean
}

export function FavoritesTab() {
    const { token } = useAuth()
    const [favorites, setFavorites] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/favorites`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const data = await response.json()
                setFavorites(data)
            } catch (error) {
                console.error("[v0] Error fetching favorites:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchFavorites()
    }, [token])

    const removeFavorite = async (productId: string) => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/favorites/${productId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            setFavorites(favorites.filter((p) => p.id !== productId))
        } catch (error) {
            console.error("[v0] Error removing favorite:", error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Cargando favoritos...</div>
            </div>
        )
    }

    if (favorites.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-6xl mb-4">❤️</div>
                    <h3 className="text-xl font-semibold mb-2">No tienes favoritos guardados</h3>
                    <p className="text-muted-foreground mb-6 text-center">
                        Guarda tus productos favoritos para encontrarlos fácilmente
                    </p>
                    <Button>Explorar productos</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square relative bg-muted">
                        <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                    </div>
                    <CardContent className="p-4 space-y-3">
                        <div>
                            <h3 className="font-semibold mb-1 text-balance">{product.name}</h3>
                            <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
                        </div>
                        {!product.inStock && <p className="text-sm text-destructive">Agotado</p>}
                        <div className="flex gap-2">
                            <Button className="flex-1" disabled={!product.inStock}>
                                {product.inStock ? "Agregar al carrito" : "Agotado"}
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => removeFavorite(product.id)}>
                                ❤️
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
