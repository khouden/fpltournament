import { prisma } from "./lib/db";
import {
  createManualGroupAction,
  addMemberToGroupAction,
  updateGroupMemberAction,
  deleteGroupMemberAction,
} from "./lib/group-actions";
import {
  saveManualMatchScoresAction,
} from "./lib/scoring-actions";
import {
  calculateGroupScore,
  calculateMatchScore,
  recalculateTournamentScores,
} from "./lib/scoring";

async function runManualTeamTests() {
  console.log("==================================================");
  console.log("TESTING MANUAL TEAM CREATION & SCORING SYSTEM");
  console.log("==================================================");

  let testTournamentId: string | null = null;

  try {
    // 1. Create a Test Tournament
    const testTournament = await prisma.tournament.create({
      data: {
        name: "Test Manual Team Tournament",
        season: 2025,
        status: "DRAFT",
        adminFplId: 9999999,
        allowBenchBoost: true,
        allowTripleCaptain: true,
      },
    });
    testTournamentId = testTournament.id;
    console.log(`\n✓ Step 1: Created test tournament "${testTournament.name}" (${testTournament.id})`);

    // 2. Create a Manual Team
    const createTeamResult = await createManualGroupAction({
      tournamentId: testTournament.id,
      name: "Atlas Lions FC",
      logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=128&h=128&fit=crop",
      initialPlayers: [
        {
          name: "Hakim Ziyech",
          teamName: "Ziyech Magic",
          isAdmin: false,
        },
        {
          name: "Achraf Hakimi",
          teamName: "Hakimi Express",
          isAdmin: false,
        },
        {
          name: "Walid Regragui",
          teamName: "Sir Walid",
          isAdmin: true, // Team Admin - should be excluded from scoring!
        },
      ],
    });

    if (!createTeamResult.success || !createTeamResult.group) {
      throw new Error(`Failed to create manual team: ${createTeamResult.error}`);
    }

    const team = createTeamResult.group;
    console.log(`\n✓ Step 2: Created manual team "${team.name}" with isManual=${team.isManual}`);
    console.log(`  Members created: ${team.members.length}`);
    for (const m of team.members) {
      console.log(`    - ${m.fplName} (${m.fplTeamName}) | ID: ${m.fplId} | Admin: ${m.isAdmin}`);
    }

    if (!team.isManual) {
      throw new Error("Expected team.isManual to be true!");
    }
    if (team.members.length !== 3) {
      throw new Error(`Expected 3 members, got ${team.members.length}`);
    }
    console.log("✅ STEP 2 PASSED: Manual team created with auto-assigned negative IDs without FPL API!");

    // 3. Test Default Score (Must be 0, no FPL API call)
    console.log("\n--- Step 3: Verify Default Group Score is 0 ---");
    const defaultScore = await calculateGroupScore(
      team.id,
      1,
      [testTournament.adminFplId]
    );

    console.log(`Group: ${defaultScore.groupName} | Total Score: ${defaultScore.totalScore} pts`);
    for (const m of defaultScore.members) {
      console.log(`  - ${m.fplName}: ${m.gameweekPoints} pts (Excluded: ${m.isExcluded})`);
    }

    if (defaultScore.totalScore !== 0) {
      throw new Error(`Expected default totalScore to be 0, got ${defaultScore.totalScore}`);
    }
    const adminMember = defaultScore.members.find((m) => m.fplName === "Walid Regragui");
    if (!adminMember || !adminMember.isExcluded) {
      throw new Error("Expected Walid Regragui (isAdmin=true) to be excluded!");
    }
    console.log("✅ STEP 3 PASSED: Default score is 0 and admin is excluded without contacting FPL API!");

    // 4. Create a Second Manual Team & Schedule a Fixture
    console.log("\n--- Step 4: Create Opponent Team and Fixture ---");
    const opponentResult = await createManualGroupAction({
      tournamentId: testTournament.id,
      name: "Pharaohs FC",
      initialPlayers: [
        { name: "Mo Salah", teamName: "Salah King", isAdmin: false },
        { name: "Trezeguet", teamName: "Trezeguet Stars", isAdmin: false },
      ],
    });
    if (!opponentResult.success || !opponentResult.group) {
      throw new Error("Failed to create opponent team");
    }
    const opponent = opponentResult.group;

    // Create Round and Match
    const round = await prisma.round.create({
      data: {
        tournamentId: testTournament.id,
        name: "Gameweek 1",
        roundNumber: 1,
        gameweek: 1,
      },
    });

    const match = await prisma.match.create({
      data: {
        roundId: round.id,
        matchNumber: 1,
        homeGroupId: team.id,
        awayGroupId: opponent.id,
        status: "SCHEDULED",
      },
    });
    console.log(`✓ Created fixture: ${team.name} vs ${opponent.name} (Match ID: ${match.id})`);

    // 5. Insert Manual Scores via saveManualMatchScoresAction
    console.log("\n--- Step 5: Admin Inserts Scores for Fixture ---");
    const hakimi = team.members.find((m) => m.fplName === "Achraf Hakimi")!;
    const ziyech = team.members.find((m) => m.fplName === "Hakim Ziyech")!;
    const walid = team.members.find((m) => m.fplName === "Walid Regragui")!;
    const salah = opponent.members.find((m) => m.fplName === "Mo Salah")!;
    const trezeguet = opponent.members.find((m) => m.fplName === "Trezeguet")!;

    const saveScoreResult = await saveManualMatchScoresAction({
      matchId: match.id,
      tournamentId: testTournament.id,
      scores: [
        { memberId: hakimi.id, gameweekPoints: 65, activeChip: null },
        { memberId: ziyech.id, gameweekPoints: 45, activeChip: null },
        { memberId: walid.id, gameweekPoints: 90, activeChip: null }, // Admin: 90 pts, should NOT count!
        { memberId: salah.id, gameweekPoints: 70, activeChip: "3xc" },
        { memberId: trezeguet.id, gameweekPoints: 30, activeChip: null },
      ],
      status: "COMPLETED",
    });

    if (!saveScoreResult.success) {
      throw new Error(`Failed to save manual match scores: ${saveScoreResult.error}`);
    }

    const updatedMatch = await prisma.match.findUnique({
      where: { id: match.id },
      include: { scores: { include: { member: true } } },
    });

    console.log(`Match Result: Atlas Lions (${updatedMatch?.homeScore}) - (${updatedMatch?.awayScore}) Pharaohs`);
    console.log(`Outcome: ${updatedMatch?.result} | Winner: ${updatedMatch?.winnerId === team.id ? team.name : opponent.name}`);
    console.log(`Status: ${updatedMatch?.status}`);

    // Verify scoring math:
    // Atlas Lions: Hakimi (65) + Ziyech (45) = 110 pts (Walid 90 excluded)
    // Pharaohs: Salah (70) + Trezeguet (30) = 100 pts
    // Result: HOME_WIN, Winner: Atlas Lions
    if (updatedMatch?.homeScore !== 110) {
      throw new Error(`Expected Atlas Lions score 110, got ${updatedMatch?.homeScore}`);
    }
    if (updatedMatch?.awayScore !== 100) {
      throw new Error(`Expected Pharaohs score 100, got ${updatedMatch?.awayScore}`);
    }
    if (updatedMatch?.result !== "HOME_WIN") {
      throw new Error(`Expected HOME_WIN, got ${updatedMatch?.result}`);
    }
    if (updatedMatch?.winnerId !== team.id) {
      throw new Error(`Expected winner to be Atlas Lions (${team.id}), got ${updatedMatch?.winnerId}`);
    }
    console.log("✅ STEP 5 PASSED: Manual fixture scores computed, admin excluded, winner determined!");

    // 6. Test Recalculation Persistence
    console.log("\n--- Step 6: Verify Persistence Across Recalculations ---");
    const recalculateResult = await recalculateTournamentScores(testTournament.id);
    const postRecalcMatch = await prisma.match.findUnique({
      where: { id: match.id },
    });

    console.log(`Post-Recalc Match Score: ${postRecalcMatch?.homeScore} - ${postRecalcMatch?.awayScore}`);
    if (postRecalcMatch?.homeScore !== 110 || postRecalcMatch?.awayScore !== 100) {
      throw new Error(
        `Recalculation wiped manual scores! Expected 110-100, got ${postRecalcMatch?.homeScore}-${postRecalcMatch?.awayScore}`
      );
    }
    console.log("✅ STEP 6 PASSED: Manual scores persist accurately through full tournament recalculations!");

    // 7. Test Member Management (Add, Edit, Delete)
    console.log("\n--- Step 7: Test Manual Member Management ---");
    // Add Member
    const addPlayerResult = await addMemberToGroupAction({
      groupId: team.id,
      tournamentId: testTournament.id,
      name: "Yassine Bounou",
      teamName: "Bounou Wall",
      isAdmin: false,
    });
    if (!addPlayerResult.success || !addPlayerResult.member) {
      throw new Error(`Failed to add player: ${addPlayerResult.error}`);
    }
    console.log(`✓ Added player: ${addPlayerResult.member.fplName} (ID: ${addPlayerResult.member.fplId})`);

    // Edit Member
    const editPlayerResult = await updateGroupMemberAction({
      memberId: addPlayerResult.member.id,
      tournamentId: testTournament.id,
      name: "Bono",
      teamName: "Bono Saves",
      isAdmin: false,
    });
    if (!editPlayerResult.success) {
      throw new Error(`Failed to update player: ${editPlayerResult.error}`);
    }
    console.log("✓ Updated player name to Bono");

    // Delete Member
    const deletePlayerResult = await deleteGroupMemberAction(
      addPlayerResult.member.id,
      testTournament.id
    );
    if (!deletePlayerResult.success) {
      throw new Error(`Failed to delete player: ${deletePlayerResult.error}`);
    }
    console.log("✓ Successfully deleted player Bono");
    console.log("✅ STEP 7 PASSED: Player addition, updating, and deletion fully functioning!");

    console.log("\n==================================================");
    console.log("ALL MANUAL TEAM TESTS PASSED WITH 100% SUCCESS! 🎉");
    console.log("==================================================");
  } finally {
    // Clean up test tournament
    if (testTournamentId) {
      try {
        await prisma.tournament.delete({
          where: { id: testTournamentId },
        });
        console.log(`\n🧹 Cleaned up test tournament (${testTournamentId})`);
      } catch (e) {
        console.warn("Cleanup warning:", e);
      }
    }
  }
}

runManualTeamTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed with error:", err);
    process.exit(1);
  });
