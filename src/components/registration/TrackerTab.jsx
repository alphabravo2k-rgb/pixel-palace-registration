import { AlertOctagon, Layers, RefreshCw, Lock, Hourglass, Shield, Sparkles } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { formatEsportsDate } from '../../utils/dateHelper';


const getSeedStyle = (seedName) => {
  const seed = (seedName || '').toString().trim().toUpperCase();
  const SEEDS_MAP = {
    'IRON':     { bg: 'bg-[#607D8B]/10 text-[#607D8B] border-[#607D8B]/30' },
    'BRONZE':   { bg: 'bg-[#A0522D]/10 text-[#A0522D] border-[#A0522D]/30' },
    'SILVER':   { bg: 'bg-[#9E9E9E]/10 text-[#9E9E9E] border-[#9E9E9E]/30' },
    'GOLD':     { bg: 'bg-[#FFC107]/10 text-[#FFC107] border-[#FFC107]/30' },
    'PLATINUM': { bg: 'bg-[#00ACC1]/10 text-[#00ACC1] border-[#00ACC1]/30' },
    'DIAMOND':  { bg: 'bg-[#7B1FA2]/10 text-[#7B1FA2] border-[#7B1FA2]/30' },
    'ELITE':    { bg: 'bg-[#E91E63]/10 text-[#E91E63] border-[#E91E63]/30' },
  };
  return SEEDS_MAP[seed] || { bg: 'bg-zinc-800/40 text-zinc-400 border-zinc-700/40' };
};

export const TrackerTab = ({
  isArchived,
  handleManualRefresh,
  isRefreshing,
  teams,
  playHover,
  playClick,
  setSelectedTeam,
  tournament,
  onRegisterClick
}) => {
  const [failedLogos, setFailedLogos] = useState({});

  // Compute if registrations are active
  const isRegistrationOpen = tournament?.registrationDeadline 
    ? new Date().getTime() < new Date(tournament.registrationDeadline).getTime()
    : false;

  const shouldHideTeams = tournament?.hideRegisteredTeamsDuringRegistration && isRegistrationOpen;

  const [timeLeft, setTimeLeft] = useState('LOADING');

  useEffect(() => {
    if (!shouldHideTeams || !tournament?.registrationDeadline) return;
    const deadlineStr = tournament.registrationDeadline;
    if (deadlineStr === 'TBD') {
      setTimeLeft('TBD');
      return;
    }
    const deadline = new Date(deadlineStr).getTime();

    const updateTimer = () => {
      const diff = deadline - new Date().getTime();
      if (diff < 0) {
        setTimeLeft('CLOSED');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      
      let parts = [];
      if (d > 0) parts.push(`${d}D`);
      if (h > 0 || d > 0) parts.push(`${h}H`);
      parts.push(`${m}M`);
      parts.push(`${s}S`);
      
      setTimeLeft(parts.join(' '));
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [shouldHideTeams, tournament?.registrationDeadline]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="glass-panel p-8 min-h-[600px]">
        <div className="hud-crosshair tl" /><div className="hud-crosshair tr" />
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
          <h2 className="text-4xl text-white font-heading tracking-wider leading-none uppercase">{isArchived ? 'All Teams' : 'Registered Teams'}</h2>
          {!isArchived && (
            <button 
              onClick={handleManualRefresh} 
              disabled={isRefreshing} 
              className="text-zinc-400 hover:text-neon-cyan flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors bg-black/50 px-5 py-3 border border-white/10 hover:border-neon-cyan/50 font-body disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> {isRefreshing ? 'REFRESHING...' : 'REFRESH LIST'}
            </button>
          )}
        </div>

        {shouldHideTeams ? (
          <div className="bg-gradient-to-b from-black/50 to-transparent p-12 border border-white/5 rounded-lg relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[500px]">
            <div className="hud-crosshair tl opacity-30" />
            <div className="hud-crosshair tr opacity-30" />
            <div className="hud-crosshair bl opacity-30" />
            <div className="hud-crosshair br opacity-30" />

            {/* RADAR SWEEP ANIMATION */}
            <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-neon-cyan/20 animate-ping [animation-duration:3s]" />
              <div className="absolute w-20 h-20 rounded-full border border-neon-pink/20 animate-pulse" />
              <div className="absolute w-12 h-12 rounded-full border border-white/5 flex items-center justify-center">
                <Lock className="w-5 h-5 text-neon-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.6)]" />
              </div>
              <div className="absolute inset-0 rounded-full border border-dashed border-neon-cyan/10 animate-spin [animation-duration:8s]" />
            </div>

            {/* STATUS BADGE */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[10px] font-bold uppercase tracking-[0.2em] font-body rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
              Registrations Active
            </div>

            {/* DETAILS */}
            <h3 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-wider leading-tight mb-4 max-w-2xl">
              Registered Teams will be revealed after registrations close
            </h3>
            
            <p className="text-zinc-400 font-body text-sm leading-relaxed max-w-xl mb-6">
              Team rosters and profiles are temporarily hidden to encourage registrations and ensure a fair signup environment.
            </p>

            {/* COUNTDOWN TIMER */}
            {timeLeft !== 'LOADING' && timeLeft !== 'CLOSED' && (
              <div className="flex flex-col items-center bg-black/40 border border-white/5 px-6 py-3.5 rounded mb-6 w-full max-w-md relative">
                <div className="absolute inset-0 bg-neon-pink/5 opacity-5 rounded" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] font-body mb-2 flex items-center gap-1.5 relative z-10">
                  <Hourglass className="w-3.5 h-3.5 text-neon-pink animate-pulse" />
                  Registration Closes In
                </span>
                <span className="text-2xl font-heading text-white tracking-[0.15em] font-black uppercase drop-shadow-[0_0_10px_rgba(240,0,255,0.4)] relative z-10 font-mono">
                  {timeLeft}
                </span>
              </div>
            )}

            {/* SCARCITY COUNTER PANEL (THRESHOLD = 8) */}
            {Array.isArray(teams) && teams.length >= 8 ? (
              <div className="w-full max-w-md bg-black/40 border border-white/5 p-4 rounded mb-6 text-center relative">
                <div className="absolute inset-0 bg-neon-pink/5 opacity-10 rounded" />
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3 relative z-10">Ecosystem Status</p>
                <div className="grid grid-cols-3 gap-2 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Total Slots</span>
                    <span className="text-base font-heading text-white tracking-widest mt-1">{tournament?.maxTeams || 32}</span>
                  </div>
                  <div className="flex flex-col border-x border-white/5">
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Secured</span>
                    <span className="text-base font-heading text-neon-pink tracking-widest mt-1">{teams.length}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Remaining</span>
                    <span className="text-base font-heading text-neon-cyan tracking-widest mt-1">
                      {Math.max(0, (tournament?.maxTeams || 32) - teams.length)}
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-zinc-400 font-bold uppercase mt-3 tracking-wider relative z-10 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                  Secure your place before registrations close.
                </p>
              </div>
            ) : (
              <div className="w-full max-w-md bg-black/40 border border-white/5 p-4 rounded mb-6 text-center relative">
                <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1 tracking-wider flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                  Registrations are open. Will your team answer the challenge?
                </p>
              </div>
            )}

            {/* CTA */}
            {onRegisterClick && (
              <button
                onClick={() => { playClick(); onRegisterClick(); }}
                onMouseEnter={playHover}
                className="btn-ignite w-full max-w-xs mt-4 transition-all duration-300 relative z-10 flex items-center justify-center"
              >
                <span>Register Your Team</span>
              </button>
            )}

            {/* SUB-TEXT */}
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.22em] mt-4 font-body">
              Think you have what it takes? Test Yourself Against the Best.
            </p>
          </div>
        ) : !teams ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-60">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="glass-panel p-0 overflow-hidden border-white/5 animate-pulse">
                <div className="flex items-stretch h-20 bg-black/40 relative">
                  <div className="w-20 bg-zinc-900 flex-shrink-0 flex items-center justify-center border-r border-white/5">
                    <div className="w-12 h-12 rounded-full bg-white/5" />
                  </div>
                  <div className="flex-grow p-4 flex flex-col justify-center">
                    <div className="flex gap-2 mb-2">
                      <div className="h-3 w-12 bg-neon-cyan/20 rounded" />
                      <div className="h-3 w-8 bg-white/10 rounded" />
                    </div>
                    <div className="h-5 w-48 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="bg-black/60 p-3 px-4 flex justify-between items-center border-t border-white/5">
                  <div className="h-2 w-24 bg-white/10 rounded" />
                  <div className="h-2 w-16 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : teams === 'error' ? (
          <div className="text-center py-32 text-red-500 flex flex-col items-center justify-center bg-red-950/10 border border-dashed border-red-500/20 rounded-md">
            <AlertOctagon className="w-12 h-12 mb-6" />
            <span className="font-heading text-2xl uppercase">CONNECTION FAILED</span>
            <p className="text-xs font-body opacity-60 mt-2 uppercase tracking-widest">Could not stabilize link to current data sheet.</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-32 text-zinc-600 flex flex-col items-center justify-center">
            <Layers className="w-12 h-12 mb-6 opacity-20" />
            <span className="font-heading text-2xl uppercase tracking-widest">SYSTEMS COLD</span>
            <p className="text-xs font-body opacity-60 mt-2 uppercase tracking-widest">No teams have initialized registration yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teams.map((team, idx) => {
              const isFailed = failedLogos[`${team.name}-${idx}`];
              const logoSrc = isFailed || !team.logo || !team.logo.startsWith('http')
                ? 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png'
                : team.logo;
              return (
                <div 
                  key={`${team.name}-${team.logo || ''}-${idx}`} 
                  className="glass-panel p-0 overflow-hidden group/team transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-neon-cyan/20 cursor-pointer" 
                  onMouseEnter={playHover} 
                  onClick={() => { playClick(); setSelectedTeam(team); }}
                >
                  <div className="flex items-stretch h-20 bg-black/40 relative">
                    <div className="w-20 bg-zinc-900 flex-shrink-0 flex items-center justify-center border-r border-white/5 relative overflow-hidden">
                      <img 
                        src={logoSrc} 
                        alt={team.name} 
                        className={`w-12 h-12 object-contain relative z-10 group-hover/team:scale-110 transition-transform duration-500 ${isFailed ? 'opacity-20 grayscale' : ''}`} 
                        onError={() => {
                          setFailedLogos(prev => ({ ...prev, [`${team.name}-${idx}`]: true }));
                        }} 
                      />
                    </div>
                  <div className="flex-grow p-4 flex flex-col justify-center min-w-0 pr-16">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] bg-neon-cyan/10 text-neon-cyan px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-neon-cyan/20">{team.tag || 'TEAM'}</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">#{String(idx + 1).padStart(2, '0')}</span>
                    </div>
                    <h4 className="text-lg font-heading text-white truncate leading-none uppercase tracking-wider group-hover/team:text-neon-cyan transition-colors">{team.name}</h4>
                  </div>
                </div>
                <div className="bg-black/60 p-3 px-4 flex justify-between items-center border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      team.status === 'VERIFIED'      ? 'bg-green-500' :
                      team.status === 'OBJECTION'     ? 'bg-orange-500' :
                      team.status === 'WAITLISTED'    ? 'bg-purple-500' :
                      team.status === 'REJECTED'      ? 'bg-red-500' :
                      team.status === 'DISQUALIFIED'  ? 'bg-zinc-500' :
                      team.status === 'CHAMPION'      ? 'bg-yellow-400' :
                      'bg-yellow-500'
                    }`} />
                    <span className={`text-[9px] font-bold uppercase tracking-[0.2em] font-body ${
                      team.status === 'VERIFIED'      ? 'text-green-400' :
                      team.status === 'OBJECTION'     ? 'text-orange-400' :
                      team.status === 'WAITLISTED'    ? 'text-purple-400' :
                      team.status === 'REJECTED'      ? 'text-red-400' :
                      team.status === 'DISQUALIFIED'  ? 'text-zinc-500' :
                      team.status === 'CHAMPION'      ? 'text-yellow-300' :
                      'text-yellow-500'
                    }`}>
                      {team.status === 'OBJECTION' ? '⚠ ACTION REQUIRED' : `STATUS: ${team.status || 'PENDING REVIEW'}`}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-body flex items-center gap-2.5">
                    {team.seed && team.seed !== 'TBD' && (
                      <span className={`px-1.5 py-0.5 rounded border text-[8px] font-extrabold tracking-wider leading-none ${getSeedStyle(team.seed).bg}`}>
                        {team.seed}
                      </span>
                    )}
                    {team.averageElo && <span className="text-neon-pink drop-shadow-[0_0_5px_rgba(240,0,255,0.5)]">AVG ELO: {team.averageElo}</span>}
                    <span className="text-zinc-600">| CLICK FOR DETAILS</span>
                  </span>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
