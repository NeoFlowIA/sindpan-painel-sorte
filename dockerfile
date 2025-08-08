# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --prefer-offline || npm install --no-audit
COPY . .
# Passe Vite envs como build-args se precisar (VITE_*):
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---- run ----
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
# Copia estáticos
COPY --from=build /app/dist .
# Config Nginx (SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
