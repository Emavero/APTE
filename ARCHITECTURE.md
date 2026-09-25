# Architecture

Document de référence sur l'organisation du code et les raisons des choix
structurants.

## Vue d'ensemble

```
Navigateur
    │  JSON / JWT
    ▼
┌──────────────────────── views.py ────────────────────────┐
│  Contrôleurs HTTP : valider la forme, déléguer, répondre │
└───────────────────────────┬──────────────────────────────┘
                            │
┌──────────────────────── services/ ───────────────────────┐
│  Cas d'usage. Toutes les décisions métier. Ni HTTP ni DRF │
└──────────────┬────────────────────────────┬──────────────┘
               │                            │
     ┌── selectors.py ──┐        ┌── services/payments/ ──┐
     │  Lectures        │        │  Prestataires externes │
     └────────┬─────────┘        └────────────────────────┘
              │
     ┌── models.py ─────────────────────────────────────┐
     │  Entités, contraintes de base, invariants        │
     └──────────────────────────────────────────────────┘
```

Règle de dépendance : une couche ne connaît que celles du dessous. `services/`
n'importe jamais `views.py` ; `models.py` n'importe jamais `serializers.py`.

## Noyau partagé (`apps/common`)

| Module | Rôle |
| --- | --- |
| `money.py` | Arithmétique monétaire en `Decimal`, quantification, éclatement TTC → HT + TVA |
| `exceptions.py` | Erreurs métier typées et gestionnaire DRF unique |
| `permissions.py` | `IsAdminOrReadOnly`, `IsOwner` |
| `pagination.py` | Pagination par défaut et pagination catalogue |
| `validators.py` | Normalisation des numéros de téléphone, quantités |
| `models.py` | `TimeStampedModel` |

## Domaines

### `users`
Compte identifié par e-mail **ou** téléphone, avec une contrainte de base qui
garantit qu'au moins l'un des deux est présent. La réinitialisation de mot de
passe se fait en deux temps (demande d'envoi, puis confirmation par jeton signé).
La suppression de compte désactive au lieu d'effacer : les commandes, et donc les
pièces comptables, doivent être conservées.

### `products`
Catalogue. Lecture publique, écriture réservée au personnel. `on_delete=PROTECT`
sur la catégorie et depuis les lignes de commande : supprimer un produit déjà
vendu casserait l'historique de facturation.

### `cart`
Un seul modèle `Cart`, porteur soit d'un `user`, soit d'une `session_key`, avec
une contrainte XOR. Les deux modèles distincts de la version précédente
obligeaient à dupliquer chaque opération et laissaient l'unicité des lignes
inopérante (en SQL, `NULL != NULL`), d'où des doublons dans le panier.
Les lignes sont adressées **par produit**, jamais par identifiant de ligne : il
n'y a donc aucun identifiant d'autrui à deviner.

### `orders`
Cœur du domaine.

| Modèle | Rôle |
| --- | --- |
| `Order` | Commande, totaux calculés côté serveur, machine à états |
| `OrderItem` | Ligne : photographie de la désignation et du prix unitaire |
| `Invoice` | Pièce comptable immuable : HT, TVA, TTC, émetteur, client |
| `InvoiceSequence` | Compteur annuel, verrouillé pour garantir une suite sans trou |
| `Payment` | Trace d'encaissement : référence, montant, charge utile du prestataire |

`services/billing.py` est la seule autorité sur les montants.
`services/checkout.py` porte le tunnel d'achat et la machine à états.
`services/payment_flow.py` orchestre les encaissements.
`services/payments/` isole les prestataires derrière un protocole
(`PaymentGateway`), ce qui permet de tester tout le flux avec un double sans
réseau, et de changer d'opérateur sans toucher au domaine.

### `quotes`
Demande de devis, ouverte aux visiteurs anonymes. L'estimation est chiffrée
côté serveur depuis les prix catalogue ; les lignes photographient le produit
comme celles d'une commande.

## Machine à états d'une commande

```
                 ┌────────────────┐
                 │    pending     │
                 └───┬────────┬───┘
        ┌────────────┘        └────────────┐
        ▼                                  ▼
┌──────────────────┐                 ┌──────────┐
│ awaiting_payment │──────────────▶ │ canceled │ ◀── restitution du stock
└────────┬─────────┘                 └──────────┘
         ▼
     ┌──────┐     ┌─────────┐     ┌───────────┐     ┌──────────┐
     │ paid │───▶ │ shipped │───▶ │ completed │───▶ │ refunded │
     └──────┘     └─────────┘     └───────────┘     └──────────┘
```

Toute transition absente de `ORDER_TRANSITIONS` est refusée par le domaine :
c'est ce qui empêche, par exemple, de « repayer » une commande annulée. Le stock
n'est restitué que si la commande le retenait encore, ce qui rend l'annulation
idempotente.

## Concurrence

| Risque | Parade |
| --- | --- |
| Deux acheteurs pour le dernier article | `select_for_update` sur les produits, puis décrément conditionnel `UPDATE … WHERE stock >= qte` |
| Deux factures avec le même numéro | `select_for_update` sur la ligne de séquence de l'année |
| Double clic sur « payer » | Réutilisation de la session ouverte + clé d'idempotence côté prestataire |
| Rejeu d'un webhook | Un paiement déjà réussi est reconnu et l'événement est ignoré |
| Interblocage sur verrous | Les produits sont verrouillés dans un ordre stable (par clé primaire) |

## Frontend

```
src/
├── context/     État partagé (authentification, panier)
├── services/    Accès HTTP, un module par domaine
├── utils/       Formatage monétaire
├── components/  Éléments d'interface réutilisables
├── pages/       Écrans
└── routes/      Routage et gardes d'accès
```

Le panier serveur est la source de vérité, y compris pour un visiteur anonyme
(session). `localStorage` ne sert plus que de cache de repli en lecture, affiché
si l'API est injoignable : tenir deux paniers en parallèle produisait des totaux
divergents entre l'écran et la commande enregistrée.

Le client HTTP renouvelle le jeton d'accès sur `401`, une seule fois et une seule
requête de renouvellement à la fois, puis rejoue l'appel d'origine.
