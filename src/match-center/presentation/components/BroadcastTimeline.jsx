import React from 'react';

export default function BroadcastTimeline({ timelineEvents = [] }) {
  const defaultEvents = [
    { time: '20:10', label: 'Match Warmup & Knife Round Completed', map: 'Ancient', type: 'system' },
    { time: '20:18', label: 'Map 1 (Ancient) Concluded: DONSTU 13 – 10 Basement Bobs', map: 'Ancient', type: 'map_end' },
    { time: '20:24', label: 'ACE! phorate (DONSTU) 5K in Round 14 on Mirage', map: 'Mirage', type: 'ace' },
    { time: '20:42', label: 'Map 2 (Mirage) Concluded: Basement Bobs 13 – 10 DONSTU', map: 'Mirage', type: 'map_end' },
    { time: '20:55', label: '1v3 CLUTCH! kyonaji (DONSTU) in Round 11 on Dust2', map: 'Dust2', type: 'clutch' },
    { time: '21:08', label: 'Map 3 (Dust2) Concluded: DONSTU 13 – 8 Basement Bobs', map: 'Dust2', type: 'map_end' },
    { time: '21:12', label: '🏆 SERIES WINNER CONFIRMED: DONSTU (2 – 1)', map: 'Series', type: 'winner' },
  ];

  const events = timelineEvents.length > 0 ? timelineEvents : defaultEvents;

  return (
    <div className="bg-[#0a0d16]/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md font-mono">
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-850">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span>⏱️</span> MATCH BROADCAST TIMELINE & MILESTONES
        </h3>
        <span className="text-[10px] text-slate-500 font-bold">7 EVENTS RECORDED</span>
      </div>

      <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
        {events.map((evt, idx) => {
          const isWinner = evt.type === 'winner';
          const isMapEnd = evt.type === 'map_end';
          const isAce = evt.type === 'ace';
          const isClutch = evt.type === 'clutch';

          return (
            <div key={idx} className="relative group">
              {/* Timeline Dot */}
              <div
                className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  isWinner
                    ? 'bg-amber-400 border-amber-300 ring-4 ring-amber-500/20'
                    : isMapEnd
                    ? 'bg-indigo-500 border-indigo-400'
                    : isAce || isClutch
                    ? 'bg-rose-500 border-rose-400'
                    : 'bg-slate-700 border-slate-600'
                }`}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 hover:border-slate-800 transition">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {evt.time}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isWinner
                        ? 'text-amber-400 font-black'
                        : isMapEnd
                        ? 'text-white'
                        : isAce || isClutch
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {evt.label}
                  </span>
                </div>
                <span className="text-[9px] text-slate-550 uppercase tracking-widest font-bold self-start sm:self-auto">
                  {evt.map}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
