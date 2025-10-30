FROM node:20-alpine

WORKDIR /app

# Copier uniquement package.json et package-lock.json pour tirer parti du cache Docker
COPY package*.json ./

# Installer les dépendances
RUN npm install --legacy-peer-deps

# Copier le code source
COPY . .

# Exposer le port Vite
EXPOSE 5173

# Lancer Vite via npm script (utilise node_modules/.bin automatiquement)
CMD ["npm", "run", "dev", "--", "--host"]
