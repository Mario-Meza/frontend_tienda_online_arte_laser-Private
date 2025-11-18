"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Slide {
    id: number
    title: string
    description: string
    image: string
    gradient: string
}

const slides: Slide[] = [
    {
        id: 1,
        title: "✨ Colección Primavera",
        description: "Descubre nuestras piezas más hermosas de la temporada",
        image: "/artisan-crafting-jewelry.jpg",
        gradient: "from-amber-500/50 via-orange-500/20 to-rose-500/50"
    },
    {
        id: 2,
        title: "🎨 Hecho a Mano",
        description: "Cada pieza es única y creada con amor",
        image: "/handcrafted-jewelry-display.jpg",
        gradient: "from-rose-500/50 via-pink-500/20 to-orange-500/50"
    },
    {
        id: 3,
        title: "🌟 Ofertas Especiales",
        description: "Encuentra los mejores precios en productos seleccionados",
        image: "/handmade-accessories-collection.jpg",
        gradient: "from-orange-500/50 via-amber-500/20 to-yellow-500/50"
    }
]

export function HeroSlider() {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, [])

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    }, [])

    const goToSlide = (index: number) => {
        setCurrentSlide(index)
        setIsAutoPlaying(false)
    }

    useEffect(() => {
        if (!isAutoPlaying) return

        const interval = setInterval(nextSlide, 5000)
        return () => clearInterval(interval)
    }, [isAutoPlaying, nextSlide])

    return (
        <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl group mb-12">
            {/* Slides container */}
            <div className="relative h-[400px] md:h-[500px]">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                            index === currentSlide
                                ? "opacity-100 translate-x-0"
                                : index < currentSlide
                                    ? "opacity-0 -translate-x-full"
                                    : "opacity-0 translate-x-full"
                        }`}
                    >
                        {/* Background image */}
                        <Image
                            src={slide.image || "/placeholder.svg"}
                            alt={slide.title}
                            fill
                            className="object-cover"
                            priority={index === 0}
                        />

                        {/* Gradient overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />

                        {/* Content */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center px-6 max-w-4xl">
                                <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl animate-fade-in-up">
                                    {slide.title}
                                </h2>
                                <p className="text-xl md:text-2xl text-white/95 drop-shadow-lg animate-fade-in-up animation-delay-200">
                                    {slide.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation arrows */}
            <button
                onClick={() => {
                    prevSlide()
                    setIsAutoPlaying(false)
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-xl transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
                aria-label="Anterior"
            >
                <ChevronLeft className="w-6 h-6 text-amber-700" />
            </button>

            <button
                onClick={() => {
                    nextSlide()
                    setIsAutoPlaying(false)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-xl transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 z-10"
                aria-label="Siguiente"
            >
                <ChevronRight className="w-6 h-6 text-amber-700" />
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`transition-all duration-300 rounded-full ${
                            index === currentSlide
                                ? "w-12 h-3 bg-white shadow-lg"
                                : "w-3 h-3 bg-white/60 hover:bg-white/80"
                        }`}
                        aria-label={`Ir a slide ${index + 1}`}
                    />
                ))}
            </div>

            <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
      `}</style>
        </div>
    )
}
