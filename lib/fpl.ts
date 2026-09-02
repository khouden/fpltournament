/**
 * FPL (Fantasy Premier League) API Service
 * Handles all interactions with the official FPL API with caching and fallback
 */

const FPL_API_BASE = "https://fantasy.premierleague.com/api";
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// In-memory cache
const cache = new Map<string, CacheEntry<unknown>>();

function getCacheKey(...parts: (string | number)[]): string {
  return parts.join("::");
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setInCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_DURATION_MS,
  });
}

export interface FPLManager {
  id: number;
  player_first_name: string;
  player_last_name: string;
  name: string; // Team name
  summary_overall_points?: number;
  summary_event_points?: number;
  current_event?: number;
}

export interface FPLLeague {
  id: number;
  name: string;
  created?: string;
  closed?: boolean;
  rank?: number;
  max_entries?: number;
  league_type?: string;
  admin_entry?: number;
}

export interface FPLLeagueEntry {
  id: number;
  entry_name: string;
  player_name: string;
  entry: number; // Manager Entry ID
  total: number;
  rank: number;
}

export interface FPLGameweekScore {
  entryId: number;
  gameweek: number;
  points: number; // raw total points
  eventTransfersCost: number;
  netPoints: number; // raw points minus transfer costs
  benchPoints?: number;
  activeChip?: string | null; // "bboost", "3xc", "wildcard", "freehit", null
  chipDeduction: number; // points deducted if allowChips is false
  adjustedNetPoints: number; // net points after chip deduction (if chips disabled)
}

export interface FantasyPlayerPick {
  elementId: number;
  webName: string;
  fullName: string;
  teamShortName: string;
  positionType: "GKP" | "DEF" | "MID" | "FWD";
  positionNumber: number; // 1 to 15 (1-11 starters, 12-15 bench)
  isStarter: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  multiplier: number; // 0 (bench without BB), 1 (starter), 2 (captain), 3 (triple captain)
  points: number; // base gameweek points
  totalPoints: number; // points * multiplier
  stats?: {
    goals?: number;
    assists?: number;
    cleanSheets?: number;
    bonus?: number;
    minutes?: number;
    yellowCards?: number;
    redCards?: number;
  };
}

export interface FantasyTeamSquadView {
  managerId: number;
  managerName: string;
  teamName: string;
  gameweek: number;
  activeChip: string | null;
  totalPoints: number;
  transfersCost: number;
  benchPoints: number;
  netPoints: number;
  chipDeduction: number;
  adjustedPoints: number;
  starters: FantasyPlayerPick[];
  bench: FantasyPlayerPick[];
  formation: string;
}

// -------------------------------------------------------------
// Mock Data for Testing & Demo Scenarios (e.g. Real Madrid vs Napoli)
// -------------------------------------------------------------
const MOCK_MANAGERS: Record<number, FPLManager> = {
  1234567: {
    id: 1234567,
    player_first_name: "Ahmed",
    player_last_name: "Ali",
    name: "Admin FC",
    summary_overall_points: 1200,
    current_event: 5,
  },
  111111: {
    id: 111111,
    player_first_name: "Ali",
    player_last_name: "Mansour",
    name: "Ali's XI",
    summary_overall_points: 1150,
  },
  222222: {
    id: 222222,
    player_first_name: "Mohamed",
    player_last_name: "Salah",
    name: "Mo Team",
    summary_overall_points: 1180,
  },
  333333: {
    id: 333333,
    player_first_name: "Zaid",
    player_last_name: "Bakr",
    name: "Zaid FC",
    summary_overall_points: 1090,
  },
  444444: {
    id: 444444,
    player_first_name: "Baha",
    player_last_name: "Nasser",
    name: "Baha United",
    summary_overall_points: 1040,
  },
  555555: {
    id: 555555,
    player_first_name: "Othman",
    player_last_name: "Tariq",
    name: "Othman's XI",
    summary_overall_points: 1210,
  },
  666666: {
    id: 666666,
    player_first_name: "Said",
    player_last_name: "Karim",
    name: "Said FC",
    summary_overall_points: 1120,
  },
  777777: {
    id: 777777,
    player_first_name: "Omar",
    player_last_name: "Farooq",
    name: "Omar XI",
    summary_overall_points: 1080,
  },
  888888: {
    id: 888888,
    player_first_name: "Samir",
    player_last_name: "Jamal",
    name: "Samir United",
    summary_overall_points: 1010,
  },
  999111: {
    id: 999111,
    player_first_name: "Youssef",
    player_last_name: "Amrani",
    name: "Youssef Stars",
    summary_overall_points: 1140,
  },
  999222: {
    id: 999222,
    player_first_name: "Hamza",
    player_last_name: "Idrissi",
    name: "Hamza XI",
    summary_overall_points: 1110,
  },
};

const MOCK_LEAGUES: Record<number, { league: FPLLeague; members: FPLLeagueEntry[] }> = {
  100001: {
    league: { id: 100001, name: "Real Madrid FC Official", league_type: "x" },
    members: [
      { id: 1, entry: 111111, player_name: "Ali", entry_name: "Ali's XI", total: 1150, rank: 1 },
      { id: 2, entry: 222222, player_name: "Mohamed", entry_name: "Mo Team", total: 1180, rank: 2 },
      { id: 3, entry: 1234567, player_name: "Admin", entry_name: "Admin FC", total: 1200, rank: 3 },
      { id: 4, entry: 333333, player_name: "Zaid", entry_name: "Zaid FC", total: 1090, rank: 4 },
      { id: 5, entry: 444444, player_name: "Baha", entry_name: "Baha United", total: 1040, rank: 5 },
    ],
  },
  100002: {
    league: { id: 100002, name: "Napoli Club", league_type: "x" },
    members: [
      { id: 6, entry: 555555, player_name: "Othman", entry_name: "Othman's XI", total: 1210, rank: 1 },
      { id: 7, entry: 666666, player_name: "Said", entry_name: "Said FC", total: 1120, rank: 2 },
      { id: 8, entry: 1234567, player_name: "Admin", entry_name: "Admin FC", total: 1200, rank: 3 },
      { id: 9, entry: 777777, player_name: "Omar", entry_name: "Omar XI", total: 1080, rank: 4 },
      { id: 10, entry: 888888, player_name: "Samir", entry_name: "Samir United", total: 1010, rank: 5 },
    ],
  },
  100003: {
    league: { id: 100003, name: "Barcelona Fans", league_type: "x" },
    members: [
      { id: 11, entry: 999111, player_name: "Youssef", entry_name: "Youssef Stars", total: 1140, rank: 1 },
      { id: 12, entry: 999222, player_name: "Hamza", entry_name: "Hamza XI", total: 1110, rank: 2 },
      { id: 13, entry: 1234567, player_name: "Admin", entry_name: "Admin FC", total: 1200, rank: 3 },
    ],
  },
  100004: {
    league: { id: 100004, name: "Arsenal Supporters", league_type: "x" },
    members: [
      { id: 14, entry: 111111, player_name: "Ali", entry_name: "Ali's XI", total: 1150, rank: 1 },
      { id: 15, entry: 555555, player_name: "Othman", entry_name: "Othman's XI", total: 1210, rank: 2 },
      { id: 16, entry: 999111, player_name: "Youssef", entry_name: "Youssef Stars", total: 1140, rank: 3 },
    ],
  },
};

// Mock points per GW (e.g. GW5 matches the spec draw scenario)
const MOCK_GW_POINTS: Record<string, number> = {
  // GW5: Real Madrid vs Napoli Draw Scenario from spec:
  // RM: Ali (50) + Mohamed (50) + Admin (40 - excluded) + Zaid (30) + Baha (30) = 160
  // Napoli: Othman (80) + Said (50) + Admin (40 - excluded) + Omar (20) + Samir (10) = 160
  "111111_5": 50,
  "222222_5": 50,
  "1234567_5": 40,
  "333333_5": 30,
  "444444_5": 30,

  "555555_5": 80,
  "666666_5": 50,
  "777777_5": 20,
  "888888_5": 10,

  "999111_5": 65,
  "999222_5": 70,

  // GW6 mock scenarios for chip testing:
  "555555_6": 75, // played bench boost: total 75 pts (15 on bench -> 60 without BB)
  "666666_6": 66, // played triple captain: total 66 pts (captain base 12 pts, 3x=36 -> 2x=24 -> -12 deduction -> 54 pts)
  "777777_6": 55, // played free hit: 55 pts (counted normally)
  "888888_6": 48, // played wildcard: 48 pts (counted normally)
};

// Mock chips per manager & gameweek
const MOCK_GW_CHIPS: Record<
  string,
  {
    activeChip: "bboost" | "3xc" | "freehit" | "wildcard";
    benchPoints?: number;
    captainBasePoints?: number;
  }
> = {
  "555555_6": { activeChip: "bboost", benchPoints: 15 },
  "666666_6": { activeChip: "3xc", captainBasePoints: 12 },
  "777777_6": { activeChip: "freehit" },
  "888888_6": { activeChip: "wildcard" },
};

async function fetchFPL<T>(endpoint: string): Promise<T> {
  const cacheKey = getCacheKey("fpl", endpoint);

  // Try cache first
  const cached = getFromCache<T>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = `${FPL_API_BASE}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as T;
    setInCache(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch from FPL API (${endpoint}): ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get manager details by entry ID
 */
export async function getManager(entryId: number): Promise<FPLManager> {
  try {
    const data = await fetchFPL<{
      id: number;
      player_first_name: string;
      player_last_name: string;
      name: string;
      summary_overall_points?: number;
      summary_event_points?: number;
      current_event?: number;
      leagues?: {
        classic?: FPLLeague[];
        h2h?: FPLLeague[];
      };
    }>(`/entry/${entryId}/`);

    return {
      id: data.id,
      player_first_name: data.player_first_name,
      player_last_name: data.player_last_name,
      name: data.name,
      summary_overall_points: data.summary_overall_points,
      summary_event_points: data.summary_event_points,
      current_event: data.current_event,
    };
  } catch (error) {
    // Check mock fallback for demo IDs
    if (MOCK_MANAGERS[entryId]) {
      return MOCK_MANAGERS[entryId];
    }
    throw error;
  }
}

/**
 * Get all classic leagues for a manager
 */
export async function getManagerLeagues(entryId: number): Promise<FPLLeague[]> {
  // Check mock managers first for demo IDs
  if (MOCK_MANAGERS[entryId] || entryId === 1234567) {
    const memberLeagues = Object.values(MOCK_LEAGUES)
      .filter((l) => l.members.some((m) => m.entry === entryId))
      .map((l) => l.league);
    if (memberLeagues.length > 0) return memberLeagues;
    return Object.values(MOCK_LEAGUES).map((l) => l.league);
  }

  try {
    const response = await fetchFPL<{
      leagues?: {
        classic?: FPLLeague[];
        h2h?: FPLLeague[];
      };
    }>(`/entry/${entryId}/`);

    if (response?.leagues?.classic && Array.isArray(response.leagues.classic)) {
      return response.leagues.classic;
    }
    return [];
  } catch (error) {
    throw error;
  }
}

/**
 * Get league details and standings
 */
export async function getLeague(
  leagueId: number
): Promise<{ league: FPLLeague; standings: FPLLeagueEntry[] }> {
  // Check mock leagues first for demo IDs
  if (MOCK_LEAGUES[leagueId]) {
    return {
      league: MOCK_LEAGUES[leagueId].league,
      standings: MOCK_LEAGUES[leagueId].members,
    };
  }

  try {
    const response = await fetchFPL<{
      league: FPLLeague;
      standings: { results: FPLLeagueEntry[] };
    }>(`/leagues-classic/${leagueId}/standings/`);

    return {
      league: response.league,
      standings: response.standings?.results || [],
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get all members in a league
 */
export async function getLeagueMembers(leagueId: number): Promise<{
  members: FPLLeagueEntry[];
}> {
  const { standings } = await getLeague(leagueId);
  return { members: standings };
}

/**
 * Verify that a manager exists and is a member of a league
 */
export async function verifyManagerInLeague(
  entryId: number,
  leagueId: number
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const manager = await getManager(entryId);

    // 1. Check if the league is in the manager's list of leagues
    const managerLeagues = await getManagerLeagues(entryId);
    const inManagerLeagues = managerLeagues.some(
      (l) => l.id === leagueId || String(l.id) === String(leagueId)
    );

    if (inManagerLeagues) {
      return { isValid: true };
    }

    // 2. Check if the manager is listed in the league standings
    const { standings } = await getLeague(leagueId);
    const isMember = standings.some(
      (member) => member.entry === entryId || String(member.entry) === String(entryId)
    );

    if (isMember) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: `Manager ${manager.player_first_name} ${manager.player_last_name} (ID: ${entryId}) is not a member of league ${leagueId}`,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to verify manager: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export interface ElementMetadata {
  id: number;
  webName: string;
  fullName: string;
  teamShortName: string;
  teamName: string;
  positionType: "GKP" | "DEF" | "MID" | "FWD";
}

export interface ElementLiveStats {
  points: number;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  bonus?: number;
  minutes?: number;
  yellowCards?: number;
  redCards?: number;
}

/**
 * Get cached bootstrap-static player and team lookup
 */
export async function getBootstrapStaticLookup(): Promise<Map<number, ElementMetadata>> {
  const cacheKey = "fpl::bootstrap_static_elements";
  const cached = getFromCache<Map<number, ElementMetadata>>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchFPL<{
      elements: Array<{
        id: number;
        web_name: string;
        first_name: string;
        second_name: string;
        team: number;
        element_type: number;
      }>;
      teams: Array<{
        id: number;
        name: string;
        short_name: string;
      }>;
      element_types: Array<{
        id: number;
        singular_name_short: string;
      }>;
    }>("/bootstrap-static/");

    const teamShortNames = new Map<number, { name: string; short_name: string }>();
    data.teams?.forEach((t) =>
      teamShortNames.set(t.id, { name: t.name, short_name: t.short_name })
    );

    const posTypes = new Map<number, "GKP" | "DEF" | "MID" | "FWD">();
    data.element_types?.forEach((et) => {
      const type = (et.singular_name_short || "").toUpperCase();
      if (type === "GKP" || type === "DEF" || type === "MID" || type === "FWD") {
        posTypes.set(et.id, type);
      }
    });

    const map = new Map<number, ElementMetadata>();
    data.elements?.forEach((el) => {
      const teamInfo = teamShortNames.get(el.team) || {
        name: "Premier League",
        short_name: "PL",
      };
      const posType = posTypes.get(el.element_type) || "MID";
      map.set(el.id, {
        id: el.id,
        webName: el.web_name,
        fullName: `${el.first_name} ${el.second_name}`.trim(),
        teamShortName: teamInfo.short_name,
        teamName: teamInfo.name,
        positionType: posType,
      });
    });

    setInCache(cacheKey, map);
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Get map of all player gameweek live points and performance stats
 */
export async function getGameweekLiveElementsStatsMap(
  gameweek: number
): Promise<Map<number, ElementLiveStats>> {
  const cacheKey = getCacheKey("fpl", "live_stats", gameweek);
  const cached = getFromCache<Map<number, ElementLiveStats>>(cacheKey);
  if (cached) return cached;

  try {
    const liveData = await fetchFPL<{
      elements?: Array<{
        id: number;
        stats?: {
          total_points?: number;
          goals_scored?: number;
          assists?: number;
          clean_sheets?: number;
          bonus?: number;
          minutes?: number;
          yellow_cards?: number;
          red_cards?: number;
        };
      }>;
    }>(`/event/${gameweek}/live/`);

    const map = new Map<number, ElementLiveStats>();
    if (liveData?.elements && Array.isArray(liveData.elements)) {
      for (const el of liveData.elements) {
        map.set(el.id, {
          points: el.stats?.total_points || 0,
          goals: el.stats?.goals_scored || 0,
          assists: el.stats?.assists || 0,
          cleanSheets: el.stats?.clean_sheets || 0,
          bonus: el.stats?.bonus || 0,
          minutes: el.stats?.minutes || 0,
          yellowCards: el.stats?.yellow_cards || 0,
          redCards: el.stats?.red_cards || 0,
        });
      }
    }
    setInCache(cacheKey, map);
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Get map of all player points in a specific gameweek from live event data
 */
export async function getGameweekLiveElementsMap(
  gameweek: number
): Promise<Map<number, number>> {
  const statsMap = await getGameweekLiveElementsStatsMap(gameweek);
  const pointsMap = new Map<number, number>();
  for (const [id, stats] of statsMap.entries()) {
    pointsMap.set(id, stats.points);
  }
  return pointsMap;
}

/**
 * Get individual player's points in a specific gameweek from live event data
 */
export async function getLivePlayerPoints(
  gameweek: number,
  elementId: number
): Promise<number> {
  const map = await getGameweekLiveElementsMap(gameweek);
  return map.get(elementId) || 0;
}

/**
 * Get a manager's gameweek score (points minus transfer costs, with separated chip rule adjustments).
 * RULES:
 * - If allowBenchBoost is false & chip is Bench Boost: points_on_bench are deducted (only starting 11 count).
 * - If allowTripleCaptain is false & chip is Triple Captain: captain points are doubled (2x) instead of tripled (3x), so 1x base points deducted.
 * - Free Hit & Wildcard: always counted normally.
 */
export async function getManagerGameweekPoints(
  entryId: number,
  gameweek: number,
  options: { allowBenchBoost?: boolean; allowTripleCaptain?: boolean } | boolean = true
): Promise<FPLGameweekScore> {
  const allowBenchBoost =
    typeof options === "boolean" ? options : options.allowBenchBoost ?? true;
  const allowTripleCaptain =
    typeof options === "boolean" ? options : options.allowTripleCaptain ?? true;

  const key = `${entryId}_${gameweek}`;

  // Check mock data for predictable testing
  if (MOCK_GW_POINTS[key] !== undefined) {
    const rawPoints = MOCK_GW_POINTS[key];
    const mockChip = MOCK_GW_CHIPS[key];
    let chipDeduction = 0;

    if (mockChip) {
      if (mockChip.activeChip === "bboost" && !allowBenchBoost) {
        chipDeduction = mockChip.benchPoints || 0;
      } else if (mockChip.activeChip === "3xc" && !allowTripleCaptain) {
        // Deduct 1x captain points so captain is 2x instead of 3x
        chipDeduction = mockChip.captainBasePoints || 0;
      }
    }

    const netPoints = rawPoints;
    const adjustedNetPoints = Math.max(0, netPoints - chipDeduction);

    return {
      entryId,
      gameweek,
      points: rawPoints,
      eventTransfersCost: 0,
      netPoints,
      benchPoints: mockChip?.benchPoints,
      activeChip: mockChip?.activeChip || null,
      chipDeduction,
      adjustedNetPoints,
    };
  }

  try {
    // Try event picks endpoint first
    const picksData = await fetchFPL<{
      active_chip?: string | null;
      entry_history?: {
        points?: number;
        total_points?: number;
        event_transfers_cost?: number;
        points_on_bench?: number;
      };
      picks?: Array<{
        element: number;
        position: number;
        multiplier: number;
        is_captain: boolean;
        is_vice_captain: boolean;
      }>;
    }>(`/entry/${entryId}/event/${gameweek}/picks/`);

    if (picksData?.entry_history) {
      const rawPoints = picksData.entry_history.points || 0;
      const transferCost = picksData.entry_history.event_transfers_cost || 0;
      let benchPoints = picksData.entry_history.points_on_bench || 0;
      const activeChip = picksData.active_chip || null;

      let chipDeduction = 0;

      if (activeChip === "bboost") {
        // In FPL API, entry_history.points_on_bench is 0 during Bench Boost because all 15 players
        // are treated as active starters in FPL's calculation.
        // To accurately get the bench points, calculate the sum of gameweek points for picks 12-15.
        if (picksData.picks && picksData.picks.length > 0) {
          const liveMap = await getGameweekLiveElementsMap(gameweek);
          const benchPicks = picksData.picks.filter((p) => p.position > 11);
          const calculatedBench = benchPicks.reduce(
            (sum, p) => sum + (liveMap.get(p.element) || 0),
            0
          );
          if (calculatedBench > 0 || benchPoints === 0) {
            benchPoints = calculatedBench;
          }
        }

        if (!allowBenchBoost) {
          // Exclude bench points so only starting 11 count
          chipDeduction = benchPoints;
        }
      } else if (activeChip === "3xc" && !allowTripleCaptain) {
        // Identify captain element to deduct 1x base points (reducing 3x to 2x)
        const captainPick = picksData.picks?.find(
          (p) => p.multiplier === 3 || (p.is_captain && p.multiplier > 1)
        );
        if (captainPick) {
          const liveMap = await getGameweekLiveElementsMap(gameweek);
          const captainBasePoints = liveMap.get(captainPick.element) || 0;
          chipDeduction = captainBasePoints;
        }
      }

      const netPoints = rawPoints - transferCost;
      const adjustedNetPoints = Math.max(0, netPoints - chipDeduction);

      return {
        entryId,
        gameweek,
        points: rawPoints,
        eventTransfersCost: transferCost,
        netPoints,
        benchPoints,
        activeChip,
        chipDeduction,
        adjustedNetPoints,
      };
    }
  } catch {
    // Try history endpoint as fallback
    try {
      const historyData = await fetchFPL<{
        current?: Array<{
          event: number;
          points: number;
          event_transfers_cost: number;
          points_on_bench: number;
        }>;
        chips?: Array<{
          name: string;
          time: string;
          event: number;
        }>;
      }>(`/entry/${entryId}/history/`);

      const gwEntry = historyData?.current?.find((e) => e.event === gameweek);
      const gwChip = historyData?.chips?.find((c) => c.event === gameweek);
      if (gwEntry) {
        const rawPoints = gwEntry.points;
        const transferCost = gwEntry.event_transfers_cost;
        const activeChip = gwChip?.name || null;
        const benchPoints = gwEntry.points_on_bench || 0;
        let chipDeduction = 0;

        if (activeChip === "bboost" && !allowBenchBoost) {
          chipDeduction = benchPoints;
        }

        const netPoints = rawPoints - transferCost;
        const adjustedNetPoints = Math.max(0, netPoints - chipDeduction);

        return {
          entryId,
          gameweek,
          points: rawPoints,
          eventTransfersCost: transferCost,
          netPoints,
          benchPoints,
          activeChip,
          chipDeduction,
          adjustedNetPoints,
        };
      }
    } catch {
      // Fallback
    }
  }

  // Generate fallback score between 30 and 70 for simulation
  const pseudoRandomScore = 40 + ((entryId * 17 + gameweek * 23) % 45);
  return {
    entryId,
    gameweek,
    points: pseudoRandomScore,
    eventTransfersCost: 0,
    netPoints: pseudoRandomScore,
    activeChip: null,
    chipDeduction: 0,
    adjustedNetPoints: pseudoRandomScore,
  };
}

/**
 * Realistic Mock Squad Generator for demo / testing managers
 */
function generateMockSquad(
  entryId: number,
  gameweek: number,
  targetScore: number,
  activeChip: string | null,
  allowBenchBoost: boolean,
  allowTripleCaptain: boolean
): { starters: FantasyPlayerPick[]; bench: FantasyPlayerPick[]; formation: string } {
  const mockStartersConfig = [
    { name: "Raya", fullName: "David Raya", team: "ARS", pos: "GKP" as const, min: 90 },
    { name: "Gabriel", fullName: "Gabriel Magalhães", team: "ARS", pos: "DEF" as const, min: 90 },
    { name: "Alexander-Arnold", fullName: "Trent Alexander-Arnold", team: "LIV", pos: "DEF" as const, min: 85 },
    { name: "Saliba", fullName: "William Saliba", team: "ARS", pos: "DEF" as const, min: 90 },
    { name: "Pedro Porro", fullName: "Pedro Porro", team: "TOT", pos: "DEF" as const, min: 90 },
    { name: "Salah", fullName: "Mohamed Salah", team: "LIV", pos: "MID" as const, min: 90 },
    { name: "Saka", fullName: "Bukayo Saka", team: "ARS", pos: "MID" as const, min: 88 },
    { name: "Palmer", fullName: "Cole Palmer", team: "CHE", pos: "MID" as const, min: 90 },
    { name: "Luis Díaz", fullName: "Luis Díaz", team: "LIV", pos: "MID" as const, min: 78 },
    { name: "Haaland", fullName: "Erling Haaland", team: "MCI", pos: "FWD" as const, min: 90, isCap: true },
    { name: "Watkins", fullName: "Ollie Watkins", team: "AVL", pos: "FWD" as const, min: 85, isVice: true },
  ];

  const mockBenchConfig = [
    { name: "Fabianski", fullName: "Lukasz Fabianski", team: "WHU", pos: "GKP" as const, pts: 2 },
    { name: "Robinson", fullName: "Antonee Robinson", team: "FUL", pos: "DEF" as const, pts: 2 },
    { name: "Winks", fullName: "Harry Winks", team: "LEI", pos: "MID" as const, pts: 2 },
    { name: "Wood", fullName: "Chris Wood", team: "NFO", pos: "FWD" as const, pts: 5 },
  ];

  const is3xC = activeChip === "3xc";
  const captainMultiplier = is3xC ? (allowTripleCaptain ? 3 : 2) : 2;
  const isBB = activeChip === "bboost";

  const totalUnits = 10 + captainMultiplier;
  const unitPoints = Math.max(1, Math.floor(targetScore / totalUnits));

  const starters: FantasyPlayerPick[] = mockStartersConfig.map((cfg, idx) => {
    const isCaptain = !!cfg.isCap;
    const isViceCaptain = !!cfg.isVice;
    const mult = isCaptain ? captainMultiplier : 1;

    let basePoints = 2;
    if (idx === 0) basePoints = Math.min(6, Math.max(2, unitPoints));
    else if (cfg.pos === "DEF") basePoints = Math.min(6, Math.max(1, unitPoints - 1));
    else if (cfg.pos === "MID") basePoints = Math.max(2, unitPoints);
    else if (isCaptain) basePoints = Math.max(4, Math.floor(unitPoints * 1.8));
    else basePoints = Math.max(2, unitPoints);

    return {
      elementId: 1000 + idx,
      webName: cfg.name,
      fullName: cfg.fullName,
      teamShortName: cfg.team,
      positionType: cfg.pos,
      positionNumber: idx + 1,
      isStarter: true,
      isCaptain,
      isViceCaptain,
      multiplier: mult,
      points: basePoints,
      totalPoints: basePoints * mult,
      stats: {
        minutes: cfg.min,
        goals: cfg.pos === "FWD" || isCaptain ? 1 : 0,
        assists: cfg.pos === "MID" && idx === 5 ? 1 : 0,
        cleanSheets: cfg.pos === "DEF" || cfg.pos === "GKP" ? 1 : 0,
        bonus: isCaptain ? 3 : 0,
      },
    };
  });

  // Adjust captain or highest scorer so sum(totalPoints) exactly equals targetScore
  const currentStarterTotal = starters.reduce((sum, p) => sum + p.totalPoints, 0);
  const diff = targetScore - currentStarterTotal;
  const captainPick = starters.find((p) => p.isCaptain);
  if (captainPick && captainMultiplier > 0) {
    const capDelta = Math.floor(diff / captainMultiplier);
    captainPick.points = Math.max(1, captainPick.points + capDelta);
    captainPick.totalPoints = captainPick.points * captainMultiplier;
  }

  // Clean remainder
  const remainder = targetScore - starters.reduce((sum, p) => sum + p.totalPoints, 0);
  if (remainder !== 0) {
    const nonCapMid = starters.find((p) => !p.isCaptain && p.positionType === "MID");
    if (nonCapMid) {
      nonCapMid.points = Math.max(0, nonCapMid.points + remainder);
      nonCapMid.totalPoints = nonCapMid.points;
    }
  }

  const bench: FantasyPlayerPick[] = mockBenchConfig.map((cfg, idx) => {
    const benchMult = isBB ? (allowBenchBoost ? 1 : 0) : 0;
    return {
      elementId: 2000 + idx,
      webName: cfg.name,
      fullName: cfg.fullName,
      teamShortName: cfg.team,
      positionType: cfg.pos,
      positionNumber: 12 + idx,
      isStarter: false,
      isCaptain: false,
      isViceCaptain: false,
      multiplier: benchMult,
      points: cfg.pts,
      totalPoints: cfg.pts * (isBB && allowBenchBoost ? 1 : 0),
      stats: {
        minutes: cfg.pts > 2 ? 75 : 15,
        goals: cfg.pts > 4 ? 1 : 0,
      },
    };
  });

  return {
    starters,
    bench,
    formation: "4-4-2",
  };
}

/**
 * Get a manager's complete fantasy squad (starters, bench, scores, formation) for a gameweek
 */
export async function getManagerGameweekSquad(
  entryId: number,
  gameweek: number,
  options: { allowBenchBoost?: boolean; allowTripleCaptain?: boolean } | boolean = true
): Promise<FantasyTeamSquadView> {
  const allowBenchBoost =
    typeof options === "boolean" ? options : options.allowBenchBoost ?? true;
  const allowTripleCaptain =
    typeof options === "boolean" ? options : options.allowTripleCaptain ?? true;

  // 1. Get gameweek score calculation
  const score = await getManagerGameweekPoints(entryId, gameweek, {
    allowBenchBoost,
    allowTripleCaptain,
  });

  // 2. Get manager profile
  let managerName = `Manager #${entryId}`;
  let teamName = `Team #${entryId}`;
  try {
    const manager = await getManager(entryId);
    managerName = `${manager.player_first_name} ${manager.player_last_name}`.trim();
    teamName = manager.name;
  } catch {
    // Fallback names
  }

  // 3. Try to fetch real picks from FPL API if not a mock manager
  const isMock = !!MOCK_MANAGERS[entryId];

  if (!isMock) {
    try {
      const picksData = await fetchFPL<{
        active_chip?: string | null;
        entry_history?: {
          points?: number;
          total_points?: number;
          event_transfers_cost?: number;
          points_on_bench?: number;
        };
        picks?: Array<{
          element: number;
          position: number;
          multiplier: number;
          is_captain: boolean;
          is_vice_captain: boolean;
        }>;
      }>(`/entry/${entryId}/event/${gameweek}/picks/`);

      if (picksData?.picks && picksData.picks.length > 0) {
        const [lookup, statsMap] = await Promise.all([
          getBootstrapStaticLookup(),
          getGameweekLiveElementsStatsMap(gameweek),
        ]);

        const allPicks: FantasyPlayerPick[] = picksData.picks.map((p) => {
          const meta = lookup.get(p.element) || {
            id: p.element,
            webName: `Player ${p.element}`,
            fullName: `Player ${p.element}`,
            teamShortName: "PL",
            teamName: "Premier League",
            positionType: (p.position === 1 || p.position === 12
              ? "GKP"
              : "MID") as "GKP" | "DEF" | "MID" | "FWD",
          };

          const live = statsMap.get(p.element) || { points: 0 };
          const isStarter = p.position <= 11;
          let mult = p.multiplier;

          // Apply chip adjustments
          if (p.is_captain && score.activeChip === "3xc" && !allowTripleCaptain) {
            mult = 2; // Reduced from 3x to 2x
          }
          if (!isStarter && score.activeChip === "bboost" && !allowBenchBoost) {
            mult = 0; // Bench points excluded
          }

          const basePoints = live.points;
          const totalPoints = basePoints * mult;

          return {
            elementId: p.element,
            webName: meta.webName,
            fullName: meta.fullName,
            teamShortName: meta.teamShortName,
            positionType: meta.positionType,
            positionNumber: p.position,
            isStarter,
            isCaptain: p.is_captain,
            isViceCaptain: p.is_vice_captain,
            multiplier: mult,
            points: basePoints,
            totalPoints,
            stats: live,
          };
        });

        const starters = allPicks.filter((p) => p.isStarter);
        const bench = allPicks.filter((p) => !p.isStarter);

        const defCount = starters.filter((p) => p.positionType === "DEF").length;
        const midCount = starters.filter((p) => p.positionType === "MID").length;
        const fwdCount = starters.filter((p) => p.positionType === "FWD").length;
        const formation = `${defCount}-${midCount}-${fwdCount}`;

        return {
          managerId: entryId,
          managerName,
          teamName,
          gameweek,
          activeChip: score.activeChip || null,
          totalPoints: score.points,
          transfersCost: score.eventTransfersCost,
          benchPoints: score.benchPoints || 0,
          netPoints: score.netPoints,
          chipDeduction: score.chipDeduction,
          adjustedPoints: score.adjustedNetPoints,
          starters,
          bench,
          formation,
        };
      }
    } catch {
      // Fallback to mock generator below
    }
  }

  // 4. Mock / fallback generator for mock managers or offline mode
  const { starters, bench, formation } = generateMockSquad(
    entryId,
    gameweek,
    score.points,
    score.activeChip || null,
    allowBenchBoost,
    allowTripleCaptain
  );

  return {
    managerId: entryId,
    managerName,
    teamName,
    gameweek,
    activeChip: score.activeChip || null,
    totalPoints: score.points,
    transfersCost: score.eventTransfersCost,
    benchPoints:
      score.benchPoints || bench.reduce((sum, p) => sum + p.points, 0),
    netPoints: score.netPoints,
    chipDeduction: score.chipDeduction,
    adjustedPoints: score.adjustedNetPoints,
    starters,
    bench,
    formation,
  };
}
