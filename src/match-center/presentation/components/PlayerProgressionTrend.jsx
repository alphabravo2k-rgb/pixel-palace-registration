import React from 'react';

export default function PlayerProgressionTrend({ players = [] }) {
  const defaultPlayers = [
    { name: 'phorate', team: 'DONSTU', m1: { kills: 22, rating: 1.43 }, m2: { kills: 11, rating: 0.98 }, m3: { kills: 19, rating: 1.51 } },
    { name: 'kyonaji', team: 'DONSTU', m1: { kills: 20, rating: 1.34 }, m2: { kills: 14, rating: 1.05 }, m3: { kills: 17, rating: 1.38 } },
    { name: 'Uzman', team: 'Basement Bobs', m1: { kills: 14, rating: 0.92 }, m2: { kills: 21, rating: 1.48 }, m3: { kills: 12, rating: 0.88 } },
    { name: 'device', team: 'Basement Bobs', m1: { kills: 16, rating: 1.05 }, m2: { kills: 19, rating: 1.35 }, m3: { kills: 10, rating: 0.82 } },
  ];

  const list = players.length > 0 ? players : defaultPlayers;

  return (
    <div className="bg-[#0a0d16]/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md font-mono">
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-850">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span>📈</span> PLAYER PERFORMANCE PROGRESSION ACROSS MAPS
          </h3>
          <p className="text-[10px] text-slate-550 mt-1">Per-map kill counts & Rating 2.0 trajectory</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((p) => {
          const isUp = p.m3.rating >= p.m2.rating;

          return (
            <div key={p.name} className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">{p.name}</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase">{p.team}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                  <span className="text-[8px] text-slate-500 block mb-0.5">M1 ANCIENT</span>
                  <span className="font-bold text-slate-200">{p.m1.kills} K</span>
                  <span className="text-[9px] block text-emerald-400 font-mono">({p.m1.rating})</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                  <span className="text-[8px] text-slate-500 block mb-0.5">M2 MIRAGE</span>
                  <span className="font-bold text-slate-200">{p.m2.kills} K</span>
                  <span className="text-[9px] block text-amber-400 font-mono">({p.m2.rating})</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                  <span className="text-[8px] text-slate-500 block mb-0.5">M3 DUST2</span>
                  <span className="font-bold text-slate-200">{p.m3.kills} K</span>
                  <span className={`text-[9px] block font-mono font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ({p.m3.rating}) {isUp ? '↑' : '↓'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
