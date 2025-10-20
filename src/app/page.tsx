import Link from "next/link"
import { LinkButton } from "@/components/button"

export default function Home() {
    return (
        <div className="container py-12">
            <section className="text-center py-20">
                <h1 className="text-5xl font-bold mb-6 text-balance">Bienvenido a Nuestra Tienda Online</h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Descubre nuestros productos de calidad con envío rápido y seguro. Compra con confianza.
                </p>
                <LinkButton href="/products" variant="primary" size="lg" className="text-lg px-8 py-3">
                    Ver Productos
                </LinkButton>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
                <div className="card text-center">
                    <div className="text-4xl mb-4">🚚</div>
                    <h3 className="text-xl font-bold mb-2">Envío Rápido</h3>
                    <p className="text-muted-foreground">Entrega en 24-48 horas a todo el país</p>
                </div>
                <div className="card text-center">
                    <div className="text-4xl mb-4">🔒</div>
                    <h3 className="text-xl font-bold mb-2">Pago Seguro</h3>
                    <p className="text-muted-foreground">Integración con Stripe para máxima seguridad</p>
                </div>
                <div className="card text-center">
                    <div className="text-4xl mb-4">💬</div>
                    <h3 className="text-xl font-bold mb-2">Soporte 24/7</h3>
                    <p className="text-muted-foreground">Estamos aquí para ayudarte en todo momento</p>
                </div>
            </section>
        </div>
    )
}
