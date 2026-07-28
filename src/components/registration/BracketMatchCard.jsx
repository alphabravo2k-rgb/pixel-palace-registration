import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Check, Play } from 'lucide-react';
import { matchCenter } from '../../utils/navigation';
import { DESIGN_SYSTEM } from '../../config/ppcc2Layout';

/**
 * Enterprise Tournament Operations Match Card Component (Memoized)
 * Parametric width, 56px compact height, clean typography, single winner accent line.
 * Handles normal match cards, live match state, and distinct BYE card layouts.
 */
export const BracketMatchCard = memo(({ slot, matchData, getTeamLogo }) => {
  const navigate = useNavigate();

  const cardW = slot.width || DESIGN_SYSTEM.roundWidths[slot.round] || 220;
  const cardH = DESIGN_SYSTEM.cardHeight || 56;

  const matchId = matchData ? matchData.id : null;
  const isCompleted = matchData?.status === 'COMPLETED';
  const isLive = matchData?.status === 'LIVE';
  const isBye = matchData?.status === 'BYE';

  // Resolve team names prioritize live API matchData
  const t1Name = (matchData && matchData.team1 && matchData.team1 !== 'TBD') ? matchData.team1 : (slot.defaultTeam1 || 'TBD');
  const t2Name = isBye ? 'BYE' : ((matchData && matchData.team2 && matchData.team2 !== 'TBD') ? matchData.team2 : 'TBD');

  const t1Logo = getTeamLogo(matchData?.team1Obj || t1Name);
  const t2Logo = getTeamLogo(matchData?.team2Obj || t2Name);

  const isT1Winner = isCompleted && matchData?.winner === 'team1';
  const isT2Winner = isCompleted && matchData?.winner === 'team2';

  // Distinct BYE Seed Card View (e.g. Last Dance & NoSpirit)
  if (slot.isByeSlot) {
    return (
      <div 
        style={{
          position: 'absolute',
          left: `${slot.x}px`,
          top: `${slot.y}px`,
          width: `${cardW}px`,
          height: `${cardH}px`
        }}
        onClick={() => matchId && navigate(matchCenter(matchId))}
        className="bg-black/90 border border-neon-cyan/35 rounded-md px-2.5 py-1.5 flex flex-col justify-between overflow-hidden shadow-[0_0_10px_rgba(0,240,255,0.1)] shrink-0 cursor-pointer hover:-translate-y-0.5 transition-all group"
      >
        {/* Header */}
        <div className="flex items-center justify-between text-[8px] font-bold font-body border-b border-white/10 pb-0.5 leading-none">
          <span className="text-neon-cyan font-black tracking-wider uppercase">{slot.visualLabel}</span>
          <span className="text-neon-cyan font-bold bg-neon-cyan/10 px-1 py-0.2 rounded border border-neon-cyan/20 uppercase tracking-widest text-[7px] flex items-center gap-0.5">
            <Check size={7} className="text-neon-cyan" /> BYE SEED
          </span>
        </div>

        {/* Seeded Team Row */}
        <div className="flex items-center justify-between text-[11px] font-bold font-body text-white leading-none">
          <div className="flex items-center gap-1.5 truncate pr-1">
            {t1Logo ? (
              <img src={t1Logo} className="w-3.5 h-3.5 rounded-full object-cover shrink-0 border border-white/10" alt="" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 flex items-center justify-center text-[8px] shrink-0 border border-white/10 text-zinc-500 font-body">?</div>
            )}
            <span className="truncate uppercase tracking-wider text-neon-cyan font-heading">{t1Name}</span>
          </div>
          <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">
            AUTO ADVANCED
          </span>
        </div>
      </div>
    );
  }

  // Standard Tournament Operations Match Card
  return (
    <div
      style={{
        position: 'absolute',
        left: `${slot.x}px`,
        top: `${slot.y}px`,
        width: `${cardW}px`,
        height: `${cardH}px`
      }}
      onClick={() => matchId && navigate(matchCenter(matchId))}
      className={`bg-black/90 border ${
        isLive 
          ? 'border-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.25)]' 
          : isCompleted 
            ? 'border-white/20 hover:border-white/40' 
            : 'border-white/10 hover:border-neon-cyan/40'
      } rounded-md px-2 py-1 flex flex-col justify-between overflow-hidden group transition-all cursor-pointer hover:-translate-y-0.5`}
    >
      {/* Header Tag */}
      <div className="flex items-center justify-between text-[8px] font-bold font-body border-b border-white/5 pb-0.5 leading-none">
        <div className="flex items-center gap-1">
          <span className="text-neon-cyan font-black uppercase tracking-wider">{slot.visualLabel}</span>
          <span className="text-zinc-500 font-semibold">({slot.format})</span>
        </div>
        {isLive ? (
          <span className="text-[7px] bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan px-1 py-0.2 rounded font-black tracking-widest uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" /> LIVE
          </span>
        ) : matchId ? (
          <span className="text-[7px] text-zinc-400 group-hover:text-neon-cyan transition-colors font-bold uppercase tracking-widest flex items-center gap-0.5">
            #{matchId} <ExternalLink size={6} />
          </span>
        ) : (
          <span className="text-[7px] text-zinc-600 uppercase tracking-widest font-semibold">
            AWAITING TEAMS
          </span>
        )}
      </div>

      {/* Team 1 Row */}
      <div className={`flex items-center justify-between text-[10px] font-bold font-body leading-none ${
        isT1Winner ? 'border-l-2 border-green-400 pl-1 text-green-400 font-extrabold' : 'text-zinc-200'
      }`}>
        <div className="flex items-center gap-1.5 truncate pr-1">
          {t1Logo ? (
            <img src={t1Logo} className="w-3.5 h-3.5 rounded-full object-cover shrink-0 border border-white/10" alt="" />
          ) : (
            <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 flex items-center justify-center text-[8px] shrink-0 border border-white/10 text-zinc-500 font-body">?</div>
          )}
          <span className="truncate uppercase tracking-wider">{t1Name}</span>
        </div>
        <span className={`text-[9px] font-black px-1 py-0.2 rounded border shrink-0 ${
          isT1Winner ? 'bg-green-500/20 border-green-400/30 text-green-300' : 'bg-black/60 border-white/10 text-zinc-400'
        }`}>
          {isCompleted ? (matchData?.score?.split('-')?.[0] || '0') : ''}
        </span>
      </div>

      {/* Team 2 Row */}
      <div className={`flex items-center justify-between text-[10px] font-bold font-body leading-none ${
        isT2Winner ? 'border-l-2 border-green-400 pl-1 text-green-400 font-extrabold' : 'text-zinc-200'
      }`}>
        <div className="flex items-center gap-1.5 truncate pr-1">
          {t2Logo ? (
            <img src={t2Logo} className="w-3.5 h-3.5 rounded-full object-cover shrink-0 border border-white/10" alt="" />
          ) : (
            <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 flex items-center justify-center text-[8px] shrink-0 border border-white/10 text-zinc-500 font-body">?</div>
          )}
          <span className="truncate uppercase tracking-wider">{t2Name}</span>
        </div>
        <span className={`text-[9px] font-black px-1 py-0.2 rounded border shrink-0 ${
          isT2Winner ? 'bg-green-500/20 border-green-400/30 text-green-300' : 'bg-black/60 border-white/10 text-zinc-400'
        }`}>
          {isCompleted ? (matchData?.score?.split('-')?.[1] || '0') : ''}
        </span>
      </div>
    </div>
  );
});

BracketMatchCard.displayName = 'BracketMatchCard';
