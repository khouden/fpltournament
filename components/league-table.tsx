"use client";

import type { GroupStanding } from "@/lib/scoring";

interface LeagueTableProps {
  standings: GroupStanding[];
}

export function LeagueTable({ standings }: LeagueTableProps) {
  if (standings.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-gray-400 backdrop-blur">
        No league standings available yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 shadow-xl backdrop-blur">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-2 text-center w-12">
                #
              </th>
              <th scope="col" className="py-3.5 px-3 min-w-[180px]">
                Team / League
              </th>
              <th scope="col" className="py-3.5 px-2.5 text-center" title="Matches Played">
                MP
              </th>
              <th scope="col" className="py-3.5 px-2.5 text-center" title="Won (+3 pts)">
                W
              </th>
              <th scope="col" className="py-3.5 px-2.5 text-center" title="Drawn (+1 pt)">
                D
              </th>
              <th scope="col" className="py-3.5 px-2.5 text-center" title="Lost (0 pts)">
                L
              </th>
              <th scope="col" className="py-3.5 px-2.5 text-center" title="FPL Points For">
                PF
              </th>
              <th scope="col" className="py-3.5 px-2.5 text-center" title="FPL Points Against">
                PA
              </th>
              <th scope="col" className="py-3.5 px-2.5 text-center" title="Points Difference">
                +/-
              </th>
              <th
                scope="col"
                className="py-3.5 px-4 text-center font-extrabold text-indigo-300"
                title="Total League Points (3 for Win, 1 for Draw)"
              >
                PTS
              </th>
              <th scope="col" className="py-3.5 pr-4 pl-2 text-center hidden md:table-cell">
                Form
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {standings.map((team, idx) => {
              const isLeader = team.rank === 1 && team.played > 0;
              const isPositiveDiff = team.pointsDiff > 0;
              const isNegativeDiff = team.pointsDiff < 0;

              return (
                <tr
                  key={team.groupId}
                  className={`transition hover:bg-white/5 ${
                    isLeader ? "bg-amber-500/5 font-medium" : ""
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3.5 pl-4 pr-2 text-center font-mono text-xs">
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
                  </td>

                  {/* Team Name */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white tracking-wide">
                        {team.groupName}
                      </span>
                      {isLeader && (
                        <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-400/30">
                          LEADER
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Played */}
                  <td className="py-3.5 px-2.5 text-center font-mono font-medium text-gray-300">
                    {team.played}
                  </td>

                  {/* Won */}
                  <td className="py-3.5 px-2.5 text-center font-mono text-emerald-400 font-semibold">
                    {team.won}
                  </td>

                  {/* Drawn */}
                  <td className="py-3.5 px-2.5 text-center font-mono text-gray-400">
                    {team.drawn}
                  </td>

                  {/* Lost */}
                  <td className="py-3.5 px-2.5 text-center font-mono text-rose-400">
                    {team.lost}
                  </td>

                  {/* Points For */}
                  <td className="py-3.5 px-2.5 text-center font-mono text-xs text-gray-300">
                    {team.pointsFor}
                  </td>

                  {/* Points Against */}
                  <td className="py-3.5 px-2.5 text-center font-mono text-xs text-gray-400">
                    {team.pointsAgainst}
                  </td>

                  {/* Diff */}
                  <td
                    className={`py-3.5 px-2.5 text-center font-mono text-xs font-semibold ${
                      isPositiveDiff
                        ? "text-emerald-400"
                        : isNegativeDiff
                          ? "text-rose-400"
                          : "text-gray-400"
                    }`}
                  >
                    {team.pointsDiff > 0 ? `+${team.pointsDiff}` : team.pointsDiff}
                  </td>

                  {/* League Points */}
                  <td className="py-3.5 px-4 text-center font-mono text-base font-black text-indigo-300">
                    {team.leaguePoints}
                  </td>

                  {/* Form */}
                  <td className="py-3.5 pr-4 pl-2 text-center hidden md:table-cell">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
