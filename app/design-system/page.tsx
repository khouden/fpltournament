"use client";

import * as React from "react";
import {
  Trophy,
  Users,
  Shield,
  Zap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Download,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { PageHeader } from "@/components/layout/page-header";
import { ContentGrid, GridMain, GridSidebar } from "@/components/layout/content-grid";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Divider } from "@/components/ui/divider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  CardSkeleton,
  PlayerCardSkeleton,
  TableSkeleton,
  StatSkeleton,
} from "@/components/ui/skeleton";
import { ToastProvider, useToast } from "@/components/ui/toast";

// Football & Fantasy components
import { ClubBadge } from "@/components/football/club-badge";
import { PlayerAvatar } from "@/components/football/player-avatar";
import { PlayerCard } from "@/components/football/player-card";
import { PlayerRow } from "@/components/football/player-row";
import { TeamCard } from "@/components/football/team-card";
import { FixtureCard } from "@/components/football/fixture-card";
import { MatchCard } from "@/components/football/match-card";
import { StatCard } from "@/components/football/stat-card";
import { GameweekBadge } from "@/components/football/gameweek-badge";
import { StatusBadge } from "@/components/football/status-badge";
import {
  FootballTable,
  FootballTableHeader,
  FootballTableRow,
  FootballTableHead,
  FootballTableCell,
} from "@/components/football/football-table";

import { FantasyHero } from "@/components/fantasy/fantasy-hero";
import { FantasyStatCard } from "@/components/fantasy/fantasy-stat-card";
import { PlayerFantasyCard } from "@/components/fantasy/player-fantasy-card";
import { TransferCard } from "@/components/fantasy/transfer-card";
import { GameweekCard } from "@/components/fantasy/gameweek-card";
import { CaptainCard } from "@/components/fantasy/captain-card";

// Stats & Visualization
import { ProgressBar } from "@/components/stats/progress-bar";
import { RankingIndicator } from "@/components/stats/ranking-indicator";
import { FormIndicator } from "@/components/stats/form-indicator";
import { PointsChart } from "@/components/stats/points-chart";
import { ComparisonBar } from "@/components/stats/comparison-bar";
import { MiniSparkline } from "@/components/stats/mini-sparkline";

// Filters
import { FilterButton } from "@/components/football/filters/filter-button";
import { FilterChip } from "@/components/football/filters/filter-chip";
import { PositionFilter, type PositionOption } from "@/components/football/filters/position-filter";
import { ClubFilter } from "@/components/football/filters/club-filter";
import { SortDropdown } from "@/components/football/filters/sort-dropdown";
import { BackgroundNumber } from "@/components/decorative/background-number";

function DesignSystemContent() {
  const { toast } = useToast();

  // Interactive filter states for demo
  const [searchValue, setSearchValue] = React.useState("");
  const [selectedPosition, setSelectedPosition] = React.useState<PositionOption>("ALL");
  const [selectedClub, setSelectedClub] = React.useState<string | null>("Arsenal");
  const [sortBy, setSortBy] = React.useState("points");
  const [switchChecked, setSwitchChecked] = React.useState(true);
  const [checkboxChecked, setCheckboxChecked] = React.useState(true);

  const demoClubs = [
    { name: "Arsenal" },
    { name: "Chelsea" },
    { name: "Liverpool" },
    { name: "Manchester City" },
    { name: "Manchester United" },
    { name: "Tottenham Hotspur" },
    { name: "Newcastle United" },
    { name: "Aston Villa" },
  ];

  const samplePointsData = [
    { gameweek: 22, points: 64 },
    { gameweek: 23, points: 52 },
    { gameweek: 24, points: 88 },
    { gameweek: 25, points: 41 },
    { gameweek: 26, points: 76 },
    { gameweek: 27, points: 94 },
    { gameweek: 28, points: 68 },
  ];

  return (
    <AppShell>
      {/* Page Header */}
      <PageHeader
        variant="purple"
        badge={
          <Badge variant="fantasy" size="sm">
            <Sparkles className="h-3 w-3" /> FPL Design System v2.0
          </Badge>
        }
        title="FPL Design System & UI Foundation"
        description="Comprehensive living styleguide inspired by Premier League / Fantasy sports aesthetics, design tokens, typography, and reusable UI components."
        actions={
          <Button
            variant="fantasy"
            onClick={() =>
              toast({
                title: "Design System Ready",
                description: "All foundation tokens and components are operational.",
                type: "success",
              })
            }
          >
            Trigger Toast Notification
          </Button>
        }
      />

      <Container className="py-12 space-y-16">
        {/* 1. Brand & Fantasy Color Tokens */}
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Color Tokens"
            title="Brand & Fantasy Color Palette"
            description="Deep purple foundation accented with high-energy fantasy neon tones and crisp neutral content surfaces."
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: "Primary Purple", hex: "#37003C", textDark: false },
              { label: "Dark Purple", hex: "#240027", textDark: false },
              { label: "Secondary Purple", hex: "#5A0A63", textDark: false },
              { label: "Accent Magenta", hex: "#E9007F", textDark: false },
              { label: "Fantasy Lime", hex: "#E7FF00", textDark: true },
              { label: "Fantasy Green", hex: "#00FF87", textDark: true },
              { label: "Fantasy Cyan", hex: "#00D9FF", textDark: true },
              { label: "Fantasy Blue", hex: "#1689E8", textDark: false },
            ].map((col) => (
              <div
                key={col.hex}
                className="rounded-[10px] p-4 border border-[#E5E5E5] shadow-xs space-y-2"
                style={{ backgroundColor: col.hex }}
              >
                <div
                  className={`text-xs font-bold leading-tight ${
                    col.textDark ? "text-[#1F1F1F]" : "text-white"
                  }`}
                >
                  {col.label}
                </div>
                <div
                  className={`font-mono text-[11px] font-bold ${
                    col.textDark ? "text-[#1F1F1F]/70" : "text-white/70"
                  }`}
                >
                  {col.hex}
                </div>
              </div>
            ))}
          </div>

          {/* Reusable Gradients */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {[
              { label: "Fantasy Primary", cls: "bg-fpl-gradient-primary", textDark: true },
              { label: "Fantasy Blue", cls: "bg-fpl-gradient-blue", textDark: false },
              { label: "Purple Brand", cls: "bg-fpl-gradient-purple", textDark: false },
              { label: "Bright Fantasy", cls: "bg-fpl-gradient-bright", textDark: true },
            ].map((g) => (
              <div
                key={g.label}
                className={`h-20 rounded-[10px] p-4 flex flex-col justify-end shadow-xs ${g.cls}`}
              >
                <span className={`text-xs font-black uppercase tracking-wider ${g.textDark ? "text-[#1F1F1F]" : "text-white"}`}>
                  {g.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <Divider />

        {/* 2. Typography Scale */}
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Typography"
            title="Geometric Sans-Serif (Poppins)"
            description="Bold, energetic headlines paired with tight line-heights and high-contrast statistical data."
          />

          <Card className="p-6 space-y-6 divide-y divide-[#EEEEEE]">
            <div>
              <span className="text-xs font-mono font-bold text-[#777777]">DISPLAY (64px / 800)</span>
              <div className="text-4xl sm:text-6xl font-black text-[#1F1F1F] tracking-tight leading-none mt-1">
                FANTASY PREMIER LEAGUE
              </div>
            </div>

            <div className="pt-4">
              <span className="text-xs font-mono font-bold text-[#777777]">H1 (44px / 800)</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1F1F1F] tracking-tight mt-1">
                Gameweek Knockout Tournament Standings
              </div>
            </div>

            <div className="pt-4">
              <span className="text-xs font-mono font-bold text-[#777777]">H2 (30px / 700)</span>
              <div className="text-2xl sm:text-3xl font-bold text-[#1F1F1F] tracking-tight mt-1">
                Head-to-Head Squad Breakdown & Scoring
              </div>
            </div>

            <div className="pt-4">
              <span className="text-xs font-mono font-bold text-[#777777]">BODY & LABEL (14px-16px / 400-500)</span>
              <p className="text-sm sm:text-base text-[#555555] leading-relaxed mt-1 max-w-2xl">
                Automatic Gameweek score calculation with strict Admin points exclusion. Managers gain
                real-time transparency into captaincy multipliers, bench boost chips, and live bonus points.
              </p>
            </div>
          </Card>
        </section>

        <Divider />

        {/* 3. Button System */}
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Buttons"
            title="Interactive Button System"
            description="Standardized 40–48px heights, 8px radius, and micro-hover transitions."
          />

          <Card className="p-6 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary (#37003C)</Button>
              <Button variant="fantasy">Fantasy Neon (#00FF87)</Button>
              <Button variant="accent">Accent Magenta (#E9007F)</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button variant="primary" size="sm">Small (32px)</Button>
              <Button variant="primary" size="default">Default (40px)</Button>
              <Button variant="primary" size="lg">Large (48px)</Button>
              <Button variant="primary" isLoading>Loading State</Button>
              <IconButton icon={<Trophy className="h-4 w-4" />} aria-label="Trophy" variant="primary" />
              <IconButton icon={<Zap className="h-4 w-4" />} aria-label="Zap" variant="fantasy" />
            </div>
          </Card>
        </section>

        <Divider />

        {/* 4. Badges & Status Indicators */}
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Pill Indicators"
            title="Badges & Football Status Indicators"
            description="Pill-shaped metadata components for match states, chip statuses, and captaincy."
          />

          <Card className="p-6 flex flex-wrap items-center gap-3">
            <StatusBadge status="live" />
            <StatusBadge status="upcoming" />
            <StatusBadge status="completed" />
            <StatusBadge status="confirmed" />
            <StatusBadge status="updated" />
            <StatusBadge status="locked" />
            <StatusBadge status="captain" />
            <StatusBadge status="vice_captain" />
            <Badge variant="fantasy">FANTASY</Badge>
            <Badge variant="transferIn">+ TRANSFER IN</Badge>
            <Badge variant="transferOut">- TRANSFER OUT</Badge>
            <GameweekBadge gameweek={28} status="active" />
          </Card>
        </section>

        <Divider />

        {/* 5. Football Components: ClubBadge & PlayerCard */}
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Football Elements"
            title="Club Badges & Player Cards"
            description="Resolves club logos from official directory with fallback initials, plus prominent player portrait cards."
          />

          {/* Club badge sizes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#777777]">
              Club Badges (xs, sm, md, lg, xl)
            </h4>
            <div className="flex flex-wrap items-center gap-4">
              <ClubBadge name="Arsenal" size="xs" showName />
              <ClubBadge name="Chelsea" size="sm" showName />
              <ClubBadge name="Liverpool" size="md" showName />
              <ClubBadge name="Manchester City" size="lg" showName />
              <ClubBadge name="Real Madrid" size="xl" showName />
            </div>
          </div>

          {/* Player Cards */}
          <div className="space-y-3 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#777777]">
              Player Cards
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <PlayerCard
                player={{
                  name: "Haaland",
                  fullName: "Erling Haaland",
                  clubName: "Manchester City",
                  position: "FWD",
                  price: 15.2,
                  points: 16,
                  isCaptain: true,
                  multiplier: 2,
                }}
              />
              <PlayerCard
                player={{
                  name: "Salah",
                  fullName: "Mohamed Salah",
                  clubName: "Liverpool",
                  position: "MID",
                  price: 13.1,
                  points: 12,
                  isViceCaptain: true,
                }}
              />
              <PlayerCard
                player={{
                  name: "Saka",
                  fullName: "Bukayo Saka",
                  clubName: "Arsenal",
                  position: "MID",
                  price: 10.0,
                  points: 8,
                }}
              />
              <PlayerCard
                player={{
                  name: "Raya",
                  fullName: "David Raya",
                  clubName: "Arsenal",
                  position: "GKP",
                  price: 5.5,
                  points: 6,
                }}
              />
            </div>
          </div>

          {/* Player Rows */}
          <div className="space-y-3 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#777777]">
              Player Table Rows
            </h4>
            <Card className="overflow-hidden divide-y divide-[#EEEEEE]">
              <PlayerRow
                player={{
                  name: "Haaland",
                  clubName: "Man City",
                  position: "FWD",
                  price: 15.2,
                  points: 16,
                  form: "9.2",
                  isCaptain: true,
                }}
              />
              <PlayerRow
                player={{
                  name: "Palmer",
                  clubName: "Chelsea",
                  position: "MID",
                  price: 11.0,
                  points: 14,
                  form: "8.4",
                }}
              />
              <PlayerRow
                player={{
                  name: "Alexander-Arnold",
                  clubName: "Liverpool",
                  position: "DEF",
                  price: 7.2,
                  points: 9,
                  form: "6.5",
                }}
              />
            </Card>
          </div>
        </section>

        <Divider />

        {/* 6. Fixtures & Matches */}
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Matches & Fixtures"
            title="Fixture & Match Scorecards"
            description="Live, completed, and upcoming tournament fixtures with head-to-head score comparisons."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FixtureCard
              gameweek={28}
              kickoffDate="Saturday, 15:00"
              status="live"
              homeTeam={{ name: "Arsenal", score: 68 }}
              awayTeam={{ name: "Chelsea", score: 54 }}
            />
            <FixtureCard
              gameweek={28}
              kickoffDate="Sunday, 16:30"
              status="upcoming"
              kickoffTime="16:30"
              homeTeam={{ name: "Liverpool" }}
              awayTeam={{ name: "Manchester City" }}
            />
            <MatchCard
              gameweek={27}
              status="completed"
              homeTeam={{ name: "Aston Villa", score: 82, chipActive: "Triple Captain" }}
              awayTeam={{ name: "Tottenham", score: 71 }}
              matchHref="/matches/sample"
            />
          </div>
        </section>

        <Divider />

        {/* 7. Fantasy Domain Components */}
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Fantasy Experience"
            title="Fantasy Hero & Tactical Pitch Cards"
            description="Designed for high-impact promotional sections and squad pitch view lineups."
          />

          {/* Mini Fantasy Hero demonstration */}
          <div className="rounded-[12px] overflow-hidden">
            <FantasyHero
              badge={
                <Badge variant="fantasy" size="sm">
                  Gameweek 28 Active
                </Badge>
              }
              headline="Knockout Championship Final"
              subheadline="Track real-time Gameweek scores, chip adjustments, and automatic points recalculations across all classic leagues."
              backgroundNumber="28"
              actions={
                <>
                  <Button variant="fantasy">View Live Scores</Button>
                  <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
                    Tournament Rules
                  </Button>
                </>
              }
            />
          </div>

          {/* Fantasy Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FantasyStatCard type="points" label="Total Points" value="1,842" secondaryValue="GW28: 74" />
            <FantasyStatCard type="rank" label="Overall Rank" value="14,210" rankDelta={3450} />
            <FantasyStatCard type="budget" label="Team Value" value="£104.2m" secondaryValue="Bank: £1.5m" />
            <FantasyStatCard type="transfers" label="Free Transfers" value="2" secondaryValue="Cost: 0" />
          </div>

          {/* Tactical Pitch Squad Cards demonstration */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#777777]">
              Pitch Player Cards (Starting XI & Bench)
            </h4>
            <div className="rounded-[10px] bg-[#0b381e] p-6 flex flex-wrap items-center justify-center gap-4 relative overflow-hidden">
              <PlayerFantasyCard
                name="Haaland"
                clubShortName="MCI"
                position="FWD"
                points={8}
                multiplier={2}
                isCaptain
              />
              <PlayerFantasyCard
                name="Salah"
                clubShortName="LIV"
                position="MID"
                points={7}
                multiplier={1}
                isViceCaptain
              />
              <PlayerFantasyCard
                name="Saka"
                clubShortName="ARS"
                position="MID"
                points={6}
              />
              <PlayerFantasyCard
                name="Gabriel"
                clubShortName="ARS"
                position="DEF"
                points={6}
              />
              <PlayerFantasyCard
                name="Raya"
                clubShortName="ARS"
                position="GKP"
                points={6}
              />
            </div>
          </div>

          {/* Transfer & Captain Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TransferCard
              gameweek={28}
              playerOut={{ name: "Watkins", clubName: "Aston Villa" }}
              playerIn={{ name: "Haaland", clubName: "Man City" }}
              cost={0}
              transferTime="2 hrs ago"
            />
            <CaptainCard
              captain={{
                name: "Haaland",
                clubName: "Manchester City",
                basePoints: 8,
                multiplier: 2,
              }}
              viceCaptain={{
                name: "Salah",
                clubName: "Liverpool",
                points: 7,
              }}
            />
          </div>
        </section>

        <Divider />

        {/* 8. Table System */}
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Data Presentation"
            title="Football Data Table System"
            description="Compact 48–56px rows, strong header hierarchy, and responsive horizontal overflow."
          />

          <FootballTable>
            <FootballTableHeader>
              <FootballTableRow>
                <FootballTableHead className="w-12 text-center">Pos</FootballTableHead>
                <FootballTableHead>Club</FootballTableHead>
                <FootballTableHead className="text-center">Pl</FootballTableHead>
                <FootballTableHead className="text-center">W</FootballTableHead>
                <FootballTableHead className="text-center">D</FootballTableHead>
                <FootballTableHead className="text-center">L</FootballTableHead>
                <FootballTableHead className="text-center">Form</FootballTableHead>
                <FootballTableHead className="text-right font-black">Pts</FootballTableHead>
              </FootballTableRow>
            </FootballTableHeader>
            <tbody>
              {[
                { pos: 1, club: "Liverpool", p: 28, w: 20, d: 5, l: 3, form: ["W", "W", "W", "D", "W"], pts: 65 },
                { pos: 2, club: "Arsenal", p: 28, w: 19, d: 6, l: 3, form: ["W", "D", "W", "W", "W"], pts: 63 },
                { pos: 3, club: "Manchester City", p: 28, w: 18, d: 6, l: 4, form: ["W", "L", "W", "W", "D"], pts: 60 },
                { pos: 4, club: "Chelsea", p: 28, w: 14, d: 7, l: 7, form: ["D", "W", "L", "W", "W"], pts: 49 },
              ].map((row) => (
                <FootballTableRow key={row.club} highlight={row.pos === 1}>
                  <FootballTableCell className="text-center font-mono font-bold">
                    {row.pos}
                  </FootballTableCell>
                  <FootballTableCell>
                    <ClubBadge name={row.club} size="xs" showName />
                  </FootballTableCell>
                  <FootballTableCell className="text-center font-mono">{row.p}</FootballTableCell>
                  <FootballTableCell className="text-center font-mono text-[#00a859] font-bold">{row.w}</FootballTableCell>
                  <FootballTableCell className="text-center font-mono text-[#555555]">{row.d}</FootballTableCell>
                  <FootballTableCell className="text-center font-mono text-[#E9007F]">{row.l}</FootballTableCell>
                  <FootballTableCell className="text-center">
                    <FormIndicator results={row.form} size="sm" />
                  </FootballTableCell>
                  <FootballTableCell className="text-right font-mono font-black text-base text-[#37003C]">
                    {row.pts}
                  </FootballTableCell>
                </FootballTableRow>
              ))}
            </tbody>
          </FootballTable>
        </section>

        <Divider />

        {/* 9. Data Visualization */}
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Data Visualization"
            title="Football Charts & Indicators"
            description="Fast comprehension statistical components following the brand palette."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PointsChart data={samplePointsData} />

            <Card className="p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#777777]">
                Head-to-Head Comparison
              </h4>
              <ComparisonBar label="Gameweek Points" valueA={84} valueB={68} />
              <ComparisonBar label="Squad Value" valueA={103.5} valueB={99.8} format={(v) => `£${v}m`} />
              <ComparisonBar label="Goals Scored" valueA={7} valueB={4} />
            </Card>

            <Card className="p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#777777]">
                Progress & Trends
              </h4>
              <ProgressBar value={75} label="Tournament Progression" showValue variant="gradient" />
              <ProgressBar value={92} label="Gameweek Fixtures Finalized" showValue variant="fantasy" />
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-[#555555]">Team Form Sparkline:</span>
                <MiniSparkline values={[2, 4, 3, 7, 8, 6, 9]} width={90} height={24} />
              </div>
            </Card>
          </div>
        </section>

        <Divider />

        {/* 10. Filters & Form Controls */}
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Search & Filtering"
            title="Standardized Filter Controls"
            description="SearchInput, PositionFilter, ClubFilter, SortDropdown, and FilterChips."
          />

          <Card className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-full sm:max-w-xs">
                <SearchInput
                  placeholder="Search player or team..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onClear={() => setSearchValue("")}
                  shortcutBadge="/"
                />
              </div>

              <PositionFilter
                value={selectedPosition}
                onChange={(p) => setSelectedPosition(p)}
              />

              <ClubFilter
                clubs={demoClubs}
                selectedClub={selectedClub}
                onSelect={(c) => setSelectedClub(c)}
              />

              <SortDropdown
                options={[
                  { label: "Points", value: "points" },
                  { label: "Price", value: "price" },
                  { label: "Form", value: "form" },
                ]}
                selectedValue={sortBy}
                onSelect={(val) => setSortBy(val)}
              />

              <FilterButton activeCount={selectedClub ? 1 : 0} />
            </div>

            {selectedClub && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-[#777777]">Active Filters:</span>
                <FilterChip
                  label={selectedClub}
                  onRemove={() => setSelectedClub(null)}
                />
              </div>
            )}
          </Card>
        </section>

        <Divider />

        {/* 11. Feedback States */}
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Feedback & States"
            title="Empty States, Error Handling & Skeletons"
            description="Clear explanations, retries, and domain skeleton presets instead of generic spinners."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EmptyState
              preset="fixtures"
              title="No Fixtures Scheduled"
              description="The schedule for this gameweek has not been published yet by the organizers."
              actionLabel="View Calendar"
            />

            <ErrorState
              title="Could not sync FPL picks"
              message="The official Premier League API is temporarily unavailable. Please retry in a few moments."
              onRetry={() => {}}
              errorDetails="Error: HTTP 503 Service Unavailable from https://fantasy.premierleague.com/api"
            />

            <LoadingState message="Recalculating tournament gameweek table..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <CardSkeleton />
            <TableSkeleton rows={3} />
          </div>
        </section>
      </Container>
    </AppShell>
  );
}

export default function DesignSystemPage() {
  return (
    <ToastProvider>
      <DesignSystemContent />
    </ToastProvider>
  );
}
