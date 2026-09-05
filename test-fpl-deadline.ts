import { prisma } from "./lib/db";
import {
  checkFPLDeadlineStatus,
  isFPLDeadlineActive,
  FPLDeadlineError,
  getManagerGameweekPoints,
  getManagerGameweekSquad,
} from "./lib/fpl";
import { setSimulatedDeadline } from "./lib/fpl-deadline";
import {
  importLeagueAsGroupAction,
  getAdminLeaguesForTournamentAction,
} from "./lib/group-actions";
import {
  calculateMatchScore,
  calculateGroupScore,
  recalculateTournamentScores,
} from "./lib/scoring";
import {
  recalculateMatchAction,
  recalculateAllScoresAction,
  finalizeMatchAction,
} from "./lib/scoring-actions";
import {
  verifyFPLEntryAction,
  getManagerLeaguesAction,
  validateManagerInLeagueAction,
} from "./lib/fpl-actions";

async function runDeadlineTests() {
  console.log("==================================================");
  console.log("TESTING FPL DEADLINE HANDLING & OPERATION GUARDING");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`✅ TEST ${total} PASSED: ${message}`);
      passed++;
    } else {
      console.error(`❌ TEST ${total} FAILED: ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
  }

  // Load a test tournament from seeded database
  const tournament = await prisma.tournament.findFirst({
    where: { name: "FPL Champions League 2024/25" },
    include: {
      groups: { include: { members: true } },
      rounds: { include: { matches: true } },
    },
  });

  if (!tournament) {
    throw new Error("Tournament not found. Please run seed first.");
  }

  const round1 = tournament.rounds.find((r) => r.roundNumber === 1);
  const match1 = round1?.matches.find((m) => m.matchNumber === 1);
  if (!match1) throw new Error("Match 1 not found");

  const realMadrid = tournament.groups.find((g) => g.name === "Real Madrid");
  if (!realMadrid) throw new Error("Real Madrid group not found");

  // TEST 1: Status when operational
  setSimulatedDeadline(false);
  const initialStatus = checkFPLDeadlineStatus();
  console.log("--- 1. Testing Default / Operational State ---");
  console.log(`Status: ${initialStatus.status}, isDeadline: ${initialStatus.isDeadline}`);
  assert(!isFPLDeadlineActive(), "FPL is not in deadline mode initially");

  // TEST 2: Enable simulated deadline mode
  console.log("\n--- 2. Enabling Simulated FPL Deadline Mode ---");
  setSimulatedDeadline(true, "Simulated Gameweek 15 Deadline in Progress");
  const deadlineStatus = checkFPLDeadlineStatus();
  assert(deadlineStatus.isDeadline, "Deadline status is true when simulated");
  assert(deadlineStatus.status === "DEADLINE_ACTIVE", "Status is DEADLINE_ACTIVE");
  assert(isFPLDeadlineActive(), "isFPLDeadlineActive() returns true");

  // TEST 3: Group import blocked during deadline
  console.log("\n--- 3. Testing Group Import Blocked During Deadline ---");
  const importResult = await importLeagueAsGroupAction(
    tournament.id,
    100001, // Real Madrid classic league
    "Test Group During Deadline"
  );
  assert(!importResult.success, "Group import is rejected during deadline");
  assert(importResult.isDeadline === true, "importLeagueAsGroupAction returns isDeadline: true");
  console.log(`  Expected error: "${importResult.error}"`);

  // TEST 4: Fetch Admin Leagues blocked during deadline
  console.log("\n--- 4. Testing Admin Leagues Fetch Blocked During Deadline ---");
  const leaguesResult = await getAdminLeaguesForTournamentAction(tournament.id);
  assert(!leaguesResult.success, "Admin leagues fetch is rejected during deadline");
  assert(leaguesResult.isDeadline === true, "getAdminLeaguesForTournamentAction returns isDeadline: true");

  // TEST 5: Manager verification blocked during deadline
  console.log("\n--- 5. Testing Manager Verification Blocked During Deadline ---");
  const verifyResult = await verifyFPLEntryAction("1234567");
  assert(!verifyResult.success, "Manager verification rejected during deadline");
  assert(verifyResult.isDeadline === true, "verifyFPLEntryAction returns isDeadline: true");

  // TEST 6: Manager leagues blocked during deadline
  console.log("\n--- 6. Testing Manager Leagues Action Blocked During Deadline ---");
  const managerLeaguesResult = await getManagerLeaguesAction("1234567");
  assert(!managerLeaguesResult.success, "Manager leagues rejected during deadline");
  assert(managerLeaguesResult.isDeadline === true, "getManagerLeaguesAction returns isDeadline: true");

  // TEST 6B: Manager league validation blocked during deadline
  console.log("\n--- 6B. Testing Validate Manager In League Blocked During Deadline ---");
  const validateInLeagueResult = await validateManagerInLeagueAction("1234567", "100001");
  assert(!validateInLeagueResult.success, "Validate manager in league rejected during deadline");
  assert(validateInLeagueResult.isDeadline === true, "validateManagerInLeagueAction returns isDeadline: true");

  // TEST 7: Match score calculation throws FPLDeadlineError
  console.log("\n--- 7. Testing calculateMatchScore Throws FPLDeadlineError ---");
  let caughtDeadlineError = false;
  try {
    await calculateMatchScore(match1.id, true);
  } catch (err) {
    if (err instanceof FPLDeadlineError || (err as { isDeadline?: boolean })?.isDeadline) {
      caughtDeadlineError = true;
    }
  }
  assert(caughtDeadlineError, "calculateMatchScore throws FPLDeadlineError during deadline");

  // TEST 8: Group score calculation throws FPLDeadlineError
  console.log("\n--- 8. Testing calculateGroupScore Throws FPLDeadlineError ---");
  let caughtGroupError = false;
  try {
    await calculateGroupScore(realMadrid.id, 5, tournament.adminFplId);
  } catch (err) {
    if (err instanceof FPLDeadlineError || (err as { isDeadline?: boolean })?.isDeadline) {
      caughtGroupError = true;
    }
  }
  assert(caughtGroupError, "calculateGroupScore throws FPLDeadlineError during deadline");

  // TEST 8B: Raw getManagerGameweekPoints throws FPLDeadlineError
  console.log("\n--- 8B. Testing getManagerGameweekPoints Throws FPLDeadlineError ---");
  let caughtPointsError = false;
  try {
    await getManagerGameweekPoints(1234567, 5);
  } catch (err) {
    if (err instanceof FPLDeadlineError || (err as { isDeadline?: boolean })?.isDeadline) {
      caughtPointsError = true;
    }
  }
  assert(caughtPointsError, "getManagerGameweekPoints throws FPLDeadlineError during deadline");

  // TEST 8C: recalculateTournamentScores throws FPLDeadlineError
  console.log("\n--- 8C. Testing recalculateTournamentScores Throws FPLDeadlineError ---");
  let caughtRecalcAllError = false;
  try {
    await recalculateTournamentScores(tournament.id);
  } catch (err) {
    if (err instanceof FPLDeadlineError || (err as { isDeadline?: boolean })?.isDeadline) {
      caughtRecalcAllError = true;
    }
  }
  assert(caughtRecalcAllError, "recalculateTournamentScores throws FPLDeadlineError during deadline");

  // TEST 9: Recalculate match action returns isDeadline: true
  console.log("\n--- 9. Testing recalculateMatchAction Blocked During Deadline ---");
  const recalcMatchResult = await recalculateMatchAction(match1.id, tournament.id);
  assert(!recalcMatchResult.success, "recalculateMatchAction is rejected during deadline");
  assert(recalcMatchResult.isDeadline === true, "recalculateMatchAction returns isDeadline: true");
  console.log(`  Expected error: "${recalcMatchResult.error}"`);

  // TEST 10: Recalculate all scores action returns isDeadline: true
  console.log("\n--- 10. Testing recalculateAllScoresAction Blocked During Deadline ---");
  const recalcAllResult = await recalculateAllScoresAction(tournament.id);
  assert(!recalcAllResult.success, "recalculateAllScoresAction is rejected during deadline");
  assert(recalcAllResult.isDeadline === true, "recalculateAllScoresAction returns isDeadline: true");

  // TEST 11: Finalize match blocked during deadline
  console.log("\n--- 11. Testing finalizeMatchAction Blocked During Deadline ---");
  const finalizeResult = await finalizeMatchAction(match1.id, tournament.id);
  assert(!finalizeResult.success, "finalizeMatchAction is rejected during deadline");
  assert(finalizeResult.isDeadline === true, "finalizeMatchAction returns isDeadline: true");

  // TEST 12: getManagerGameweekSquad throws FPLDeadlineError
  console.log("\n--- 12. Testing getManagerGameweekSquad Throws FPLDeadlineError ---");
  let caughtSquadError = false;
  try {
    await getManagerGameweekSquad(1234567, 5);
  } catch (err) {
    if (err instanceof FPLDeadlineError || (err as { isDeadline?: boolean })?.isDeadline) {
      caughtSquadError = true;
    }
  }
  assert(caughtSquadError, "getManagerGameweekSquad throws FPLDeadlineError during deadline");

  // TEST 13: Disable simulated deadline & verify operational restoration
  console.log("\n--- 13. Disabling Simulated Deadline Mode ---");
  setSimulatedDeadline(false);
  assert(!isFPLDeadlineActive(), "isFPLDeadlineActive() is false after clearing simulation");

  // TEST 14: Regular score calculation succeeds when outside deadline
  console.log("\n--- 14. Testing Regular Score Calculation Outside Deadline ---");
  const restoredGroupScore = await calculateGroupScore(realMadrid.id, 5, tournament.adminFplId);
  assert(restoredGroupScore.totalScore === 160, "Real Madrid calculates 160 pts normally outside deadline");

  const restoredMatch = await calculateMatchScore(match1.id, true);
  assert(restoredMatch.homeScore === 160 && restoredMatch.awayScore === 160, "Match 1 calculates 160-160 DRAW normally outside deadline");

  console.log("\n==================================================");
  console.log(`ALL DEADLINE GUARD TESTS PASSED (${passed}/${total}) 🎉`);
  console.log("==================================================");
}

runDeadlineTests().catch((err) => {
  console.error("FATAL ERROR IN DEADLINE TESTS:", err);
  process.exit(1);
});
