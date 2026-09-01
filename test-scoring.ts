import { prisma } from "./lib/db";
import {
  calculateGroupScore,
  calculateMatchScore,
  recalculateTournamentScores,
  calculateLeagueStandings,
} from "./lib/scoring";
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

  // TEST 5: Separated Chips Rules (allowBenchBoost and allowTripleCaptain)
  console.log("\n--- TEST 5A: Bench Boost DISABLED, Triple Captain ENABLED ---");
  // BB disabled (Othman 75 -> 60), TC enabled (Said 66 -> 66), FH (55), WC (48) -> Total = 60 + 66 + 55 + 48 = 229
  const scoreBBOffTCOn = await calculateGroupScore(napoli.id, 6, tournament.adminFplId, {
    allowBenchBoost: false,
    allowTripleCaptain: true,
  });
  console.log(`Napoli GW6 Score (BB Off, TC On): ${scoreBBOffTCOn.totalScore} pts`);
  if (scoreBBOffTCOn.totalScore !== 229) {
    throw new Error(`Expected 229 pts for BB Off / TC On, got ${scoreBBOffTCOn.totalScore}`);
  }
  console.log("✅ TEST 5A PASSED: BB bench points deducted (-15), TC counted at 3x!");

  console.log("\n--- TEST 5B: Bench Boost ENABLED, Triple Captain DISABLED ---");
  // BB enabled (Othman 75 -> 75), TC disabled (Said 66 -> 54), FH (55), WC (48) -> Total = 75 + 54 + 55 + 48 = 232
  const scoreBBOnTCOff = await calculateGroupScore(napoli.id, 6, tournament.adminFplId, {
    allowBenchBoost: true,
    allowTripleCaptain: false,
  });
  console.log(`Napoli GW6 Score (BB On, TC Off): ${scoreBBOnTCOff.totalScore} pts`);
  if (scoreBBOnTCOff.totalScore !== 232) {
    throw new Error(`Expected 232 pts for BB On / TC Off, got ${scoreBBOnTCOff.totalScore}`);
  }
  console.log("✅ TEST 5B PASSED: BB bench points counted fully, TC reduced to 2x (-12)!");

  console.log("\n--- TEST 5C: BOTH Chips DISABLED ---");
  // BB disabled (60), TC disabled (54), FH (55), WC (48) -> Total = 60 + 54 + 55 + 48 = 217
  const scoreBothOff = await calculateGroupScore(napoli.id, 6, tournament.adminFplId, {
    allowBenchBoost: false,
    allowTripleCaptain: false,
  });
  console.log(`Napoli GW6 Score (Both Off): ${scoreBothOff.totalScore} pts`);
  if (scoreBothOff.totalScore !== 217) {
    throw new Error(`Expected 217 pts for Both Off, got ${scoreBothOff.totalScore}`);
  }
  console.log("✅ TEST 5C PASSED: Both chips adjusted properly!");

  // TEST 6: BOTH Chips ENABLED
  console.log("\n--- TEST 6: BOTH Chips ENABLED ---");
  // BB enabled (75), TC enabled (66), FH (55), WC (48) -> Total = 75 + 66 + 55 + 48 = 244
  const scoreBothOn = await calculateGroupScore(napoli.id, 6, tournament.adminFplId, {
    allowBenchBoost: true,
    allowTripleCaptain: true,
  });
  console.log(`Napoli GW6 Score (Both On): ${scoreBothOn.totalScore} pts`);
  if (scoreBothOn.totalScore !== 244) {
    throw new Error(`Expected 244 pts for Both On, got ${scoreBothOn.totalScore}`);
  }
  console.log("✅ TEST 6 PASSED: Both chips counted fully!");

  // TEST 8: Head-to-Head League Standings Calculation (+3 Win, +1 Draw, 0 Loss)
  console.log("\n--- TEST 8: Head-to-Head League Standings (+3 Win, +1 Draw, 0 Loss) ---");
  const standings = await calculateLeagueStandings(tournament.id);
  console.log("Current League Standings Table:");
  console.log("Rank | Team | MP | W | D | L | PF | PA | +/- | PTS");
  console.log("--------------------------------------------------");
  standings.forEach((s) => {
    console.log(
      `  ${s.rank}  | ${s.groupName.padEnd(12)} | ${s.played}  | ${s.won} | ${s.drawn} | ${s.lost} | ${s.pointsFor} | ${s.pointsAgainst} | ${s.pointsDiff >= 0 ? "+" : ""}${s.pointsDiff} | ${s.leaguePoints} PTS`
    );
  });

  const barcelona = standings.find((s) => s.groupName === "Barcelona");
  const realMadridStanding = standings.find((s) => s.groupName === "Real Madrid");
  const napoliStanding = standings.find((s) => s.groupName === "Napoli");
  const liverpool = standings.find((s) => s.groupName === "Liverpool");

  // Barcelona won Match 2 (244 vs 215) -> 3 PTS, +29 Diff, 1st place
  if (barcelona?.leaguePoints !== 3 || barcelona?.rank !== 1 || barcelona?.pointsDiff !== 29) {
    throw new Error(`Barcelona standings check failed: expected 3 PTS (+29 Diff, Rank 1), got ${barcelona?.leaguePoints} PTS (Diff: ${barcelona?.pointsDiff}, Rank: ${barcelona?.rank})`);
  }

  // Real Madrid drew Match 1 (160 vs 160) -> 1 PT, 0 Diff
  if (realMadridStanding?.leaguePoints !== 1 || realMadridStanding?.pointsDiff !== 0) {
    throw new Error(`Real Madrid standings check failed: expected 1 PT (0 Diff), got ${realMadridStanding?.leaguePoints} PTS`);
  }

  // Napoli drew Match 1 (160 vs 160) -> 1 PT, 0 Diff
  if (napoliStanding?.leaguePoints !== 1 || napoliStanding?.pointsDiff !== 0) {
    throw new Error(`Napoli standings check failed: expected 1 PT (0 Diff), got ${napoliStanding?.leaguePoints} PTS`);
  }

  // Liverpool lost Match 2 (215 vs 244) -> 0 PTS, -29 Diff, 4th place
  if (liverpool?.leaguePoints !== 0 || liverpool?.rank !== 4 || liverpool?.pointsDiff !== -29) {
    throw new Error(`Liverpool standings check failed: expected 0 PTS (-29 Diff, Rank 4), got ${liverpool?.leaguePoints} PTS`);
  }

  console.log("✅ TEST 8 PASSED: League standings computed correctly with +3 Win, +1 Draw, 0 Loss and standard tiebreakers!");

  console.log("\n==================================================");
  console.log("ALL SCORING & LEAGUE RULE TESTS PASSED (8/8) 🎉");
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
