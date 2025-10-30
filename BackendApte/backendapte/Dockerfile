# Utiliser une image Node légère
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier uniquement les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances avec contournement des peer-deps
RUN npm install --legacy-peer-deps

# Copier tout le code source
COPY . .

# Exposer le port Vite
EXPOSE 5173

# Lancer Vite en mode développement et écouter toutes les interfaces
CMD ["npm", "run", "dev", "--", "--host"]
