# Installer Tortue Blocs sur la tablette Android

## 1. Mettre l'appli en ligne (une seule fois, gratuit)

### Méthode A — GitHub Pages (sans installer de logiciel)
1. Créer un compte gratuit sur https://github.com (si besoin).
2. « New repository » → nom : `tortue-blocs` → **Public** → Create.
3. « uploading an existing file » → glisser **tout le contenu** du dossier `Algoblocs`
   (index.html, sw.js, manifest.webmanifest, dossiers css, js, icons, vendor…) → Commit.
   (Astuce : si le glisser-déposer refuse les dossiers, utiliser Chrome sur PC.)
4. Settings → Pages → Source : « Deploy from a branch » → branche `main`, dossier `/ (root)` → Save.
5. Après ~1 minute, l'adresse est : `https://<votre-pseudo>.github.io/tortue-blocs/`

### Méthode B — Netlify (encore plus rapide)
1. Créer un compte gratuit sur https://app.netlify.com
2. « Add new site » → « Deploy manually » → glisser le dossier `Algoblocs`.
3. L'adresse (modifiable dans « Site configuration ») est du type `https://xxxx.netlify.app`.

## 2. Installer sur la tablette
1. Ouvrir l'adresse dans **Chrome** sur la tablette, attendre le chargement complet (1 fois, avec Internet).
2. Menu ⋮ → **« Installer l'application »** (ou « Ajouter à l'écran d'accueil »).
3. Ouvrir l'icône 🐢 : l'appli fonctionne ensuite **sans Internet**.

## 3. Bon à savoir
- La progression (prénoms, niveaux réussis) est enregistrée **sur la tablette**, dans l'appli installée.
  Ne pas « vider les données de Chrome / du site » sinon elle est perdue.
- Mises à jour : remplacer les fichiers sur GitHub/Netlify. La tablette récupère la nouvelle version
  au lancement suivant (en ligne) ; la version à jour s'affiche au 2ᵉ lancement.
- Test hors ligne : mode avion, relancer l'icône.
