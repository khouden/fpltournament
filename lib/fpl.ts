/**
 * FPL (Fantasy Premier League) API Service
 * Handles all interactions with the official FPL API
 */

const FPL_API_BASE = "https://fantasy.premierleague.com/api";
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Simple in-memory cache
const cache = new Map<string, CacheEntry<any>>();

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

async function fetchFPL<T>(endpoint: string): Promise<T> {
  const cacheKey = getCacheKey("fpl", endpoint);

  // Try cache first
  const cached = getFromCache<T>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = `${FPL_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "fpltournament/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`FPL API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as T;
    setInCache(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch from FPL API: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export interface FPLManager {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  player_first_name: string;
  player_last_name: string;
  favourite_team: number;
}

export interface FPLLeague {
  id: number;
  name: string;
  created: string;
  closed: boolean;
  rank: number;
  max_entries: number;
  league_type: string;
}

export interface FPLLeagueEntry {
  id: number;
  entry_name: string;
  player_name: string;
  entry: number;
  total: number;
  rank: number;
}

/**
 * Get manager details by entry ID
 */
export async function getManager(entryId: number): Promise<FPLManager> {
  return fetchFPL<FPLManager>(`/entry/${entryId}/`);
}

/**
 * Get all leagues for a manager
 */
export async function getManagerLeagues(entryId: number): Promise<FPLLeague[]> {
  const response = await fetchFPL<{ leagues: FPLLeague[] }>(
    `/entry/${entryId}/leagues/`
  );
  return response.leagues;
}

/**
 * Get league details and standings
 */
export async function getLeague(
  leagueId: number
): Promise<{ league: FPLLeague; standings: FPLLeagueEntry[] }> {
  const response = await fetchFPL<{
    league: FPLLeague;
    standings: { results: FPLLeagueEntry[] };
  }>(`/leagues-classic/${leagueId}/standings/`);

  return {
    league: response.league,
    standings: response.standings.results,
  };
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
    const leagues = await getManagerLeagues(entryId);

    const isMember = leagues.some((league) => league.id === leagueId);

    if (!isMember) {
      return {
        isValid: false,
        error: `Manager ${manager.player_first_name} ${manager.player_last_name} is not a member of this league`,
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to verify manager: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
