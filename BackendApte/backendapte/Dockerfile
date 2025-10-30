# Utiliser une image Python légère
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers requis
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code
COPY . .

# Exposer le port de Django
EXPOSE 8000

# Commande pour lancer le serveur
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
