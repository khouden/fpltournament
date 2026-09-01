import { prisma } from "./lib/db";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3005";

async function runApiTests() {
  console.log("==================================================");
  console.log("TESTING REST API ROUTES (Sections 38–44)");
  console.log("==================================================\n");

  const tournament = await prisma.tournament.findFirst({
    where: { name: "FPL Champions League 2024/25" },
    include: {
      groups: true,
      rounds: {
        include: { matches: true },
      },
    },
  });

  if (!tournament) {
    throw new Error("Tournament not found. Please run seed first.");
  }

  // Ensure tournament is published for public API tests
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: { status: "PUBLISHED" },
  });

  const round1 = tournament.rounds.find((r) => r.roundNumber === 1);
  const match1 = round1?.matches.find((m) => m.matchNumber === 1);

  let passed = 0;
  let total = 0;

  async function testEndpoint(name: string, url: string, expectedStatus = 200) {
    total++;
    try {
      const res = await fetch(`${BASE_URL}${url}`);
      if (res.status !== expectedStatus) {
        console.error(`❌ ${name} Failed: Expected HTTP ${expectedStatus}, got ${res.status}`);
        const text = await res.text();
        console.error(`   Response: ${text.slice(0, 200)}`);
        return false;
      }
      const data = await res.json();
      console.log(`✅ ${name}: HTTP ${res.status} OK`);
      passed++;
      return data;
    } catch (err) {
      console.error(`❌ ${name} Error:`, err);
      return false;
    }
  }

  // --- SECTION 38: Public API ---
  console.log("--- Section 38: Public API ---");
  await testEndpoint("GET /api/tournaments", "/api/tournaments");
  await testEndpoint(`GET /api/tournaments/${tournament.id}`, `/api/tournaments/${tournament.id}`);
  await testEndpoint(`GET /api/tournaments/${tournament.id}/rounds`, `/api/tournaments/${tournament.id}/rounds`);
  if (match1) {
    await testEndpoint(`GET /api/matches/${match1.id}`, `/api/matches/${match1.id}`);
  }

  // --- SECTION 39: Admin API ---
  console.log("\n--- Section 39: Admin Tournaments API ---");
  await testEndpoint("GET /api/admin/tournaments", "/api/admin/tournaments");
  await testEndpoint(`GET /api/admin/tournaments/${tournament.id}`, `/api/admin/tournaments/${tournament.id}`);

  // --- SECTION 40: FPL Admin API ---
  console.log("\n--- Section 40: FPL Admin API ---");
  await testEndpoint("GET /api/admin/fpl/manager/1234567", "/api/admin/fpl/manager/1234567");
  await testEndpoint("GET /api/admin/fpl/manager/1234567/leagues", "/api/admin/fpl/manager/1234567/leagues");
  await testEndpoint("GET /api/admin/fpl/league/100001", "/api/admin/fpl/league/100001");

  console.log("\n==================================================");
  console.log(`API TEST RESULTS: ${passed}/${total} PASSED 🎉`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runApiTests()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("API Tests Failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
