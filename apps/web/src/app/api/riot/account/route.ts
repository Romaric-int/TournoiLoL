import { NextRequest, NextResponse } from "next/server";

// récupère les infos complètes d'un compte Riot (profil + rang)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gameName = searchParams.get("gameName");
  const tagLine = searchParams.get("tagLine");

  if (!gameName || !tagLine) {
    return NextResponse.json({ error: "gameName et tagLine requis" }, { status: 400 });
  }

  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API Riot manquante" }, { status: 500 });
  }

  try {
    // étape 1 : récupérer le puuid via Riot ID
    const accountRes = await fetch(
      `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers: { "X-Riot-Token": apiKey } }
    );

    if (!accountRes.ok) {
      if (accountRes.status === 404) {
        return NextResponse.json({ error: "Joueur introuvable" }, { status: 404 });
      }
      return NextResponse.json({ error: "Erreur Riot API" }, { status: accountRes.status });
    }

    const account = await accountRes.json();

    // étape 2 : récupérer les infos invocateur via puuid
    const summonerRes = await fetch(
      `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${account.puuid}`,
      { headers: { "X-Riot-Token": apiKey } }
    );

    if (!summonerRes.ok) {
      return NextResponse.json({ error: "Invocateur introuvable" }, { status: 404 });
    }

    const summoner = await summonerRes.json();

    // étape 3 : récupérer le rang solo/duo via puuid
    const rankedRes = await fetch(
      `https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${account.puuid}`,
      { headers: { "X-Riot-Token": apiKey } }
    );

    let soloRank = null;
    if (rankedRes.ok) {
      const entries = await rankedRes.json();
      soloRank = entries.find((e: { queueType: string }) => e.queueType === "RANKED_SOLO_5x5") ?? null;
    }

    // étape 4 : version DDragon pour l'URL de l'icône
    const versionRes = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    const versions = await versionRes.json();
    const latestVersion = versions[0];

    return NextResponse.json({
      puuid: account.puuid,
      summonerId: summoner.id,
      gameName: account.gameName,
      tagLine: account.tagLine,
      profileIconId: summoner.profileIconId,
      summonerLevel: summoner.summonerLevel,
      iconUrl: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/profileicon/${summoner.profileIconId}.png`,
      // rang solo/duo (null si unranked)
      rank: soloRank
        ? {
            tier: soloRank.tier,
            rank: soloRank.rank,
            lp: soloRank.leaguePoints,
            wins: soloRank.wins,
            losses: soloRank.losses,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
