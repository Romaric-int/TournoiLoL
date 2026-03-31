# Tournoi LoL — Contexte projet

## Description
Application web pour organiser des tournois League of Legends.

## Fonctionnalités prévues
- Connexion via Discord OAuth
- Liaison compte Riot (saisie manuelle dans un premier temps, OAuth Riot plus tard)
- Création et recherche d'équipes
- Planning des matchs

## Stack technique
- **Frontend** : Next.js 15 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (à venir)
- **Backend** : NestJS + TypeScript — port 3001
- **ORM** : Prisma (dans `packages/db`)
- **Base de données** : PostgreSQL (local via pgAdmin en dev, Railway en prod)
- **Auth** : NextAuth.js v5 beta (provider Discord, adapter Prisma)
- **Monorepo** : Turborepo
- **Déploiement** : Railway (Next.js + NestJS + PostgreSQL)

## Conventions
- Les commentaires dans le code sont en français
- Pas d'emoji dans le code ni dans les réponses
- Pour les icônes en frontend, utiliser des SVG (pas d'emoji)
- `cursor-pointer` sur tous les éléments cliquables (boutons, liens)
- Tailwind pour la structure/layout + `globals.css` pour les variables CSS et effets custom

## Architecture des appels
```
Page (client) → Next.js API Route (vérifie session) → NestJS (logique métier + DB)
```
- Les API Routes Next.js servent uniquement à vérifier la session et transmettre à NestJS
- NestJS gère toute la logique métier et les appels à la DB via Prisma
- La communication Next.js → NestJS est sécurisée par `INTERNAL_API_SECRET` (header `x-internal-secret`)

## Structure du monorepo
```
tournoi/
├── apps/
│   ├── web/      # Next.js (UI) — port 3005
│   └── api/      # NestJS (REST API) — port 3001
└── packages/
    └── db/       # Prisma schema + client partagé (@tournoi/db)
```

## Structure Next.js
```
apps/web/src/
├── app/
│   ├── layout.tsx                          # layout global avec Header + SessionProvider
│   ├── page.tsx                            # homepage (/)
│   ├── rateme/
│   │   └── page.tsx                        # inscription : liaison Riot, rôles, préférences joueur
│   ├── mercato/                            # page mercato (à créer)
│   └── api/
│       ├── auth/[...nextauth]/route.ts     # route NextAuth
│       ├── riot/
│       │   ├── account/route.ts            # GET — recherche Riot par gameName#tag
│       │   ├── me/route.ts                 # GET — compte Riot lié à l'utilisateur
│       │   ├── save/route.ts               # POST — sauvegarde compte Riot
│       │   ├── refresh/route.ts            # POST — actualise les données Riot
│       │   └── roles/route.ts              # POST — sauvegarde les rôles du joueur
│       └── user/
│           └── preferences/route.ts        # GET + PATCH — préférences joueur
├── components/
│   ├── Header.tsx                          # header fixe : Mon inscription, Mercato, Equipes, Planning
│   └── SessionProvider.tsx                 # wrapper client NextAuth
├── lib/
│   └── auth.ts                             # config NextAuth (Discord provider)
└── types/
    └── next-auth.d.ts                      # extension du type Session (user.id)
```

## Structure NestJS
```
apps/api/src/
├── main.ts                  # entrée, charge dotenv, port 3001
├── app.module.ts            # importe PrismaModule + RiotModule + UserModule
├── prisma/
│   ├── prisma.module.ts     # module global
│   └── prisma.service.ts    # client Prisma injectable
├── riot/
│   ├── riot.module.ts
│   ├── riot.controller.ts   # GET /riot/me, POST /riot/save, POST /riot/refresh, POST /riot/roles
│   └── riot.service.ts      # logique métier + appels Riot API
└── user/
    ├── user.module.ts
    ├── user.controller.ts   # GET /user/preferences, PATCH /user/preferences
    └── user.service.ts      # lecture/écriture préférences utilisateur
```

## Design system
- Thème sombre gaming
- Variables CSS dans `globals.css` : `--background`, `--foreground`, `--accent` (#5865f2 violet Discord), `--border`, `--surface`, `--surface-hover`, `--muted`
- Classe `.glow` pour l'effet lumineux sur les éléments interactifs
- Logo : `public/images/logo.svg`

## Page rateme/ — fonctionnement
1. Non connecté : bouton Discord OAuth
2. Connecté sans compte Riot : formulaire de recherche par gameName#tag → confirmation → save
3. Connecté avec compte Riot lié :
   - Affichage icône, nom, rang, éligibilité/points
   - Date + heure du dernier refresh (en haut à gauche de la carte)
   - Bouton refresh (actualise depuis l'API Riot, met à jour `lastRefreshedAt`)
   - Rôles souhaités (badges) + lien "Ajouter/Modifier mes rôles" (modal de sélection)
   - Toggle "Je recherche une équipe" : si activé sans rôles → ouvre la modal des rôles
   - Toggle "J'accepte les DM Discord"
   - Les toggles sont sauvegardés immédiatement en base au clic

## Système de points tournoi
- Chaque joueur a un coût en points selon son rang solo/duo (stocké dans `RiotAccount.points`)
- Une équipe ne peut pas dépasser **100 points** au total
- Les points sont calculés côté NestJS (`computePoints` dans `riot.service.ts`) lors du save et du refresh
- `points = null` signifie que le joueur est **inéligible** (rang hors barème)
- Un joueur est aussi inéligible s'il a moins de **50 games** (wins + losses) — vérifié côté frontend

### Barème
| Rang | Points |
|------|--------|
| Silver IV | 5 |
| Silver III | 5.5 |
| Silver II | 6 |
| Silver I | 6.5 |
| Gold IV | 7 |
| Gold III | 7.5 |
| Gold II | 8.5 |
| Gold I | 9 |
| Platinum IV | 12 |
| Platinum III | 14 |
| Platinum II | 16 |
| Platinum I | 18 |
| Emerald IV | 22 |
| Emerald III | 25 |
| Emerald II | 27 |
| Emerald I | 30 |
| Diamond IV | 35 |
| Diamond III | 40 |

Rangs inéligibles (points = null) : Iron, Bronze, Diamond II+, Master, Grandmaster, Challenger, Non classé

## Modèles de données Prisma
- **User** : id, name, email, emailVerified, image, discordUsername, lookingForTeam, acceptDm (+ relations NextAuth)
- **Account / Session / VerificationToken** : tables NextAuth
- **RiotAccount** : gameName, tagLine, puuid, summonerId, profileIconId, iconUrl, tier, rank, lp, wins, losses, points, prevTier, prevRank, roles (String[]), lastRefreshedAt
- **Team** : name, tag, description, captain (User), members (User[])
- **TeamMember** : relation User <-> Team avec joinedAt
- **Tournament** : name, startDate, endDate
- **Match** : teamA, teamB, round, scheduledAt, result, lié à Tournament

## Variables d'environnement
### apps/web/.env.local
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` = http://localhost:3005
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `RIOT_API_KEY`
- `INTERNAL_API_SECRET`
- `NEST_API_URL` = http://localhost:3001

### apps/api/.env
- `DATABASE_URL` = postgresql://...
- `RIOT_API_KEY`
- `INTERNAL_API_SECRET`
- `PORT` = 3001

### packages/db/.env
- `DATABASE_URL` = postgresql://...

## Redirect Discord OAuth
- Dev : `http://localhost:3005/api/auth/callback/discord`
- Prod : `https://TON_DOMAINE.railway.app/api/auth/callback/discord`

## Riot API
- Région account-v1 : `europe.api.riotgames.com`
- Région summoner/league : `euw1.api.riotgames.com`
- Icônes profil : `ddragon.leagueoflegends.com/cdn/{version}/img/profileicon/{id}.png`
- Toujours privilégier les endpoints `by-puuid` quand disponibles (ex: `/lol/league/v4/entries/by-puuid/{puuid}`)
- Ne pas utiliser `by-summoner` si `by-puuid` existe pour le même endpoint
