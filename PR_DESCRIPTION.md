# Refactorisation clean architecture, correction de la facturation, Docker et CI

Cible de fusion : `master`

Le design et les couleurs ne sont pas modifiés : `tailwind.config.js` et
`index.css` sont intacts, et aucune classe Tailwind existante n'a été remplacée.

---

## 1. Facturation — ce qui était cassé

| Problème | Conséquence | Correction |
| --- | --- | --- |
| Totaux calculés en `float` | Le total facturé pouvait différer du total affiché | Tout en `Decimal`, via `apps/common/money.py` |
| **Le stock n'était jamais décrémenté** | Vente illimitée d'articles en rupture | Réservation dans la transaction, avec verrou, restituée à l'annulation |
| **Webhook de paiement non vérifié** | Un tiers pouvait marquer une commande « payée » sans régler | Signature HMAC-SHA256 obligatoire, montant et devise rapprochés |
| Aucune facture produite | Pas de pièce comptable | Modèle `Invoice`, numérotation séquentielle, endpoints JSON et imprimable |
| Prix non figés | Une hausse de tarif réécrivait les commandes passées | Désignation et prix unitaire photographiés à la commande |
| Montants affichés en `.toFixed(2)` | « 25000.00 FCFA » alors que le XOF n'a pas de sous-unité | Formatage en unités entières, cohérent avec le serveur |
| URL de paiement devinée | Lien invalide si le prestataire change de format | URL renvoyée par le prestataire |
| URL de callback erronée | `/api/orders/wave-callback/` annoncé, route servie sur `/orders/...` | Préfixe `/api/` unifié |
| Statuts librement modifiables | Une commande annulée pouvait redevenir payée | Machine à états explicite |

Les prix catalogue étant TTC, la TVA est **extraite** du total et non ajoutée :
le montant payé par le client ne change pas si le taux change. L'égalité
`HT + TVA + port − remise == TTC` est vérifiée à l'émission de chaque facture.

## 2. Sécurité

- **Prise de contrôle de compte** : `POST /users/reset-password/` appliquait un
  nouveau mot de passe sur simple connaissance de l'adresse e-mail. Remplacé par
  un flux en deux temps avec jeton signé à usage unique ; la réponse est
  identique que le compte existe ou non.
- **Écriture du catalogue ouverte à tout compte connecté** : n'importe quel
  client pouvait modifier un prix ou supprimer un produit. Réservée au personnel.
- **`/admin` accessible à tout compte connecté** côté frontend. Garde ajoutée.
- Clé secrète, `DEBUG` et `ALLOWED_HOSTS` codés en dur, `CORS_ALLOW_ALL_ORIGINS`
  à `True`. Tout passe par l'environnement ; `prod.py` refuse de démarrer sans
  secret ou avec `ALLOWED_HOSTS='*'`.
- JWT : durées bornées, rotation, liste noire, déconnexion effective. Ajout de la
  limitation de débit sur connexion, réinitialisation, commande et webhook.
- Les messages d'exception ne partent plus au client final.
- Suppression de compte désactivante, pour ne pas effacer les pièces comptables.
- Dépendances vulnérables mises à jour : `pip-audit` et `npm audit` ne signalent
  plus rien (60 vulnérabilités connues côté Python, 22 côté Node).

> La clé `django-insecure-...` était versionnée : **elle doit être considérée
> comme compromise** et remplacée en production.

## 3. Architecture

```
apps/<domaine>/
├── models.py       Entités et invariants
├── selectors.py    Lectures réutilisées
├── services/       Cas d'usage — la seule couche qui décide
├── serializers.py  Frontière d'entrée/sortie
├── views.py        Contrôleurs : valider, déléguer, répondre
└── tests/
```

`apps/common` porte le noyau partagé (monnaie, erreurs typées, permissions,
pagination, validateurs). Le prestataire de paiement est isolé derrière un
protocole, donc testable sans réseau et remplaçable sans toucher au domaine.

Voir [ARCHITECTURE.md](ARCHITECTURE.md).

## 4. Autres corrections notables

- `AuthProvider` était monté deux fois : deux états d'authentification
  concurrents, `/users/me/` appelé en double.
- La route `/orders` affichait une page blanche (modale rendue sans ses props).
- `Cart` et `AnonymousCart` dupliquaient la logique et leur contrainte d'unicité
  était inopérante (`NULL != NULL` en SQL) : doublons dans le panier.
- Quantités de panier non converties : concaténation de chaînes, `TypeError`.
- `QuoteSerializer` lisait `user.username`, champ absent du modèle : toute
  sérialisation de devis rattaché à un compte levait une `AttributeError`.
- Images de fond référencées par chemin littéral : cassées en production.
- Aucun renouvellement de jeton : déconnexion à chaque expiration.
- `users/logout/` et `users/update/` appelés par le frontend n'existaient pas.
- Onze fichiers vides et cinq dépendances inutilisées supprimés.

## 5. Tests

191 tests, 90 % de couverture — le projet n'en avait aucun (les cinq `tests.py`
étaient vides).

Portent notamment sur : l'équilibre comptable des factures, la numérotation sans
trou, la réservation et la restitution du stock, les transitions de statut
interdites, les signatures de webhook forgées et les rejeux, le rapprochement des
montants, le cloisonnement entre clients, et la réinitialisation de mot de passe.

## 6. Docker et pipelines

```bash
docker compose up --build            # base + API + interface
docker compose run --rm tests        # tests + couverture
docker compose --profile prod up     # images de production
```

Images multi-étapes (gunicorn et utilisateur non privilégié côté API, nginx côté
interface), attente de la base, migrations automatiques, catalogue de
démonstration, sondes de disponibilité.

Quatre workflows GitHub Actions : backend (ruff, tests sur PostgreSQL, migrations
manquantes, `check --deploy`, schéma OpenAPI), frontend (ESLint, build), docker
(images, démarrage de la pile, contrôles de fumée dont le refus d'un webhook non
signé), sécurité (`pip-audit`, `npm audit`, gitleaks).

---

## ⚠️ À lire avant de fusionner

1. **Migrations régénérées.** Le schéma a été restructuré (facturation,
   paiements, fusion des paniers). Sur une base contenant déjà des données, ne
   pas appliquer ces migrations telles quelles : exporter, recréer le schéma,
   réimporter en renseignant les nouveaux champs et en émettant les factures
   manquantes. Procédure dans le README.
2. **Rotation des secrets.** Nouvelle `DJANGO_SECRET_KEY`, et
   `WAVE_WEBHOOK_SECRET` à renseigner, sinon les webhooks sont refusés (c'est
   volontaire).
3. **SMTP à configurer**, sinon les liens de réinitialisation ne partent pas.
4. **Frontend : le préfixe `/api/`** est désormais requis ; il est géré dans
   `apiClient.js`.
5. **Taux de TVA** : `BILLING_TAX_RATE=0.18` par défaut, en mode TTC inclus. À
   ajuster selon votre régime fiscal — le total payé par le client est inchangé
   quel que soit le taux.
6. La pile Docker n'a pas pu être démarrée dans l'environnement de cette session
   (pas de démon Docker) : `docker compose config` est validé et le workflow
   `docker.yml` l'exerce au premier passage de CI.
