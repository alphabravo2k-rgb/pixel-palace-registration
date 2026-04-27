import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Users, Globe, Target, Clock, Trophy } from 'lucide-react';
import { getTimeStatus } from '../../utils/dateHelper';

export default function TournamentCard({ tournament }) {
  const [timeText, setTimeText] = useState("");
  const [imageError, setImageError] = useState(false);
  const isLive = tournament.status === "LIVE";
  const isUpcoming = tournament.status === "UPCOMING";
  const isArchived = tournament.status === "ARCHIVED";

  useEffect(() => {
    if (isLive) {
      const status = getTimeStatus(tournament.registrationDeadline);
      setTimeText(status?.expired ? "REGISTRATION CLOSED" : `CLOSES IN ${status?.text || 'TBD'}`);
    } else if (isUpcoming) {
      const status = getTimeStatus(tournament.tournamentDate);
      setTimeText(status?.expired ? "STARTING NOW" : `BEGINS IN ${status?.text || 'TBD'}`);
    } else {
      setTimeText("TOURNAMENT CONCLUDED");
    }
  }, [tournament, isLive, isUpcoming]);

  // Dynamic styling based on status
  const borderHover = isLive ? 'hover:border-[var(--neon-pink)] shadow-[0_0_20px_rgba(240,0,255,0)] hover:shadow-[0_0_20px_rgba(240,0,255,0.3)]' 
                    : isUpcoming ? 'hover:border-[var(--neon-cyan)] shadow-[0_0_20px_rgba(0,240,255,0)] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                    : 'border-white/5';
  
  const opacity = isArchived ? 'opacity-80 grayscale-[30%]' : 'opacity-100';
  const transformHover = 'hover:-translate-y-1 hover:scale-[1.02]';
  const targetRoute = `/register/${tournament.slug}`;

  return (
    <Link 
      to={targetRoute}
      className={`glass-panel p-0 flex flex-col overflow-hidden transition-all duration-300 cursor-pointer border ${borderHover} ${opacity} ${transformHover}`}
    >
      {/* Banner & Badge */}
      <div className="relative h-32 w-full bg-zinc-900 border-b border-white/10 flex items-center justify-center">
        {!imageError ? (
          <img 
            src={tournament.thumbnail}
            alt={`${tournament.name} Thumbnail`}
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-0">
            <span className="font-heading text-xl text-zinc-600 uppercase tracking-widest leading-none text-center px-4">
              {tournament.gameMode} MAP TBD
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] to-transparent z-[1]" />
        
        <div className="absolute top-3 right-3 z-10">
          {isLive && <span className="bg-[#f000ff]/20 border border-[#f000ff] text-[#f000ff] px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded animate-pulse">LIVE</span>}
          {isUpcoming && <span className="bg-amber-500/20 border border-amber-500 text-amber-400 px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded">UPCOMING</span>}
          {isArchived && <span className="bg-zinc-500/20 border border-zinc-500 text-zinc-400 px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded">ENDED</span>}
        </div>
      </div>

      {/* Title Area */}
      <div className="p-5 pb-0 flex-grow relative z-10">
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-body block mb-1">
          {tournament.gameMode}
        </span>
        <h3 className="font-heading text-3xl text-white leading-none mb-4">
          {tournament.name}
        </h3>

        {/* Winner Display for Archived Tournaments */}
        {isArchived && tournament.champion && (
          <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded p-3 flex items-center gap-3">
             <Trophy size={20} className="text-yellow-500 shrink-0" />
             <div className="min-w-0">
               <div className="text-[9px] text-yellow-500 font-bold tracking-[0.2em] uppercase mb-0.5 font-body">Grand Champions</div>
               <div className="text-lg font-heading tracking-wider text-white uppercase leading-none truncate">{tournament.champion.name}</div>
             </div>
          </div>
        )}

        {/* 2x2 Dense Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="flex items-center gap-2 text-zinc-300">
            <Award size={14} className="text-[var(--neon-cyan)]" />
            <span className="font-body text-sm font-bold">{tournament.prizePool}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Target size={14} className="text-[var(--neon-pink)]" />
            <span className="font-body text-sm font-bold uppercase">{tournament.format}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Globe size={14} className="text-zinc-400" />
            <span className="font-body text-sm font-bold">{tournament.region}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Users size={14} className="text-zinc-400" />
            <span className="font-body text-sm font-bold">{tournament.maxTeams} Teams</span>
          </div>
        </div>
      </div>

      {/* Time Footer */}
      <div className="bg-black/50 border-t border-white/5 p-4 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <Clock size={14} className={isLive ? "text-[#f000ff]" : isUpcoming ? "text-amber-400" : "text-zinc-600"} />
          <span className={`text-[10px] font-bold uppercase tracking-widest font-body ${isLive ? "text-[#f000ff]" : isUpcoming ? "text-amber-400" : "text-zinc-600"}`}>
            {timeText}
          </span>
        </div>
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-body group-hover:text-white transition-colors">
          {isArchived ? "VIEW RESULTS" : "REGISTER NOW"} &rarr;
        </span>
      </div>
    </Link>
  );
}
