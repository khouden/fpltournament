/**
 * FPL Global Design System Tokens
 * Centralized design tokens for Premier League / Fantasy Sports visual language.
 */

export const FPL_COLORS = {
  // Brand Colors
  primaryPurple: "#37003C",
  darkPurple: "#240027",
  secondaryPurple: "#5A0A63",
  accentMagenta: "#E9007F",

  // Fantasy Colors
  fantasyLime: "#E7FF00",
  fantasyGreen: "#00FF87",
  fantasyCyan: "#00D9FF",
  fantasyBlue: "#1689E8",

  // Neutral Colors
  background: "#F7F7F7",
  surface: "#FFFFFF",
  text: "#1F1F1F",
  secondaryText: "#555555",
  mutedText: "#777777",
  border: "#E5E5E5",
  lightBorder: "#EEEEEE",
  disabled: "#BDBDBD",

  // Semantic Colors
  success: "#00FF87",
  warning: "#E7FF00",
  error: "#E9007F",
  info: "#00D9FF",
} as const;

export const FPL_GRADIENTS = {
  fantasyPrimary: "linear-gradient(135deg, #00D9FF 0%, #00FF87 50%, #E7FF00 100%)",
  fantasyBlue: "linear-gradient(135deg, #00D9FF 0%, #6C4DFF 100%)",
  purple: "linear-gradient(135deg, #37003C 0%, #5A0A63 100%)",
  brightFantasy: "linear-gradient(135deg, #E7FF00 0%, #00FF87 100%)",
  darkPurple: "linear-gradient(180deg, #37003C 0%, #240027 100%)",
  magentaPurple: "linear-gradient(135deg, #E9007F 0%, #5A0A63 100%)",
} as const;

export const FPL_SHADOWS = {
  sm: "0 2px 8px rgba(0, 0, 0, 0.06)",
  md: "0 8px 24px rgba(55, 0, 60, 0.10)",
  lg: "0 16px 40px rgba(55, 0, 60, 0.12)",
  card: "0 4px 16px rgba(0, 0, 0, 0.05)",
  glowGreen: "0 0 20px rgba(0, 255, 135, 0.35)",
  glowLime: "0 0 20px rgba(231, 255, 0, 0.35)",
  glowMagenta: "0 0 20px rgba(233, 0, 127, 0.35)",
  glowCyan: "0 0 20px rgba(0, 217, 255, 0.35)",
} as const;

export const FPL_RADIUS = {
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "18px",
  pill: "999px",
} as const;

export const FPL_SPACING = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
  30: "120px",
} as const;

export const FPL_CONTAINER = {
  desktop: "1280px",
  largeDesktop: "1400px",
} as const;
