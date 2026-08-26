# BuildCheck

BuildCheck est un SaaS mobile-first de validation produit : il mesure la demande, la douleur, la volonté de payer, la distribution, la concurrence, la simplicité de construction et la défensibilité **avant** d'investir dans un produit complet.

Cette livraison est volontairement **mock-first**. Le moteur, l'UX, les contrats de providers, les sorties structurées et l'intégration WebMCP fonctionnent sans Reddit, X, Google, OpenAI ou Supabase. Aucune donnée de démonstration n'est présentée comme une observation en direct.

## État d'entrée et périmètre livré

Le dépôt Git était vide au début de l'intervention. Cette version apporte :

- une application Next.js 16 / React 19 / TypeScript strict ;
- une landing page, l'authentification de démonstration, l'onboarding et un workspace complet ;
- un moteur déterministe, explicable et testé ;
- des providers mockés derrière des interfaces interchangeables ;
- un feed d'opportunités, des projets persistés localement et des rapports versionnés ;
- une PWA installable ;
- une migration Supabase prête à appliquer, avec RLS et analyses append-only ;
- sept outils WebMCP natifs, enregistrés uniquement quand le navigateur expose l'API ;
- une page Agent, un garde-fou « before build » et un journal d'activité sans prompts ni secrets.

## Démarrage

Prérequis : Node.js 20 ou plus récent et npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvrir `http://localhost:3000`. Aucun service externe n'est nécessaire en mode démo.

Vérification complète :

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Le script `build` force Webpack, car certains sandboxes locaux interdisent le sous-processus/port interne utilisé par Turbopack. `npm run build:turbopack` reste disponible dans un environnement qui l'autorise.

## Parcours de démonstration

1. Ouvrir `/dashboard` et comparer les projets seedés.
2. Ouvrir `InvoiceFlow` : score élevé, verdict de validation, evidence mockée traçable et MVP court.
3. Ouvrir `Generic AI CRM for freelancers` : verdict `PIVOT`, risque de banalisation et pivot hypothétique vers les photographes immobiliers indépendants.
4. Aller dans `/validate`, saisir une idée, puis vérifier qu'elle apparaît dans le dashboard et dans `/projects`.
5. Réanalyser un projet : l'analyse précédente reste disponible dans l'historique immuable.
6. Ouvrir `/agents` dans un navigateur compatible WebMCP, vérifier les sept outils, puis utiliser le prompt de démonstration.

Le bouton **Reset demo data** dans `/settings` restaure cet état.

## Architecture

```text
UI Next.js / Agent WebMCP / API HTTP
                │
       services métier partagés
                │
   moteur de score + décision + coût
                │
 AIProvider / DataSourceProvider
                │
      mock actif / HN optionnel
```

Les points d'entrée UI, HTTP et WebMCP appellent les mêmes services. Aucune règle de score n'est dupliquée dans un composant ou dans un outil agent.

Répertoires principaux :

- `app/` : routes publiques, workspace et API ;
- `components/` : design system applicatif et pont WebMCP ;
- `lib/scoring/` : score, confiance, verdict et complexité ;
- `lib/providers/` : contrats, mocks et registre des adapters ;
- `lib/services/` : cas d'usage partagés ;
- `lib/agent/` et `lib/webmcp/` : schémas et catalogue d'outils ;
- `supabase/migrations/` : schéma SQL, contraintes, index et RLS ;
- `tests/` : règles métier, sécurité, provenance et contrats agent.

## Moteur de décision

Le Build Score est pondéré sur 100 points :

| Dimension | Poids |
| --- | ---: |
| Demande | 25 |
| Douleur | 20 |
| Volonté de payer | 15 |
| Distribution | 15 |
| Opportunité concurrentielle | 10 |
| Simplicité de construction | 10 |
| Défensibilité | 5 |

Verdicts : `BUILD` à partir de 80, `VALIDATE FIRST` à partir de 60, `PIVOT` à partir de 40, sinon `KILL`.

Le score de confiance est séparé du Build Score. Il tient compte de la force, de la fiabilité, de la récence, de la provenance, de la diversité des sources et de la couverture des types de signaux. Une sortie générée ne compte pas comme preuve marché. Une idée sans preuve suffisante reçoit la décision agent `INSUFFICIENT_EVIDENCE`.

Les fourchettes d'heures et de tokens sont directionnelles. Elles expriment l'incertitude du périmètre ; ce ne sont pas des mesures d'usage réelles.

## Providers mock-first

Deux contrats isolent le moteur :

- `AIProvider` : synthèse, roast, MVP, pivots et résumé ;
- `DataSourceProvider` : collecte normalisée de signaux et concurrents.

Le registre garde `mock` comme défaut et expose deux adapters réels optionnels : Hacker News via la [HN Search API](https://hn.algolia.com/api) et GitHub Issues via la [REST Search API](https://docs.github.com/en/rest/search/search#search-issues-and-pull-requests). OpenAI, Anthropic, Gemini, Reddit, Product Hunt et les plateformes d'avis restent `planned` ou `not connected`.

Activation locale de cette première source :

```bash
DATA_SOURCE_PROVIDER=hacker-news+github npm run dev
```

L'activation serveur rend les sources disponibles mais ne transmet encore rien. L'utilisateur doit cocher **Use live Hacker News + GitHub Issues evidence**, ou un agent doit envoyer `allow_external_lookup: true`. Sans ce consentement par projet, l'en-tête reste `mock-external-consent-required` et l'analyse utilise les mocks.

Après consentement, chaque provider transmet uniquement trois mots-clés dérivés et examine au maximum 20 résultats sur une fenêtre de deux ans, avec un timeout de 4,5 secondes. Il exige le sujet principal et au moins un terme du problème, classe la pertinence puis conserve huit candidats au maximum. L'agrégateur limite ensuite chaque source à six preuves, douze au total, afin qu'une communauté ne domine pas artificiellement le score. Les extraits gardent leur URL publique, `provenance: observed`, `isDemo: false` et une fiabilité plafonnée, car les discussions restent anecdotiques. Aucun concurrent ni canal de distribution n'est inventé lorsque les sources ne les établissent pas.

Une panne partielle conserve uniquement les preuves de la source live restante. Si toutes les sources sont indisponibles ou renvoient un format invalide, l'analyse bascule une seule fois sur les scénarios mockés et porte explicitement `evidenceMeta.mode: fallback`. Le projet Algolia HN Search étant archivé côté code source depuis février 2026, cet adapter doit rester bêta et surveillé ; une ingestion interne depuis l'[API HN Firebase officielle](https://github.com/HackerNews/API) est l'alternative de production si sa disponibilité devient insuffisante.

GitHub fonctionne sans authentification pour les données publiques, avec une limite plus basse. Un `GITHUB_TOKEN` serveur facultatif relève les limites applicables ; il n'est jamais exposé au navigateur et la recherche reste en lecture seule. La Search API possède ses propres limites, donc ce connecteur doit être protégé par un rate limiter partagé avant un usage SaaS important. Voir les [limites REST GitHub](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) et l'[authentification REST](https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api).

Pour brancher une source réelle :

1. implémenter le contrat correspondant sans modifier le moteur ;
2. mapper chaque observation avec `source`, `sourceUrl`, date, fiabilité et `provenance: observed` ;
3. ajouter des fixtures et des tests de contrat ;
4. activer la source dans le registre et l'écran Settings ;
5. vérifier les quotas, erreurs partielles, suppressions et conditions d'utilisation ;
6. déployer une source à la fois et comparer ses résultats aux scénarios mockés.

## WebMCP natif

BuildCheck utilise `document.modelContext.registerTool` avec feature detection. En l'absence de cette API, aucun shim et aucune fausse connexion ne sont installés : la page Agent affiche simplement l'indisponibilité.

WebMCP reste expérimental et lié à la page ouverte. Les outils sont enregistrés dans le workspace, héritent de la session courante et sont désenregistrés avec un `AbortController` lorsque le layout disparaît. Références : [documentation OpenAI Site tools](https://learn.chatgpt.com/docs/webmcp), [draft WebMCP](https://webmachinelearning.github.io/webmcp/) et [WebMCP Challenge](https://openai.com/webmcp-challenge/).

### Outils exposés

| Outil | Accès | Effet principal |
| --- | --- | --- |
| `validate_idea` | écriture | analyse et persiste un projet dans le workspace courant |
| `roast_idea` | lecture | expose risques, hypothèses et conditions de révision |
| `get_project_analysis` | lecture | retourne la dernière analyse d'un projet appartenant à l'utilisateur |
| `generate_validation_mvp` | lecture | retourne le plus petit test, ses exclusions et métriques |
| `estimate_build_cost` | lecture | retourne fourchettes heures/tokens et facteurs de risque |
| `find_opportunities` | lecture | filtre le feed d'opportunités, marqué démo |
| `evaluate_before_build` | lecture | conseille ou déconseille le build complet et propose une alternative |

Chaque outil possède un JSON Schema strict généré depuis Zod, des annotations `readOnlyHint` / `untrustedContentHint`, une sortie structurée, un rate limit par utilisateur et un log technique minimal. Les IDs inconnus et non autorisés partagent la même erreur afin de limiter l'énumération.

Exemple de prompt dans un client compatible :

> Analyse mon idée de CRM IA générique pour freelances, challenge ses hypothèses, estime le coût d'un produit complet puis recommande le plus petit MVP de validation. N'approuve pas le build complet si les preuves sont insuffisantes.

La continuité agent est visible : un appel `validate_idea` ajoute le projet au dashboard et le journal de `/agents` conserve les appels réussis ou en erreur dans le stockage local. En production, cette continuité doit utiliser les tables Supabase et une session Auth réelle.

## Sécurité et données

- validation Zod côté API et côté WebMCP ;
- limites de longueur et body HTTP plafonné ;
- rate limiting de démonstration par utilisateur et outil ;
- contrôles d'appartenance projet avant lecture ;
- logs sans idée brute, prompt, clé ou contenu de preuve ;
- en-têtes `nosniff`, referrer et permissions restrictives ;
- Service Worker limité au shell et aux assets statiques same-origin, sans cache des routes API ;
- secrets uniquement via variables serveur ;
- RLS sur toutes les tables privées Supabase ;
- analyses, scores et preuves append-only côté clients authentifiés.

Le stockage `localStorage` et l'utilisateur `demo-user` conviennent uniquement à la démonstration. Ils ne constituent ni une authentification ni une isolation multi-tenant de production.

## Supabase

Le runtime de démonstration ne dépend pas de Supabase. Pour préparer un environnement réel :

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Puis renseigner les variables de `.env.example` et implémenter l'adapter de persistence. La migration crée profils, préférences, projets, analyses versionnées, scores, signaux, concurrents, pivots, MVP, opportunités et activité agent.

## API HTTP

- `GET /api/health` : santé et providers actifs ;
- `POST /api/analyze` : validation structurée avec le même `ValidationService` que l'UI.

Exemple :

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H 'content-type: application/json' \
  -d '{"description":"A lightweight assistant that reconciles disputed ecommerce refunds for small operations teams.","targetCustomer":"Small ecommerce operations teams"}'
```

La réponse porte `X-BuildCheck-Providers: mock` par défaut, l'identifiant configuré (`hacker-news`, `github` ou `hacker-news+github`) en mode live, `mock-external-consent-required` avant consentement, ou un suffixe `-fallback-mock` lorsque toutes les sources échouent. `X-BuildCheck-Evidence-Mode` distingue également `demo`, `live` et `fallback`.

## Limites avant production

Cette version est un produit de démonstration crédible, pas encore un SaaS multi-tenant exploitable publiquement. Restent notamment à brancher :

- Supabase Auth et l'adapter de persistence ;
- la supervision de HN Search et GitHub Search et, si nécessaire, le remplacement de l'adapter HN bêta par une ingestion interne ;
- un provider IA réel si les synthèses génératives sont souhaitées ;
- un rate limiter partagé (Redis/Upstash ou équivalent) pour plusieurs instances ;
- observabilité, alertes, politique de rétention et suppression de compte ;
- tests E2E sur navigateur compatible WebMCP et environnement de déploiement final.

La stratégie recommandée reste volontairement séquentielle : valider l'UX et le moteur mockés, puis connecter les vraies sources une par une.
