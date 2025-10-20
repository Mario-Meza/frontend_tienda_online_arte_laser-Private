import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // El webhook de Stripe es manejado por tu backend FastAPI
        // Este endpoint es solo para referencia
        // Tu FastAPI maneja: /api/v1/stripe/webhook

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("Webhook error:", error)
        return NextResponse.json({ error: "Webhook error" }, { status: 400 })
    }
}
