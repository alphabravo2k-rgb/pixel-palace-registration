import React from 'react';

export default function MatchFactsPanel({ teamA = 'DONSTU', teamB = 'Basement Bobs' }) {
  const facts = [
    { label: 'SERIES DURATION', value: '2h 31m', icon: '⏱️' },
    { label: 'MAPS PLAYED', value: '3 Maps (BO3)', icon: '🗺️' },
    { label: 'TOTAL ROUNDS', value: '67 Rounds', icon: '⚔️' },
    { label: 'LONGEST MAP', value: 'Mirage (46m · 23 R)', icon: '⏳' },
    { label: 'FASTEST MAP', value: 'Dust2 (38m · 21 R)', icon: '⚡' },
    { label: 'LONGEST ROUND', value: '2m 04s (Round 18 on Mirage)', icon: '🕒' },
    { label: 'MOST KILLS', value: 'kyonaji (51 Kills)', icon: '🎯' },
    { label: 'HIGHEST ADR', value: 'phorate (114.2 ADR)', icon: '💥' },
    { label: 'MOST CLUTCHES', value: 'Uzman (3 Clutches)', icon: '🧠' },
    { label: 'MOST ENTRIES', value: 'phorate (7 Entry Kills)', icon: '🏹' },
    { label: 'MOST UTILITY DMG', value: 'device (285 Utility Dmg)', icon: '💣' },
    { label: 'SERIES MVP', value: 'phorate (1.43 Avg Rating)', icon: '🏆' },
  ];

  return (
    <div className="bg-[#0a0d16]/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md font-mono">
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-850">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span>📌</span> MATCH FACTS & KEY MILESTONES
          </h3>
          <p className="text-[10px] text-slate-550 mt-1">Quick operational recap of the BO3 series</p>
        </div>
        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/30 border border-indigo-900/40 px-2.5 py-1 rounded">
          12 FACTS RECORDED
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {facts.map((f) => (
          <div key={f.label} className="bg-slate-950/50 border border-slate-900 rounded-xl p-3.5 hover:border-slate-800 transition">
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
            <span className="text-xs font-bold text-white block truncate">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
