import React, { useState, useMemo } from 'react';
import { CalendarX } from 'lucide-react';
import { tournaments } from '../config/tournaments';
import TournamentFilterTabs from '../components/registration/TournamentFilterTabs';
import TournamentCard from '../components/registration/TournamentCard';

export const Home = () => {
  // Check if any live tournaments exist to set intelligent default tab
  const hasLive = tournaments.some(t => t.status === "LIVE");
  const [activeTab, setActiveTab] = useState(hasLive ? "LIVE" : "ALL");

  const filteredTournaments = useMemo(() => {
    if (activeTab === "ALL") return tournaments;
    return tournaments.filter(t => t.status === activeTab);
  }, [activeTab]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-in fade-in duration-500 relative z-10">
      
      {/* Header Area */}
      <div className="mb-12">
        <h1 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter font-heading uppercase drop-shadow-2xl">
          TOURNAMENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--neon-cyan)] to-blue-500">HUB</span>
        </h1>
        <p className="text-zinc-400 font-body text-sm uppercase tracking-widest mt-2">
          Select an active circuit to begin registration protocols.
        </p>
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

    </div>
  );
}
