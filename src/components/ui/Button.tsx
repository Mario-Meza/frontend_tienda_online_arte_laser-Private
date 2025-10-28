import type React from "react"
import Link from "next/link"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost"
    size?: "sm" | "md" | "lg"
    children: React.ReactNode
}

interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string
    variant?: "primary" | "secondary" | "ghost"
    size?: "sm" | "md" | "lg"
    children: React.ReactNode
}

const baseStyles = "inline-flex items-center justify-center font-medium transition-colors rounded-lg"

const variantStyles = {
    primary: "bg-accent text-accent-foreground hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-neutral-200 text-foreground hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost: "text-foreground hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed",
}

const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
}

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
    return <button className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props} />
}

export function LinkButton({
                               href,
                               variant = "secondary",
                               size = "md",
                               className = "",
                               children,
                               ...props
                           }: LinkButtonProps) {
    return (
        <Link href={href} className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props}>
            {children}
        </Link>
    )
}
