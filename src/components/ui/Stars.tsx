"use client"

import type React from "react"


// Componente para mostrar estrellas de rating promedio
export const StarRating = ({ value }: { value: number }) => {
    const stars = [1, 2, 3, 4, 5]
    return (
        <div className="flex justify-center mt-2">
            {stars.map(star => (
                <svg
                    key={star}
                    fill={star <= value ? "gold" : "none"}
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="gold"
                    className="w-5 h-5"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499l2.264 4.587 5.065.736-3.664 3.572.865 5.04L11.48 14.9l-4.53 2.375.865-5.04-3.664-3.572 5.065-.736 2.264-4.587z" />
                </svg>

            ))}
        </div>
    )
}