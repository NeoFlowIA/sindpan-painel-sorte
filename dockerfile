# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Instala dependências
# (usa npm ci se houver package-lock, senão fallback para npm install)
COPY package*.json ./
RUN npm ci --no-audit --prefer-offline || npm install --no-audit

# Copia o restante do código e builda
COPY . .
# Se precisar de variáveis Vite em build-time, passe com: --build-arg VITE_API_URL=...
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---- run stage ----
FROM nginx:1.27-alpine AS run
# Nginx conf com suporte a SPA (client-side routing)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# Copia os estáticos gerados
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
# Healthcheck simples
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
