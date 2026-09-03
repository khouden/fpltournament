"use client";

import type { GroupStanding } from "@/lib/scoring";
import { Crown } from "lucide-react";
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
      <Card className="border-white/10 bg-white/5 p-8 text-center text-gray-400 backdrop-blur">
        No league standings available yet.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden border-white/10 bg-black/40 shadow-xl backdrop-blur">
        <Table>
          <TableHeader className="border-b border-white/10 bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-12 py-3.5 pl-4 pr-2 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400">
                #
              </TableHead>
              <TableHead className="min-w-[180px] py-3.5 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Team / League
              </TableHead>
              <TableHead
                className="py-3.5 px-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400"
                title="Matches Played"
              >
                MP
              </TableHead>
              <TableHead
                className="py-3.5 px-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400"
                title="Won (+3 pts)"
              >
                W
              </TableHead>
              <TableHead
                className="py-3.5 px-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400"
                title="Drawn (+1 pt)"
              >
                D
              </TableHead>
              <TableHead
                className="py-3.5 px-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400"
                title="Lost (0 pts)"
              >
                L
              </TableHead>
              <TableHead
                className="py-3.5 px-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400"
                title="FPL Points For"
              >
                PF
              </TableHead>
              <TableHead
                className="py-3.5 px-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400"
                title="FPL Points Against"
              >
                PA
              </TableHead>
              <TableHead
                className="py-3.5 px-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400"
                title="Points Difference"
              >
                +/-
              </TableHead>
              <TableHead
                className="py-3.5 px-4 text-center text-[11px] font-extrabold uppercase tracking-wider text-indigo-300"
                title="Total League Points (3 for Win, 1 for Draw)"
              >
                PTS
              </TableHead>
              <TableHead className="hidden md:table-cell py-3.5 pr-4 pl-2 text-center text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Form
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-white/5">
            {standings.map((team) => {
              const isLeader = team.rank === 1 && team.played > 0;
              const isPositiveDiff = team.pointsDiff > 0;
              const isNegativeDiff = team.pointsDiff < 0;

              return (
                <TableRow
                  key={team.groupId}
                  className={`border-white/5 transition hover:bg-white/5 ${
                    isLeader ? "bg-amber-500/5 font-medium" : ""
                  }`}
                >
                  {/* Rank */}
                  <TableCell className="py-3.5 pl-4 pr-2 text-center font-mono text-xs">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        team.rank === 1
                          ? "bg-amber-400 text-slate-950 shadow-sm"
                          : team.rank === 2
                            ? "bg-slate-300 text-slate-950"
                            : team.rank === 3
                              ? "bg-amber-700 text-white"
                              : "text-gray-400"
                      }`}
                    >
                      {team.rank}
                    </span>
                  </TableCell>

                  {/* Team Name & Logo */}
                  <TableCell className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      {team.logo ? (
                        <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 p-0.5 border border-white/10 shadow-xs">
                          <img
                            src={team.logo}
                            alt={team.groupName}
                            className="h-5 w-5 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-[11px] font-bold text-indigo-300 border border-white/10">
                          {team.groupName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white tracking-wide">
                          {team.groupName}
                        </span>
                        {isLeader && (
                          <Badge
                            variant="warning"
                            className="gap-1 text-[10px] font-extrabold"
                          >
                            <Crown className="h-3 w-3" />
                            <span>LEADER</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Played */}
                  <TableCell className="py-3.5 px-2.5 text-center font-mono font-medium text-gray-300">
                    {team.played}
                  </TableCell>

                  {/* Won */}
                  <TableCell className="py-3.5 px-2.5 text-center font-mono text-emerald-400 font-semibold">
                    {team.won}
                  </TableCell>

                  {/* Drawn */}
                  <TableCell className="py-3.5 px-2.5 text-center font-mono text-gray-400">
                    {team.drawn}
                  </TableCell>

                  {/* Lost */}
                  <TableCell className="py-3.5 px-2.5 text-center font-mono text-rose-400">
                    {team.lost}
                  </TableCell>

                  {/* Points For */}
                  <TableCell className="py-3.5 px-2.5 text-center font-mono text-xs text-gray-300">
                    {team.pointsFor}
                  </TableCell>

                  {/* Points Against */}
                  <TableCell className="py-3.5 px-2.5 text-center font-mono text-xs text-gray-400">
                    {team.pointsAgainst}
                  </TableCell>

                  {/* Diff */}
                  <TableCell
                    className={`py-3.5 px-2.5 text-center font-mono text-xs font-semibold ${
                      isPositiveDiff
                        ? "text-emerald-400"
                        : isNegativeDiff
                          ? "text-rose-400"
                          : "text-gray-400"
                    }`}
                  >
                    {team.pointsDiff > 0 ? `+${team.pointsDiff}` : team.pointsDiff}
                  </TableCell>

                  {/* League Points */}
                  <TableCell className="py-3.5 px-4 text-center font-mono text-base font-black text-indigo-300">
                    {team.leaguePoints}
                  </TableCell>

                  {/* Form */}
                  <TableCell className="hidden md:table-cell py-3.5 pr-4 pl-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {team.form.length === 0 ? (
                        <span className="text-xs text-gray-600">-</span>
                      ) : (
                        team.form.slice(-5).map((f, i) => (
                          <span
                            key={i}
                            className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-black ${
                              f === "W"
                                ? "bg-emerald-500 text-white"
                                : f === "D"
                                  ? "bg-gray-500 text-white"
                                  : "bg-rose-500 text-white"
                            }`}
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
      </Card>

      {/* Rules footer note */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 px-2">
        <div className="flex items-center gap-3">
          <span>
            <strong className="text-emerald-400">Win:</strong> +3 PTS
          </span>
          <span>
            <strong className="text-gray-300">Draw:</strong> +1 PT
          </span>
          <span>
            <strong className="text-rose-400">Loss:</strong> 0 PTS
          </span>
        </div>
        <div className="text-gray-500">
          Tiebreakers: Points &gt; Points Diff (+/-) &gt; Points For (PF)
        </div>
      </div>
    </div>
  );
}
