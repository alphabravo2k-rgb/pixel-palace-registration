import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Users, Globe, Target, Clock, Trophy, Sparkles, Flame, CheckCircle2 } from 'lucide-react';
import { getTimeStatus } from '../../utils/dateHelper';
import { useAudio } from '../../hooks/useAudio';

export default function TournamentCard({ tournament }) {
  const [timeText, setTimeText] = useState("");
  const [imageError, setImageError] = useState(false);
  const isLive = tournament.status === "LIVE";
  const isUpcoming = tournament.status === "UPCOMING";
  const isArchived = tournament.status === "ARCHIVED";
  const { playHover, playClick } = useAudio();

  useEffect(() => {
    if (isLive) {
      const status = getTimeStatus(tournament.registrationDeadline);
      setTimeText(status?.expired ? "REGISTRATION CLOSED" : `CLOSES IN ${status?.text || 'TBD'}`);
    } else if (isUpcoming) {
      const status = getTimeStatus(tournament.tournamentDate);
      setTimeText(status?.expired ? "STARTING NOW" : `BEGINS IN ${status?.text || 'TBD'}`);
    } else {
      setTimeText(`CONCLUDED ${tournament.displayDate || ''}`);
    }
  }, [tournament, isLive, isUpcoming]);

  // Dynamic styling based on status
  const cardBorder = isLive 
    ? 'border-neon-pink/60 hover:border-neon-pink shadow-[0_0_25px_rgba(255,0,127,0.35)] bg-gradient-to-b from-[#180824] via-black to-[#050711]' 
    : isUpcoming 
    ? 'border-neon-cyan/50 hover:border-neon-cyan shadow-[0_0_25px_rgba(0,240,255,0.25)] bg-gradient-to-b from-[#061824] via-black to-[#050711]'
    : 'border-amber-500/30 hover:border-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-gradient-to-b from-[#1c1408] via-black to-[#050711]';
  
  const transformHover = 'hover:-translate-y-1.5 hover:scale-[1.015]';
  const targetRoute = `/register/${tournament.slug}`;

  return (
    <Link 
      to={targetRoute}
      onMouseEnter={playHover}
      onClick={playClick}
      className={`glass-panel p-0 flex flex-col overflow-hidden transition-all duration-300 cursor-pointer border rounded-2xl group font-mono relative ${cardBorder} ${transformHover}`}
    >
      {/* Glare Effect Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      
      {/* Banner & Status Badge */}
      <div className="relative h-36 w-full bg-zinc-900 border-b border-white/10 flex items-center justify-center overflow-hidden">
        {!imageError && tournament.thumbnail ? (
          <img 
            src={tournament.thumbnail}
            alt={`${tournament.name} Thumbnail`}
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-900/40 via-black to-blue-900/40 z-0">
            <span className="font-heading text-lg text-zinc-400 uppercase tracking-widest leading-none text-center px-4">
              {tournament.gameMode} CHAMPIONSHIP
            </span>
          </div>
        )}
        
        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050711] via-black/30 to-transparent z-[1]" />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-black/70 backdrop-blur-md border border-white/20 text-zinc-300 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-md">
            {tournament.gameMode}
          </span>
        </div>

        <div className="absolute top-3 right-3 z-10">
          {isLive && (
            <span className="bg-rose-500/25 border border-rose-500 text-rose-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.5)] flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" /> LIVE NOW
            </span>
          )}
          {isUpcoming && (
            <span className="bg-neon-cyan/20 border border-neon-cyan text-neon-cyan px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              <Sparkles className="w-3 h-3" /> UPCOMING
            </span>
          )}
          {isArchived && (
            <span className="bg-amber-500/20 border border-amber-500 text-yellow-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              <Trophy className="w-3 h-3 text-yellow-400" /> CONCLUDED
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 pb-0 flex-grow relative z-10 flex flex-col justify-between">
        <div>
          <h3 className="font-heading font-black text-2xl text-white uppercase tracking-wider leading-tight mb-3 group-hover:text-neon-cyan transition-colors">
            {tournament.name}
          </h3>

          {/* Champion Box for Concluded Tournaments */}
          {isArchived && tournament.champion && (
            <div className="mb-4 bg-gradient-to-r from-amber-950/40 via-black to-yellow-950/30 border border-yellow-500/35 rounded-xl p-3 shadow-inner space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy size={15} className="text-yellow-400 shrink-0" />
                  <div>
                    <span className="text-[8px] text-yellow-400/80 font-bold tracking-[0.2em] uppercase font-body block leading-none">CHAMPIONS</span>
                    <span className="text-sm font-heading font-black text-yellow-300 uppercase leading-tight truncate block">{tournament.champion.name}</span>
                  </div>
                </div>
                {tournament.champion.score && (
                  <span className="text-xs font-heading font-black text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/30">
                    {tournament.champion.score}
                  </span>
                )}
              </div>

              {tournament.runnerUp && (
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/10">
                  <span className="text-zinc-400 text-[9px] uppercase font-bold">RUNNER UP</span>
                  <span className="text-zinc-300 font-bold uppercase truncate max-w-[140px]">{tournament.runnerUp.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-zinc-300 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
              <Award size={13} className="text-neon-cyan shrink-0" />
              <span className="truncate">{tournament.prizePool}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
              <Target size={13} className="text-neon-pink shrink-0" />
              <span className="uppercase truncate">{tournament.format}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
              <Globe size={13} className="text-zinc-400 shrink-0" />
              <span className="truncate">{tournament.region}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
              <Users size={13} className="text-zinc-400 shrink-0" />
              <span className="truncate">{tournament.maxTeams} Teams</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="bg-black/70 border-t border-white/10 p-3.5 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <Clock size={13} className={isLive ? "text-rose-400" : isUpcoming ? "text-neon-cyan" : "text-amber-400"} />
          <span className={`text-[10px] font-bold uppercase tracking-widest font-body ${isLive ? "text-rose-400" : isUpcoming ? "text-neon-cyan" : "text-amber-400"}`}>
            {timeText}
          </span>
        </div>
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest font-body group-hover:text-white transition-colors flex items-center gap-1">
          {isArchived ? "REPLAY RESULTS" : "VIEW MATCHES"} &rarr;
        </span>
      </div>
    </Link>
  );
}
