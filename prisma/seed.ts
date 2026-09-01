import { prisma } from "../lib/db";

async function main() {
  console.log("Seeding database...");

  // Create a test tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: "Test Tournament 2024/25",
      season: "2024/25",
      adminFplId: 123456,
      status: "DRAFT",
    },
  });

  console.log("✓ Created tournament:", tournament.id);

  // Create test groups
  const group1 = await prisma.group.create({
    data: {
      tournamentId: tournament.id,
      name: "Group A",
    },
  });

  const group2 = await prisma.group.create({
    data: {
      tournamentId: tournament.id,
      name: "Group B",
    },
  });

  console.log("✓ Created groups");

  // Create test members
  const member1 = await prisma.groupMember.create({
    data: {
      groupId: group1.id,
      fplName: "Admin User",
      fplId: 123456,
      isAdmin: true,
    },
  });

  const member2 = await prisma.groupMember.create({
    data: {
      groupId: group1.id,
      fplName: "Player 1",
      fplId: 654321,
      isAdmin: false,
    },
  });

  const member3 = await prisma.groupMember.create({
    data: {
      groupId: group2.id,
      fplName: "Player 2",
      fplId: 789012,
      isAdmin: false,
    },
  });

  const member4 = await prisma.groupMember.create({
    data: {
      groupId: group2.id,
      fplName: "Player 3",
      fplId: 345678,
      isAdmin: false,
    },
  });

  console.log("✓ Created test members");

  // Create test rounds
  const round1 = await prisma.round.create({
    data: {
      tournamentId: tournament.id,
      roundNumber: 1,
      gameweek: 1,
    },
  });

  console.log("✓ Created test round");

  // Create test match
  const match = await prisma.match.create({
    data: {
      roundId: round1.id,
      groupId: group1.id,
      matchNumber: 1,
      status: "SCHEDULED",
      participant1Id: member1.id,
      participant1Type: "GROUP_MEMBER",
      participant2Id: member2.id,
      participant2Type: "GROUP_MEMBER",
    },
  });

  console.log("✓ Created test match");

  console.log("\nSeed completed successfully!");
  console.log("Tournament ID:", tournament.id);
  console.log("Group A ID:", group1.id);
  console.log("Group B ID:", group2.id);
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
