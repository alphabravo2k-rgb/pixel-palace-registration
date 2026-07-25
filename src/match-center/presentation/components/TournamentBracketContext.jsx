import React from 'react';

export default function TournamentBracketContext() {
  const bracketStages = [
    { name: 'Round of 16', status: 'COMPLETED' },
    { name: 'Quarter Final', status: 'COMPLETED' },
    { name: 'Semi Final', status: 'COMPLETED' },
    { name: 'GRAND FINAL', status: 'ACTIVE', current: true },
  ];

  return (
    <div className="bg-[#0a0d16]/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md font-mono space-y-6">
      {/* Tournament Metadata Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-850">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest mb-1">
            <span>🏆</span> PIXEL PALACE COMMUNITY CUP 2
          </div>
          <h2 className="text-base font-black text-white">GRAND FINAL — BEST OF 3</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">31 July 2026 · London LAN Arena</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="bg-slate-950/60 border border-slate-900 px-4 py-2 rounded-xl">
            <span className="text-[9px] text-slate-550 block mb-0.5 uppercase">PRIZE POOL STAKES</span>
            <span className="text-white font-black text-xs">£2,000 GBP + Trophy</span>
          </div>
          <div className="bg-indigo-950/30 border border-indigo-900/40 px-4 py-2 rounded-xl">
            <span className="text-[9px] text-indigo-400 block mb-0.5 uppercase">WINNER ADVANCEMENT</span>
            <span className="text-white font-black text-xs">Qualified for Season Finals</span>
          </div>
        </div>
      </div>

      {/* Bracket Progress Bar */}
      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
          TOURNAMENT BRACKET PROGRESSION
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {bracketStages.map((stg) => (
            <div
              key={stg.name}
              className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs ${
                stg.current
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold'
                  : 'bg-slate-950/30 border-slate-900 text-slate-500'
              }`}
            >
              <span>{stg.name}</span>
              {stg.current ? (
                <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                  ACTIVE
                </span>
              ) : (
                <span className="text-[9px] text-emerald-400 font-bold">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
