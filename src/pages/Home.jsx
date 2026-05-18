import React, { useState, useMemo } from 'react';
import { CalendarX, Trophy, Users, Award, Target, History, Globe } from 'lucide-react';
import { tournaments } from '../config/tournaments';
import TournamentFilterTabs from '../components/shared/TournamentFilterTabs';
import TournamentCard from '../components/shared/TournamentCard';
import { CountUp } from '../components/ui/CountUp';
import { Magnetic } from '../components/ui/Magnetic';

export const Home = () => {
  // Check if any live tournaments exist to set intelligent default tab
  const hasLive = tournaments.some(t => t.status === "LIVE");
  const [activeTab, setActiveTab] = useState(hasLive ? "LIVE" : "ALL");

  const filteredTournaments = useMemo(() => {
    if (activeTab === "ALL") return tournaments;
    return tournaments.filter(t => t.status === activeTab);
  }, [activeTab]);

  // Dynamic Org Stats
  const stats = useMemo(() => {
    let totalPrize = 0;
    let totalTeams = 0;
    tournaments.forEach(t => {
      if (t.prizePool) {
        const amount = parseInt(t.prizePool.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(amount)) totalPrize += amount;
      }
      if (t.maxTeams) totalTeams += t.maxTeams;
    });
    return {
      totalEvents: tournaments.length,
      totalPrize: totalPrize,
      totalTeams: totalTeams
    };
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-in fade-in duration-500 relative z-10">
      
      {/* Hero & Identity Section */}
      <div className="flex flex-col items-center text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-cyan/10 blur-[100px] rounded-full pointer-events-none" />
        <img 
          src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png" 
          alt="Pixel Palace Logo" 
          className="w-32 h-32 md:w-40 md:h-40 object-contain mb-6 drop-shadow-[0_0_20px_rgba(0,240,255,0.4)] animate-logo-breathe"
        />
        <div className="glitch-wrapper mb-6">
          <h1 
            className="text-5xl md:text-7xl font-black text-white italic tracking-tighter font-heading uppercase drop-shadow-2xl leading-none glitch"
            data-text="PIXEL PALACE"
          >
            PIXEL PALACE
          </h1>
        </div>
        <p className="text-zinc-400 font-body text-sm md:text-base uppercase tracking-[0.3em] mt-4 font-bold">
          The Premier CS2 Tournament Circuit
        </p>
        
        {/* Org Stats Bar */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 md:gap-8 glass-panel px-8 py-4 rounded-full border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-black/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold font-body tracking-widest text-zinc-300 uppercase"><span className="text-white text-base mr-1"><CountUp end={stats.totalEvents} /></span> Events</span>
          </div>
          <div className="hidden md:block w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold font-body tracking-widest text-zinc-300 uppercase"><span className="text-white text-base mr-1"><CountUp end={stats.totalPrize} prefix="$" suffix="+" /></span> Prize Money</span>
          </div>
          <div className="hidden md:block w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neon-cyan" />
            <span className="text-xs font-bold font-body tracking-widest text-zinc-300 uppercase"><span className="text-white text-base mr-1"><CountUp end={stats.totalTeams} suffix="+" /></span> Teams</span>
          </div>
          <div className="hidden md:block w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-neon-pink" />
            <span className="text-xs font-bold font-body tracking-widest text-zinc-300 uppercase"><span className="text-white text-base mr-1"><CountUp end={4} /></span> Regions</span>
          </div>
        </div>

        <div className="mt-12">
          <Magnetic>
            <a href="#circuits" className="inline-block">
              <button className="bg-white text-black font-black uppercase tracking-widest px-8 py-3 rounded-sm hover:bg-neon-cyan transition-colors">
                Explore Circuits
              </button>
            </a>
          </Magnetic>
        </div>
      </div>

      {/* Tabs */}
      <TournamentFilterTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Grid or Empty State */}
      {filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-center border-dashed border-white/10 mt-8">
          <div className="bg-black/50 p-5 rounded-full mb-6">
            <CalendarX size={48} className="text-zinc-600" />
          </div>
          <h3 className="font-heading text-3xl text-zinc-400 mb-2">NO CIRCUITS FOUND</h3>
          <p className="font-body text-xs uppercase tracking-widest text-zinc-600 font-bold">
            There are currently no {activeTab !== "ALL" ? activeTab.toLowerCase() : ""} tournaments in the database.
          </p>
        </div>
      )}

      {/* Legacy Timeline Section */}
      <div className="mt-32">
        <h3 className="text-2xl text-white font-heading tracking-widest uppercase mb-8 flex items-center gap-3 border-b border-white/10 pb-4">
          <History className="w-6 h-6 text-neon-cyan" /> Organizational Legacy
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-8 snap-x scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {tournaments.filter(t => t.status === "ARCHIVED").reverse().map((t, i) => (
            <div key={i} className="min-w-[280px] glass-panel p-5 snap-start shrink-0 hover:border-white/20 transition-colors cursor-default relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-[20px] rounded-full group-hover:bg-neon-cyan/10 transition-colors" />
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] font-body mb-2">{t.displayYear || new Date(t.tournamentDate).getFullYear()} // {t.gameMode}</div>
              <div className="text-xl font-heading text-white uppercase tracking-widest leading-none mb-4">{t.name}</div>
              <div className="space-y-2 mt-auto relative z-10">
                <div className="flex justify-between items-center text-xs font-body font-bold uppercase tracking-widest">
                  <span className="text-zinc-600">Champion</span>
                  <span className="text-yellow-500 flex items-center gap-1"><Trophy className="w-3 h-3" /> {t.champion?.name || "TBD"}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-body font-bold uppercase tracking-widest">
                  <span className="text-zinc-600">Prize</span>
                  <span className="text-green-400">{t.prizePool}</span>
                </div>
              </div>
            </div>
          ))}
          {/* Add a generic historical entry to show legacy since there are only 2 archived currently */}
          <div className="min-w-[280px] glass-panel p-5 snap-start shrink-0 border-dashed border-white/10 opacity-60">
             <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] font-body mb-2">2024 // CS:GO</div>
             <div className="text-xl font-heading text-zinc-400 uppercase tracking-widest leading-none mb-4">Pixel Palace Season 1</div>
             <div className="space-y-2 mt-auto">
                <div className="flex justify-between items-center text-xs font-body font-bold uppercase tracking-widest">
                  <span className="text-zinc-600">Champion</span>
                  <span className="text-yellow-500/50 flex items-center gap-1"><Trophy className="w-3 h-3" /> RETIRED</span>
                </div>
                <div className="flex justify-between items-center text-xs font-body font-bold uppercase tracking-widest">
                  <span className="text-zinc-600">Prize</span>
                  <span className="text-green-400/50">$250</span>
                </div>
              </div>
          </div>
        </div>
      </div>

    </div>
  );
}
