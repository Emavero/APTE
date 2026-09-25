# APTE — Plateforme e-commerce et devis

Application de vente et de devis pour équipements de sécurité (vidéosurveillance,
alarme, protection intrusion, automatisation).

| Composant | Technologie | Dossier |
| --- | --- | --- |
| API | Django 5.2 · Django REST Framework · PostgreSQL | `BackendApte/backendapte` |
| Interface | React 19 · Vite · Tailwind CSS | `FrontendApte/aptefrontend` |

---

## Démarrage rapide (Docker)

Prérequis : Docker et le plugin Compose.

```bash
git clone <url-du-depot> && cd APTE
docker compose up --build
```

| Service | Adresse |
| --- | --- |
| Interface | http://localhost:5173 |
| API | http://localhost:8000/api/ |
| Documentation de l'API | http://localhost:8000/api/docs/ |
| Administration Django | http://localhost:8000/admin/ |
| Sonde de disponibilité | http://localhost:8000/health/ |

Les migrations sont appliquées et le catalogue de démonstration est chargé au
démarrage du conteneur. Pour créer un compte d'administration :

```bash
docker compose exec backend python manage.py createsuperuser
```

### Commandes utiles

```bash
docker compose run --rm tests              # suite de tests + couverture
docker compose run --rm lint               # ruff (analyse + format)
docker compose --profile prod up --build   # vérifier les images de production
docker compose down -v                     # tout arrêter et purger les volumes
```

---

## Démarrage sans Docker

### API

```bash
cd BackendApte/backendapte
python -m venv .venv && source .venv/bin/activate   # Windows : .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env                                 # puis adapter
python manage.py migrate
python manage.py loaddata products_seed.json         # catalogue de démonstration
python manage.py runserver
```

Sans `POSTGRES_DB` dans l'environnement, l'API bascule automatiquement sur
SQLite : pratique pour un essai local, à ne pas utiliser en production.

### Interface

```bash
cd FrontendApte/aptefrontend
npm ci
cp .env.example .env.local
npm run dev
```

---

## Architecture

Le backend suit une séparation en couches. Chaque couche ne connaît que celle du
dessous, ce qui rend la logique métier testable sans HTTP ni base de données.

```
apps/<domaine>/
├── models.py       Entités et invariants persistés
├── selectors.py    Lectures réutilisées (une seule définition par requête)
├── services/       Cas d'usage : la seule couche qui décide
├── serializers.py  Frontière d'entrée/sortie (validation de forme)
├── views.py        Contrôleurs HTTP : valider, déléguer, répondre
├── urls.py         Routage
├── admin.py        Back-office
└── tests/          Tests du domaine et de l'API
```

`apps/common` est le noyau partagé : arithmétique monétaire (`money.py`),
erreurs métier (`exceptions.py`), permissions, pagination, validateurs.

### Règles structurantes

- **Aucun montant en `float`.** Tous les calculs passent par `apps.common.money`,
  en `Decimal`, quantifiés dans la devise de facturation.
- **Les vues ne décident rien.** Toute règle de gestion vit dans `services/`.
- **Le client ne fixe jamais un prix.** Les montants sont relus en base au moment
  de la commande ; ceux envoyés par le navigateur sont ignorés.
- **Les erreurs métier sont typées.** `DomainError` et ses sous-classes portent
  leur code HTTP ; un gestionnaire DRF unique les traduit en réponses homogènes.

---

## Facturation

| Sujet | Comportement |
| --- | --- |
| Devise | XOF (FCFA), sans sous-unité : les montants sont arrondis à l'unité |
| Prix catalogue | TTC. La TVA est **extraite** du total, jamais ajoutée |
| Total payé | Somme exacte des lignes : il ne varie pas si le taux de TVA change |
| Numérotation | `APTE-<année>-<00001>`, séquentielle et sans trou |
| Immuabilité | Désignation, prix unitaire et client sont photographiés à la commande |
| Annulation | La facture est annulée, jamais supprimée ; le stock est restitué |

L'égalité comptable `HT + TVA + port − remise == TTC` est vérifiée à l'émission
de chaque facture et couverte par les tests.

Réglages (voir `.env.example`) : `BILLING_TAX_RATE`, `BILLING_PRICES_INCLUDE_TAX`,
`BILLING_CURRENCY`, `BILLING_INVOICE_PREFIX`, `BILLING_FREE_SHIPPING`, ainsi que
les mentions légales de l'émetteur `COMPANY_*`.

### Factures

| Endpoint | Description |
| --- | --- |
| `GET /api/orders/<id>/invoice/` | Facture au format JSON (détail comptable) |
| `GET /api/orders/<id>/invoice/print/` | Facture imprimable / exportable en PDF |

---

## Paiement mobile (Wave)

Le flux est le suivant :

1. La commande est enregistrée et facturée ; le stock est réservé.
2. Une session de paiement est ouverte chez le prestataire, avec clé
   d'idempotence.
3. Le webhook du prestataire confirme l'encaissement.

Le webhook est la **seule** source de vérité pour marquer une commande payée, et
il n'est appliqué que si les trois contrôles passent :

- signature HMAC-SHA256 valide (comparaison à temps constant) ;
- référence correspondant à un paiement que nous avons initié ;
- montant et devise conformes à la facture.

Si `WAVE_WEBHOOK_SECRET` n'est pas défini, les webhooks sont **refusés** : un
callback non vérifié permettrait de faire passer une commande en « payée » sans
règlement. `WAVE_REQUIRE_SIGNED_WEBHOOK=False` ne doit servir qu'en bac à sable
isolé.

Configuration côté Wave : `callback_url` = `<BACKEND_URL>/api/orders/wave-callback/`.

Un webhook perdu se rattrape sans intervention : `GET /api/orders/<id>/check-payment/`
interroge le prestataire et resynchronise la commande.

---

## Tests et qualité

```bash
cd BackendApte/backendapte
pytest                                  # 191 tests
pytest --cov=apps --cov-report=term-missing
ruff check . && ruff format --check .

cd ../../FrontendApte/aptefrontend
npm run lint
npm run build
```

Couverture : 90 % des applications. Les tests couvrent en particulier : l'arithmétique monétaire, l'équilibre
comptable des factures, la numérotation séquentielle, la réservation et la
restitution du stock, la machine à états des commandes, la vérification de
signature des webhooks (y compris signatures forgées et rejeux), le
cloisonnement des données entre clients, et la réinitialisation de mot de passe.

---

## Intégration continue

| Workflow | Contenu |
| --- | --- |
| `.github/workflows/backend.yml` | ruff, tests sur PostgreSQL, migrations manquantes, `check --deploy`, schéma OpenAPI |
| `.github/workflows/frontend.yml` | ESLint, build de production |
| `.github/workflows/docker.yml` | images de production, démarrage de la pile, contrôles de fumée |
| `.github/workflows/security.yml` | `pip-audit`, `npm audit`, recherche de secrets (gitleaks) |

Les contrôles de fumée vérifient notamment qu'un webhook de paiement non signé
reçoit bien un `403`.

---

## Mise en production

1. **Variables d'environnement.** `DJANGO_SETTINGS_MODULE=backendapte.settings.prod`.
   Le module refuse de démarrer sans `DJANGO_SECRET_KEY` ni `DJANGO_ALLOWED_HOSTS`
   explicite : mieux vaut un conteneur qui ne démarre pas qu'une instance exposée
   avec une clé par défaut.
2. **Images.** `target: prod` pour les deux Dockerfiles (gunicorn + utilisateur
   non privilégié côté API, nginx côté interface).
3. **TLS.** Terminé par le frontal ; `SECURE_SSL_REDIRECT=False` uniquement si la
   redirection est déjà assurée en amont.
4. **Média.** `/app/media` doit être un volume persistant.
5. **Wave.** Renseigner `WAVE_API_KEY` et `WAVE_WEBHOOK_SECRET`.
6. **E-mail.** Remplacer le backend console par un SMTP réel, sinon les liens de
   réinitialisation de mot de passe ne partent pas.

### Migrations

Le schéma a été restructuré (facturation, paiements, fusion des paniers) et les
migrations ont été régénérées depuis une base neuve. Sur une base contenant déjà
des données, ne pas appliquer ces migrations telles quelles : exporter les
données, recréer le schéma, puis réimporter en renseignant les nouveaux champs
(`OrderItem.product_name`, `unit_price`, `line_total`) et en émettant les
factures manquantes.

---

## API

Documentation interactive : `/api/docs/` · schéma : `/api/schema/`.

| Domaine | Base |
| --- | --- |
| Utilisateurs | `/api/users/` |
| Catalogue | `/api/products/` |
| Panier | `/api/cart/` |
| Commandes et factures | `/api/orders/` |
| Devis | `/api/quotes/` |

Authentification par JWT : `POST /api/users/login/` renvoie `access` et
`refresh`. Le jeton d'accès est renouvelé automatiquement par le client ; la
déconnexion révoque le jeton de rafraîchissement (liste noire).

## Licence

Voir [LICENSE](LICENSE).
