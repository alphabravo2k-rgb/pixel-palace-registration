import React from 'react';
import { RefreshCw, AlertOctagon, Layers } from 'lucide-react';

export const TrackerTab = ({
  isArchived,
  handleManualRefresh,
  isRefreshing,
  teams,
  playHover,
  playClick,
  setSelectedTeam,
  tournament
}) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="glass-panel p-8 min-h-[600px]">
        <div className="hud-crosshair tl"></div><div className="hud-crosshair tr"></div>
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

        {!teams ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-60">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="glass-panel p-0 overflow-hidden border-white/5 animate-pulse">
                <div className="flex items-stretch h-20 bg-black/40 relative">
                  <div className="w-20 bg-zinc-900 flex-shrink-0 flex items-center justify-center border-r border-white/5">
                    <div className="w-12 h-12 rounded-full bg-white/5"></div>
                  </div>
                  <div className="flex-grow p-4 flex flex-col justify-center">
                    <div className="flex gap-2 mb-2">
                      <div className="h-3 w-12 bg-neon-cyan/20 rounded"></div>
                      <div className="h-3 w-8 bg-white/10 rounded"></div>
                    </div>
                    <div className="h-5 w-48 bg-white/10 rounded"></div>
                  </div>
                </div>
                <div className="bg-black/60 p-3 px-4 flex justify-between items-center border-t border-white/5">
                  <div className="h-2 w-24 bg-white/10 rounded"></div>
                  <div className="h-2 w-16 bg-white/10 rounded"></div>
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
            {teams.map((team, idx) => (
              <div 
                key={`${team.name}-${idx}`} 
                className="glass-panel p-0 overflow-hidden group/team transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-neon-cyan/20 cursor-pointer" 
                onMouseEnter={playHover} 
                onClick={() => { playClick(); if (team.roster?.length > 0) setSelectedTeam(team); }}
              >
                <div className="flex items-stretch h-20 bg-black/40 relative">
                  <div className="w-20 bg-zinc-900 flex-shrink-0 flex items-center justify-center border-r border-white/5 relative overflow-hidden">
                    <img 
                      src={team.logo && team.logo.startsWith('http') ? team.logo : 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png'} 
                      alt={team.name} 
                      className="w-12 h-12 object-contain relative z-10 group-hover/team:scale-110 transition-transform duration-500" 
                      onError={(e) => { e.target.src = 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png'; e.target.className += ' opacity-20 grayscale'; }} 
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
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${team.status === 'PENDING REVIEW' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] font-body">STATUS: {team.status || 'VERIFIED'}</span>
                  </div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-body flex gap-2">
                    {team.averageElo && <span className="text-neon-pink drop-shadow-[0_0_5px_rgba(240,0,255,0.5)]">AVG ELO: {team.averageElo}</span>}
                    {team.roster?.length > 0 && <span className="text-zinc-600">| CLICK FOR ROSTER</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
