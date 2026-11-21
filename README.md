# Autodeal 94

Site vitrine et espace vendeur hébergés sur Vercel, avec Supabase pour la base, les photos et la connexion.

## Gestion du catalogue

Ouvrir `/?espace=vendeur`. Lors de la première connexion, saisir l’adresse autorisée et choisir un mot de passe, puis confirmer l’adresse avec l’e-mail reçu. Les connexions suivantes utilisent cette adresse et ce mot de passe.

Le vendeur peut créer des brouillons, publier, modifier les prix, réserver, marquer comme vendu, archiver et supprimer ses annonces. Chaque voiture reçoit une référence unique. Les états disponibles et réservés sont visibles dans le catalogue public.

Le formulaire accepte jusqu’à 20 photos JPEG, PNG ou WebP, les compresse avant l’envoi et permet de choisir la couverture et de modifier l’ordre. Les équipements saisis sont proposés dans les annonces suivantes. L’immatriculation reste privée. Les caractéristiques se renseignent manuellement.

Le téléphone et WhatsApp se configurent dans « Coordonnées et exemples ».

## Développement

Node.js 22 ou 24.

```sh
npm ci
npm run dev
npm run build
```

- `src/app.js` — catalogue et fiches
- `src/seller.js` — espace vendeur
- `src/data.js` — connexion, base et stockage Supabase
- `src/supabase-config.js` — URL et clé publique du projet
- `src/style.css` — mise en page
- `public/img/` — photos d’exemple
- `supabase/migrations/` — schéma, fonctions et règles d’accès
- `vercel.json` — configuration Vercel

La clé publishable est destinée au navigateur. La sécurité repose sur les autorisations de la base et du stockage. Aucune clé service_role n’est utilisée dans le site.

## Déploiement

Importer ce dépôt dans Vercel avec le preset Vite. La commande de build est `npm run build` et le résultat se trouve dans `dist`. Les publications suivantes peuvent partir des commits de la branche `main`.

Le projet Supabase correspondant doit disposer des migrations de `supabase/migrations/`. Dans Authentication → URL Configuration, déclarer l’URL Vercel de production comme Site URL et autoriser `https://VOTRE-DOMAINE/?espace=vendeur` comme destination de confirmation.

Les adresses autorisées à vendre figurent dans `autodeal_private.seller_emails`. Seul l’administrateur Supabase peut modifier cette liste. Le compte doit avoir confirmé son adresse. La base n’autorise aucune lecture directe des annonces ni de leur immatriculation aux visiteurs. Une fonction de catalogue retourne uniquement les annonces publiées et masque l’immatriculation. Les actions d’écriture vérifient les droits du vendeur et la révision de l’annonce.

Les photos sont stockées dans le bucket privé `vehicle-photos`. Le catalogue utilise des liens temporaires. Les droits de lecture contrôlent qu’une photo est publiée ou que la demande provient du vendeur.

Les changements du catalogue prennent effet dès l’enregistrement. Les changements de code demandent une nouvelle publication Vercel. Les annonces et les photos chargées en ligne sont conservées dans Supabase, séparément du dépôt GitHub.

Photos d’exemple — Unsplash, Caradisiac, Click Dealer, Arabavs, AutoUncle, Van Poelgeest et Autocar India. Remplacer ces illustrations par les photos des véhicules réels.
