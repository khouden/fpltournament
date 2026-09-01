import { prisma } from "../lib/db";

async function main() {
  console.log("==================================================");
  console.log("🌱 SEEDING PURE ROUND-ROBIN LEAGUE TOURNAMENTS");
  console.log("==================================================\n");

  // 1. Clean existing database records
  console.log("Cleaning existing database records...");
  await prisma.matchMemberScore.deleteMany();
  await prisma.match.deleteMany();
  await prisma.round.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.tournament.deleteMany();
  console.log("✓ Database cleaned.\n");

  const ADMIN_FPL_ID = 1234567;
  const ADMIN_NAME = "Tournament Admin";
  const ADMIN_TEAM = "Admin FC";

  // =========================================================================
  // TOURNAMENT 1: FPL Champions League 2024/25 (PUBLISHED)
  // 4 Teams, 3 Gameweek Rounds (GW5, GW6, GW7) - All teams play each other
  // =========================================================================
  console.log("Creating Tournament 1: FPL Champions League 2024/25 (PUBLISHED)...");
  const t1 = await prisma.tournament.create({
    data: {
      name: "FPL Champions League 2024/25",
      season: 2024,
      adminFplId: ADMIN_FPL_ID,
      allowBenchBoost: true,
      allowTripleCaptain: true,
      status: "PUBLISHED",
    },
  });

  // Groups
  const realMadrid = await prisma.group.create({
    data: { tournamentId: t1.id, name: "Real Madrid", fplLeagueId: 100001 },
  });
  const napoli = await prisma.group.create({
    data: { tournamentId: t1.id, name: "Napoli", fplLeagueId: 100002 },
  });
  const barcelona = await prisma.group.create({
    data: { tournamentId: t1.id, name: "Barcelona", fplLeagueId: 100003 },
  });
  const liverpool = await prisma.group.create({
    data: { tournamentId: t1.id, name: "Liverpool", fplLeagueId: 100004 },
  });

  // Real Madrid Members (Ali 50, Mohamed 50, Zaid 30, Baha 30 = 160)
  const rmAdmin = await prisma.groupMember.create({
    data: { groupId: realMadrid.id, fplName: ADMIN_NAME, fplTeamName: ADMIN_TEAM, fplId: ADMIN_FPL_ID, isAdmin: true },
  });
  const rmAli = await prisma.groupMember.create({
    data: { groupId: realMadrid.id, fplName: "Ali", fplTeamName: "Ali's XI", fplId: 111111 },
  });
  const rmMohamed = await prisma.groupMember.create({
    data: { groupId: realMadrid.id, fplName: "Mohamed", fplTeamName: "Mo's Team", fplId: 222222 },
  });
  const rmZaid = await prisma.groupMember.create({
    data: { groupId: realMadrid.id, fplName: "Zaid", fplTeamName: "Zaid FC", fplId: 333333 },
  });
  const rmBaha = await prisma.groupMember.create({
    data: { groupId: realMadrid.id, fplName: "Baha", fplTeamName: "Baha United", fplId: 444444 },
  });

  // Napoli Members (Othman 80, Said 50, Omar 20, Samir 10 = 160)
  const napAdmin = await prisma.groupMember.create({
    data: { groupId: napoli.id, fplName: ADMIN_NAME, fplTeamName: ADMIN_TEAM, fplId: ADMIN_FPL_ID, isAdmin: true },
  });
  const napOthman = await prisma.groupMember.create({
    data: { groupId: napoli.id, fplName: "Othman", fplTeamName: "Othman's Team", fplId: 555555 },
  });
  const napSaid = await prisma.groupMember.create({
    data: { groupId: napoli.id, fplName: "Said", fplTeamName: "Said FC", fplId: 666666 },
  });
  const napOmar = await prisma.groupMember.create({
    data: { groupId: napoli.id, fplName: "Omar", fplTeamName: "Omar XI", fplId: 777777 },
  });
  const napSamir = await prisma.groupMember.create({
    data: { groupId: napoli.id, fplName: "Samir", fplTeamName: "Samir United", fplId: 888888 },
  });

  // Barcelona Members (Youssef 65, Hamza 70, Khalid 54, Amine 55 = 244)
  const barcAdmin = await prisma.groupMember.create({
    data: { groupId: barcelona.id, fplName: ADMIN_NAME, fplTeamName: ADMIN_TEAM, fplId: ADMIN_FPL_ID, isAdmin: true },
  });
  const barcYoussef = await prisma.groupMember.create({
    data: { groupId: barcelona.id, fplName: "Youssef", fplTeamName: "Youssef FC", fplId: 999111 },
  });
  const barcHamza = await prisma.groupMember.create({
    data: { groupId: barcelona.id, fplName: "Hamza", fplTeamName: "Hamza XI", fplId: 999222 },
  });
  const barcKhalid = await prisma.groupMember.create({
    data: { groupId: barcelona.id, fplName: "Khalid", fplTeamName: "Khalid United", fplId: 999333 },
  });
  const barcAmine = await prisma.groupMember.create({
    data: { groupId: barcelona.id, fplName: "Amine", fplTeamName: "Amine FC", fplId: 999444 },
  });

  // Liverpool Members (Rachid 54, Nabil 55, Tariq 56, Mehdi 50 = 215)
  const livAdmin = await prisma.groupMember.create({
    data: { groupId: liverpool.id, fplName: ADMIN_NAME, fplTeamName: ADMIN_TEAM, fplId: ADMIN_FPL_ID, isAdmin: true },
  });
  const livRachid = await prisma.groupMember.create({
    data: { groupId: liverpool.id, fplName: "Rachid", fplTeamName: "Rachid's Team", fplId: 888111 },
  });
  const livNabil = await prisma.groupMember.create({
    data: { groupId: liverpool.id, fplName: "Nabil", fplTeamName: "Nabil FC", fplId: 888222 },
  });
  const livTariq = await prisma.groupMember.create({
    data: { groupId: liverpool.id, fplName: "Tariq", fplTeamName: "Tariq XI", fplId: 888333 },
  });
  const livMehdi = await prisma.groupMember.create({
    data: { groupId: liverpool.id, fplName: "Mehdi", fplTeamName: "Mehdi United", fplId: 888444 },
  });

  // 3 Rounds for 4 Teams (Round-Robin)
  const t1Round1 = await prisma.round.create({
    data: { tournamentId: t1.id, name: "Round 1", roundNumber: 1, gameweek: 5 },
  });
  const t1Round2 = await prisma.round.create({
    data: { tournamentId: t1.id, name: "Round 2", roundNumber: 2, gameweek: 6 },
  });
  const t1Round3 = await prisma.round.create({
    data: { tournamentId: t1.id, name: "Round 3", roundNumber: 3, gameweek: 7 },
  });

  // Round 1 (GW5): Match 1 = Real Madrid vs Napoli (DRAW 160-160)
  const t1m1 = await prisma.match.create({
    data: {
      roundId: t1Round1.id,
      matchNumber: 1,
      status: "FINALIZED",
      homeGroupId: realMadrid.id,
      awayGroupId: napoli.id,
      homeScore: 160,
      awayScore: 160,
      result: "DRAW",
      winnerId: null,
    },
  });

  await prisma.matchMemberScore.createMany({
    data: [
      { matchId: t1m1.id, memberId: rmAdmin.id, gameweekPoints: 40, isExcluded: true, isFinal: true },
      { matchId: t1m1.id, memberId: rmAli.id, gameweekPoints: 50, isExcluded: false, isFinal: true },
      { matchId: t1m1.id, memberId: rmMohamed.id, gameweekPoints: 50, isExcluded: false, isFinal: true },
      { matchId: t1m1.id, memberId: rmZaid.id, gameweekPoints: 30, isExcluded: false, isFinal: true },
      { matchId: t1m1.id, memberId: rmBaha.id, gameweekPoints: 30, isExcluded: false, isFinal: true },
      { matchId: t1m1.id, memberId: napAdmin.id, gameweekPoints: 40, isExcluded: true, isFinal: true },
      { matchId: t1m1.id, memberId: napOthman.id, gameweekPoints: 80, isExcluded: false, isFinal: true },
      { matchId: t1m1.id, memberId: napSaid.id, gameweekPoints: 50, isExcluded: false, isFinal: true },
      { matchId: t1m1.id, memberId: napOmar.id, gameweekPoints: 20, isExcluded: false, isFinal: true },
      { matchId: t1m1.id, memberId: napSamir.id, gameweekPoints: 10, isExcluded: false, isFinal: true },
    ],
  });

  // Round 1 (GW5): Match 2 = Barcelona vs Liverpool (Barcelona Win 244-215)
  const t1m2 = await prisma.match.create({
    data: {
      roundId: t1Round1.id,
      matchNumber: 2,
      status: "FINALIZED",
      homeGroupId: barcelona.id,
      awayGroupId: liverpool.id,
      homeScore: 244,
      awayScore: 215,
      result: "HOME_WIN",
      winnerId: barcelona.id,
    },
  });

  await prisma.matchMemberScore.createMany({
    data: [
      { matchId: t1m2.id, memberId: barcAdmin.id, gameweekPoints: 40, isExcluded: true, isFinal: true },
      { matchId: t1m2.id, memberId: barcYoussef.id, gameweekPoints: 65, isExcluded: false, isFinal: true },
      { matchId: t1m2.id, memberId: barcHamza.id, gameweekPoints: 70, isExcluded: false, isFinal: true },
      { matchId: t1m2.id, memberId: barcKhalid.id, gameweekPoints: 54, isExcluded: false, isFinal: true },
      { matchId: t1m2.id, memberId: barcAmine.id, gameweekPoints: 55, isExcluded: false, isFinal: true },
      { matchId: t1m2.id, memberId: livAdmin.id, gameweekPoints: 40, isExcluded: true, isFinal: true },
      { matchId: t1m2.id, memberId: livRachid.id, gameweekPoints: 54, isExcluded: false, isFinal: true },
      { matchId: t1m2.id, memberId: livNabil.id, gameweekPoints: 55, isExcluded: false, isFinal: true },
      { matchId: t1m2.id, memberId: livTariq.id, gameweekPoints: 56, isExcluded: false, isFinal: true },
      { matchId: t1m2.id, memberId: livMehdi.id, gameweekPoints: 50, isExcluded: false, isFinal: true },
    ],
  });

  // Round 2 (GW6): Real Madrid vs Barcelona, Napoli vs Liverpool
  await prisma.match.create({
    data: {
      roundId: t1Round2.id,
      matchNumber: 3,
      status: "SCHEDULED",
      homeGroupId: realMadrid.id,
      awayGroupId: barcelona.id,
    },
  });
  await prisma.match.create({
    data: {
      roundId: t1Round2.id,
      matchNumber: 4,
      status: "SCHEDULED",
      homeGroupId: napoli.id,
      awayGroupId: liverpool.id,
    },
  });

  // Round 3 (GW7): Real Madrid vs Liverpool, Napoli vs Barcelona
  await prisma.match.create({
    data: {
      roundId: t1Round3.id,
      matchNumber: 5,
      status: "SCHEDULED",
      homeGroupId: realMadrid.id,
      awayGroupId: liverpool.id,
    },
  });
  await prisma.match.create({
    data: {
      roundId: t1Round3.id,
      matchNumber: 6,
      status: "SCHEDULED",
      homeGroupId: napoli.id,
      awayGroupId: barcelona.id,
    },
  });

  console.log("✓ Tournament 1 seeded.\n");

  // =========================================================================
  // TOURNAMENT 2: Premier League H2H Masters 2024/25 (PUBLISHED)
  // 6 Teams, 5 Gameweek Rounds (GW1-GW5) - Full Round-Robin
  // =========================================================================
  console.log("Creating Tournament 2: Premier League H2H Masters 2024/25 (PUBLISHED)...");
  const t2 = await prisma.tournament.create({
    data: {
      name: "Premier League H2H Masters 2024/25",
      season: 2024,
      adminFplId: ADMIN_FPL_ID,
      allowBenchBoost: false, // Showcase BB disabled
      allowTripleCaptain: true,
      status: "PUBLISHED",
    },
  });

  const plTeamsData = [
    {
      name: "Arsenal Gunners",
      fplLeagueId: 200001,
      members: [
        { fplName: "Bukayo Saka", fplTeamName: "Starboy XI", fplId: 20101, ptsGW1: 72, ptsGW2: 68 },
        { fplName: "Martin Odegaard", fplTeamName: "Captain Magic", fplId: 20102, ptsGW1: 64, ptsGW2: 75 },
        { fplName: "Declan Rice", fplTeamName: "Rice Rice Baby", fplId: 20103, ptsGW1: 58, ptsGW2: 52 },
        { fplName: "William Saliba", fplTeamName: "Rolls Royce Def", fplId: 20104, ptsGW1: 44, ptsGW2: 25 },
      ],
    },
    {
      name: "Manchester City FC",
      fplLeagueId: 200002,
      members: [
        { fplName: "Erling Haaland", fplTeamName: "Viking Machine", fplId: 20201, ptsGW1: 85, ptsGW2: 92, chipGW1: "3xc" },
        { fplName: "Kevin De Bruyne", fplTeamName: "KDB Vision", fplId: 20202, ptsGW1: 60, ptsGW2: 71 },
        { fplName: "Phil Foden", fplTeamName: "Stockport Sniper", fplId: 20203, ptsGW1: 45, ptsGW2: 48 },
        { fplName: "Rodri Hernandez", fplTeamName: "Rodri Clutch", fplId: 20204, ptsGW1: 34, ptsGW2: 34 },
      ],
    },
    {
      name: "Liverpool Kopites",
      fplLeagueId: 200003,
      members: [
        { fplName: "Mohamed Salah", fplTeamName: "Egyptian King", fplId: 20301, ptsGW1: 78, ptsGW2: 65 },
        { fplName: "Virgil van Dijk", fplTeamName: "Big Virg FC", fplId: 20302, ptsGW1: 55, ptsGW2: 60 },
        { fplName: "Trent Alexander", fplTeamName: "Trent Assists", fplId: 20303, ptsGW1: 48, ptsGW2: 57 },
        { fplName: "Alexis Mac Allister", fplTeamName: "Mac Maestro", fplId: 20304, ptsGW1: 34, ptsGW2: 48 },
      ],
    },
    {
      name: "Chelsea Pride",
      fplLeagueId: 200004,
      members: [
        { fplName: "Cole Palmer", fplTeamName: "Cold Palmer XI", fplId: 20401, ptsGW1: 65, ptsGW2: 82, chipGW2: "3xc" },
        { fplName: "Enzo Fernandez", fplTeamName: "Enzo Central", fplId: 20402, ptsGW1: 52, ptsGW2: 54 },
        { fplName: "Moises Caicedo", fplTeamName: "Caicedo Engine", fplId: 20403, ptsGW1: 45, ptsGW2: 40 },
        { fplName: "Nicolas Jackson", fplTeamName: "Jackson 5", fplId: 20404, ptsGW1: 36, ptsGW2: 34 },
      ],
    },
    {
      name: "Aston Villa Lions",
      fplLeagueId: 200005,
      members: [
        { fplName: "Ollie Watkins", fplTeamName: "Watkins Goals", fplId: 20501, ptsGW1: 60, ptsGW2: 55 },
        { fplName: "John McGinn", fplTeamName: "Meatball FC", fplId: 20502, ptsGW1: 48, ptsGW2: 45 },
        { fplName: "Leon Bailey", fplTeamName: "Bailey Speed", fplId: 20503, ptsGW1: 44, ptsGW2: 45 },
        { fplName: "Emi Martinez", fplTeamName: "Dibu Saves", fplId: 20504, ptsGW1: 38, ptsGW2: 40 },
      ],
    },
    {
      name: "Tottenham Spurs",
      fplLeagueId: 200006,
      members: [
        { fplName: "Son Heung-min", fplTeamName: "Sonny Smile", fplId: 20601, ptsGW1: 68, ptsGW2: 58 },
        { fplName: "James Maddison", fplTeamName: "Madders Darts", fplId: 20602, ptsGW1: 52, ptsGW2: 54 },
        { fplName: "Pedro Porro", fplTeamName: "Porro Attack", fplId: 20603, ptsGW1: 40, ptsGW2: 48 },
        { fplName: "Cristian Romero", fplTeamName: "Cuti Tackles", fplId: 20604, ptsGW1: 30, ptsGW2: 45 },
      ],
    },
  ];

  const t2Groups: Record<string, { group: any; members: any[]; memberMap: Record<number, any> }> = {};

  for (const team of plTeamsData) {
    const group = await prisma.group.create({
      data: {
        tournamentId: t2.id,
        name: team.name,
        fplLeagueId: team.fplLeagueId,
      },
    });

    const admin = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        fplName: ADMIN_NAME,
        fplTeamName: ADMIN_TEAM,
        fplId: ADMIN_FPL_ID,
        isAdmin: true,
      },
    });

    const members: any[] = [admin];
    const memberMap: Record<number, any> = { [ADMIN_FPL_ID]: admin };

    for (const m of team.members) {
      const created = await prisma.groupMember.create({
        data: {
          groupId: group.id,
          fplName: m.fplName,
          fplTeamName: m.fplTeamName,
          fplId: m.fplId,
        },
      });
      members.push(created);
      memberMap[m.fplId] = { ...created, ...m };
    }

    t2Groups[team.name] = { group, members, memberMap };
  }

  // 5 Rounds for 6 Teams
  const t2Rounds = [];
  for (let r = 1; r <= 5; r++) {
    const created = await prisma.round.create({
      data: {
        tournamentId: t2.id,
        name: `Round ${r}`,
        roundNumber: r,
        gameweek: r,
      },
    });
    t2Rounds.push(created);
  }

  async function createPLFixture(
    roundId: string,
    matchNumber: number,
    homeTeamName: string,
    awayTeamName: string,
    gw: number,
    status: "FINALIZED" | "SCHEDULED" = "FINALIZED"
  ) {
    const home = t2Groups[homeTeamName];
    const away = t2Groups[awayTeamName];

    if (status === "SCHEDULED") {
      return prisma.match.create({
        data: {
          roundId,
          matchNumber,
          status: "SCHEDULED",
          homeGroupId: home.group.id,
          awayGroupId: away.group.id,
        },
      });
    }

    const ptsProp = gw === 1 ? "ptsGW1" : "ptsGW2";
    const chipProp = gw === 1 ? "chipGW1" : "chipGW2";

    let homeScore = 0;
    let awayScore = 0;

    const homeScoresData: any[] = [
      { memberId: home.memberMap[ADMIN_FPL_ID].id, gameweekPoints: 45, isExcluded: true, isFinal: true },
    ];
    for (const m of home.members.filter((x: any) => !x.isAdmin)) {
      const raw = home.memberMap[m.fplId][ptsProp] || 50;
      const chip = home.memberMap[m.fplId][chipProp] || null;
      homeScore += raw;
      homeScoresData.push({
        memberId: m.id,
        gameweekPoints: raw,
        isExcluded: false,
        isFinal: true,
        activeChip: chip,
        chipDeduction: 0,
      });
    }

    const awayScoresData: any[] = [
      { memberId: away.memberMap[ADMIN_FPL_ID].id, gameweekPoints: 42, isExcluded: true, isFinal: true },
    ];
    for (const m of away.members.filter((x: any) => !x.isAdmin)) {
      const raw = away.memberMap[m.fplId][ptsProp] || 50;
      const chip = away.memberMap[m.fplId][chipProp] || null;
      awayScore += raw;
      awayScoresData.push({
        memberId: m.id,
        gameweekPoints: raw,
        isExcluded: false,
        isFinal: true,
        activeChip: chip,
        chipDeduction: 0,
      });
    }

    const result = homeScore > awayScore ? "HOME_WIN" : awayScore > homeScore ? "AWAY_WIN" : "DRAW";
    const winnerId = result === "HOME_WIN" ? home.group.id : result === "AWAY_WIN" ? away.group.id : null;

    const match = await prisma.match.create({
      data: {
        roundId,
        matchNumber,
        status: "FINALIZED",
        homeGroupId: home.group.id,
        awayGroupId: away.group.id,
        homeScore,
        awayScore,
        result,
        winnerId,
      },
    });

    for (const s of [...homeScoresData, ...awayScoresData]) {
      await prisma.matchMemberScore.create({
        data: {
          matchId: match.id,
          memberId: s.memberId,
          gameweekPoints: s.gameweekPoints,
          isExcluded: s.isExcluded,
          isFinal: true,
          activeChip: s.activeChip,
          chipDeduction: s.chipDeduction,
        },
      });
    }

    return match;
  }

  // Round 1 (GW1 - Completed)
  await createPLFixture(t2Rounds[0].id, 1, "Arsenal Gunners", "Manchester City FC", 1);
  await createPLFixture(t2Rounds[0].id, 2, "Liverpool Kopites", "Chelsea Pride", 1);
  await createPLFixture(t2Rounds[0].id, 3, "Aston Villa Lions", "Tottenham Spurs", 1);

  // Round 2 (GW2 - Completed)
  await createPLFixture(t2Rounds[1].id, 4, "Manchester City FC", "Liverpool Kopites", 2);
  await createPLFixture(t2Rounds[1].id, 5, "Chelsea Pride", "Aston Villa Lions", 2);
  await createPLFixture(t2Rounds[1].id, 6, "Tottenham Spurs", "Arsenal Gunners", 2);

  // Round 3 (GW3 - Scheduled)
  await createPLFixture(t2Rounds[2].id, 7, "Arsenal Gunners", "Liverpool Kopites", 3, "SCHEDULED");
  await createPLFixture(t2Rounds[2].id, 8, "Manchester City FC", "Aston Villa Lions", 3, "SCHEDULED");
  await createPLFixture(t2Rounds[2].id, 9, "Chelsea Pride", "Tottenham Spurs", 3, "SCHEDULED");

  // Round 4 (GW4 - Scheduled)
  await createPLFixture(t2Rounds[3].id, 10, "Aston Villa Lions", "Arsenal Gunners", 4, "SCHEDULED");
  await createPLFixture(t2Rounds[3].id, 11, "Tottenham Spurs", "Liverpool Kopites", 4, "SCHEDULED");
  await createPLFixture(t2Rounds[3].id, 12, "Manchester City FC", "Chelsea Pride", 4, "SCHEDULED");

  // Round 5 (GW5 - Scheduled)
  await createPLFixture(t2Rounds[4].id, 13, "Arsenal Gunners", "Chelsea Pride", 5, "SCHEDULED");
  await createPLFixture(t2Rounds[4].id, 14, "Liverpool Kopites", "Aston Villa Lions", 5, "SCHEDULED");
  await createPLFixture(t2Rounds[4].id, 15, "Tottenham Spurs", "Manchester City FC", 5, "SCHEDULED");

  console.log("✓ Tournament 2 seeded (all teams play against each other across 5 rounds).\n");

  // =========================================================================
  // TOURNAMENT 3: European Super League 2024/25 (PUBLISHED)
  // 6 European Clubs, 5 Gameweek Rounds (GW10-GW14) - Full Round-Robin
  // =========================================================================
  console.log("Creating Tournament 3: European Super League 2024/25 (PUBLISHED)...");
  const t3 = await prisma.tournament.create({
    data: {
      name: "European Super League 2024/25",
      season: 2024,
      adminFplId: ADMIN_FPL_ID,
      allowBenchBoost: true,
      allowTripleCaptain: false, // TC reduced to 2x
      status: "PUBLISHED",
    },
  });

  const euroClubs = [
    "Bayern Munich",
    "Paris Saint-Germain",
    "Inter Milan",
    "Borussia Dortmund",
    "Juventus",
    "Atletico Madrid",
  ];

  const t3GroupsMap: Record<string, any> = {};
  for (let i = 0; i < euroClubs.length; i++) {
    const clubName = euroClubs[i];
    const group = await prisma.group.create({
      data: { tournamentId: t3.id, name: clubName, fplLeagueId: 300000 + i + 1 },
    });

    const admin = await prisma.groupMember.create({
      data: { groupId: group.id, fplName: ADMIN_NAME, fplTeamName: ADMIN_TEAM, fplId: ADMIN_FPL_ID, isAdmin: true },
    });
    const m1 = await prisma.groupMember.create({
      data: { groupId: group.id, fplName: `${clubName} Ace`, fplTeamName: `${clubName} Stars`, fplId: 30000 + i * 10 + 1 },
    });
    const m2 = await prisma.groupMember.create({
      data: { groupId: group.id, fplName: `${clubName} Striker`, fplTeamName: `${clubName} XI`, fplId: 30000 + i * 10 + 2 },
    });
    const m3 = await prisma.groupMember.create({
      data: { groupId: group.id, fplName: `${clubName} Playmaker`, fplTeamName: `${clubName} United`, fplId: 30000 + i * 10 + 3 },
    });

    t3GroupsMap[clubName] = { group, members: [admin, m1, m2, m3] };
  }

  // 5 Rounds for 6 Euro Clubs
  const t3Rounds = [];
  for (let r = 1; r <= 5; r++) {
    const created = await prisma.round.create({
      data: {
        tournamentId: t3.id,
        name: `Round ${r}`,
        roundNumber: r,
        gameweek: 10 + r - 1,
      },
    });
    t3Rounds.push(created);
  }

  // GW10 Completed Matches
  const t3m1 = await prisma.match.create({
    data: {
      roundId: t3Rounds[0].id,
      matchNumber: 1,
      status: "FINALIZED",
      homeGroupId: t3GroupsMap["Bayern Munich"].group.id,
      awayGroupId: t3GroupsMap["Paris Saint-Germain"].group.id,
      homeScore: 210,
      awayScore: 195,
      result: "HOME_WIN",
      winnerId: t3GroupsMap["Bayern Munich"].group.id,
    },
  });
  const t3m2 = await prisma.match.create({
    data: {
      roundId: t3Rounds[0].id,
      matchNumber: 2,
      status: "FINALIZED",
      homeGroupId: t3GroupsMap["Inter Milan"].group.id,
      awayGroupId: t3GroupsMap["Borussia Dortmund"].group.id,
      homeScore: 190,
      awayScore: 205,
      result: "AWAY_WIN",
      winnerId: t3GroupsMap["Borussia Dortmund"].group.id,
    },
  });
  const t3m3 = await prisma.match.create({
    data: {
      roundId: t3Rounds[0].id,
      matchNumber: 3,
      status: "FINALIZED",
      homeGroupId: t3GroupsMap["Juventus"].group.id,
      awayGroupId: t3GroupsMap["Atletico Madrid"].group.id,
      homeScore: 185,
      awayScore: 192,
      result: "AWAY_WIN",
      winnerId: t3GroupsMap["Atletico Madrid"].group.id,
    },
  });

  for (const matchObj of [t3m1, t3m2, t3m3]) {
    const homeTeam = Object.values(t3GroupsMap).find((x: any) => x.group.id === matchObj.homeGroupId);
    const awayTeam = Object.values(t3GroupsMap).find((x: any) => x.group.id === matchObj.awayGroupId);

    if (homeTeam && awayTeam) {
      for (const m of homeTeam.members) {
        await prisma.matchMemberScore.create({
          data: {
            matchId: matchObj.id,
            memberId: m.id,
            gameweekPoints: m.isAdmin ? 40 : 70,
            isExcluded: m.isAdmin,
            isFinal: true,
          },
        });
      }
      for (const m of awayTeam.members) {
        await prisma.matchMemberScore.create({
          data: {
            matchId: matchObj.id,
            memberId: m.id,
            gameweekPoints: m.isAdmin ? 40 : 65,
            isExcluded: m.isAdmin,
            isFinal: true,
          },
        });
      }
    }
  }

  // GW11 to GW14 Scheduled Matches (Round-Robin)
  let t3MatchCounter = 4;
  const euroFixtures = [
    // GW11
    { roundIndex: 1, home: "Bayern Munich", away: "Borussia Dortmund" },
    { roundIndex: 1, home: "Paris Saint-Germain", away: "Juventus" },
    { roundIndex: 1, home: "Inter Milan", away: "Atletico Madrid" },
    // GW12
    { roundIndex: 2, home: "Juventus", away: "Bayern Munich" },
    { roundIndex: 2, home: "Atletico Madrid", away: "Paris Saint-Germain" },
    { roundIndex: 2, home: "Borussia Dortmund", away: "Inter Milan" },
    // GW13
    { roundIndex: 3, home: "Bayern Munich", away: "Atletico Madrid" },
    { roundIndex: 3, home: "Paris Saint-Germain", away: "Inter Milan" },
    { roundIndex: 3, home: "Borussia Dortmund", away: "Juventus" },
    // GW14
    { roundIndex: 4, home: "Inter Milan", away: "Bayern Munich" },
    { roundIndex: 4, home: "Borussia Dortmund", away: "Paris Saint-Germain" },
    { roundIndex: 4, home: "Atletico Madrid", away: "Juventus" },
  ];

  for (const f of euroFixtures) {
    await prisma.match.create({
      data: {
        roundId: t3Rounds[f.roundIndex].id,
        matchNumber: t3MatchCounter++,
        status: "SCHEDULED",
        homeGroupId: t3GroupsMap[f.home].group.id,
        awayGroupId: t3GroupsMap[f.away].group.id,
      },
    });
  }

  console.log("✓ Tournament 3 seeded.\n");

  // =========================================================================
  // TOURNAMENT 4: FPL Winter Classic 2023/24 (FINISHED)
  // 4 Teams, 3 Completed Gameweek Rounds (GW36, GW37, GW38) - Round-Robin
  // =========================================================================
  console.log("Creating Tournament 4: FPL Winter Classic 2023/24 (FINISHED)...");
  const t4 = await prisma.tournament.create({
    data: {
      name: "FPL Winter Classic 2023/24",
      season: 2023,
      adminFplId: ADMIN_FPL_ID,
      allowBenchBoost: true,
      allowTripleCaptain: true,
      status: "FINISHED",
    },
  });

  const t4Clubs = ["Celtic Bhoys", "Ajax Amsterdam", "Porto Dragons", "Benfica Eagles"];
  const t4GroupsMap: Record<string, any> = {};

  for (let i = 0; i < t4Clubs.length; i++) {
    const clubName = t4Clubs[i];
    const group = await prisma.group.create({
      data: { tournamentId: t4.id, name: clubName, fplLeagueId: 400000 + i + 1 },
    });

    const admin = await prisma.groupMember.create({
      data: { groupId: group.id, fplName: ADMIN_NAME, fplTeamName: ADMIN_TEAM, fplId: ADMIN_FPL_ID, isAdmin: true },
    });
    const m1 = await prisma.groupMember.create({
      data: { groupId: group.id, fplName: `${clubName} Alpha`, fplTeamName: `${clubName} Top`, fplId: 40000 + i * 10 + 1 },
    });
    const m2 = await prisma.groupMember.create({
      data: { groupId: group.id, fplName: `${clubName} Beta`, fplTeamName: `${clubName} Pro`, fplId: 40000 + i * 10 + 2 },
    });

    t4GroupsMap[clubName] = { group, members: [admin, m1, m2] };
  }

  const t4Round1 = await prisma.round.create({
    data: { tournamentId: t4.id, name: "Round 1", roundNumber: 1, gameweek: 36 },
  });
  const t4Round2 = await prisma.round.create({
    data: { tournamentId: t4.id, name: "Round 2", roundNumber: 2, gameweek: 37 },
  });
  const t4Round3 = await prisma.round.create({
    data: { tournamentId: t4.id, name: "Round 3 - Finale", roundNumber: 3, gameweek: 38 },
  });

  // All 6 Matches completed in Round-Robin
  const t4Matches = [
    // Round 1
    { roundId: t4Round1.id, num: 1, home: "Celtic Bhoys", away: "Ajax Amsterdam", hs: 145, as: 120, res: "HOME_WIN", win: "Celtic Bhoys" },
    { roundId: t4Round1.id, num: 2, home: "Porto Dragons", away: "Benfica Eagles", hs: 130, as: 130, res: "DRAW", win: null },
    // Round 2
    { roundId: t4Round2.id, num: 3, home: "Celtic Bhoys", away: "Porto Dragons", hs: 155, as: 135, res: "HOME_WIN", win: "Celtic Bhoys" },
    { roundId: t4Round2.id, num: 4, home: "Ajax Amsterdam", away: "Benfica Eagles", hs: 140, as: 110, res: "HOME_WIN", win: "Ajax Amsterdam" },
    // Round 3
    { roundId: t4Round3.id, num: 5, home: "Celtic Bhoys", away: "Benfica Eagles", hs: 160, as: 125, res: "HOME_WIN", win: "Celtic Bhoys" },
    { roundId: t4Round3.id, num: 6, home: "Ajax Amsterdam", away: "Porto Dragons", hs: 135, as: 135, res: "DRAW", win: null },
  ];

  for (const mData of t4Matches) {
    const match = await prisma.match.create({
      data: {
        roundId: mData.roundId,
        matchNumber: mData.num,
        status: "FINALIZED",
        homeGroupId: t4GroupsMap[mData.home].group.id,
        awayGroupId: t4GroupsMap[mData.away].group.id,
        homeScore: mData.hs,
        awayScore: mData.as,
        result: mData.res,
        winnerId: mData.win ? t4GroupsMap[mData.win].group.id : null,
      },
    });

    const homeTeam = t4GroupsMap[mData.home];
    const awayTeam = t4GroupsMap[mData.away];

    for (const mem of homeTeam.members) {
      await prisma.matchMemberScore.create({
        data: {
          matchId: match.id,
          memberId: mem.id,
          gameweekPoints: mem.isAdmin ? 40 : Math.round(mData.hs / 2),
          isExcluded: mem.isAdmin,
          isFinal: true,
        },
      });
    }

    for (const mem of awayTeam.members) {
      await prisma.matchMemberScore.create({
        data: {
          matchId: match.id,
          memberId: mem.id,
          gameweekPoints: mem.isAdmin ? 40 : Math.round(mData.as / 2),
          isExcluded: mem.isAdmin,
          isFinal: true,
        },
      });
    }
  }

  console.log("✓ Tournament 4 seeded.\n");

  // =========================================================================
  // TOURNAMENT 5: Sunday League Invitational 2025/26 (DRAFT)
  // 4 Teams, 3 Scheduled Rounds in Draft Mode
  // =========================================================================
  console.log("Creating Tournament 5: Sunday League Invitational 2025/26 (DRAFT)...");
  const t5 = await prisma.tournament.create({
    data: {
      name: "Sunday League Invitational 2025/26",
      season: 2025,
      adminFplId: ADMIN_FPL_ID,
      allowBenchBoost: true,
      allowTripleCaptain: true,
      status: "DRAFT",
    },
  });

  const draftClubs = ["Grasshoppers FC", "Red Bull Pioneers", "Spartak Casuals", "Dynamo Pubs"];
  const t5GroupsMap: Record<string, any> = {};

  for (let i = 0; i < draftClubs.length; i++) {
    const group = await prisma.group.create({
      data: { tournamentId: t5.id, name: draftClubs[i], fplLeagueId: 500000 + i + 1 },
    });

    await prisma.groupMember.create({
      data: { groupId: group.id, fplName: ADMIN_NAME, fplTeamName: ADMIN_TEAM, fplId: ADMIN_FPL_ID, isAdmin: true },
    });
    await prisma.groupMember.create({
      data: { groupId: group.id, fplName: `Player ${i + 1}A`, fplTeamName: `Team ${i + 1}A`, fplId: 50000 + i * 10 + 1 },
    });
    await prisma.groupMember.create({
      data: { groupId: group.id, fplName: `Player ${i + 1}B`, fplTeamName: `Team ${i + 1}B`, fplId: 50000 + i * 10 + 2 },
    });

    t5GroupsMap[draftClubs[i]] = group;
  }

  // 3 Scheduled Rounds for Draft Tournament
  const t5r1 = await prisma.round.create({
    data: { tournamentId: t5.id, name: "Round 1", roundNumber: 1, gameweek: 1 },
  });
  const t5r2 = await prisma.round.create({
    data: { tournamentId: t5.id, name: "Round 2", roundNumber: 2, gameweek: 2 },
  });
  const t5r3 = await prisma.round.create({
    data: { tournamentId: t5.id, name: "Round 3", roundNumber: 3, gameweek: 3 },
  });

  await prisma.match.create({
    data: { roundId: t5r1.id, matchNumber: 1, status: "SCHEDULED", homeGroupId: t5GroupsMap["Grasshoppers FC"].id, awayGroupId: t5GroupsMap["Red Bull Pioneers"].id },
  });
  await prisma.match.create({
    data: { roundId: t5r1.id, matchNumber: 2, status: "SCHEDULED", homeGroupId: t5GroupsMap["Spartak Casuals"].id, awayGroupId: t5GroupsMap["Dynamo Pubs"].id },
  });
  await prisma.match.create({
    data: { roundId: t5r2.id, matchNumber: 3, status: "SCHEDULED", homeGroupId: t5GroupsMap["Grasshoppers FC"].id, awayGroupId: t5GroupsMap["Spartak Casuals"].id },
  });
  await prisma.match.create({
    data: { roundId: t5r2.id, matchNumber: 4, status: "SCHEDULED", homeGroupId: t5GroupsMap["Red Bull Pioneers"].id, awayGroupId: t5GroupsMap["Dynamo Pubs"].id },
  });
  await prisma.match.create({
    data: { roundId: t5r3.id, matchNumber: 5, status: "SCHEDULED", homeGroupId: t5GroupsMap["Grasshoppers FC"].id, awayGroupId: t5GroupsMap["Dynamo Pubs"].id },
  });
  await prisma.match.create({
    data: { roundId: t5r3.id, matchNumber: 6, status: "SCHEDULED", homeGroupId: t5GroupsMap["Red Bull Pioneers"].id, awayGroupId: t5GroupsMap["Spartak Casuals"].id },
  });

  console.log("✓ Tournament 5 seeded.\n");

  console.log("==================================================");
  console.log("🎉 ALL PURE ROUND-ROBIN DATA SEEDED SUCCESSFULLY!");
  console.log("==================================================");
  console.log("Summary of Seeded Tournaments (All Pure Round-Robin):");
  console.log(`  1. [PUBLISHED] ${t1.name} (ID: ${t1.id}) - 4 Groups, 3 Rounds`);
  console.log(`  2. [PUBLISHED] ${t2.name} (ID: ${t2.id}) - 6 Premier League Groups, 5 Rounds`);
  console.log(`  3. [PUBLISHED] ${t3.name} (ID: ${t3.id}) - 6 European Groups, 5 Rounds`);
  console.log(`  4. [FINISHED]  ${t4.name} (ID: ${t4.id}) - 4 Groups, 3 Rounds (Completed)`);
  console.log(`  5. [DRAFT]     ${t5.name} (ID: ${t5.id}) - 4 Groups, 3 Rounds (Draft)`);
  console.log("==================================================");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Seeding failed with error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
