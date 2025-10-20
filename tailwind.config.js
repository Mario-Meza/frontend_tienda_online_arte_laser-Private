// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // ¡Esta línea es la clave!
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            // ... tus otras extensiones
        },
    },
    plugins: [],
}