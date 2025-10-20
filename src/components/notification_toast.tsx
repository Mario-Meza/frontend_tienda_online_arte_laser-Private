"use client"

import { useState, useEffect } from "react"

interface Toast {
    id: string
    message: string
    type: "success" | "error" | "info"
    duration?: number
}

let toastId = 0
const toasts: Toast[] = []
const listeners: ((toasts: Toast[]) => void)[] = []

export function showToast(message: string, type: "success" | "error" | "info" = "info", duration = 3000) {
    const id = `toast-${toastId++}`
    const toast: Toast = { id, message, type, duration }
    toasts.push(toast)
    notifyListeners()

    if (duration) {
        setTimeout(() => {
            removeToast(id)
        }, duration)
    }
}

function removeToast(id: string) {
    const index = toasts.findIndex((t) => t.id === id)
    if (index > -1) {
        toasts.splice(index, 1)
        notifyListeners()
    }
}

function notifyListeners() {
    listeners.forEach((listener) => listener([...toasts]))
}

export function useToasts() {
    const [currentToasts, setCurrentToasts] = useState<Toast[]>([])

    useEffect(() => {
        const listener = (toasts: Toast[]) => setCurrentToasts(toasts)
        listeners.push(listener)
        return () => {
            const index = listeners.indexOf(listener)
            if (index > -1) listeners.splice(index, 1)
        }
    }, [])

    return currentToasts
}

export function ToastContainer() {
    const toasts = useToasts()

    const bgColor = {
        success: "bg-success text-white",
        error: "bg-destructive text-white",
        info: "bg-accent text-white",
    }

    return (
        <div className="fixed bottom-4 right-4 space-y-2 z-50">
            {toasts.map((toast) => (
                <div key={toast.id} className={`${bgColor[toast.type]} px-6 py-3 rounded-lg shadow-lg animate-in fade-in`}>
                    {toast.message}
                </div>
            ))}
        </div>
    )
}
