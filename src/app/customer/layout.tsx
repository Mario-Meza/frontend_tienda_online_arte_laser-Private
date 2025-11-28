"use client"

import { ProtectedRoute } from "@/components/shared/ProtectedRoute"

export default function CustomerLayout(
    {children,}:
    { children: React.ReactNode })
{
    return (
        <ProtectedRoute>
            <main className="min-h-screen">
                {children}
            </main>
        </ProtectedRoute>
    )
}