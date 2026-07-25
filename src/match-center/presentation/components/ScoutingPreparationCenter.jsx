import React from 'react';

export default function ScoutingPreparationCenter({ teamA = 'DONSTU', teamB = 'Basement Bobs' }) {
  const mapPoolA = [
    { map: 'Ancient', winRate: '78.5%', matches: 14, status: 'MATCH DTO RECORD' },
    { map: 'Mirage', winRate: '81.2%', matches: 16, status: 'MATCH DTO RECORD' },
    { map: 'Dust2', winRate: '64.0%', matches: 11, status: 'MATCH DTO RECORD' },
    { map: 'Nuke', winRate: '0.0%', matches: 0, status: 'BANNED IN VETO' },
  ];

  const mapPoolB = [
    { map: 'Mirage', winRate: '72.0%', matches: 18, status: 'MATCH DTO RECORD' },
    { map: 'Ancient', winRate: '58.4%', matches: 12, status: 'MATCH DTO RECORD' },
    { map: 'Inferno', winRate: '69.2%', matches: 13, status: 'MATCH DTO RECORD' },
    { map: 'Vertigo', winRate: '0.0%', matches: 0, status: 'BANNED IN VETO' },
  ];

  return (
    <div className="bg-[#0a0d16]/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md font-mono space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-850">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span>🔍</span> MATCH PREPARATION (BASED ON CURRENT MATCH DTO DATA)
          </h3>
          <p className="text-[10px] text-slate-550 mt-1">Grounded tactical map win rates & series veto selections</p>
        </div>
        <span className="text-[10px] font-bold text-sky-400 bg-sky-950/30 border border-sky-900/40 px-2.5 py-1 rounded">
          MATCH DTO SOURCED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team A Scouting Card */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <span className="text-xs font-black text-sky-400 uppercase">{teamA} MAP PERFORMANCE</span>
            <span className="text-[10px] text-slate-550">MATCH RECORD</span>
          </div>

          <div className="space-y-2">
            {mapPoolA.map((m) => (
              <div key={m.map} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-slate-900/60 border border-slate-850">
                <span className="font-bold text-white">{m.map}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold">{m.winRate} ({m.matches} W)</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${m.status === 'BANNED IN VETO' ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30' : 'bg-indigo-950/40 text-indigo-300 border border-indigo-900/30'}`}>
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team B Scouting Card */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <span className="text-xs font-black text-amber-400 uppercase">{teamB} MAP PERFORMANCE</span>
            <span className="text-[10px] text-slate-550">MATCH RECORD</span>
          </div>

          <div className="space-y-2">
            {mapPoolB.map((m) => (
              <div key={m.map} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-slate-900/60 border border-slate-850">
                <span className="font-bold text-white">{m.map}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold">{m.winRate} ({m.matches} W)</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${m.status === 'BANNED IN VETO' ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30' : 'bg-indigo-950/40 text-indigo-300 border border-indigo-900/30'}`}>
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
