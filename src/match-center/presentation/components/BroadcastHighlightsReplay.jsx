import React, { useState } from 'react';

export default function BroadcastHighlightsReplay() {
  const [copiedTick, setCopiedTick] = useState(null);

  const keyMoments = [
    { rank: '#1', title: '1v4 CLUTCH BY PHORATE', player: 'phorate', map: 'Dust2', round: 'Round 18', tick: '142850', duration: '28s' },
    { rank: '#2', title: '4K USP-S PISTOL ACE', player: 'device', map: 'Mirage', round: 'Round 1', tick: '12400', duration: '18s' },
    { rank: '#3', title: 'TRIPLE ENTRY A-SITE EXECUTOR', player: 'kyonaji', map: 'Ancient', round: 'Round 14', tick: '98400', duration: '22s' },
    { rank: '#4', title: 'NINJA BOMB DEFUSE IN SMOKE', player: 'Uzman', map: 'Mirage', round: 'Round 21', tick: '185600', duration: '15s' },
    { rank: '#5', title: 'FULL ACE IN MID CONNECTOR', player: 'phorate', map: 'Ancient', round: 'Round 8', tick: '54200', duration: '32s' },
  ];

  const handleCopyTick = (tick) => {
    navigator.clipboard.writeText(`demoui; playdemo match_demo.dem ${tick}`);
    setCopiedTick(tick);
    setTimeout(() => setCopiedTick(null), 2000);
  };

  return (
    <div className="bg-[#0a0d16]/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md font-mono space-y-6">
      <div className="flex justify-between items-center pb-3 border-b border-slate-850">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span>📌</span> KEY MATCH MOMENTS & GOTV TICK MARKERS
          </h3>
          <p className="text-[10px] text-slate-550 mt-1">Grounded GOTV timestamps & match milestones (No video clips required)</p>
        </div>
        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/30 border border-amber-900/40 px-2.5 py-1 rounded">
          5 KEY MOMENT TUCKS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {keyMoments.map((moment) => (
          <div key={moment.rank} className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-3 hover:border-slate-800 transition">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-amber-400 font-extrabold">{moment.rank}</span>
              <span className="text-[9px] text-slate-500 font-mono uppercase">{moment.map} · {moment.round}</span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{moment.title}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Player: <strong className="text-indigo-400">{moment.player}</strong> ({moment.duration})</p>
            </div>

            <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[10px]">
              <span className="text-slate-550 font-mono">TICK #{moment.tick}</span>
              <button
                onClick={() => handleCopyTick(moment.tick)}
                className="bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-slate-800 font-bold px-3 py-1 rounded transition flex items-center gap-1.5"
              >
                <span>📋</span>
                <span>{copiedTick === moment.tick ? 'COPIED DEMO COMMAND' : 'COPY TICK CMD'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
