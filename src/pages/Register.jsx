import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { getTournamentBySlug } from '../config/tournaments';
import { fetchTournamentSlots } from '../services/sheets';
import { TournamentForm } from '../components/forms/TournamentForm';
import { MessageCircle, Tv, AlertOctagon, Target, ShieldAlert, Layers, Download, Loader2, ShieldCheck, Activity, RefreshCw } from 'lucide-react';

export const Register = () => {
  const { tournamentSlug } = useParams();
  const tournament = getTournamentBySlug(tournamentSlug);
  const [activeTab, setActiveTab] = useState('register');
  const [slots, setSlots] = useState(null);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState('LOADING');

  useEffect(() => {
    if (!tournament) return;
    
    // Fetch live slots
    const loadSlots = async () => {
      try {
        const liveSlots = await fetchTournamentSlots(tournament.id);
        setSlots(liveSlots);
      } catch(err) {
        setSlots('error');
      }
    };
    loadSlots();
    const interval = setInterval(loadSlots, 15000);
    return () => clearInterval(interval);
  }, [tournament]);

  useEffect(() => {
    if (!tournament) return;
    const deadlineStr = tournament.registrationDeadline;
    if (!deadlineStr || deadlineStr === 'TBD') {
      setTimeLeft('TBD');
      return;
    }
    const deadline = new Date(deadlineStr).getTime();
    
    const timer = setInterval(() => {
      const diff = deadline - new Date().getTime();
      if (diff < 0) {
        setTimeLeft('OFFLINE');
        clearInterval(timer);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(d).padStart(2,'0')}:${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [tournament]);


  if (!tournament) {
    return <Navigate to="/404" replace />;
  }

  const mapAccentClasses = ['mc-green', 'mc-orange', 'mc-yellow', 'mc-red', 'mc-amber', 'mc-cyan'];

  return (
    <>
      <div className="bg-void-engine"></div>
      <div className="bg-scanlines"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-12 flex-grow">
        
        {/* HEADER SECTION */}
        <header className="text-center mb-12 flex flex-col items-center relative">
          <span className="absolute top-0 left-5 font-body text-[0.5rem] text-white/20 uppercase tracking-widest pointer-events-none">INIT_SEQ // 0x4F9A</span>
          <span className="absolute top-0 right-5 font-body text-[0.5rem] text-white/20 uppercase tracking-widest pointer-events-none">SYS_STATUS // ONLINE</span>

          <img 
            src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png" 
            alt="Pixel Palace Logo" 
            className="w-40 h-40 md:w-56 md:h-56 object-contain mb-[-10px] relative z-20 cursor-crosshair transition-all duration-500 hover:drop-shadow-[0_0_20px_rgba(240,0,255,0.6)] drop-shadow-[0_0_20px_rgba(240,0,255,0.4)]"
          />
          
          <h1 className="text-5xl sm:text-[5rem] md:text-[6.5rem] font-black text-white italic tracking-tighter font-heading leading-none relative z-10 drop-shadow-2xl uppercase">
            PIXEL PALACE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-white to-neon-cyan inline-block tracking-tight">
              {tournament.name.replace('Pixel Palace ', '')}
            </span>
          </h1>

          <div className="flex items-center justify-center w-full max-w-md mx-auto mt-2 mb-8 relative z-20 opacity-80">
            <div className="h-[1px] bg-zinc-500 w-12 sm:w-24"></div>
            <div className="px-6 py-1 tracking-[0.3em] font-bold text-lg sm:text-xl text-white font-body uppercase">
              {tournament.tournamentDate}
            </div>
            <div className="h-[1px] bg-zinc-500 w-12 sm:w-24"></div>
          </div>
          
          {/* HUD STATS PANEL */}
          <div className="w-full max-w-4xl mx-auto mt-6 relative z-20">
            <div className="hud-crosshair tl"></div><div className="hud-crosshair tr"></div>
            <div className="hud-crosshair bl"></div><div class="hud-crosshair br"></div>
            <div className="glass-panel p-2 grid grid-cols-2 md:grid-cols-4 gap-1">
              <div className="bg-black/40 p-4 text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Live Slots</p>
                {!slots ? (
                   <div className="text-neon-cyan font-heading text-xl animate-pulse">LOADING</div>
                ) : slots === 'error' ? (
                   <div className="text-red-500 font-heading text-xl">ERROR</div>
                ) : (
                  <div className="text-sm font-heading font-bold text-neon-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                    <div>INVITE: {slots.inviteConfirmed || 0} / {tournament.inviteSlots}</div>
                    <div>OPEN: {slots.openConfirmed || 0} / {tournament.openSlots}</div>
                  </div>
                )}
              </div>
              <div className="bg-black/40 p-4 text-center flex flex-col justify-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Prize Pool</p>
                <p className="text-3xl text-white font-heading leading-none">{tournament.prizePool}</p>
              </div>
              <div className="bg-black/40 p-4 text-center relative group cursor-help flex flex-col justify-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Format</p>
                <p className="text-3xl text-neon-pink font-heading leading-none drop-shadow-[0_0_10px_rgba(240,0,255,0.5)]">{tournament.format}</p>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-max px-4 py-2 bg-black border border-neon-pink text-white text-xs font-body font-bold tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-[0_0_15px_rgba(240,0,255,0.3)]">
                  {tournament.gameMode.toUpperCase()} FORMAT | BO3 Finals
                </div>
              </div>
              <div className="bg-black/40 p-4 text-center flex flex-col justify-center items-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Security</p>
                <p className="text-sm font-body text-green-400 font-bold tracking-widest mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> {tournament.antiCheat.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* SOCIAL LINKS ROW */}
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-6 w-full sm:w-auto relative z-10">
            <a href="https://discord.gg/y6ZW8jHn2Q" target="_blank" rel="noreferrer" className="glass-panel px-8 py-3 flex items-center justify-center gap-3 group hover:bg-neon-purple/20 transition-all duration-300">
              <MessageCircle className="w-5 h-5 text-neon-cyan group-hover:text-white transition-colors" />
              <span className="font-bold text-lg uppercase tracking-widest text-white font-body">JOIN DISCORD SERVER</span>
            </a>
            <a href="https://www.twitch.tv/pXpLgg" target="_blank" rel="noreferrer" className="glass-panel px-8 py-3 flex items-center justify-center gap-3 group hover:bg-[#6441a5]/20 transition-all duration-300">
              <Tv className="w-5 h-5 text-[#9146FF] group-hover:text-white transition-colors" />
              <span className="font-bold text-lg uppercase tracking-widest text-white font-body">WATCH TWITCH STREAM</span>
            </a>
          </div>

          {/* NAVIGATION TABS */}
          <div className="flex justify-center gap-12 w-full max-w-2xl mt-16 relative">
            <div className="absolute bottom-0 w-full h-[1px] bg-white/10"></div>
            <button 
              onClick={() => setActiveTab('register')}
              className={`font-heading text-3xl uppercase tracking-[2px] pb-[5px] relative transition-all duration-300 ${activeTab === 'register' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
            >
              Register Team
              <div className={`absolute bottom-[-1px] left-1/2 -translate-x-1/2 h-[3px] bg-neon-cyan shadow-[0_0_15px_rgba(0,240,255,1)] transition-all duration-300 ${activeTab === 'register' ? 'w-full' : 'w-0'}`}></div>
            </button>
            <button 
              onClick={() => setActiveTab('tracker')}
              className={`font-heading text-3xl uppercase tracking-[2px] pb-[5px] relative transition-all duration-300 flex items-center gap-3 ${activeTab === 'tracker' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
            >
              Live Roster Tracker
              <span className="bg-neon-pink text-white text-[10px] px-2 py-0.5 rounded-sm font-sans font-bold tracking-widest animate-pulse">LIVE</span>
              <div className={`absolute bottom-[-1px] left-1/2 -translate-x-1/2 h-[3px] bg-neon-cyan shadow-[0_0_15px_rgba(0,240,255,1)] transition-all duration-300 ${activeTab === 'tracker' ? 'w-full' : 'w-0'}`}></div>
            </button>
          </div>
        </header>

        {activeTab === 'register' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
            {/* LEFT SIDEBAR */}
            <div className="lg:col-span-4 space-y-8">
              
              <div className="glass-panel p-6 border-l-4 border-l-red-500 bg-red-950/20">
                <h3 className="text-2xl text-white font-heading mb-4 flex items-center gap-2 uppercase">
                  <AlertOctagon className="w-6 h-6 text-red-500" /> CRITICAL REQUIREMENTS
                </h3>
                <ul className="space-y-4 font-body text-sm">
                  <li className="flex gap-3 items-start bg-black/30 p-3 rounded border border-white/5">
                    <MessageCircle className="w-5 h-5 text-[#5865F2] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white uppercase tracking-widest font-bold">Mandatory Discord</strong>
                      <p className="text-zinc-400 leading-tight mt-1">
                        All players MUST be in the Pixel Palace Discord server. Failure to join results in disqualification.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start bg-black/30 p-3 rounded border border-white/5">
                    <Target className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white uppercase tracking-widest font-bold">Registration Status</strong>
                      <p className="text-zinc-400 leading-tight mt-1">
                        Invite codes unlock priority slots ({tournament.inviteSlots} available). Open registration fills remaining {tournament.openSlots} slots. Limited to {tournament.maxTeams} total teams.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="glass-panel p-6">
                <div className="hud-crosshair tl"></div><div className="hud-crosshair br"></div>
                <h3 className="text-3xl text-white font-heading mb-4 flex items-center gap-3 border-b border-white/10 pb-3 uppercase">
                  <Target className="w-6 h-6 text-neon-cyan" /> Tournament Info
                </h3>
                <div className="space-y-5 font-body">
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">01 // TOURNAMENT DATE</p>
                    <p className="text-xl font-bold text-neon-cyan mt-1 uppercase">DATE: {tournament.tournamentDate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">02 // START TIME</p>
                    <p className="text-xl font-bold text-white mt-1 uppercase">{tournament.startTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">03 // GAME MODE</p>
                    <p className="text-xl font-bold text-white mt-1 uppercase">{tournament.gameMode}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">04 // REGISTRATION DEADLINE</p>
                    <p className="text-xl font-bold text-white mt-1 uppercase">{new Date(tournament.registrationDeadline).toUTCString().replace('GMT', 'GMT')} </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 border-l-4 border-l-neon-pink">
                <p className="text-[10px] uppercase tracking-[0.3em] text-neon-pink mb-2 font-bold font-body">Registration Closes In</p>
                <p className={`text-5xl font-heading tracking-widest ${timeLeft === 'OFFLINE' ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-white drop-shadow-[0_0_15px_rgba(240,0,255,0.5)]'}`}>
                  {timeLeft}
                </p>
              </div>

              <div className="glass-panel p-6">
                <h3 className="text-2xl text-white font-heading mb-4 flex items-center gap-2 uppercase">
                  <ShieldAlert className="w-5 h-5 text-red-500" /> Anti-Cheat Protocols
                </h3>
                <ul className="text-sm space-y-3 text-zinc-300 font-body mb-5">
                  <li className="flex gap-3 items-start">
                    <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-tight"><strong>Akros Anti-Cheat</strong> is 100% required. No exceptions.</span>
                  </li>
                </ul>
                <a href="https://akros.ac/#downloadSteps" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black text-sm font-bold uppercase tracking-widest transition-all font-body rounded shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  <Download className="w-4 h-4" /> Download Akros Client
                </a>
              </div>

              {tournament.maps && tournament.maps.length > 0 && (
                <div className="glass-panel p-6">
                  <h3 className="text-2xl text-white font-heading mb-4 flex items-center gap-2 uppercase">
                    <Layers className="w-5 h-5 text-zinc-400" /> {tournament.gameMode} Map Pool
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {tournament.maps.map((mapName, i) => (
                      <div key={mapName} className={`map-card ${mapAccentClasses[i % mapAccentClasses.length]}`}>
                        <div 
                          className="map-card-img" 
                          style={{ backgroundImage: `url('https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_${mapName.toLowerCase()}.png')` }}
                          onError={(e) => e.target.style.backgroundImage = 'none'}
                        ></div>
                        <div className="map-card-overlay"></div>
                        <div className="map-card-content justify-center w-full">
                          <span className="text-sm font-bold uppercase font-heading tracking-widest">{mapName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT FORM */}
            <div className="lg:col-span-8">
              {timeLeft === 'OFFLINE' ? (
                <div className="glass-panel p-16 text-center text-red-500 flex flex-col items-center">
                  <AlertOctagon className="w-24 h-24 mb-6" />
                  <h2 className="text-5xl font-heading font-black uppercase">REGISTRATION OFFLINE</h2>
                  <p className="mt-4 font-body uppercase text-sm tracking-widest text-zinc-400">The registration deadline has passed.</p>
                </div>
              ) : (
                <TournamentForm tournament={tournament} />
              )}
            </div>
          </div>
        ) : (
          /* LIVE ROSTER TRACKER VIEW */
          <div className="max-w-6xl mx-auto">
            <div className="glass-panel p-8 min-h-[600px]">
              <div className="hud-crosshair tl"></div><div className="hud-crosshair tr"></div>
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
                <h2 className="text-4xl text-white font-heading tracking-wider leading-none uppercase">Registered Teams</h2>
                 <button className="text-zinc-400 hover:text-neon-cyan flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors bg-black/50 px-5 py-3 border border-white/10 hover:border-neon-cyan/50 font-body">
                   <RefreshCw className="w-4 h-4" /> Refresh Tracker
                 </button>
              </div>

              <div className="text-center py-32 text-zinc-500 flex flex-col items-center justify-center">
                 <Loader2 className="w-12 h-12 animate-spin mb-6 text-neon-pink drop-shadow-[0_0_10px_rgba(240,0,255,0.5)]" />
                 <span className="font-bold tracking-[0.3em] uppercase text-sm font-body">Fetching Database...</span>
                 <p className="mt-8 text-[10px] text-zinc-600 border border-dashed border-white/10 p-4 rounded-lg">Tracker endpoint requires Phase 2 configuration.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="w-full bg-black/90 border-t border-white/10 mt-20 py-12 relative z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
          <div className="flex items-center gap-5 justify-center md:justify-start group cursor-pointer">
            <img src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png" alt="Logo" className="w-16 h-16 object-contain filter grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0 group-hover:drop-shadow-[0_0_15px_rgba(240,0,255,0.5)] transition-all duration-500" />
            <div className="h-12 w-[2px] bg-white/10 group-hover:bg-neon-pink transition-colors"></div>
            <div className="text-left flex flex-col justify-center">
              <h4 className="font-heading text-3xl text-zinc-300 group-hover:text-white leading-none tracking-[0.15em] transition-colors">PIXEL PALACE</h4>
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mt-1 font-bold font-body">
                © 2026 Sovereign Systems
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
             <span className="text-[8px] uppercase tracking-[0.5em] text-zinc-700 font-bold mb-2 font-body">Engineered By</span>
             <a href="https://discordapp.com/users/bravo.gg" target="_blank" rel="noreferrer" className="text-lg font-black tracking-[0.3em] uppercase text-zinc-400 hover:text-white hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 font-heading">
                BRAVO<span className="text-neon-pink">.</span>GG
             </a>
          </div>

          <div className="flex items-center justify-center md:justify-end">
            <a href="https://discord.gg/xGMZ5wrgUd" target="_blank" rel="noreferrer" className="group flex items-center gap-4 px-6 py-3 bg-black border border-white/10 hover:border-neon-cyan transition-all duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(0,240,255,0.2)]">
                <div className="bg-zinc-900 group-hover:bg-neon-cyan/20 p-2.5 rounded-sm transition-colors">
                    <ShieldAlert className="w-5 h-5 text-zinc-500 group-hover:text-neon-cyan transition-colors" />
                </div>
                <div className="flex flex-col text-left font-body">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 leading-none">Need Backup?</span>
                    <span className="text-sm font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white mt-1.5 leading-none transition-colors">Contact Support</span>
                </div>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};
