import { prisma } from "./lib/db";
import {
  createRoundAction,
  createMatchAction,
  swapMatchSidesAction,
  autoPairRemainingAction,
  duplicateRoundAsReverseAction,
  fillRoundWithEmptyMatchesAction,
} from "./lib/schedule-actions";

async function runScheduleSpeedupTests() {
  console.log("==================================================");
  console.log("TESTING SCHEDULE BUILDER SPEEDUP SERVER ACTIONS");
  console.log("==================================================\n");

  const testAdminFplId = 99999999;
  let testTournament: any = null;

  try {
    // Setup test tournament with 4 groups
    testTournament = await prisma.tournament.create({
      data: {
        name: "Test Speedup Tournament",
        season: 2025,
        adminFplId: testAdminFplId,
        status: "DRAFT",
        groups: {
          create: [
            { name: "Group Alpha" },
            { name: "Group Beta" },
            { name: "Group Gamma" },
            { name: "Group Delta" },
          ],
        },
      },
      include: {
        groups: true,
      },
    });

    console.log(`✓ Created test tournament: "${testTournament.name}" (ID: ${testTournament.id})`);
    const [alpha, beta, gamma, delta] = testTournament.groups;

    // 1. Create a base round
    const round1 = await prisma.round.create({
      data: {
        tournamentId: testTournament.id,
        roundNumber: 1,
        gameweek: 10,
        name: "Round 1",
      },
    });
    console.log(`✓ Created Round 1 (GW ${round1.gameweek})`);

    // ----------------------------------------------------
    // TEST 1: swapMatchSidesAction
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Swap Home / Away (⇄) ---");
    const match1 = await prisma.match.create({
      data: {
        roundId: round1.id,
        matchNumber: 1,
        status: "SCHEDULED",
        homeGroupId: alpha.id,
        awayGroupId: beta.id,
      },
    });

    const swapRes = await swapMatchSidesAction(match1.id, testTournament.id);
    if (!swapRes.success || !swapRes.match) {
      throw new Error(`Swap sides failed: ${swapRes.error}`);
    }

    if (
      swapRes.match.homeGroupId !== beta.id ||
      swapRes.match.awayGroupId !== alpha.id
    ) {
      throw new Error(
        `Expected Home: Beta, Away: Alpha. Got Home: ${swapRes.match.homeGroupId}, Away: ${swapRes.match.awayGroupId}`
      );
    }
    console.log("✅ TEST 1 PASSED: Match sides swapped successfully (Beta vs Alpha)!");

    // ----------------------------------------------------
    // TEST 2: autoPairRemainingAction
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Auto-Pair Remaining Teams ---");
    // Currently alpha and beta are scheduled. Gamma and Delta remain unassigned.
    const autoPairRes = await autoPairRemainingAction(round1.id, testTournament.id);
    if (!autoPairRes.success) {
      throw new Error(`Auto-pair failed: ${autoPairRes.error}`);
    }

    const updatedRound1Matches = await prisma.match.findMany({
      where: { roundId: round1.id },
      orderBy: { matchNumber: "asc" },
    });

    if (updatedRound1Matches.length !== 2) {
      throw new Error(`Expected 2 matches in round 1, found ${updatedRound1Matches.length}`);
    }

    const match2 = updatedRound1Matches[1];
    const scheduledGroups = [match2.homeGroupId, match2.awayGroupId];
    if (
      !scheduledGroups.includes(gamma.id) ||
      !scheduledGroups.includes(delta.id)
    ) {
      throw new Error("Match 2 should pair Gamma and Delta!");
    }
    console.log("✅ TEST 2 PASSED: Auto-paired remaining Gamma vs Delta!");

    // ----------------------------------------------------
    // TEST 3: duplicateRoundAsReverseAction (Leg 2)
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Duplicate Round as Reverse Fixtures (Leg 2) ---");
    const dupRes = await duplicateRoundAsReverseAction(
      round1.id,
      testTournament.id,
      11
    );

    if (!dupRes.success || !dupRes.round) {
      throw new Error(`Duplicate reverse round failed: ${dupRes.error}`);
    }

    const round2 = dupRes.round;
    if (round2.roundNumber !== 2 || round2.gameweek !== 11) {
      throw new Error(
        `Expected Round 2 GW 11, got Round ${round2.roundNumber} GW ${round2.gameweek}`
      );
    }

    const round2Matches = await prisma.match.findMany({
      where: { roundId: round2.id },
      orderBy: { matchNumber: "asc" },
    });

    if (round2Matches.length !== 2) {
      throw new Error(`Expected 2 matches in leg 2, got ${round2Matches.length}`);
    }

    // Match 1 was Beta vs Alpha -> Leg 2 must be Alpha vs Beta
    if (
      round2Matches[0].homeGroupId !== alpha.id ||
      round2Matches[0].awayGroupId !== beta.id
    ) {
      throw new Error("Leg 2 Match 1 should be Alpha vs Beta");
    }

    // Match 2 was Gamma vs Delta -> Leg 2 must be Delta vs Gamma
    if (
      round2Matches[1].homeGroupId !== match2.awayGroupId ||
      round2Matches[1].awayGroupId !== match2.homeGroupId
    ) {
      throw new Error("Leg 2 Match 2 sides must be exact inverse of Round 1 Match 2");
    }
    console.log("✅ TEST 3 PASSED: Round duplicated as Leg 2 with inverted Home/Away fixtures!");

    // ----------------------------------------------------
    // TEST 4: fillRoundWithEmptyMatchesAction
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Fill Round with Empty Matches ---");
    const round3 = await prisma.round.create({
      data: {
        tournamentId: testTournament.id,
        roundNumber: 3,
        gameweek: 12,
        name: "Round 3",
      },
    });

    const fillRes = await fillRoundWithEmptyMatchesAction(round3.id, testTournament.id);
    if (!fillRes.success) {
      throw new Error(`Fill empty matches failed: ${fillRes.error}`);
    }

    const round3Matches = await prisma.match.findMany({
      where: { roundId: round3.id },
    });

    // 4 groups = 2 matches expected
    if (round3Matches.length !== 2) {
      throw new Error(`Expected 2 empty matches, got ${round3Matches.length}`);
    }
    console.log("✅ TEST 4 PASSED: Created 2 empty match slots in Round 3!");

    console.log("\n==================================================");
    console.log("ALL 4 SCHEDULE SPEEDUP TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("==================================================");
  } finally {
    // Cleanup test tournament
    if (testTournament) {
      await prisma.tournament.delete({
        where: { id: testTournament.id },
      });
      console.log(`\n✓ Cleaned up test tournament: ${testTournament.id}`);
    }
  }
}

runScheduleSpeedupTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
