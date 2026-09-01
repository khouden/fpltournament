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

  // TEST 5: Recalculate Tournament Scores
  console.log("\n--- TEST 5: Full Tournament Recalculation ---");
  const allResults = await recalculateTournamentScores(tournament.id, true);
  console.log(`Recalculated ${allResults.length} matches across all rounds`);
  allResults.forEach((res) => {
    console.log(`  Match ${res.matchNumber} (GW${res.gameweek}): ${res.homeGroup?.groupName || "TBD"} (${res.homeScore ?? "-"}) vs ${res.awayGroup?.groupName || "TBD"} (${res.awayScore ?? "-"}) -> [${res.result || "PENDING"}]`);
  });
  console.log("✅ TEST 5 PASSED: Full tournament calculation executed successfully!");

  console.log("\n==================================================");
  console.log("ALL SCORING & BUSINESS RULE TESTS PASSED (5/5) 🎉");
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
