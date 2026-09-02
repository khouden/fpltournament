import { prisma } from "./lib/db";
import {
  getAdminLeaguesForTournamentAction,
  importLeagueAsGroupAction,
} from "./lib/group-actions";
import { calculateGroupScore } from "./lib/scoring";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3005";

async function runMultiAdminTests() {
  console.log("==================================================");
  console.log("TESTING MULTI-ADMIN TOURNAMENT CREATION & WORKFLOW");
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
    }
  }

  // 1. Create Tournament with 2 Admins via POST API
  console.log("--- 1. Creating tournament with Primary Admin & Co-Admin ---");
  const createRes = await fetch(`${BASE_URL}/api/admin/tournaments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Multi-Admin Test Championship",
      season: 2025,
      adminFplId: 1234567,
      admins: [
        {
          fplId: 1234567,
          name: "Ahmed Ali",
          teamName: "Admin FC",
          isPrimary: true,
        },
        {
          fplId: 111111,
          name: "Ali Mansour",
          teamName: "Ali's XI",
          isPrimary: false,
        },
      ],
      allowBenchBoost: true,
      allowTripleCaptain: true,
    }),
  });

  assert(createRes.status === 201, "POST /api/admin/tournaments returned 201 Created");
  const createdTournament = await createRes.json();
  const tournamentId = createdTournament.id;

  // 2. Verify database records
  const dbTournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { admins: { orderBy: { isPrimary: "desc" } } },
  });

  assert(
    !!dbTournament && dbTournament.admins.length === 2,
    "Tournament persisted in database with exactly 2 TournamentAdmin records"
  );
  assert(
    dbTournament?.admins[0].fplId === 1234567 && dbTournament?.admins[0].isPrimary === true,
    "Primary admin is 1234567 (Ahmed Ali)"
  );
  assert(
    dbTournament?.admins[1].fplId === 111111 && dbTournament?.admins[1].isPrimary === false,
    "Co-admin is 111111 (Ali Mansour)"
  );

  // 3. Fetch leagues for all tournament admins
  console.log("\n--- 2. Fetching leagues from both Primary & Co-Admin ---");
  const leaguesResult = await getAdminLeaguesForTournamentAction(tournamentId);

  assert(leaguesResult.success === true, "getAdminLeaguesForTournamentAction succeeded");
  assert(
    (leaguesResult.admins?.length ?? 0) === 2,
    "Action returned 2 tournament admins in metadata"
  );

  const admin1Leagues = leaguesResult.leagues?.filter((l) => l.adminFplId === 1234567) || [];
  const admin2Leagues = leaguesResult.leagues?.filter((l) => l.adminFplId === 111111) || [];

  assert(
    admin1Leagues.length > 0,
    `Admin 1 (1234567) has ${admin1Leagues.length} leagues available (includes Real Madrid 100001)`
  );
  assert(
    admin2Leagues.some((l) => l.id === 100004),
    "Admin 2 (111111) has Arsenal Supporters (League 100004) available"
  );

  // 4. Import a league from Admin 1 (Real Madrid - 100001)
  console.log("\n--- 3. Importing group from Admin 1's league ---");
  const import1 = await importLeagueAsGroupAction(
    tournamentId,
    100001,
    undefined,
    null,
    1234567
  );
  assert(import1.success === true, "Imported Real Madrid (100001) successfully");

  const group1Members = import1.group?.members || [];
  const admin1InGroup1 = group1Members.find((m) => m.fplId === 1234567);
  assert(
    admin1InGroup1?.isAdmin === true,
    "Primary Admin (1234567) is automatically marked isAdmin: true in Real Madrid"
  );

  // 5. Import a league from Admin 2 (Arsenal Supporters - 100004)
  console.log("\n--- 4. Importing group from Admin 2's league (where Admin 1 is NOT a member) ---");
  const import2 = await importLeagueAsGroupAction(
    tournamentId,
    100004,
    undefined,
    null,
    111111
  );
  assert(import2.success === true, "Imported Arsenal Supporters (100004) successfully via Co-Admin");

  const group2Members = import2.group?.members || [];
  const admin2InGroup2 = group2Members.find((m) => m.fplId === 111111);
  assert(
    admin2InGroup2?.isAdmin === true,
    "Co-Admin (111111) is automatically marked isAdmin: true in Arsenal Supporters"
  );

  // 6. Test Scoring Engine with Multi-Admin Exclusion
  console.log("\n--- 5. Verifying Scoring Engine excludes both Primary and Co-Admins ---");
  const adminIds = [1234567, 111111];
  const group2Score = await calculateGroupScore(
    import2.group!.id,
    5,
    adminIds
  );

  const admin2ScoreItem = group2Score.members.find((m) => m.fplId === 111111);
  assert(
    admin2ScoreItem?.isExcluded === true,
    "Co-Admin (111111) is strictly EXCLUDED from scoring in Arsenal Supporters"
  );

  const scoringMembers = group2Score.members.filter((m) => !m.isExcluded);
  const expectedTotal = scoringMembers.reduce((sum, m) => sum + m.gameweekPoints, 0);
  assert(
    group2Score.totalScore === expectedTotal,
    `Group total score (${group2Score.totalScore} pts) correctly matches non-admin points only`
  );

  // 7. Test PUT API to update admins (e.g. promoting co-admin to primary)
  console.log("\n--- 6. Updating tournament admins via PUT API ---");
  const putRes = await fetch(`${BASE_URL}/api/admin/tournaments`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: tournamentId,
      name: "Multi-Admin Test Championship (Updated)",
      season: 2025,
      admins: [
        {
          fplId: 111111,
          name: "Ali Mansour",
          teamName: "Ali's XI",
          isPrimary: true,
        },
        {
          fplId: 1234567,
          name: "Ahmed Ali",
          teamName: "Admin FC",
          isPrimary: false,
        },
      ],
    }),
  });

  assert(putRes.status === 200, "PUT /api/admin/tournaments returned 200 OK");
  const updatedTournament = await putRes.json();
  assert(
    updatedTournament.adminFplId === 111111,
    "Updated tournament adminFplId reflects newly designated primary admin (111111)"
  );

  // 8. Clean up
  console.log("\n--- 7. Cleanup test tournament ---");
  await prisma.tournament.delete({ where: { id: tournamentId } });
  console.log("✓ Cleaned up test tournament records.");

  console.log("\n==================================================");
  console.log(`MULTI-ADMIN TEST RESULTS: ${passed}/${total} PASSED 🎉`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runMultiAdminTests()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Multi-admin test run failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
