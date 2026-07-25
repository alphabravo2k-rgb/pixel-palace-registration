import React, { useState } from 'react';

export default function RoundHistoryBar({ mapName = 'Ancient', rounds = [], teamA = 'DONSTU', teamB = 'Basement Bobs' }) {
  const [selectedRound, setSelectedRound] = useState(18);

  // Rich round data dictionary for CS2 deep round center
  const defaultRounds = [
    { round: 1, winner: 'A', side: 'CT', type: 'Pistol', event: 'defuse', opening: 'phorate (USP-S)', equipA: '$4,200', equipB: '$4,000', mvp: 'phorate' },
    { round: 2, winner: 'A', side: 'CT', type: 'Anti-Eco', event: 'elimination', opening: 'kyonaji (MP9)', equipA: '$16,500', equipB: '$7,200', mvp: 'kyonaji' },
    { round: 3, winner: 'A', side: 'CT', type: 'Full Buy', event: 'elimination', opening: 'phorate (M4A1-S)', equipA: '$24,200', equipB: '$21,500', mvp: 'phorate' },
    { round: 4, winner: 'B', side: 'T', type: 'Full Buy', event: 'bomb', opening: 'Uzman (AK-47)', equipA: '$22,000', equipB: '$23,100', mvp: 'Uzman' },
    { round: 5, winner: 'A', side: 'CT', type: 'Force Buy', event: 'defuse', opening: 'NeoLife (Deagle)', equipA: '$12,800', equipB: '$22,500', mvp: 'NeoLife' },
    { round: 6, winner: 'A', side: 'CT', type: 'Full Buy', event: 'elimination', opening: 'kyonaji (M4A1-S)', equipA: '$25,000', equipB: '$14,200', mvp: 'kyonaji' },
    { round: 7, winner: 'B', side: 'T', type: 'Full Buy', event: 'bomb', opening: 'device (AK-47)', equipA: '$21,400', equipB: '$24,000', mvp: 'device' },
    { round: 8, winner: 'B', side: 'T', type: 'Full Buy', event: 'elimination', opening: 'FenomeN (AWP)', equipA: '$19,500', equipB: '$26,200', mvp: 'FenomeN' },
    { round: 9, winner: 'A', side: 'CT', type: 'Full Buy', event: 'defuse', opening: 'phorate (AWP)', equipA: '$24,800', equipB: '$22,000', mvp: 'phorate' },
    { round: 10, winner: 'A', side: 'CT', type: 'Full Buy', event: 'elimination', opening: 'kyonaji (M4A1-S)', equipA: '$26,000', equipB: '$18,500', mvp: 'kyonaji' },
    { round: 11, winner: 'A', side: 'CT', type: 'Full Buy', event: 'elimination', opening: 'phorate (M4A1-S)', equipA: '$27,200', equipB: '$15,000', mvp: 'phorate' },
    { round: 12, winner: 'B', side: 'T', type: 'Full Buy', event: 'bomb', opening: 'Uzman (AK-47)', equipA: '$24,000', equipB: '$21,000', mvp: 'Uzman' },
    // Half 2 (Switch sides)
    { round: 13, winner: 'B', side: 'CT', type: 'Pistol', event: 'elimination', opening: 'device (USP-S)', equipA: '$4,000', equipB: '$4,200', mvp: 'device' },
    { round: 14, winner: 'B', side: 'CT', type: 'Anti-Eco', event: 'elimination', opening: 'FenomeN (MP9)', equipA: '$6,800', equipB: '$17,000', mvp: 'FenomeN' },
    { round: 15, winner: 'A', side: 'T', type: 'Full Buy', event: 'bomb', opening: 'phorate (AK-47)', equipA: '$22,500', equipB: '$24,100', mvp: 'phorate' },
    { round: 16, winner: 'A', side: 'T', type: 'Full Buy', event: 'bomb', opening: 'kyonaji (AK-47)', equipA: '$24,800', equipB: '$21,000', mvp: 'kyonaji' },
    { round: 17, winner: 'B', side: 'CT', type: 'Full Buy', event: 'defuse', opening: 'Uzman (M4A4)', equipA: '$22,000', equipB: '$25,500', mvp: 'Uzman' },
    { round: 18, winner: 'A', side: 'T', type: 'Full Buy', event: 'bomb', opening: 'phorate (AK-47)', equipA: '$26,100', equipB: '$22,400', mvp: 'phorate', note: 'Key momentum swing: 1v2 clutch by phorate' },
    { round: 19, winner: 'A', side: 'T', type: 'Full Buy', event: 'elimination', opening: 'NeoLife (AK-47)', equipA: '$27,000', equipB: '$14,500', mvp: 'NeoLife' },
    { round: 20, winner: 'A', side: 'T', type: 'Full Buy', event: 'bomb', opening: 'phorate (AWP)', equipA: '$28,400', equipB: '$18,000', mvp: 'phorate' },
    { round: 21, winner: 'B', side: 'CT', type: 'Full Buy', event: 'defuse', opening: 'device (AWP)', equipA: '$24,000', equipB: '$26,000', mvp: 'device' },
    { round: 22, winner: 'A', side: 'T', type: 'Full Buy', event: 'bomb', opening: 'kyonaji (AK-47)', equipA: '$25,200', equipB: '$19,000', mvp: 'kyonaji' },
    { round: 23, winner: 'A', side: 'T', type: 'Full Buy', event: 'elimination', opening: 'phorate (AK-47)', equipA: '$26,800', equipB: '$15,200', mvp: 'phorate' },
  ];

  const roundList = rounds.length > 0 ? rounds : defaultRounds;
  const currentRoundObj = roundList.find(r => r.round === selectedRound) || roundList[17];

  return (
    <div className="bg-[#0a0d16]/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md font-mono space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-850">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span>⚔️</span> CS2 ROUND CENTER & INTERACTIVE ROUND INSPECTOR ({mapName.toUpperCase()})
          </h3>
          <p className="text-[10px] text-slate-550 mt-1">Click any round below to inspect full tactical telemetry</p>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1.5 text-sky-400 font-bold">
            <span className="w-2.5 h-2.5 rounded bg-sky-500" /> {teamA} (CT/T)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" /> {teamB} (T/CT)
          </span>
        </div>
      </div>

      {/* Round Blocks Strip */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1.5 min-w-max">
          {roundList.map((r) => {
            const isTeamA = r.winner === 'A';
            const isSelected = r.round === selectedRound;
            const bgClass = isSelected
              ? 'ring-2 ring-indigo-400 bg-indigo-600/30 border-indigo-400 text-white scale-105'
              : isTeamA
              ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
              : 'bg-amber-500/20 border-amber-500/50 text-amber-300';
            const icon = r.event === 'bomb' ? '💣' : r.event === 'defuse' ? '✂️' : r.event === 'time' ? '⏱️' : '💀';

            return (
              <button
                key={r.round}
                onClick={() => setSelectedRound(r.round)}
                className={`w-9 h-14 rounded-lg border flex flex-col items-center justify-between p-1 select-none transition-all hover:scale-105 ${bgClass} ${
                  r.round === 12 ? 'mr-3 border-r-2 border-r-indigo-500' : ''
                }`}
                title={`Click to inspect Round ${r.round}`}
              >
                <span className="text-[9px] font-bold opacity-60">R{r.round}</span>
                <span className="text-xs">{icon}</span>
                <span className="text-[8px] font-black">{r.side}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Round Telemetry Inspector */}
      {currentRoundObj && (
        <div className="bg-slate-950/60 border border-indigo-500/30 rounded-xl p-5 space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-amber-400 bg-amber-950/40 border border-amber-900/40 px-2.5 py-1 rounded">
                ROUND {currentRoundObj.round} INSPECTOR
              </span>
              <span className="text-xs font-bold text-white uppercase">
                WINNER: {currentRoundObj.winner === 'A' ? teamA : teamB} ({currentRoundObj.side})
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase">
              BUY TYPE: {currentRoundObj.type}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
              <span className="text-[9px] text-slate-500 block mb-1">VICTORY CONDITION</span>
              <span className="font-bold text-white capitalize">{currentRoundObj.event === 'bomb' ? '💣 Bomb Detonated' : currentRoundObj.event === 'defuse' ? '✂️ Bomb Defused' : '💀 Team Eliminated'}</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
              <span className="text-[9px] text-slate-500 block mb-1">OPENING DUEL (FIRST KILL)</span>
              <span className="font-bold text-sky-400">{currentRoundObj.opening}</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
              <span className="text-[9px] text-slate-500 block mb-1">EQUIPMENT VALUE</span>
              <span className="font-bold text-white">{teamA}: {currentRoundObj.equipA} | {teamB}: {currentRoundObj.equipB}</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850">
              <span className="text-[9px] text-slate-500 block mb-1">ROUND MVP</span>
              <span className="font-bold text-amber-400">{currentRoundObj.mvp}</span>
            </div>
          </div>

          {currentRoundObj.note && (
            <div className="bg-indigo-950/20 border border-indigo-900/30 p-2.5 rounded-lg text-[11px] text-indigo-300">
              💡 <strong>tactical note:</strong> {currentRoundObj.note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
