# Image Node pour le développement
FROM node:22.11.0

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le code
COPY . .

# Exposer le port utilisé par Vite (par défaut 5173)
EXPOSE 5173

# Commande pour lancer le serveur Vite
CMD ["npm", "run", "dev", "--", "--host"]
