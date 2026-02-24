import { Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { API_URL } from '../App';
// Note: We will create these two files in the next step!
import { LiveTracker } from '../components/modules/tracker/LiveTracker';
import { RegistrationForm } from '../components/modules/registration/RegistrationForm';
import { Skeleton } from '../components/ui/Skeleton';

export const TournamentHub = () => {
  const { tournamentId } = useParams();
  const [activeTab, setActiveTab] = useState('register');
  const [config, setConfig] = useState(null);
  const [slots, setSlots] = useState({ cap: 32, confirmed: 0, isFull: false, loading: true });

  useEffect(() => {
    // Simulate fetching the JSON manifest you requested earlier
    // (Using hardcoded fallback to ensure instant load for this specific tournament)
    setConfig({
      date: "APRIL 03, 2026",
      deadline: "2026-03-31T23:59:59Z",
      format: "5v5",
      id: "community-cup-2",
      name: "Community Cup 2.0"
    });

    const fetchSlots = async () => {
      try {
        const res = await fetch(`${API_URL}?t=${new Date().getTime()}`);
        const data = await res.json();
        setSlots({ cap: data.cap || 32, confirmed: data.confirmed || 0, isFull: data.isFull, loading: false });
      } catch (_err) {
        setSlots((s) => ({ ...s, loading: false }));
      }
    };
    
    fetchSlots();
    const interval = setInterval(fetchSlots, 15000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  if (!config) return <div className="p-20"><Skeleton className="h-64" /></div>;

  return (
    <div className="animate-enter">
      {/* Cinematic Header HUD */}
      <div className="text-center mb-12">
        <h1 className="text-6xl sm:text-fluid-7xl font-black italic font-display leading-none drop-shadow-neon uppercase">
          PIXEL PALACE <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-white to-role-tech tracking-tight">
            {config.name}
          </span>
        </h1>
        
        <div className="w-full max-w-4xl mx-auto mt-6">
          <div className="glass-panel p-2 grid grid-cols-2 md:grid-cols-4 gap-1">
            <div className="bg-bg-panel/80 p-4 text-center">
              <p className="text-[10px] text-tactical-muted uppercase tracking-widest font-bold mb-1 font-mono">Live Slots</p>
              {slots.loading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
                slots.isFull ? <span className="text-2xl text-status-loss font-display">FULL</span> :
                <div className="text-3xl text-role-tech font-display leading-none">{slots.confirmed} <span className="text-tactical-muted">/ {slots.cap}</span></div>
              )}
            </div>
            <div className="bg-bg-panel/80 p-4 text-center">
              <p className="text-[10px] text-tactical-muted uppercase tracking-widest font-bold mb-1 font-mono">Prize Pool</p>
              <p className="text-3xl text-white font-display leading-none">TBA</p>
            </div>
            <div className="bg-bg-panel/80 p-4 text-center">
              <p className="text-[10px] text-tactical-muted uppercase tracking-widest font-bold mb-1 font-mono">Format</p>
              <p className="text-3xl text-brand-accent font-display leading-none text-glow">{config.format}</p>
            </div>
            <div className="bg-bg-panel/80 p-4 flex flex-col justify-center items-center">
              <p className="text-[10px] text-tactical-muted uppercase tracking-widest font-bold mb-1 font-mono">Security</p>
              <p className="text-sm font-mono text-status-win font-bold tracking-widest flex items-center gap-1">
                <Shield size={14} /> AKROS
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cyber Tabs */}
      <div className="flex justify-center gap-12 w-full max-w-2xl mx-auto mb-10 border-b border-white/5">
        <button 
          className={`pb-2 font-display text-3xl tracking-widest uppercase transition-colors ${activeTab === 'register' ? 'text-white border-b-2 border-role-tech text-neon' : 'text-tactical-muted hover:text-tactical-faint'}`}
          onClick={() => setActiveTab('register')} 
        >
          Register Team
        </button>
        <button 
          className={`pb-2 font-display text-3xl tracking-widest uppercase flex items-center gap-3 transition-colors ${activeTab === 'tracker' ? 'text-white border-b-2 border-role-tech text-neon' : 'text-tactical-muted hover:text-tactical-faint'}`}
          onClick={() => setActiveTab('tracker')} 
        >
          Live Tracker 
          <span className="bg-brand-accent text-white text-[10px] px-2 py-0.5 rounded font-mono tracking-widest animate-pulse-fast">LIVE</span>
        </button>
      </div>

      {/* Content Switcher */}
      {activeTab === 'register' ? (
        <RegistrationForm config={config} tournamentId={tournamentId} />
      ) : (
        <LiveTracker />
      )}
    </div>
  );
};
