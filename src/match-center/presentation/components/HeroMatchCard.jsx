/**
 * Hero Match Card Component
 * Esports Production Series Header (HLTV + FACEIT Series Standard)
 * Displays complete BO3/BO5 Series Results and Map Breakdown
 */
import React from 'react';

const STATUS_VARIANTS = {
  LIVE: { label: 'LIVE TELEMETRY', color: 'bg-red-500/20 text-red-400 border-red-500/40', isPulse: true },
  CHECK_IN: { label: 'WAITING FOR CHECK-IN', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', isPulse: false },
  READY: { label: 'READY', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', isPulse: false },
  PAUSED: { label: 'PAUSED', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', isPulse: true },
  COMPLETED: { label: 'SERIES CONCLUDED', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', isPulse: false },
  SCHEDULED: { label: 'SCHEDULED', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40', isPulse: false },
};

export function HeroMatchCard({ viewModel, selectedMapIndex = 'SERIES', onSelectMap }) {
  if (!viewModel) return null;

  const {
    eventTitle = 'Pixel Palace Community Cup 2',
    roundStage = 'Quarter Final',
    formatText = 'BEST OF 3',
    status = 'COMPLETED',
    isCompleted = true,
    seriesWinner,
    teamA,
    teamB,
    maps = [],
    seriesSummary,
  } = viewModel;

  const variant = STATUS_VARIANTS[status] || STATUS_VARIANTS.COMPLETED;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950 p-6 md:p-8 shadow-2xl backdrop-blur-md">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-transparent to-cyan-600/10 pointer-events-none" />

      {/* Header Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-6 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-red-500 font-bold uppercase tracking-wider">{roundStage}</span>
          <span>•</span>
          <span className="text-slate-200">{eventTitle}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-slate-800/80 text-slate-300 font-semibold text-[11px] border border-slate-700">
            {formatText}
          </span>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${variant.color}`}>
            {variant.isPulse && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
              </span>
            )}
            {variant.label}
          </span>
        </div>
      </div>

      {/* Series Winner Banner (if Completed) */}
      {isCompleted && seriesWinner && (
        <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 text-center font-mono flex items-center justify-center gap-2">
          <span className="text-amber-400 font-extrabold text-sm">🏆 SERIES WINNER:</span>
          <span className="text-white font-black text-base tracking-wide uppercase">{seriesWinner}</span>
          <span className="text-amber-400/80 text-xs font-bold">({teamA.seriesScore} - {teamB.seriesScore})</span>
        </div>
      )}

      {/* Teams vs Series Score */}
      <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-6 py-2">
        {/* Team A */}
        <div className="md:col-span-3 flex items-center justify-start md:justify-end gap-4 text-left md:text-right">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{teamA.name}</h2>
            <div className="flex items-center justify-start md:justify-end gap-2 mt-1 text-xs text-slate-400 font-mono">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{teamA.tag}</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">{teamA.elo} ELO</span>
            </div>
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-lg">
            {teamA.logo ? (
              <img src={teamA.logo} alt={teamA.name} className="w-full h-full object-contain p-2 rounded-2xl" />
            ) : (
              <span>{teamA.tag?.[0] || 'A'}</span>
            )}
          </div>
        </div>

        {/* Series Score Middle */}
        <div className="md:col-span-1 flex flex-col items-center justify-center my-2 md:my-0">
          <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest mb-1">SERIES SCORE</div>
          <div className="flex items-center gap-4 text-4xl md:text-5xl font-black font-mono tracking-wider">
            <span className={teamA.seriesScore > teamB.seriesScore ? 'text-amber-400' : 'text-white'}>
              {teamA.seriesScore}
            </span>
            <span className="text-slate-650 text-2xl">-</span>
            <span className={teamB.seriesScore > teamA.seriesScore ? 'text-amber-400' : 'text-white'}>
              {teamB.seriesScore}
            </span>
          </div>
          {seriesSummary?.seriesMvp && (
            <div className="mt-2 text-[10px] font-mono text-slate-400">
              MVP: <span className="text-amber-400 font-bold">{seriesSummary.seriesMvp}</span>
            </div>
          )}
        </div>

        {/* Team B */}
        <div className="md:col-span-3 flex items-center justify-end md:justify-start gap-4 text-right md:text-left">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-lg order-last md:order-first">
            {teamB.logo ? (
              <img src={teamB.logo} alt={teamB.name} className="w-full h-full object-contain p-2 rounded-2xl" />
            ) : (
              <span>{teamB.tag?.[0] || 'B'}</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{teamB.name}</h2>
            <div className="flex items-center justify-end md:justify-start gap-2 mt-1 text-xs text-slate-400 font-mono">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{teamB.tag}</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">{teamB.elo} ELO</span>
            </div>
          </div>
        </div>
      </div>

      {/* Series Map Results Breakdown Grid */}
      <div className="mt-6 pt-6 border-t border-slate-800/80">
        <div className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider mb-3">SERIES MAP RESULTS Breakdown</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          {maps.map((m) => {
            const isWinnerA = m.scoreA > m.scoreB;
            const winnerName = isWinnerA ? teamA.name : teamB.name;
            const isSelected = selectedMapIndex === m.mapIndex;

            return (
              <div
                key={m.mapIndex}
                onClick={() => onSelectMap && onSelectMap(m.mapIndex)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/80 border-indigo-500 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-1.5 text-[11px]">
                  <span className="font-bold text-slate-300">Map {m.mapIndex}: {m.mapName}</span>
                  <span className="text-emerald-400 font-bold">✔ {winnerName}</span>
                </div>
                <div className="flex items-center justify-between text-base font-black">
                  <span className={isWinnerA ? 'text-amber-400' : 'text-slate-300'}>{teamA.tag} {m.scoreA}</span>
                  <span className="text-slate-600 text-xs">-</span>
                  <span className={!isWinnerA ? 'text-amber-400' : 'text-slate-300'}>{m.scoreB} {teamB.tag}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
