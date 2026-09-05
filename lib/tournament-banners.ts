export interface TournamentBanner {
  id: string;
  name: string;
  category: "Stadium" | "Matchday" | "Graphic";
  path: string;
  description: string;
}

export const TOURNAMENT_BANNERS: TournamentBanner[] = [
  {
    id: "champions-arena",
    name: "Champions Arena",
    category: "Stadium",
    path: "/images/banners/champions-arena.svg",
    description: "Deep imperial purple stadium with vibrant emerald pitch glow and beams",
  },
  {
    id: "premier-stadium",
    name: "Premier Stadium",
    category: "Stadium",
    path: "/images/banners/premier-stadium.svg",
    description: "High-intensity stadium lights with electric cyan and mint floodlight clusters",
  },
  {
    id: "emerald-pitch",
    name: "Emerald Pitch",
    category: "Matchday",
    path: "/images/banners/emerald-pitch.svg",
    description: "Pristine mowed turf with crisp penalty markings and dynamic field glow",
  },
  {
    id: "wembley-floodlights",
    name: "Wembley Floodlights",
    category: "Stadium",
    path: "/images/banners/wembley-floodlights.svg",
    description: "Iconic arch silhouette under dramatic midnight-to-violet floodlights",
  },
  {
    id: "trophy-glory",
    name: "Trophy Glory",
    category: "Graphic",
    path: "/images/banners/trophy-glory.svg",
    description: "Golden championship cup with sunburst rays and celebratory confetti",
  },
  {
    id: "neon-fantasy",
    name: "Neon Fantasy",
    category: "Graphic",
    path: "/images/banners/neon-fantasy.svg",
    description: "Futuristic FPL geometric speed stripes with fluorescent cyan and green accents",
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
