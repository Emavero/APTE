# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Image du frontend React/Vite APTE.
#   - cible « dev »  : serveur Vite avec rechargement à chaud
#   - cible « prod » : bundle statique servi par nginx
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

# npm ci garantit une installation reproductible depuis le lockfile.
COPY package.json package-lock.json ./
RUN npm ci


# --------------------------------------------------------------------- dev
FROM node:22-alpine AS dev

WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# ------------------------------------------------------------------- build
FROM node:22-alpine AS build

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# L'URL de l'API est figée au build : Vite inline les variables VITE_*.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build


# -------------------------------------------------------------------- prod
FROM nginx:1.27-alpine AS prod

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
