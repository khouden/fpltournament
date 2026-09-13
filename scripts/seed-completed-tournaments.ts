import { prisma } from "../lib/db";
import { suggestLogoForTeamName } from "../lib/team-logos";

async function main() {
  console.log("Seeding completed tournaments from mockup...");

  const ADMIN_FPL_ID = 1234567;
  const ADMIN_NAME = "Tournament Admin";
  const ADMIN_TEAM = "Admin FC";

  const completedData = [
    {
      name: "FPL Classics",
      season: 2025,
      banner: "/images/tournaments banners/Gemini_Generated_Image_83ieaz83ieaz83ie.jpg",
      top3: [
        { name: "Birdy FC", points: 2981, teamLogo: "Crystal Palace" },
        { name: "The Avengers", points: 2845, teamLogo: "Arsenal" },
        { name: "Red Devils", points: 2761, teamLogo: "Manchester United" },
        { name: "Blue Waves", points: 2650, teamLogo: "Chelsea" },
      ],
    },
    {
      name: "Summer Cup",
      season: 2025,
      banner: "/images/tournaments banners/Gemini_Generated_Image_kux2txkux2txkux2.jpg",
      top3: [
        { name: "Bleach FC", points: 2654, teamLogo: "Liverpool" },
        { name: "Golden Boys", points: 2602, teamLogo: "Manchester City" },
        { name: "FC Horizon", points: 2541, teamLogo: "Tottenham Hotspur" },
        { name: "Strikers United", points: 2420, teamLogo: "Newcastle United" },
      ],
    },
    {
      name: "Winter League",
      season: 2025,
      banner: "/images/tournaments banners/Gemini_Generated_Image_u8k167u8k167u8k1.jpg",
      top3: [
        { name: "Frosty FC", points: 2712, teamLogo: "Aston Villa" },
        { name: "Ice United", points: 2648, teamLogo: "Everton" },
        { name: "Snow Blazers", points: 2601, teamLogo: "Brighton & Hove Albion" },
        { name: "Glacier Rovers", points: 2510, teamLogo: "West Ham United" },
      ],
    },
    {
      name: "Autumn Championship",
      season: 2025,
      banner: "/images/tournaments banners/Gemini_Generated_Image_upnohbupnohbupno.jpg",
      top3: [
        { name: "United Stars", points: 2843, teamLogo: "Real Madrid" },
        { name: "Cityzens", points: 2801, teamLogo: "Manchester City" },
        { name: "Galaxy FC", points: 2756, teamLogo: "Barcelona" },
        { name: "Apex Warriors", points: 2690, teamLogo: "Bayern Munich" },
      ],
    },
  ];

  for (const item of completedData) {
    const existing = await prisma.tournament.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      console.log(`Tournament "${item.name}" already exists, updating status to FINISHED...`);
      await prisma.tournament.update({
        where: { id: existing.id },
        data: {
          status: "FINISHED",
          banner: item.banner,
        },
      });
      continue;
    }

    const t = await prisma.tournament.create({
      data: {
        name: item.name,
        season: item.season,
        banner: item.banner,
        adminFplId: ADMIN_FPL_ID,
        allowBenchBoost: true,
        allowTripleCaptain: true,
        status: "FINISHED",
      },
    });

    // Create groups
    const createdGroups: Array<{ id: string; name: string; targetPoints: number }> = [];
    for (let i = 0; i < item.top3.length; i++) {
      const gInfo = item.top3[i];
      const logoPath = suggestLogoForTeamName(gInfo.teamLogo)?.path || null;
      const g = await prisma.group.create({
        data: {
          tournamentId: t.id,
          name: gInfo.name,
          logo: logoPath,
          fplLeagueId: 600000 + i,
        },
      });

      // Admin member
      await prisma.groupMember.create({
        data: {
          groupId: g.id,
          fplName: ADMIN_NAME,
          fplTeamName: ADMIN_TEAM,
          fplId: ADMIN_FPL_ID,
          isAdmin: true,
        },
      });

      // Regular member
      await prisma.groupMember.create({
        data: {
          groupId: g.id,
          fplName: `Manager ${gInfo.name}`,
          fplTeamName: gInfo.name,
          fplId: 700000 + i * 10 + 1,
          isAdmin: false,
        },
      });

      createdGroups.push({ id: g.id, name: gInfo.name, targetPoints: gInfo.points });
    }

    // Create 2 finalized rounds
    const round1 = await prisma.round.create({
      data: { tournamentId: t.id, name: "Round 1", roundNumber: 1, gameweek: 1 },
    });
    const round2 = await prisma.round.create({
      data: { tournamentId: t.id, name: "Round 2", roundNumber: 2, gameweek: 2 },
    });

    // Match 1 in round 1
    await prisma.match.create({
      data: {
        roundId: round1.id,
        matchNumber: 1,
        status: "FINALIZED",
        homeGroupId: createdGroups[0].id,
        awayGroupId: createdGroups[1].id,
        homeScore: Math.round(createdGroups[0].targetPoints / 2),
        awayScore: Math.round(createdGroups[1].targetPoints / 2),
        result: "HOME_WIN",
        winnerId: createdGroups[0].id,
      },
    });

    // Match 2 in round 1
    await prisma.match.create({
      data: {
        roundId: round1.id,
        matchNumber: 2,
        status: "FINALIZED",
        homeGroupId: createdGroups[2].id,
        awayGroupId: createdGroups[3].id,
        homeScore: Math.round(createdGroups[2].targetPoints / 2),
        awayScore: Math.round(createdGroups[3].targetPoints / 2),
        result: "HOME_WIN",
        winnerId: createdGroups[2].id,
      },
    });

    // Match 3 in round 2
    await prisma.match.create({
      data: {
        roundId: round2.id,
        matchNumber: 3,
        status: "FINALIZED",
        homeGroupId: createdGroups[0].id,
        awayGroupId: createdGroups[2].id,
        homeScore: Math.round(createdGroups[0].targetPoints / 2),
        awayScore: Math.round(createdGroups[2].targetPoints / 2),
        result: "HOME_WIN",
        winnerId: createdGroups[0].id,
      },
    });

    console.log(`✓ Seeded completed tournament: ${item.name}`);
  }

  console.log("All completed tournaments seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
