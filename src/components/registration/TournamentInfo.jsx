import React from 'react';
import { Target } from 'lucide-react';

export function TournamentInfo({ tournament }) {
  if (!tournament) return null;

  return (
    <div className="glass-panel p-6">
      <div className="hud-crosshair tl"></div><div className="hud-crosshair br"></div>
      <h3 className="text-3xl text-white font-heading mb-4 flex items-center gap-3 border-b border-white/10 pb-3 uppercase">
        <Target className="w-6 h-6 text-[#00f0ff]" /> Tournament Info
      </h3>
      <div className="space-y-5 font-body">
        <div>
          <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">01 // TOURNAMENT DATE</p>
          <p className="text-xl font-bold text-[#00f0ff] mt-1 uppercase">DATE: {tournament.tournamentDate || 'TBD'}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">02 // START TIME</p>
          <p className="text-xl font-bold text-white mt-1 uppercase">{tournament.startTime || 'TBD'}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">03 // GAME MODE</p>
          <p className="text-xl font-bold text-white mt-1 uppercase">{tournament.gameMode}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">04 // REGISTRATION DEADLINE</p>
          <p className="text-xl font-bold text-white mt-1 uppercase">
            {tournament.registrationDeadline && tournament.registrationDeadline !== 'TBD' ? 
              new Date(tournament.registrationDeadline).toUTCString().replace('GMT', 'GMT') : 'TBD'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
