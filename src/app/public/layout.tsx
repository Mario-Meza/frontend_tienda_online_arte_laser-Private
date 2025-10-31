// app/layout.tsx
import "../globals.css"

export const metadata = {
    title: "TiendaOnline - Tu tienda de confianza",
    description: "Compra productos de calidad con envío rápido",
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}