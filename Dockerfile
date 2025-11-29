# ========================================
# ETAPA 1: DEPENDENCIAS
# ========================================
FROM node:20-alpine AS deps
WORKDIR /app

# Instalar dependencias del sistema para módulos nativos
RUN apk add --no-cache libc6-compat

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci


# ========================================
# ETAPA 2: BUILDER
# ========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Variables de build (Railway las pasa automáticamente)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# Build de Next.js
RUN npm run build


# ========================================
# ETAPA 3: RUNNER (Producción)
# ========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos necesarios del builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Railway asigna el puerto dinámicamente
# Usa $PORT de Railway, por defecto 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Comando de inicio
CMD ["node", "server.js"]