import React from 'react';

export default function MapVetoFlow({ teamA = 'DONSTU', teamB = 'Basement Bobs' }) {
  const vetoSteps = [
    { step: 1, action: 'BAN', team: teamA, map: 'de_inferno', displayName: 'Inferno' },
    { step: 2, action: 'BAN', team: teamB, map: 'de_nuke', displayName: 'Nuke' },
    { step: 3, action: 'PICK', team: teamA, map: 'de_ancient', displayName: 'Ancient', score: '13 – 10 (DONSTU)' },
    { step: 4, action: 'PICK', team: teamB, map: 'de_mirage', displayName: 'Mirage', score: '10 – 13 (Basement Bobs)' },
    { step: 5, action: 'BAN', team: teamA, map: 'de_anubis', displayName: 'Anubis' },
    { step: 6, action: 'BAN', team: teamB, map: 'de_vertigo', displayName: 'Vertigo' },
    { step: 7, action: 'DECIDER', team: 'System', map: 'de_dust2', displayName: 'Dust2', score: '13 – 8 (DONSTU)' },
  ];

  return (
    <div className="bg-[#0a0d16]/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-3 border-b border-slate-850">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span>🗺️</span> MAP VETO TIMELINE & SELECTION FLOW
          </h3>
          <p className="text-[10px] text-slate-550 mt-1">CS2 Map Pick & Ban Sequence</p>
        </div>
        <span className="text-[10px] text-amber-400 font-bold bg-amber-950/30 border border-amber-900/40 px-2.5 py-1 rounded">
          DECIDER: DUST2
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {vetoSteps.map((v) => {
          const isBan = v.action === 'BAN';
          const isPick = v.action === 'PICK';
          const isDecider = v.action === 'DECIDER';

          return (
            <div
              key={v.step}
              className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition hover:scale-102 ${
                isDecider
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                  : isPick
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                  : 'bg-slate-950/40 border-slate-850 text-slate-500 opacity-70'
              }`}
            >
              <div className="flex justify-between items-center text-[9px] font-bold">
                <span>STEP {v.step}</span>
                <span
                  className={`px-1.5 py-0.5 rounded uppercase ${
                    isBan
                      ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                      : isPick
                      ? 'bg-indigo-600 text-white'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {v.action}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-wider mb-0.5">{v.displayName}</h4>
                <p className="text-[9px] text-slate-400">{v.team}</p>
              </div>

              {v.score && (
                <div className="pt-2 border-t border-slate-850 text-[9px] font-bold text-indigo-400">
                  {v.score}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
