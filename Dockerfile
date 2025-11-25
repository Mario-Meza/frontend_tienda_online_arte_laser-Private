# 1. ETAPA DE CONSTRUCCIÓN (BUILDER)
# Usa la imagen de Node.js que coincide con la versión usada en desarrollo
FROM node:20-alpine AS builder

# Configura variables de entorno para el proceso de construcción
ENV NODE_ENV=production

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de configuración de dependencias primero
# Esto permite que Docker cachee el paso de instalación si solo cambia el código.
COPY package.json yarn.lock ./

# Instala las dependencias de Node.js
RUN npm install --frozen-lockfile

# Copia el resto del código del frontend
COPY . .

# Comando de construcción de Next.js
# Esto genera la carpeta 'out' o '.next' dependiendo de cómo sirvas la app.
# Si usas el export estático: yarn build && yarn export
# Si usas el servidor de Next: yarn build
RUN yarn build


# 2. ETAPA DE PRODUCCIÓN (RUNNER)
# Usa una imagen base pequeña y segura para servir los archivos
# Node.js no es estrictamente necesario si solo sirves archivos estáticos,
# pero es más fácil para Next.js si no usas Static Export.
# Usaremos node-alpine para servir la app Next.js o Nginx si fuera Static Export.
FROM node:20-alpine AS runner

# Establece el directorio de trabajo
WORKDIR /app

# 🚨 Configuración crítica para Next.js 🚨
# Copia solo los archivos esenciales para la ejecución
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public

# Establece el puerto de Next.js (por defecto: 3000)
ENV PORT=3000

# Exponer el puerto
EXPOSE ${PORT}

# Comando de inicio: Inicia la aplicación en modo producción
CMD ["yarn", "start"]