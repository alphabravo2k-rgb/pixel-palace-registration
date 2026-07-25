import React from 'react';

export default function EconomyUtilityAnalytics({ teamA = 'DONSTU', teamB = 'Basement Bobs' }) {
  const economyMetrics = [
    { label: 'FULL BUY WIN %', valA: '80.0%', valB: '66.7%' },
    { label: 'FORCE BUY WIN %', valA: '50.0%', valB: '33.3%' },
    { label: 'ECO BUY WIN %', valA: '20.0%', valB: '14.3%' },
    { label: 'AVG EQUIPMENT VALUE', valA: '$23,450', valB: '$21,800' },
    { label: 'MONEY SAVED PER ROUND', valA: '$4,200', valB: '$3,100' },
    { label: 'AWP PURCHASES', valA: '14 AWPs', valB: '11 AWPs' },
    { label: 'LOST BONUS TIER', valA: '$2,900 Max', valB: '$2,400 Max' },
    { label: 'REBUY EFFICIENCY', valA: '88.5%', valB: '79.2%' },
  ];

  const utilityMetrics = [
    { label: 'FLASH SUCCESS RATE', valA: '68.5%', valB: '54.2%' },
    { label: 'AVG BLIND DURATION', valA: '2.4s / Flash', valB: '1.8s / Flash' },
    { label: 'HE GRENADE DAMAGE', valA: '480 Total HP', valB: '390 Total HP' },
    { label: 'MOLOTOV AREA DENIAL', valA: '610 Total HP', valB: '520 Total HP' },
    { label: 'UTILITY COST / ROUND', valA: '$1,450', valB: '$1,320' },
    { label: 'ENEMIES FLASHED / MAP', valA: '18.4 Enemies', valB: '14.1 Enemies' },
  ];

  return (
    <div className="space-y-6 font-mono">
      {/* Economy Center */}
      <div className="bg-[#0a0d16]/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-850">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span>💰</span> ECONOMY ANALYTICS & REBUY EFFICIENCY
            </h3>
            <p className="text-[10px] text-slate-550 mt-1">Financial management, buy-type conversions & saved rifles</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-black">
            <span className="text-sky-400">{teamA}</span>
            <span className="text-slate-600">VS</span>
            <span className="text-amber-400">{teamB}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {economyMetrics.map((m) => (
            <div key={m.label} className="bg-slate-950/60 border border-slate-900 rounded-xl p-4">
              <span className="text-[9px] text-slate-500 font-bold uppercase block mb-2">{m.label}</span>
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-sky-400">{m.valA}</span>
                <span className="text-amber-400">{m.valB}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Utility Center */}
      <div className="bg-[#0a0d16]/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-850">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span>💣</span> UTILITY IMPACT & TACTICAL DEPLOYMENT
            </h3>
            <p className="text-[10px] text-slate-550 mt-1">Flash duration, HE damage & Molotov area denial</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {utilityMetrics.map((u) => (
            <div key={u.label} className="bg-slate-950/60 border border-slate-900 rounded-xl p-4">
              <span className="text-[9px] text-slate-500 font-bold uppercase block mb-2">{u.label}</span>
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-sky-400">{u.valA}</span>
                <span className="text-amber-400">{u.valB}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
