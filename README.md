# Autodeal 94

Catalogue et espace vendeur avec base partagée et photos. La version hébergée utilise Cloudflare D1 (annonces et équipements), R2 (images) et la connexion ChatGPT du compte vendeur.

## Utilisation

Ouvrir `/?espace=vendeur`, puis « Ajouter un véhicule ». La marque et le modèle acceptent des suggestions et des valeurs libres. Les types, motorisations et transmissions sont proposés dans des menus.

Ajouter jusqu’à 20 photos JPEG, PNG ou WebP. Les images sont redimensionnées à 1800 px maximum et compressées avant l’envoi. La première photo est la couverture. Utiliser « Avant », « Après » ou le glisser-déposer pour changer l’ordre.

Saisir un équipement puis valider avec Entrée ou « Ajouter l’équipement ». Les équipements enregistrés deviennent des suggestions pour les annonces suivantes.

Enregistrer en brouillon pour compléter plus tard ou publier après avoir ajouté une photo, l’année, le kilométrage, le type, la motorisation, la boîte et le prix. Les statuts disponibles et réservés sont visibles dans le catalogue. Les brouillons, vendus et archives restent dans l’espace vendeur.

La suppression retire l’annonce du catalogue et de la liste. Une suppression logique conserve les enregistrements dans la base. Les objets image conservés ne sont accessibles au public que s’ils appartiennent à une annonce publiée.

Les coordonnées WhatsApp et téléphone se renseignent dans « Coordonnées et exemples ». Le numéro doit être international (+33…).

L’immatriculation est privée et les caractéristiques se renseignent manuellement. Aucun service de recherche de plaques n’est connecté.

## Développement

Node.js 24 recommandé.

```sh
npm ci
npm run build
npm run dev
```

La prévisualisation locale utilise une base SQLite et des fichiers sous `.local-data/`. Elle simule un compte vendeur pour le développement. Le serveur de développement ne doit jamais être déployé ni utilisé comme serveur public.

- `public/index.html` — structure, navigation
- `public/style.css` — mise en page, couleurs, mobile
- `public/app.js` — catalogue, fiches, galerie, WhatsApp
- `public/seller.js` — formulaire et gestion vendeur
- `public/img/` — photos de démonstration
- `worker/index.js` — API, validation, contrôle d’accès
- `db/schema.js` — schéma de la base
- `drizzle/` — migrations SQL générées
- `scripts/build.mjs` — compilation du Worker avec ses fichiers statiques

Les modifications des annonces passent par l’espace vendeur et prennent effet immédiatement. Les modifications du code demandent une nouvelle compilation et un déploiement.

## Hébergement

La version actuelle est déployée sur ChatGPT Sites. Le manifeste déclare `DB` pour D1 et `BUCKET` pour R2. Les migrations du dossier `drizzle/` sont appliquées au déploiement. En cas d’évolution du schéma, lancer `npm run db:generate` et conserver l’historique des migrations.

Configurer côté serveur `SELLER_EMAIL`, adresse du compte autorisé à gérer le parc. Les en-têtes d’identité doivent provenir d’un frontal authentifiant de confiance. Les requêtes de gestion vérifient cette identité et leur origine. `ADMIN_API_TOKEN` est une clé secrète de maintenance facultative, jamais intégrée au navigateur ni au dépôt.

Cette version nécessite un serveur Worker et les stockages associés. GitHub conserve les sources. Un hébergement GitHub Pages ou un déploiement Vercel purement statique ne fournit pas les services nécessaires à la base et aux photos.

Le catalogue reste privé selon les paramètres actuels du site. Une ouverture au public demande de modifier son audience. Le contrôle d’accès de l’espace vendeur reste indépendant.

Photos d’exemple — Unsplash (bannière), Caradisiac (208), Click Dealer (Clio), Arabavs (Golf), AutoUncle (Yaris), Van Poelgeest (BMW), Autocar India (Audi). Remplacer les illustrations par les photos du concessionnaire pour ses annonces réelles.
