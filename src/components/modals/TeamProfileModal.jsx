import React from 'react';
import { X, ShieldAlert, Crosshair, Trophy } from 'lucide-react';

export function TeamProfileModal({ team, onClose }) {
  if (!team) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl glass-panel p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
        {/* Header Background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-neon-cyan/20 to-black pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/10 blur-[100px] pointer-events-none" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/50 border border-white/10 rounded-full text-zinc-400 hover:text-white hover:border-neon-cyan/50 transition-all group"
        >
          <X size={16} className="group-hover:scale-110 transition-transform" />
        </button>

        <div className="p-8 relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 border-b border-white/5">
          {/* Logo */}
          <div className="w-32 h-32 rounded-xl bg-black border-2 border-white/10 p-2 shrink-0 shadow-2xl relative group">
            <div className="absolute inset-0 bg-neon-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl blur-xl" />
            <img 
              src={team.logo} 
              alt={team.name} 
              className="w-full h-full object-contain relative z-10"
              onError={(e) => { e.target.src = 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png'; e.target.className += ' opacity-20 grayscale'; }}
            />
          </div>
          
          {/* Info */}
          <div className="text-center md:text-left flex-grow">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-[10px] bg-neon-cyan/10 text-neon-cyan px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-neon-cyan/20">
                {team.tag || 'TEAM'}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${team.status === 'PENDING REVIEW' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                {team.status === 'PENDING REVIEW' ? 'REVIEW' : 'VERIFIED'}
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-heading text-white uppercase tracking-widest leading-none drop-shadow-lg">
              {team.name}
            </h2>
            
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] font-body mb-1">Average ELO</span>
                <span className="text-xl font-heading text-neon-cyan tracking-widest">{team.averageElo || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] font-body mb-1">Active Roster</span>
                <span className="text-xl font-heading text-white tracking-widest">{team.roster?.length || 0} Players</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] font-body mb-1">Region</span>
                <span className="text-xl font-heading text-zinc-300 tracking-widest">{team.region || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Roster Grid */}
        <div className="bg-black/60 p-8">
          <h3 className="text-lg font-heading text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
            <Crosshair className="w-5 h-5 text-neon-cyan" /> Registered Roster
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.roster?.map((p, i) => (
              <div key={i} className="bg-black/40 border border-white/5 p-4 rounded-lg hover:border-white/20 transition-colors group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-[20px] rounded-full group-hover:bg-neon-cyan/10 transition-colors" />
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.5)] ${i === 0 ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-neon-cyan shadow-neon-cyan/50'}`} />
                  <span className="text-sm font-bold text-white uppercase tracking-wider font-body truncate">
                    {p.ign || p.discord || 'PLAYER'}
                  </span>
                </div>
                <div className="flex flex-col gap-2 relative z-10">
                  <div className="flex justify-between items-center bg-black/50 px-2 py-1.5 rounded border border-white/5">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">FaceIT LVL</span>
                    <span className="text-[10px] text-zinc-300 font-bold font-body">{p.faceitLevel || '?'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/50 px-2 py-1.5 rounded border border-white/5">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">FaceIT ELO</span>
                    <span className="text-[10px] text-neon-cyan font-bold font-body">{p.faceitElo || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
