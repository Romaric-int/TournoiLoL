import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// barème tournoi : null = rang inéligible
const POINTS_MAP: Record<string, number> = {
  SILVER_IV: 5,
  SILVER_III: 5.5,
  SILVER_II: 6,
  SILVER_I: 6.5,
  GOLD_IV: 7,
  GOLD_III: 7.5,
  GOLD_II: 8.5,
  GOLD_I: 9,
  PLATINUM_IV: 12,
  PLATINUM_III: 14,
  PLATINUM_II: 16,
  PLATINUM_I: 18,
  EMERALD_IV: 22,
  EMERALD_III: 25,
  EMERALD_II: 27,
  EMERALD_I: 30,
  DIAMOND_IV: 35,
  DIAMOND_III: 40,
};

function computePoints(tier: string | null, rank: string | null): number | null {
  if (!tier || !rank) return null;
  return POINTS_MAP[`${tier}_${rank}`] ?? null;
}

type RankData = {
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
} | null;

type SaveRiotDto = {
  userId: string;
  puuid: string;
  summonerId: string;
  gameName: string;
  tagLine: string;
  profileIconId?: number;
  iconUrl?: string;
  rank?: RankData;
};

@Injectable()
export class RiotService {
  private readonly apiKey = process.env.RIOT_API_KEY!;

  constructor(private readonly prisma: PrismaService) {}

  // récupère le compte Riot lié à un utilisateur
  async getLinkedAccount(userId: string) {
    return this.prisma.riotAccount.findUnique({ where: { userId } });
  }

  // sauvegarde ou met à jour le compte Riot
  async saveAccount(dto: SaveRiotDto) {
    const tier = dto.rank?.tier ?? null;
    const rank = dto.rank?.rank ?? null;

    const data = {
      puuid: dto.puuid,
      summonerId: dto.summonerId,
      gameName: dto.gameName,
      tagLine: dto.tagLine,
      profileIconId: dto.profileIconId ?? null,
      iconUrl: dto.iconUrl ?? null,
      tier,
      rank,
      lp: dto.rank?.lp ?? null,
      wins: dto.rank?.wins ?? null,
      losses: dto.rank?.losses ?? null,
      points: computePoints(tier, rank),
    };

    return this.prisma.riotAccount.upsert({
      where: { userId: dto.userId },
      create: { userId: dto.userId, ...data },
      update: data,
    });
  }

  // sauvegarde les rôles souhaités du joueur
  async saveRoles(userId: string, roles: string[]) {
    const existing = await this.prisma.riotAccount.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException('Aucun compte Riot lié à cet utilisateur');
    }

    return this.prisma.riotAccount.update({
      where: { userId },
      data: { roles },
    });
  }

  // actualise les données Riot depuis l'API pour un utilisateur
  async refreshAccount(userId: string) {
    const existing = await this.prisma.riotAccount.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException('Aucun compte Riot lié à cet utilisateur');
    }

    // récupère les infos invocateur via puuid
    const summonerRes = await fetch(
      `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${existing.puuid}`,
      { headers: { 'X-Riot-Token': this.apiKey } },
    );

    if (!summonerRes.ok) {
      throw new NotFoundException('Invocateur introuvable sur Riot');
    }

    const summoner = await summonerRes.json();

    // récupère le rang solo/duo via puuid
    const rankedRes = await fetch(
      `https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${existing.puuid}`,
      { headers: { 'X-Riot-Token': this.apiKey } },
    );

    let soloRank: {
      tier: string;
      rank: string;
      leaguePoints: number;
      wins: number;
      losses: number;
    } | null = null;
    if (rankedRes.ok) {
      const entries = await rankedRes.json();
      soloRank =
        entries.find(
          (e: { queueType: string }) => e.queueType === 'RANKED_SOLO_5x5',
        ) ?? null;
    }

    // récupère la version DDragon pour l'icône
    const versionRes = await fetch(
      'https://ddragon.leagueoflegends.com/api/versions.json',
    );
    const versions = await versionRes.json();
    const latestVersion = versions[0];

    const tier = soloRank?.tier ?? null;
    const rank = soloRank?.rank ?? null;

    // met à jour en base
    return this.prisma.riotAccount.update({
      where: { userId },
      data: {
        profileIconId: summoner.profileIconId,
        iconUrl: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/profileicon/${summoner.profileIconId}.png`,
        tier,
        rank,
        lp: soloRank?.leaguePoints ?? null,
        wins: soloRank?.wins ?? null,
        losses: soloRank?.losses ?? null,
        points: computePoints(tier, rank),
        lastRefreshedAt: new Date(),
      },
    });
  }
}
