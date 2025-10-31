FROM node:jod-alpine3.21

WORKDIR /app

# Copier uniquement package.json et package-lock.json pour tirer parti du cache Docker
COPY package*.json ./

# Installer les dépendances
RUN npm install --legacy-peer-deps

# Copier le code source
COPY . .

# Exposer le port Vite
EXPOSE 5173

# Démarrer l'application 
CMD ["npm", "run", "dev", "--", "--host"]
