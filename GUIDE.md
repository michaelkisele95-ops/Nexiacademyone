# Guide — NEXI ONE (site des défis hebdomadaires)

Ce guide t'explique comment installer, connecter et alimenter ton site,
étape par étape. Prends ton temps, chaque section n'est à faire qu'une fois.

---

## 1. Ce que contient le zip

```
nexi-one/
├── index.html              → 🧒 ACCUEIL ENFANT (point d'entrée du site)
├── quiz.html                 → défis + classement + jeu
├── profil.html                 → "Mon profil" (Quotient de Croissance)
├── admin/
│   ├── login.html                → connexion administrateur
│   └── dashboard.html              → tableau de bord administrateur
├── css/style.css                     → tout le style visuel NEXI
├── js/config.js                        → ⭐ LE SEUL RÉGLAGE OBLIGATOIRE
├── js/store.js                           → mode démo (localStorage)
├── js/api.js                               → bascule démo / connecté
├── js/nexibot.js                             → mascotte NexiBot + sons
├── js/child.js, quiz.js, admin.js, profil.js   → logique des pages
├── apps-script/Code.gs                           → backend à coller dans Apps Script
├── data/modele-questions.csv                       → modèle d'import en masse
├── img/README.txt                                    → pour ton visuel NexiBot
└── GUIDE.md                                            → ce fichier
```

### 📌 Important : pourquoi l'admin est maintenant dans son propre dossier

Avant, la page admin pouvait apparaître avant la page enfant selon la façon
dont tu ouvrais le site (par exemple si ton navigateur ou ton outil listait
les fichiers par ordre alphabétique : `admin.html` passe avant `index.html`).

C'est corrigé : **`index.html`, à la racine, est maintenant le seul point
d'entrée naturel du site** — c'est le fichier que toute plateforme
d'hébergement (Netlify, GitHub Pages) ouvre automatiquement en premier.
L'espace administrateur est déplacé dans `admin/login.html` : un enfant qui
ouvre le site tombe directement sur sa page ; toi, tu cliques sur "Espace
administrateur" en bas de l'accueil, ou tu vas directement sur
`tonsite.com/admin/login.html`.

> 💡 Dans VS Code avec Live Server : clique-droit précisément sur
> `index.html` → **Open with Live Server**, pour être sûr de démarrer sur la
> bonne page. Si tu veux la sécurité totale, tu peux aussi épingler
> `index.html` comme fichier "racine" dans les réglages de l'extension
> (`liveServer.settings.root`, à mettre sur `/index.html`).

---

## 2. Les deux modes du site

- **Mode démo** (par défaut) : données dans le navigateur, pour tester vite.
  Chaque appareil a ses propres données — pas utilisable pour un vrai lancement.
- **Mode connecté** (recommandé) : données dans une Google Sheet partagée,
  visibles par tous les enfants et par toi, sur tous les appareils.

Réglage unique dans `js/config.js` → `APPS_SCRIPT_URL`. Vide = démo, remplie
= connecté (voir partie 4).

---

## 3. Les classes (G, F, E, D, C, B, A, S)

Chaque enfant appartient à une classe (renseignée à son inscription), et
chaque défi peut être réservé à une classe précise — un enfant ne voit que
les défis prévus pour la sienne.

- Dans l'onglet 👦 **Enfants** du tableau de bord, choisis la classe de
  l'enfant dans le menu déroulant.
- Dans l'onglet 📜 **Défis**, choisis "Classe concernée" en créant un défi.
  Choisis **"Toutes les classes"** pour un défi commun (ex. un défi spécial
  ouvert à tout le monde).
- Le filtrage se fait automatiquement : un enfant en classe `C` ne verra que
  les défis marqués `C` ou `Toutes`.

---

## 4. Le temps par question, réglable finement

Tu peux fixer un temps par défaut pour tout un défi (ex. 20 secondes), **et**
donner un temps différent à chaque question individuellement — utile car un
calcul mental ou une question de logique n'a pas besoin du même temps qu'un
problème de mathématiques à rédiger :

- Dans le formulaire "Créer un défi", chaque bloc de question a un champ
  **"Temps pour cette question"** — laisse-le vide pour utiliser le temps par
  défaut du défi.
- Idem dans le CSV d'import : la dernière colonne (`tempsQuestion`) permet de
  fixer ce temps question par question. Exemple : 15 secondes pour une
  question de géographie, 60 secondes pour un exercice de calcul.
- Ce temps par question (et la matière associée) sert aussi de base à la
  page "Mon profil" — voir partie 6.

---

## 5. Mettre en place Google Sheets + Apps Script (mode connecté)

### Étape 1 — Créer la Google Sheet
1. Va sur sheets.google.com, crée une feuille vide, nomme-la par exemple
   **"NEXI ONE — Base de données"**.

### Étape 2 — Coller le script
1. Dans cette Sheet : menu **Extensions > Apps Script**.
2. Supprime le contenu par défaut et colle l'intégralité du fichier
   `apps-script/Code.gs` fourni dans ce zip.
3. Sauvegarde (icône 💾).

### Étape 3 — Initialiser les onglets
1. Menu déroulant des fonctions en haut de l'éditeur → choisis
   **configurerFeuilles** → **▶ Exécuter**.
2. Autorise l'accès à ton compte la première fois (normal, c'est ton script).
3. Tu dois voir apparaître 6 onglets dans ta Sheet : **Enfants, Defis,
   Questions, Resultats, Reponses, Config**.

> Tu avais déjà une Sheet NEXI ONE créée avant cette mise à jour ? Utilise
> plutôt **mettreAJourFeuillesV2** à la place de configurerFeuilles : elle
> ajoute les nouvelles colonnes (Classe, Matiere, TempsQuestion...) sans
> toucher à tes données existantes.

### Étape 4 — Déployer en tant qu'application Web
1. **Déployer > Nouveau déploiement** → type **Application Web**.
2. Exécuter en tant que **Moi**, accès **Tout le monde**.
3. **Déployer**, autorise si demandé, puis copie l'**URL de l'application
   Web** (`https://script.google.com/macros/s/XXXXX/exec`).

### Étape 5 — Brancher le site
1. Ouvre `js/config.js` dans VS Code.
2. Colle l'URL dans `APPS_SCRIPT_URL: "TON_URL_ICI"`. Sauvegarde.

> ⚠️ Après toute modification de `Code.gs`, refais un déploiement :
> **Déployer > Gérer les déploiements > ✏️ > Nouvelle version > Déployer**.
> L'URL ne change pas.

---

## 6. "Mon profil" et le Quotient de Croissance — comment ça marche

Chaque enfant, une fois connecté, peut cliquer sur **📈 Voir mon profil**
pour voir :
- son **Quotient de Croissance** (Régularité, Progression, Constance,
  Résilience) — calculé automatiquement à partir de ses résultats successifs,
  dans le même esprit que ta méthodologie NEXI ONE (voir ton document de
  présentation) ;
- ses **scores par matière** — calculés à partir du champ "Matière" que tu
  renseignes sur chaque question ;
- ses **derniers défis** avec leur pourcentage.

C'est un indicateur pilote simplifié (comme le précise ton propre document
aux parents) : il se base sur les résultats et réponses enregistrés dans les
onglets **Resultats** et **Reponses** de ta Sheet. Plus tu renseignes le
champ "Matière" sur tes questions, plus ce profil est détaillé.

> 💡 Pour construire un vrai rapport PDF mensuel (comme ton "Profil
> d'apprentissage") à partir de ces données, l'onglet **Reponses** contient
> tout le détail nécessaire (bonne/mauvaise réponse, temps pris, matière,
> par semaine) — exportable en Excel pour l'analyse ou pour alimenter un
> modèle de rapport.

---

## 7. Comment insérer et extraire tes données facilement

### Ajouter des enfants
- Onglet **Enfants** de ta Sheet directement, ou formulaire du tableau de
  bord (onglet 👦 Enfants) — les deux écrivent au même endroit. N'oublie pas
  la colonne **Classe**.

### Ajouter les questions de la semaine
- **Le plus rapide pour un gros volume (25 questions)** : ajoute une ligne
  dans l'onglet **Defis** (note son `ID`, ex. `defi_S5`, et sa **Classe**),
  puis colle tes questions en masse dans l'onglet **Questions** avec ce même
  `DefiID` — en remplissant si besoin les colonnes **Matiere** et
  **TempsQuestion** pour chaque ligne.
- **Ou** : formulaire "Créer un défi" / import CSV dans l'onglet 📜 Défis du
  tableau de bord (le CSV inclut désormais matière et temps par question,
  voir `data/modele-questions.csv`).

### Extraire / consulter les résultats
- Onglet **Resultats** (résumé par défi) et **Reponses** (détail question
  par question) de ta Sheet, mis à jour en temps réel. Exportables en Excel
  (`Fichier > Télécharger > .xlsx`).

---

## 8. Relier ton Google Form d'inscription (optionnel mais recommandé)

1. Ouvre ton Google Form existant → **Réponses** → icône Google Sheets (🟢)
   → lie-le à la même Google Sheet que celle créée en partie 5 (ou à une
   nouvelle feuille dédiée, au choix).
2. Ouvre l'éditeur Apps Script **lié à cette Sheet**.
3. Dans `Code.gs`, repère `onFormSubmit(e)` en bas du fichier. Adapte les
   noms entre guillemets (`"Prénom de l'enfant"`, `"Classe"`, etc.) pour
   qu'ils correspondent **exactement** aux intitulés de tes questions du Form.
4. Icône ⏰ **Déclencheurs** → **+ Ajouter un déclencheur** :
   - Fonction : `onFormSubmit`
   - Source : **Depuis la feuille de calcul**
   - Type d'événement : **Sur envoi du formulaire**
5. Chaque inscription crée désormais un enfant automatiquement (identifiant
   généré, **Actif = FALSE** par défaut). Active-le une fois le paiement
   Mobile Money confirmé, puis communique l'identifiant par WhatsApp.

---

## 9. Tester le site dans VS Code

1. Dézippe `nexi-one`, ouvre-le dans VS Code.
2. Extension **Live Server** → clique-droit sur `index.html` (à la racine,
   pas dans `admin/`) → **Open with Live Server**.
3. Identifiants de test (mode démo) : enfant `LEO123` ou `MIA456` (classe
   `C`) ; admin `tresor2026` via `admin/login.html`.

---

## 10. Publier le site en ligne (gratuit)

### Netlify (le plus simple)
Glisse-dépose le dossier `nexi-one` sur netlify.com ("Deploy manually") —
adresse en ligne immédiate, `index.html` est automatiquement la page
d'accueil.

### GitHub Pages
Dépôt GitHub avec les fichiers du dossier `nexi-one` → **Settings > Pages** →
branche `main`, dossier `/root`.

---

## 11. Sécurité — à savoir

- Le mot de passe admin protège l'interface, mais l'URL de ton Apps Script
  reste techniquement appelable directement si quelqu'un la connaît. Pour un
  pilote avec un groupe restreint de familles, c'est raisonnable ; évite de
  partager publiquement l'URL `.../exec` ou le contenu de `Code.gs`.
- Ne partage jamais ta Google Sheet en "modifiable par tous" — seul le lien
  Apps Script doit être public, pas la feuille de calcul elle-même.

---

## 12. Pour aller plus loin

- Lien WhatsApp Business (API) pour automatiser l'envoi des identifiants et
  des résultats du samedi ;
- Export PDF automatique du "Profil d'apprentissage" mensuel à partir des
  onglets Resultats/Reponses ;
- Ligues/niveaux (roadmap NEXI STUDIO / NEXI ACADEMY).

Dis-moi ce que tu veux prioriser ensuite !
