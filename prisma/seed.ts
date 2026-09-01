import { prisma } from "../lib/db";

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.matchMemberScore.deleteMany();
  await prisma.match.deleteMany();
  await prisma.round.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.tournament.deleteMany();

  // Create a test tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: "FPL Champions League 2024/25",
      season: 2024,
      adminFplId: 1234567,
      status: "DRAFT",
    },
  });

  console.log("✓ Created tournament:", tournament.id);

  // Create test groups (representing FPL Classic Leagues)
  const realMadrid = await prisma.group.create({
    data: {
      tournamentId: tournament.id,
      name: "Real Madrid",
      fplLeagueId: 100001,
    },
  });

  const napoli = await prisma.group.create({
    data: {
      tournamentId: tournament.id,
      name: "Napoli",
      fplLeagueId: 100002,
    },
  });

  const barcelona = await prisma.group.create({
    data: {
      tournamentId: tournament.id,
      name: "Barcelona",
      fplLeagueId: 100003,
    },
  });

  const liverpool = await prisma.group.create({
    data: {
      tournamentId: tournament.id,
      name: "Liverpool",
      fplLeagueId: 100004,
    },
  });

  console.log("✓ Created 4 groups");

  // Create members for Real Madrid
  // Admin is member of every group (excluded from scoring)
  const adminRM = await prisma.groupMember.create({
    data: {
      groupId: realMadrid.id,
      fplName: "Tournament Admin",
      fplTeamName: "Admin FC",
      fplId: 1234567,
      isAdmin: true,
    },
  });

  await prisma.groupMember.createMany({
    data: [
      { groupId: realMadrid.id, fplName: "Ali", fplTeamName: "Ali's XI", fplId: 111111 },
      { groupId: realMadrid.id, fplName: "Mohamed", fplTeamName: "Mo's Team", fplId: 222222 },
      { groupId: realMadrid.id, fplName: "Zaid", fplTeamName: "Zaid FC", fplId: 333333 },
      { groupId: realMadrid.id, fplName: "Baha", fplTeamName: "Baha United", fplId: 444444 },
    ],
  });

  // Create members for Napoli
  await prisma.groupMember.create({
    data: {
      groupId: napoli.id,
      fplName: "Tournament Admin",
      fplTeamName: "Admin FC",
      fplId: 1234567,
      isAdmin: true,
    },
  });

  await prisma.groupMember.createMany({
    data: [
      { groupId: napoli.id, fplName: "Othman", fplTeamName: "Othman's Team", fplId: 555555 },
      { groupId: napoli.id, fplName: "Said", fplTeamName: "Said FC", fplId: 666666 },
      { groupId: napoli.id, fplName: "Omar", fplTeamName: "Omar XI", fplId: 777777 },
      { groupId: napoli.id, fplName: "Samir", fplTeamName: "Samir United", fplId: 888888 },
    ],
  });

  // Create members for Barcelona
  await prisma.groupMember.create({
    data: {
      groupId: barcelona.id,
      fplName: "Tournament Admin",
      fplTeamName: "Admin FC",
      fplId: 1234567,
      isAdmin: true,
    },
  });

  await prisma.groupMember.createMany({
    data: [
      { groupId: barcelona.id, fplName: "Youssef", fplTeamName: "Youssef FC", fplId: 999111 },
      { groupId: barcelona.id, fplName: "Hamza", fplTeamName: "Hamza XI", fplId: 999222 },
      { groupId: barcelona.id, fplName: "Khalid", fplTeamName: "Khalid United", fplId: 999333 },
      { groupId: barcelona.id, fplName: "Amine", fplTeamName: "Amine FC", fplId: 999444 },
    ],
  });

  // Create members for Liverpool
  await prisma.groupMember.create({
    data: {
      groupId: liverpool.id,
      fplName: "Tournament Admin",
      fplTeamName: "Admin FC",
      fplId: 1234567,
      isAdmin: true,
    },
  });

  await prisma.groupMember.createMany({
    data: [
      { groupId: liverpool.id, fplName: "Rachid", fplTeamName: "Rachid's Team", fplId: 888111 },
      { groupId: liverpool.id, fplName: "Nabil", fplTeamName: "Nabil FC", fplId: 888222 },
      { groupId: liverpool.id, fplName: "Tariq", fplTeamName: "Tariq XI", fplId: 888333 },
      { groupId: liverpool.id, fplName: "Mehdi", fplTeamName: "Mehdi United", fplId: 888444 },
    ],
  });

  console.log("✓ Created members for all groups (admin in each)");

  // Create rounds
  const round1 = await prisma.round.create({
    data: {
      tournamentId: tournament.id,
      name: "Semi-Finals",
      roundNumber: 1,
      gameweek: 5,
    },
  });

  const round2 = await prisma.round.create({
    data: {
      tournamentId: tournament.id,
      name: "Final",
      roundNumber: 2,
      gameweek: 6,
    },
  });

  console.log("✓ Created 2 rounds");

  // Create matches — group-vs-group
  const match1 = await prisma.match.create({
    data: {
      roundId: round1.id,
      matchNumber: 1,
      status: "SCHEDULED",
      homeGroupId: realMadrid.id,
      awayGroupId: napoli.id,
    },
  });

  const match2 = await prisma.match.create({
    data: {
      roundId: round1.id,
      matchNumber: 2,
      status: "SCHEDULED",
      homeGroupId: barcelona.id,
      awayGroupId: liverpool.id,
    },
  });

  // Final: Winner of Match 1 vs Winner of Match 2
  const finalMatch = await prisma.match.create({
    data: {
      roundId: round2.id,
      matchNumber: 3,
      status: "SCHEDULED",
      homeWinnerOfMatchId: match1.id,
      awayWinnerOfMatchId: match2.id,
    },
  });

  console.log("✓ Created 3 matches (2 semi-finals + 1 final)");

  console.log("\n✅ Seed completed successfully!");
  console.log("Tournament ID:", tournament.id);
  console.log("Groups:", [realMadrid, napoli, barcelona, liverpool].map(g => g.name).join(", "));
  console.log("Schedule:");
  console.log("  Round 1 (GW5): Real Madrid vs Napoli, Barcelona vs Liverpool");
  console.log("  Round 2 (GW6): Winner Match 1 vs Winner Match 2");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
