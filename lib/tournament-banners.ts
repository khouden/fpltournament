export interface TournamentBanner {
  id: string;
  name: string;
  category: "Stadium" | "Matchday" | "Graphic";
  path: string;
  description: string;
}

export const TOURNAMENT_BANNERS: TournamentBanner[] = [
  {
    id: "cyber-arena",
    name: "Champions Cyber Arena",
    category: "Stadium",
    path: "/images/tournaments banners/Gemini_Generated_Image_7wspvd7wspvd7wsp.jpg",
    description: "Futuristic purple stadium with neon green and electric cyan glowing pitch boundary lines",
  },
  {
    id: "floodlight-colosseum",
    name: "Floodlight Colosseum",
    category: "Stadium",
    path: "/images/tournaments banners/Gemini_Generated_Image_u8k167u8k167u8k1.jpg",
    description: "Epic midnight colosseum under stadium floodlights with dramatic cyan and mint laser beams",
  },
  {
    id: "neon-striker",
    name: "Neon Striker Velocity",
    category: "Graphic",
    path: "/images/tournaments banners/Gemini_Generated_Image_83ieaz83ieaz83ie.jpg",
    description: "Dynamic 3D geometric purple shards with a speeding neon football and high-velocity electric green trails",
  },
  {
    id: "cosmic-orbit",
    name: "Cosmic Orbit Arena",
    category: "Matchday",
    path: "/images/tournaments banners/Gemini_Generated_Image_kux2txkux2txkux2.jpg",
    description: "Celestial matchday in deep purple cosmos with luminous emerald and cyan orbital light rings",
  },
  {
    id: "trophy-glory",
    name: "Championship Trophy Glory",
    category: "Graphic",
    path: "/images/tournaments banners/Gemini_Generated_Image_upnohbupnohbupno.jpg",
    description: "Iconic championship trophy silhouetted in radiant emerald starlight, particle mist, and neon sweeps",
  },
];

export function getTournamentBanners(): TournamentBanner[] {
  return TOURNAMENT_BANNERS;
}

export function getBannerById(id: string): TournamentBanner | undefined {
  return TOURNAMENT_BANNERS.find((b) => b.id === id);
}

export function getDefaultBanner(): TournamentBanner {
  return TOURNAMENT_BANNERS[0];
}

/**
 * Returns the tournament's banner if present, or a deterministic default banner from presets based on tournament ID.
 */
export function getTournamentBannerOrDefault(
  banner?: string | null,
  tournamentId?: string
): string {
  if (banner && banner.trim().length > 0) {
    return banner;
  }
  if (!tournamentId) {
    return TOURNAMENT_BANNERS[0].path;
  }
  let hash = 0;
  for (let i = 0; i < tournamentId.length; i++) {
    hash = (hash << 5) - hash + tournamentId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TOURNAMENT_BANNERS.length;
  return TOURNAMENT_BANNERS[index].path;
}
