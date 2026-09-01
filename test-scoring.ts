import { prisma } from "./lib/db";
import { calculateGroupScore, calculateMatchScore, recalculateTournamentScores } from "./lib/scoring";
import { validateScheduleAction } from "./lib/schedule-actions";

async function runScoringTest() {
  console.log("==================================================");
  console.log("TESTING FANTASY LEAGUES SCORING ENGINE & BUSINESS RULES");
  console.log("==================================================\n");

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

  console.log(`✓ Loaded Tournament: "${tournament.name}" (Admin FPL ID: ${tournament.adminFplId})`);

  const realMadrid = tournament.groups.find((g) => g.name === "Real Madrid");
  const napoli = tournament.groups.find((g) => g.name === "Napoli");

  if (!realMadrid || !napoli) {
    throw new Error("Real Madrid or Napoli group not found");
  }

  // TEST 1: Real Madrid Group Score Calculation
  console.log("\n--- TEST 1: Real Madrid Group Score (Gameweek 5) ---");
  const rmScore = await calculateGroupScore(realMadrid.id, 5, tournament.adminFplId);
  console.log(`Group: ${rmScore.groupName}`);
  console.log(`Total Score: ${rmScore.totalScore} pts`);
  rmScore.members.forEach((m) => {
    console.log(`  - ${m.fplName} (${m.fplTeamName}): ${m.gameweekPoints} pts ${m.isExcluded ? "⛔ [ADMIN EXCLUDED]" : "✓ [COUNTED]"}`);
  });

  // Verification from spec:
  // Ali (50) + Mohamed (50) + Zaid (30) + Baha (30) = 160. Admin (40) excluded.
  if (rmScore.totalScore !== 160) {
    throw new Error(`Real Madrid score expected 160, got ${rmScore.totalScore}`);
  }
  console.log("✅ TEST 1 PASSED: Real Madrid scored exactly 160 pts, Admin correctly excluded!");

  // TEST 2: Napoli Group Score Calculation
  console.log("\n--- TEST 2: Napoli Group Score (Gameweek 5) ---");
  const napoliScore = await calculateGroupScore(napoli.id, 5, tournament.adminFplId);
  console.log(`Group: ${napoliScore.groupName}`);
  console.log(`Total Score: ${napoliScore.totalScore} pts`);
  napoliScore.members.forEach((m) => {
    console.log(`  - ${m.fplName} (${m.fplTeamName}): ${m.gameweekPoints} pts ${m.isExcluded ? "⛔ [ADMIN EXCLUDED]" : "✓ [COUNTED]"}`);
  });

  // Verification from spec:
  // Othman (80) + Said (50) + Omar (20) + Samir (10) = 160. Admin (40) excluded.
  if (napoliScore.totalScore !== 160) {
    throw new Error(`Napoli score expected 160, got ${napoliScore.totalScore}`);
  }
  console.log("✅ TEST 2 PASSED: Napoli scored exactly 160 pts, Admin correctly excluded!");

  // TEST 3: Match 1 Result (Real Madrid vs Napoli) -> DRAW
  console.log("\n--- TEST 3: Match 1 Score & Result ---");
  const round1 = tournament.rounds.find((r) => r.roundNumber === 1);
  const match1 = round1?.matches.find((m) => m.matchNumber === 1);
  if (!match1) throw new Error("Match 1 not found");

  const match1Result = await calculateMatchScore(match1.id, true);
  console.log(`Match 1: Real Madrid (${match1Result.homeScore}) vs Napoli (${match1Result.awayScore})`);
  console.log(`Result: ${match1Result.result}`);
  console.log(`Winner: ${match1Result.winnerGroupId || "None (DRAW)"}`);

  if (match1Result.homeScore !== 160 || match1Result.awayScore !== 160 || match1Result.result !== "DRAW") {
    throw new Error(`Match 1 expected 160-160 DRAW, got ${match1Result.homeScore}-${match1Result.awayScore} ${match1Result.result}`);
  }
  console.log("✅ TEST 3 PASSED: Match 1 is 160 - 160 DRAW as required by spec!");

  // TEST 4: Schedule Validation Test
  console.log("\n--- TEST 4: Schedule Validation ---");
  const validation = await validateScheduleAction(tournament.id);
  console.log(`Schedule Valid: ${validation.isValid}`);
  if (validation.issues.length > 0) {
    console.log("Issues:", validation.issues);
  }
  if (!validation.isValid) {
    throw new Error("Schedule validation failed unexpectedly: " + validation.issues.join(", "));
  }
  console.log("✅ TEST 4 PASSED: Schedule passes all integrity validations!");

  // TEST 5: Configurable Chips Rule (allowChips = false)
  console.log("\n--- TEST 5: Chip Rule with Chips DISABLED (allowChips: false) ---");
  // Napoli in GW6:
  // - Othman (555555): 75 pts with Bench Boost (15 on bench -> counted = 60 pts)
  // - Said (666666): 66 pts with Triple Captain (captain base 12 pts, 3x=36 -> 2x=24 -> counted = 54 pts)
  // - Omar (777777): 55 pts with Free Hit (counted normally = 55 pts)
  // - Samir (888888): 48 pts with Wildcard (counted normally = 48 pts)
  // Admin: excluded.
  // Expected Napoli GW6 score with chips disabled: 60 + 54 + 55 + 48 = 217 pts
  const napoliGW6NoChips = await calculateGroupScore(napoli.id, 6, tournament.adminFplId, false);
  console.log(`Napoli GW6 Score (Chips Off): ${napoliGW6NoChips.totalScore} pts`);
  napoliGW6NoChips.members.forEach((m) => {
    console.log(
      `  - ${m.fplName}: counted ${m.gameweekPoints} pts (raw: ${m.rawPoints}, chip: ${m.activeChip || "none"}, deduction: -${m.chipDeduction})`
    );
  });

  const othmanNoChips = napoliGW6NoChips.members.find((m) => m.fplId === 555555);
  const saidNoChips = napoliGW6NoChips.members.find((m) => m.fplId === 666666);
  const omarNoChips = napoliGW6NoChips.members.find((m) => m.fplId === 777777);
  const samirNoChips = napoliGW6NoChips.members.find((m) => m.fplId === 888888);

  if (othmanNoChips?.gameweekPoints !== 60 || othmanNoChips?.chipDeduction !== 15) {
    throw new Error(`Bench boost deduction failed for Othman: expected 60 pts (-15 deduction), got ${othmanNoChips?.gameweekPoints}`);
  }
  if (saidNoChips?.gameweekPoints !== 54 || saidNoChips?.chipDeduction !== 12) {
    throw new Error(`Triple captain 2x adjustment failed for Said: expected 54 pts (-12 deduction), got ${saidNoChips?.gameweekPoints}`);
  }
  if (omarNoChips?.gameweekPoints !== 55 || omarNoChips?.chipDeduction !== 0) {
    throw new Error(`Free hit failed: expected 55 pts with 0 deduction, got ${omarNoChips?.gameweekPoints}`);
  }
  if (samirNoChips?.gameweekPoints !== 48 || samirNoChips?.chipDeduction !== 0) {
    throw new Error(`Wildcard failed: expected 48 pts with 0 deduction, got ${samirNoChips?.gameweekPoints}`);
  }
  if (napoliGW6NoChips.totalScore !== 217) {
    throw new Error(`Napoli GW6 total with chips disabled expected 217, got ${napoliGW6NoChips.totalScore}`);
  }
  console.log("✅ TEST 5 PASSED: Chips disabled rule works perfectly (BB excluded bench, TC reduced to 2x, FH & WC counted)!");

  // TEST 6: Configurable Chips Rule (allowChips = true)
  console.log("\n--- TEST 6: Chip Rule with Chips ENABLED (allowChips: true) ---");
  // With chips enabled:
  // - Othman (555555): 75 pts (bench counted)
  // - Said (666666): 66 pts (triple captain 3x counted)
  // - Omar (777777): 55 pts
  // - Samir (888888): 48 pts
  // Expected Napoli GW6 score with chips enabled: 75 + 66 + 55 + 48 = 244 pts
  const napoliGW6WithChips = await calculateGroupScore(napoli.id, 6, tournament.adminFplId, true);
  console.log(`Napoli GW6 Score (Chips On): ${napoliGW6WithChips.totalScore} pts`);
  if (napoliGW6WithChips.totalScore !== 244) {
    throw new Error(`Napoli GW6 total with chips enabled expected 244, got ${napoliGW6WithChips.totalScore}`);
  }
  console.log("✅ TEST 6 PASSED: Chips enabled rule counts all chips normally!");

  // TEST 7: Recalculate Tournament Scores
  console.log("\n--- TEST 7: Full Tournament Recalculation ---");
  const allResults = await recalculateTournamentScores(tournament.id, true);
  console.log(`Recalculated ${allResults.length} matches across all rounds`);
  allResults.forEach((res) => {
    console.log(`  Match ${res.matchNumber} (GW${res.gameweek}): ${res.homeGroup?.groupName || "TBD"} (${res.homeScore ?? "-"}) vs ${res.awayGroup?.groupName || "TBD"} (${res.awayScore ?? "-"}) -> [${res.result || "PENDING"}]`);
  });
  console.log("✅ TEST 7 PASSED: Full tournament calculation executed successfully!");

  console.log("\n==================================================");
  console.log("ALL SCORING & BUSINESS RULE TESTS PASSED (7/7) 🎉");
  console.log("==================================================");
}

runScoringTest()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Test Failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
