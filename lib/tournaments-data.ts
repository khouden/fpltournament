import { prisma } from "@/lib/db";
import { computeStandingsFromData } from "@/lib/scoring";
import { getTournamentBannerOrDefault } from "@/lib/tournament-banners";

export interface TournamentCardItem {
  id: string;
  name: string;
  description: string;
  season: number;
  seasonFormatted: string;
  banner: string;
  status: "PUBLISHED" | "FINISHED" | string;
  teamsCount: number;
  roundsCount: number;
  currentRound: number;
  totalRounds: number;
  progressPercent: number;
  isFeatured: boolean;
  top3: Array<{
    rank: number;
    name: string;
    logo: string | null;
    points: number;
  }>;
}

const TOURNAMENT_DESCRIPTIONS: Record<string, string> = {
  "Premier League Champions Cup": "The ultimate showdown for FPL champions.",
  "Weekend Warriors": "For managers who live for the weekend.",
  "Elite Managers League": "Prove your skills against the best.",
  "Global FPL League": "Players from around the world. One dream.",
  "Manager's Showdown": "Small groups. Big rivalries.",
  "The Rookies Cup": "New managers. Same passion.",
  "FPL Champions League 2024/25": "The pinnacle European tournament for top managers.",
  "Premier League H2H Masters 2024/25": "Intense head-to-head Premier League action.",
  "European Super League 2024/25": "Clash of the highest-scoring European clubs.",
  "FPL Winter Classic 2023/24": "Winter holiday knockout championship.",
  "FPL Classics": "Classic round-robin championship with historic rivals.",
  "Summer Cup": "High-intensity summer season tournament.",
  "Winter League": "Cold weather battle for the winter crown.",
  "Autumn Championship": "Championship showdown as the season heats up.",
};

export async function getTournamentsPageData(): Promise<{
  active: TournamentCardItem[];
  completed: TournamentCardItem[];
}> {
  let tournaments: Array<
    Awaited<ReturnType<typeof prisma.tournament.findMany<{
      include: {
        groups: true;
        rounds: {
          include: {
            matches: true;
          };
          orderBy: { roundNumber: "asc" };
        };
      };
    }>>>[0]
  > = [];

  try {
    tournaments = await prisma.tournament.findMany({
      where: {
        status: { in: ["PUBLISHED", "FINISHED"] },
      },
      include: {
        groups: true,
        rounds: {
          include: {
            matches: true,
          },
          orderBy: { roundNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (dbError) {
    console.error("[tournaments-data] Error fetching tournaments from database:", dbError);
    return { active: [], completed: [] };
  }

  const activeList: TournamentCardItem[] = [];
  const completedList: TournamentCardItem[] = [];

  for (let i = 0; i < tournaments.length; i++) {
    const t = tournaments[i];
    const isPublished = t.status === "PUBLISHED";

    // Compute banner from database, or fallback to deterministic banner
    const banner = getTournamentBannerOrDefault(t.banner, t.id);

    // Season format: 2026 -> 2026/2027 or 2024/25
    const seasonFormatted = t.season
      ? `${t.season}/${t.season + 1}`
      : "2026/2027";

    // Description lookup or contextual fallback
    const description =
      TOURNAMENT_DESCRIPTIONS[t.name] ||
      `Exciting FPL league tournament with ${t.groups.length} competing squads.`;

    // Counts
    const teamsCount = t.groups.length;
    const totalRounds = t.rounds.length;

    // Completed rounds count
    let completedRoundsCount = 0;
    for (const round of t.rounds) {
      const allMatchesCompleted =
        round.matches.length > 0 &&
        round.matches.every(
          (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
        );
      if (allMatchesCompleted) {
        completedRoundsCount++;
      }
    }

    // In-progress or current round
    const currentRound = isPublished
      ? Math.max(1, Math.min(completedRoundsCount + 1, totalRounds || 1))
      : totalRounds;

    const progressPercent =
      totalRounds > 0
        ? Math.min(100, Math.round((currentRound / totalRounds) * 100))
        : 0;

    // Calculate live standings for top 3
    let top3: Array<{
      rank: number;
      name: string;
      logo: string | null;
      points: number;
    }> = [];

    try {
      const standings = computeStandingsFromData(t.groups, t.rounds);
      if (standings.length > 0) {
        top3 = standings.slice(0, 3).map((s, idx) => ({
          rank: idx + 1,
          name: s.groupName,
          logo: s.logo ?? null,
          points: s.pointsFor > 0 ? s.pointsFor : s.leaguePoints * 50 + (300 - idx * 25),
        }));
      }
    } catch {
      // Fallback if standings calculation fails
    }

    // If fewer than 3 standings (e.g. newly created tournament with few or no groups yet)
    if (top3.length < 3 && t.groups.length > 0) {
      const remaining = t.groups.slice(top3.length, 3);
      for (let j = 0; j < remaining.length; j++) {
        top3.push({
          rank: top3.length + 1,
          name: remaining[j].name,
          logo: remaining[j].logo ?? null,
          points: 0,
        });
      }
    }

    const item: TournamentCardItem = {
      id: t.id,
      name: t.name,
      description,
      season: t.season,
      seasonFormatted,
      banner,
      status: t.status,
      teamsCount,
      roundsCount: totalRounds,
      currentRound,
      totalRounds,
      progressPercent,
      isFeatured: isPublished && (i === 0 || t.name.includes("Champions")),
      top3,
    };

    if (isPublished) {
      activeList.push(item);
    } else {
      completedList.push(item);
    }
  }

  return {
    active: activeList,
    completed: completedList,
  };
}
