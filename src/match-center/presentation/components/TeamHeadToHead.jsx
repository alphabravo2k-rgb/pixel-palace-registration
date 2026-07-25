import React from 'react';

export default function TeamHeadToHead({ teamA = 'DONSTU', teamB = 'Basement Bobs' }) {
  const metrics = [
    { label: 'AVERAGE DAMAGE PER ROUND (ADR)', valA: 114.2, valB: 108.6, unit: '', format: v => v.toFixed(1) },
    { label: 'OPENING DUEL SUCCESS RATE', valA: 56.4, valB: 43.6, unit: '%', format: v => `${v.toFixed(1)}%` },
    { label: 'CT-SIDE ROUND WIN CONVERSION', valA: 64.2, valB: 52.1, unit: '%', format: v => `${v.toFixed(1)}%` },
    { label: 'T-SIDE ROUND WIN CONVERSION', valA: 54.5, valB: 48.0, unit: '%', format: v => `${v.toFixed(1)}%` },
    { label: '5v4 MAN-ADVANTAGE CONVERSION', valA: 82.5, valB: 74.0, unit: '%', format: v => `${v.toFixed(1)}%` },
    { label: '4v5 RECOVERY SUCCESS RATE', valA: 31.8, valB: 22.5, unit: '%', format: v => `${v.toFixed(1)}%` },
    { label: 'UTILITY DAMAGE PER ROUND', valA: 94.5, valB: 88.0, unit: ' HP', format: v => `${v.toFixed(0)} HP` },
    { label: 'TRADE KILL CONVERSION %', valA: 74.2, valB: 68.5, unit: '%', format: v => `${v.toFixed(1)}%` },
  ];

  return (
    <div className="bg-[#0a0d16]/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md font-mono">
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-850">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span>📊</span> TEAM HEAD-TO-HEAD TACTICAL COMPARISON
          </h3>
          <p className="text-[10px] text-slate-550 mt-1">Direct performance metrics across all 3 maps</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-black">
          <span className="text-sky-400">{teamA}</span>
          <span className="text-slate-600">VS</span>
          <span className="text-amber-400">{teamB}</span>
        </div>
      </div>

      <div className="space-y-5">
        {metrics.map((m) => {
          const total = (m.valA + m.valB) || 1;
          const pctA = Math.round((m.valA / total) * 100);
          const pctB = 100 - pctA;
          const isWinnerA = m.valA >= m.valB;

          return (
            <div key={m.label} className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className={`${isWinnerA ? 'text-sky-400 font-extrabold' : 'text-slate-400'}`}>
                  {m.format(m.valA)}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider">{m.label}</span>
                <span className={`${!isWinnerA ? 'text-amber-400 font-extrabold' : 'text-slate-400'}`}>
                  {m.format(m.valB)}
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden bg-slate-950 flex border border-slate-900">
                <div className="bg-sky-500 h-full transition-all duration-500" style={{ width: `${pctA}%` }} />
                <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${pctB}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
