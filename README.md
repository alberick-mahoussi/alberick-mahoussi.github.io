# Portfolio — Alberick Mahoussi

Portfolio professionnel d'Alberick Mahoussi, **analyste cybersécurité polyvalent**
(défense / SOC, test d'intrusion, audit & gouvernance). Site statique servi par
GitHub Pages sur **rickkoussi.tech**, en français, sans serveur ni base de données.

Recherche : **CDI**. Le positionnement ne cible pas une seule filière : il met en
avant des compétences sur plusieurs domaines de la cybersécurité.

## Architecture

Site statique HTML / CSS / JavaScript (modules ES, sans étape de build). Le contenu
éditorial est séparé du balisage : il vit dans `data/*.json` et est rendu côté client.

| Fichier | Rôle |
| --- | --- |
| `index.html` | Accueil : accroche, statistiques, liens, recherche en cours. |
| `about.html` | Profil : formations, expériences, compétences, langues. |
| `projects.html` | Grille des projets avec filtres par filière. |
| `blog.html` | Liste des write-ups et rendu d'un article (`?article=<id>`). |
| `certs.html` | Certifications obtenues / en préparation et plateformes CTF. |
| `contact.html` | Recherche en cours, contacts, CTF et CV. |
| `404.html` | Page d'erreur. |
| `styles.css` | Styles partagés, thème clair/sombre, rendu Markdown. |
| `assets/js/site.js` | Coquille commune : nav, pied de page, thème, animations. |
| `assets/js/*.js` | Un script de rendu par page (home, about, certs, contact, projects, blog). |
| `assets/vendor/` | `marked` (Markdown) et `DOMPurify` (nettoyage HTML), en local. |
| `data/*.json` | Source de toutes les données éditables (voir CMS). |
| `.pages.yml` | Schéma Pages CMS pour éditer les JSON. |
| `sitemap.xml`, `robots.txt`, `favicon.svg`, `assets/img/og.png` | SEO et partage. |

### Design

Direction « type-only », palette sobre (blanc / encre / un accent bleu), typographie
Bricolage Grotesque, thème clair par défaut avec bascule clair/sombre mémorisée
(`localStorage`, respecte la préférence système). Accessibilité : lien d'évitement,
focus visibles, `aria-current`, navigation mobile au clavier, contrastes AA.
Les animations d'entrée se dégradent proprement (contenu visible sans JS et en
`prefers-reduced-motion`).

## Édition du contenu (Pages CMS)

Tout le contenu est éditable depuis [Pages CMS](https://app.pagescms.org/) — aucune
donnée en dur dans le HTML. Collections configurées dans `.pages.yml` :

- **Accueil & informations** → `data/site.json` (accroche, cible CDI, stats, liens, CTF)
- **Profil** → `data/about.json`
- **Certifications** → `data/certs.json`
- **Projets** → `data/projects.json`
- **Blog / write-ups** → `data/blog.json` (champ `content` en Markdown)

Les modifications enregistrées sur la branche `main` sont publiées automatiquement par
GitHub Pages. Topics de projet reconnus pour les filtres : `defense`, `offensive`,
`grc`, `systemes`, `lab`, `outils`.

### Write-ups Markdown

Le rendu utilise **marked** + **DOMPurify** : titres, listes imbriquées, tableaux,
code (inline et blocs), citations, liens et images sont pris en charge, et le HTML est
nettoyé (pas d'injection possible). Coller un README en Markdown fonctionne directement.

## Développement local

Les scripts chargent des JSON via `fetch`, donc il faut servir le dossier en HTTP :

```bash
python3 -m http.server 8000   # puis http://localhost:8000/
# ou : npm run serve
```

## Tests

```bash
npm install                 # installe Playwright (tests uniquement)
npm run test:data           # valide le schéma des data/*.json
PW_CHANNEL=chrome npm run test:browser   # smoke tests navigateur (Chrome système)
npm run check:syntax        # node --check sur les modules JS
```

- `tests/validate-data.mjs` : validation de schéma des JSON (sans dépendance).
- `tests/browser.mjs` : charge chaque page dans un navigateur, vérifie le rendu
  (contenu injecté, filtres, rendu Markdown, bascule de thème) et l'absence d'erreur JS.
- `.github/workflows/ci.yml` : exécute tout cela à chaque push/PR (installe Chromium).

En local, `PW_CHANNEL=chrome` réutilise Google Chrome ; en CI, Playwright installe Chromium.

## Déploiement & sécurité

- GitHub Pages, source `main` / racine, domaine `rickkoussi.tech` (`CNAME`).
- Dépôt et site publics : ne jamais y déposer de secret ou de donnée privée.
- **À vérifier côté réglages GitHub Pages** (hors code) : forcer HTTPS une fois le
  certificat délivré.
- Pages CMS vit sur un domaine tiers (`app.pagescms.org`) ; son accès dépend des droits
  GitHub, pas d'une règle Cloudflare Access sur `rickkoussi.tech`.
