# 1. ETAPA DE CONSTRUCCIÓN (BUILDER)
FROM node:20-slim AS builder

# Instala dependencias del sistema necesarias para compilar módulos nativos
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia archivos de dependencias
COPY package.json package-lock.json ./

# Instala dependencias
RUN npm ci

# Copia el código fuente
# CON ESTAS TRES LÍNEAS EXPLÍCITAS:
COPY src ./src
COPY public ./public
COPY tsconfig.json ./tsconfig.json

# Configura las variables de entorno para el build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# Build con output standalone
RUN npm run build


# 2. ETAPA DE PRODUCCIÓN (RUNNER) - Súper ligera
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crea usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia solo lo necesario del build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE ${PORT}

# Ejecuta el servidor standalone
CMD ["node", "server.js"]