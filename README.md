# Autodeal 94

Maquette statique en français. Six annonces fictives et photos d’illustration.

## Lancer
Ouvrir `index.html` ou lancer `python3 -m http.server 8000`.

## Déployer
Dans Settings → Pages, choisir Deploy from a branch puis main et / (root). Pour Vercel, importer ce dépôt comme projet statique (Framework Preset Other, sans build). Les URLs des véhicules utilisent des paramètres de requête pour fonctionner sur les deux hébergeurs.

## Configurer
Le numéro international se configure dans `app.js` via `contactNumber`. Sans numéro, le site affiche le parcours de démonstration. Les données du parc sont dans `stock`.

Le formulaire vendeur accepte la plaque fictive DE-094-MO. Il préremplit la fiche et enregistre l’ajout dans le navigateur courant. Pour exploiter des plaques réelles, prévoir une interface vendeur authentifiée, un appel serveur à un service comme https://www.api-plaque.com/documentation, une clé tenue côté serveur et une base de données pour publier le stock. Le vendeur saisit prix, kilométrage, équipements vérifiés et photos. L’immatriculation doit rester hors des fiches publiques.

Photos de démonstration : Unsplash (bannière), Caradisiac (208), Click Dealer (Clio), Arabavs (Golf), AutoUncle (Yaris), Van Poelgeest (BMW), Autocar India (Audi). Remplacer les illustrations par les photos du concessionnaire avant production.

## Modifier le site
- `index.html` contient la structure, le nom et la navigation.
- `style.css` contient les couleurs, polices, espacements et le rendu mobile.
- `app.js` contient le parc (`stock`), les fiches, les messages WhatsApp et le numéro (`contactNumber`).
- `img/` contient les photos.

Sur GitHub, ouvrir un fichier puis cliquer sur le crayon pour le modifier et enregistrer un commit. Un déploiement Vercel connecté au dépôt peut publier les changements automatiquement.
