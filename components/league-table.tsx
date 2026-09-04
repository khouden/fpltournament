"use client";

import type { GroupStanding } from "@/lib/scoring";
import { Crown, Trophy } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LeagueTableProps {
  standings: GroupStanding[];
}

export function LeagueTable({ standings }: LeagueTableProps) {
  if (standings.length === 0) {
    return (
      <Card className="rounded-[16px] border border-[#E5E5E5] bg-white p-8 text-center text-[#777777] shadow-fpl-sm">
        <Trophy className="mx-auto h-8 w-8 text-[#BDBDBD] mb-2" />
        <p className="font-semibold text-sm">No league standings available yet.</p>
        <p className="text-xs text-[#999999] mt-1">Standings will update automatically after matches are played.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden rounded-[16px] border border-[#E5E5E5] bg-white shadow-fpl-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px] sm:min-w-[820px] w-full border-collapse">
            <TableHeader className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
              <TableRow className="border-[#E5E5E5] hover:bg-transparent">
                <TableHead className="w-12 py-3.5 pl-4 pr-2 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                  #
                </TableHead>
                <TableHead className="min-w-[200px] py-3.5 px-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                  TEAM / LEAGUE
                </TableHead>
                <TableHead
                  className="py-3.5 px-2.5 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777777]"
                  title="Matches Played"
                >
                  MP
                </TableHead>
                <TableHead
                  className="py-3.5 px-2.5 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777777]"
                  title="Won (+3 pts)"
                >
                  W
                </TableHead>
                <TableHead
                  className="py-3.5 px-2.5 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777777]"
                  title="Drawn (+1 pt)"
                >
                  D
                </TableHead>
                <TableHead
                  className="py-3.5 px-2.5 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777777]"
                  title="Lost (0 pts)"
                >
                  L
                </TableHead>
                <TableHead
                  className="py-3.5 px-2.5 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777777]"
                  title="FPL Points For"
                >
                  PF
                </TableHead>
                <TableHead
                  className="py-3.5 px-2.5 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777777]"
                  title="FPL Points Against"
                >
                  PA
                </TableHead>
                <TableHead
                  className="py-3.5 px-2.5 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777777]"
                  title="Points Difference"
                >
                  +/-
                </TableHead>
                <TableHead
                  className="py-3.5 px-4 text-center text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#37003C]"
                  title="Total League Points (3 for Win, 1 for Draw)"
                >
                  PTS
                </TableHead>
                <TableHead className="hidden md:table-cell py-3.5 pr-4 pl-2 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                  FORM
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[#E5E5E5]/70">
              {standings.map((team) => {
                const isLeader = team.rank === 1 && team.played > 0;
                const isPositiveDiff = team.pointsDiff > 0;
                const isNegativeDiff = team.pointsDiff < 0;

                return (
                  <TableRow
                    key={team.groupId}
                    className={`border-[#E5E5E5]/70 transition-colors h-[64px] sm:h-[68px] ${
                      isLeader
                        ? "bg-[#FAF7FB] hover:bg-[#F5EDF7]"
                        : "hover:bg-[#F9F9F9]"
                    }`}
                  >
                    {/* Rank */}
                    <TableCell className="py-3 pl-4 pr-2 text-center">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black select-none ${
                          team.rank === 1
                            ? "bg-[#FFD700] text-[#37003C] shadow-xs"
                            : team.rank === 2
                              ? "bg-[#E2E8F0] text-[#37003C] shadow-xs"
                              : team.rank === 3
                                ? "bg-[#D97706] text-white shadow-xs"
                                : "bg-[#F0F0F0] text-[#777777] font-bold"
                        }`}
                      >
                        {team.rank}
                      </span>
                    </TableCell>

                    {/* Team Name & Logo */}
                    <TableCell className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {team.logo ? (
                          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white p-1 border border-[#E5E5E5] shadow-xs">
                            <img
                              src={team.logo}
                              alt={team.groupName}
                              className="h-6 w-6 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#37003C] text-[11px] font-black text-[#00FF87] border border-[#5A0A63] shadow-xs">
                            {team.groupName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-[#37003C] text-sm sm:text-base tracking-tight truncate hover:text-[#5A0A63] transition-colors">
                            {team.groupName}
                          </span>
                          {isLeader && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-[#37003C]/10 text-[#37003C] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                              title="Current Tournament Leader"
                            >
                              <Crown className="h-3 w-3 text-[#E9007F]" />
                              <span>LEADER</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Played */}
                    <TableCell className="py-3 px-2.5 text-center font-semibold text-sm text-[#444444]">
                      {team.played}
                    </TableCell>

                    {/* Won */}
                    <TableCell className="py-3 px-2.5 text-center font-bold text-sm text-[#008744]">
                      {team.won}
                    </TableCell>

                    {/* Drawn */}
                    <TableCell className="py-3 px-2.5 text-center font-semibold text-sm text-[#777777]">
                      {team.drawn}
                    </TableCell>

                    {/* Lost */}
                    <TableCell className="py-3 px-2.5 text-center font-semibold text-sm text-[#D32F2F]">
                      {team.lost}
                    </TableCell>

                    {/* Points For */}
                    <TableCell className="py-3 px-2.5 text-center text-sm font-medium text-[#555555]">
                      {team.pointsFor}
                    </TableCell>

                    {/* Points Against */}
                    <TableCell className="py-3 px-2.5 text-center text-sm font-medium text-[#777777]">
                      {team.pointsAgainst}
                    </TableCell>

                    {/* Diff */}
                    <TableCell
                      className={`py-3 px-2.5 text-center font-bold text-sm ${
                        isPositiveDiff
                          ? "text-[#008744]"
                          : isNegativeDiff
                            ? "text-[#D32F2F]"
                            : "text-[#777777]"
                      }`}
                    >
                      {team.pointsDiff > 0 ? `+${team.pointsDiff}` : team.pointsDiff}
                    </TableCell>

                    {/* League Points */}
                    <TableCell className="py-3 px-4 text-center">
                      <span className="text-xl font-extrabold text-[#37003C] tracking-tight">
                        {team.leaguePoints}
                      </span>
                    </TableCell>

                    {/* Form */}
                    <TableCell className="hidden md:table-cell py-3 pr-4 pl-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {team.form.length === 0 ? (
                          <span className="text-xs text-[#BDBDBD] font-semibold">—</span>
                        ) : (
                          team.form.slice(-5).map((f, i) => (
                            <span
                              key={i}
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-[11px] font-black shadow-xs select-none ${
                                f === "W"
                                  ? "bg-[#00FF87] text-[#37003C]"
                                  : f === "D"
                                    ? "bg-[#FFC107] text-[#37003C]"
                                    : "bg-[#FF4D4D] text-white"
                              }`}
                              title={f === "W" ? "Win" : f === "D" ? "Draw" : "Loss"}
                            >
                              {f}
                            </span>
                          ))
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Rules footer note */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[#777777] px-2 py-1 gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-[#008744]" />
            <strong className="text-[#37003C]">Win:</strong> +3 PTS
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-[#FFC107]" />
            <strong className="text-[#37003C]">Draw:</strong> +1 PT
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-[#D32F2F]" />
            <strong className="text-[#37003C]">Loss:</strong> 0 PTS
          </span>
        </div>
        <div className="text-[11px] text-[#888888] font-medium">
          Tiebreakers: Points &gt; Points Diff (+/-) &gt; Points For (PF)
        </div>
      </div>
    </div>
  );
}
