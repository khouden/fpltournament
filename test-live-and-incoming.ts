import assert from "node:assert";
import { prisma } from "./lib/db";
import {
  calculateMatchScore,
  recalculateTournamentScores,
} from "./lib/scoring";
import {
  getGameweekStatus,
  setSimulatedGameweekStatus,
  clearSimulatedGameweekStatuses,
} from "./lib/fpl";
import { finalizeMatchAction } from "./lib/scoring-actions";

async function runLiveAndIncomingTests() {
  console.log("==================================================");
  console.log("TESTING LIVE MATCHES & INCOMING ROUNDS ENGINE");
  console.log("==================================================\n");

  // 1. Test getGameweekStatus
  console.log("--- 1. Testing Gameweek Status Detection ---");
  const gw1Status = await getGameweekStatus(1);
  console.log(`GW1 status: ${gw1Status.status} (finished: ${gw1Status.isFinished})`);
  assert(gw1Status.status === "FINISHED", "GW1 should be FINISHED");

  setSimulatedGameweekStatus(3, "LIVE");
  const gw3Status = await getGameweekStatus(3);
  console.log(`GW3 status: ${gw3Status.status} (current/live: ${gw3Status.isCurrent})`);
  assert(gw3Status.status === "LIVE", "GW3 with simulated status should be LIVE");
  clearSimulatedGameweekStatuses();

  const gw35Status = await getGameweekStatus(35);
  console.log(`GW35 status: ${gw35Status.status}`);
  assert(gw35Status.status === "UPCOMING", "GW35 in current season should be UPCOMING");
  console.log("✅ TEST 1 PASSED: getGameweekStatus correctly identifies FINISHED, LIVE, and UPCOMING!\n");

  // 2. Setup a test tournament
  console.log("--- 2. Setting up Test Tournament with Past, Live, and Future Rounds ---");
  const adminFplId = 9990001;
  const testTournament = await prisma.tournament.create({
    data: {
      name: "Test Live & Incoming Tournament",
      season: 2024,
      adminFplId,
      status: "PUBLISHED",
    },
  });

  const groupA = await prisma.group.create({
    data: { tournamentId: testTournament.id, name: "Team Alpha" },
  });
  const groupB = await prisma.group.create({
    data: { tournamentId: testTournament.id, name: "Team Beta" },
  });

  // Add members
  await prisma.groupMember.create({
    data: { groupId: groupA.id, fplId: 111111, fplName: "Player A" },
  });
  await prisma.groupMember.create({
    data: { groupId: groupB.id, fplId: 222222, fplName: "Player B" },
  });

  // Round 1: GW5 (Finished with mock points)
  const round1 = await prisma.round.create({
    data: {
      tournamentId: testTournament.id,
      roundNumber: 1,
      name: "Round 1 (Finished)",
      gameweek: 5,
    },
  });
  const match1 = await prisma.match.create({
    data: {
      roundId: round1.id,
      matchNumber: 1,
      homeGroupId: groupA.id,
      awayGroupId: groupB.id,
      status: "SCHEDULED",
    },
  });

  // Round 2: GW20 (Simulated LIVE)
  setSimulatedGameweekStatus(20, "LIVE");
  const round2 = await prisma.round.create({
    data: {
      tournamentId: testTournament.id,
      roundNumber: 2,
      name: "Round 2 (Live / In Progress)",
      gameweek: 20,
    },
  });
  const match2 = await prisma.match.create({
    data: {
      roundId: round2.id,
      matchNumber: 2,
      homeGroupId: groupA.id,
      awayGroupId: groupB.id,
      status: "SCHEDULED",
    },
  });

  // Round 3: GW35 (Upcoming / Not started yet)
  const round3 = await prisma.round.create({
    data: {
      tournamentId: testTournament.id,
      roundNumber: 3,
      name: "Round 3 (Incoming / Future)",
      gameweek: 35,
    },
  });
  const match3 = await prisma.match.create({
    data: {
      roundId: round3.id,
      matchNumber: 3,
      homeGroupId: groupA.id,
      awayGroupId: groupB.id,
      status: "SCHEDULED",
    },
  });

  console.log("✅ TEST 2 PASSED: Tournament created with Finished, Live, and Incoming rounds!\n");

  // 3. Test calculation of Incoming / Not started yet match
  console.log("--- 3. Testing calculateMatchScore for UPCOMING round ---");
  const upcomingResult = await calculateMatchScore(match3.id);
  console.log("Upcoming match result status:", upcomingResult.status);
  console.log("Home score:", upcomingResult.homeScore, "Away score:", upcomingResult.awayScore);
  assert(upcomingResult.status === "SCHEDULED", "Upcoming match must remain SCHEDULED");
  assert(upcomingResult.homeScore === null, "Upcoming match scores must remain null");

  const dbMatch3 = await prisma.match.findUnique({ where: { id: match3.id } });
  assert(dbMatch3?.status === "SCHEDULED", "DB match status must be SCHEDULED");
  console.log("✅ TEST 3 PASSED: Upcoming round match is treated as an incoming match and not calculated prematurely!\n");

  // 4. Test calculation of LIVE match
  console.log("--- 4. Testing calculateMatchScore for LIVE round ---");
  const liveResult = await calculateMatchScore(match1.id);
  // Match 1 is GW5 which is FINISHED:
  console.log("Match 1 (GW5 FINISHED) status:", liveResult.status);
  assert(liveResult.status === "COMPLETED", "GW5 match should be COMPLETED");

  // Now simulate match 1 as LIVE to verify IN_PROGRESS transition
  setSimulatedGameweekStatus(5, "LIVE");
  const forcedLiveResult = await calculateMatchScore(match1.id, true);
  console.log("Match 1 with simulated LIVE status:", forcedLiveResult.status);
  assert(forcedLiveResult.status === "IN_PROGRESS", "Live match status must be IN_PROGRESS");

  const dbMatch1Live = await prisma.match.findUnique({ where: { id: match1.id } });
  assert(dbMatch1Live?.status === "IN_PROGRESS", "DB status must update to IN_PROGRESS");
  console.log("✅ TEST 4 PASSED: In-progress matches are properly stamped as LIVE (IN_PROGRESS)!\n");

  // 5. Test Batch Tournament Recalculation across mixed rounds
  console.log("--- 5. Testing recalculateTournamentScores across Mixed Rounds ---");
  setSimulatedGameweekStatus(5, "FINISHED");
  setSimulatedGameweekStatus(20, "UPCOMING"); // GW20 upcoming
  setSimulatedGameweekStatus(35, "UPCOMING"); // GW35 upcoming

  const allResults = await recalculateTournamentScores(testTournament.id, true);
  console.log(`Recalculated ${allResults.length} matches:`);
  allResults.forEach((r) => {
    console.log(`  Match ${r.matchNumber} (GW${r.gameweek}): status = ${r.status}`);
  });

  assert(allResults.find((r) => r.matchNumber === 1)?.status === "COMPLETED", "Match 1 should be COMPLETED");
  assert(allResults.find((r) => r.matchNumber === 2)?.status === "SCHEDULED", "Match 2 (GW20 upcoming) should be SCHEDULED");
  assert(allResults.find((r) => r.matchNumber === 3)?.status === "SCHEDULED", "Match 3 (GW35 upcoming) should be SCHEDULED");
  console.log("✅ TEST 5 PASSED: Batch recalculation processes completed/live matches and preserves incoming rounds!\n");

  // 6. Test finalizeMatchAction blocks upcoming rounds
  console.log("--- 6. Testing finalizeMatchAction Block on Upcoming Round ---");
  process.env.ADMIN_ENTRY_ID = String(adminFplId);
  const finalizeUpcomingResult = await finalizeMatchAction(match3.id, testTournament.id);
  console.log("Finalize upcoming match result:", finalizeUpcomingResult);
  assert(!finalizeUpcomingResult.success, "Finalizing an upcoming match must fail");
  assert(
    finalizeUpcomingResult.error?.includes("has not started yet"),
    "Error should state gameweek has not started yet"
  );
  console.log("✅ TEST 6 PASSED: Finalizing not-started rounds is strictly blocked!\n");

  // Clean up
  clearSimulatedGameweekStatuses();
  await prisma.matchMemberScore.deleteMany({ where: { match: { round: { tournamentId: testTournament.id } } } });
  await prisma.match.deleteMany({ where: { round: { tournamentId: testTournament.id } } });
  await prisma.round.deleteMany({ where: { tournamentId: testTournament.id } });
  await prisma.groupMember.deleteMany({ where: { group: { tournamentId: testTournament.id } } });
  await prisma.group.deleteMany({ where: { tournamentId: testTournament.id } });
  await prisma.tournament.delete({ where: { id: testTournament.id } });

  console.log("==================================================");
  console.log("ALL LIVE & INCOMING TESTS PASSED (6/6) 🎉");
  console.log("==================================================");
}

runLiveAndIncomingTests()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Test failed:", err);
    clearSimulatedGameweekStatuses();
    await prisma.$disconnect();
    process.exit(1);
  });
