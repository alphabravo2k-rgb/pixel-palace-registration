import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { getTournamentBySlug } from '../config/tournaments';
import { fetchTournamentSlots, fetchTournamentTeams } from '../services/sheets';
import { TournamentForm } from '../components/forms/TournamentForm';
import { TournamentInfo } from '../components/registration/TournamentInfo';
import { formatEsportsDate } from '../utils/dateHelper';
import { MessageCircle, Tv, AlertOctagon, Target, ShieldAlert, Layers, Download, Loader2, ShieldCheck, RefreshCw, ChevronLeft } from 'lucide-react';

export const Register = () => {
  const { tournamentSlug } = useParams();
  const tournament = getTournamentBySlug(tournamentSlug);
  const [activeTab, setActiveTab] = useState('register');
  const [slots, setSlots] = useState(null);
  const [teams, setTeams] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [failedMapImages, setFailedMapImages] = useState(new Set());

  const handleMapImgError = useCallback((mapName) => {
    setFailedMapImages(prev => new Set([...prev, mapName]));
  }, []);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState('LOADING');

  useEffect(() => {
    if (!tournament) return;
    
    // Fetch live slots & teams
    const loadData = async () => {
      try {
        const [liveSlots, liveTeams] = await Promise.all([
          fetchTournamentSlots(tournament.id),
          fetchTournamentTeams(tournament.id)
        ]);
        setSlots(liveSlots);
        setTeams(liveTeams?.teams || []);
      } catch(err) {
        setSlots('error');
        setTeams('error');
      }
    };
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [tournament]);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const liveTeams = await fetchTournamentTeams(tournament.id);
      setTeams(liveTeams?.teams || []);
    } catch {
      setTeams('error');
    } finally {
      setIsRefreshing(false);
    }
  };

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
      <div className="app-bg-void"></div>
      <div className="app-bg-scanlines"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-12 flex-grow">
        
        {/* TOP HUB NAVIGATION */}
        <div className="absolute top-4 left-4 md:top-8 md:left-8 z-50">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-zinc-500 hover:text-neon-cyan transition-all duration-300 group font-body text-[10px] font-bold tracking-[0.3em] uppercase bg-black/40 px-4 py-2 border border-white/5 rounded hover:border-neon-cyan/30"
          >
            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            <span>BACK TO HUB</span>
          </Link>
        </div>

        {/* HEADER SECTION */}
        <header className="text-center mb-12 flex flex-col items-center relative">
          <span className="absolute top-0 left-5 font-body text-[0.5rem] text-white/20 uppercase tracking-widest pointer-events-none">INIT_SEQ // 0x4F9A</span>
          <span className="absolute top-0 right-5 font-body text-[0.5rem] text-white/20 uppercase tracking-widest pointer-events-none">SYS_STATUS // ONLINE</span>

          <Link to="/" className="relative group block cursor-pointer">
            <div className="absolute inset-0 bg-neon-pink/20 blur-[60px] rounded-full scale-150 opacity-40 group-hover:opacity-80 transition-opacity duration-700 animate-pulse-fast"></div>
            <img 
              src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png" 
              alt="Pixel Palace Logo" 
              className="w-40 h-40 md:w-56 md:h-56 object-contain mb-[-10px] relative z-20 transition-all duration-500 hover:scale-105 animate-logo-breathe hover:drop-shadow-[0_0_30px_rgba(240,0,255,0.8)]"
            />
          </Link>
          
          <h1 className="text-5xl sm:text-[5rem] md:text-[6.5rem] font-black text-white italic tracking-tighter font-heading leading-none relative z-10 drop-shadow-2xl uppercase">
            PIXEL PALACE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-white to-neon-cyan inline-block tracking-tight">
              {tournament.name.replace('Pixel Palace ', '')}
            </span>
          </h1>

          <div className="flex items-center justify-center w-full max-w-2xl mx-auto mt-2 mb-8 relative z-20">
            {tournament.displayTime ? (
              <div className="flex flex-col items-center gap-1">
                <div className="text-neon-cyan font-heading text-2xl tracking-[0.2em] font-black drop-shadow-[0_0_10px_rgba(0,240,255,0.4)] uppercase">
                  {tournament.displayTime}
                </div>
                <div className="flex items-center gap-4 w-full">
                  <div className="h-[1px] bg-white/10 flex-grow"></div>
                  <div className="font-heading text-4xl text-white italic tracking-tighter uppercase whitespace-nowrap px-2">
                    {tournament.displayDate}
                  </div>
                  <div className="h-[1px] bg-white/10 flex-grow"></div>
                </div>
                <div className="text-zinc-500 font-body text-xl font-bold tracking-[0.5em] uppercase">
                  {tournament.displayYear}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6 w-full opacity-80">
                <div className="h-[1px] bg-zinc-500 flex-grow"></div>
                <div className="px-6 py-1 tracking-[0.3em] font-bold text-lg sm:text-xl text-white font-body uppercase">
                  {formatEsportsDate(tournament.tournamentDate)}
                </div>
                <div className="h-[1px] bg-zinc-500 flex-grow"></div>
              </div>
            )}
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

              <TournamentInfo tournament={tournament} />

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
                    {tournament.maps.map((mapName, i) => {
                      const imgUrl = `https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_${mapName.toLowerCase()}.png`;
                      const hasFailed = failedMapImages.has(mapName);
                      return (
                        <div key={mapName} className={`map-card ${mapAccentClasses[i % mapAccentClasses.length]}`}>
                          {!hasFailed ? (
                            <div
                              className="map-card-img"
                              style={{ backgroundImage: `url('${imgUrl}')` }}
                              onError={() => handleMapImgError(mapName)}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-black/80 z-10" />
                          )}
                          <div className="map-card-overlay" />
                          <div className="map-card-content justify-center w-full">
                            <span className="text-sm font-bold uppercase font-heading tracking-widest">{mapName}</span>
                          </div>
                        </div>
                      );
                    })}
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
                 <button 
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="text-zinc-400 hover:text-neon-cyan flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors bg-black/50 px-5 py-3 border border-white/10 hover:border-neon-cyan/50 font-body disabled:opacity-50"
                 >
                   <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                   {isRefreshing ? 'REFRESHING...' : 'REFRESH TRACKER'}
                 </button>
              </div>

              {!teams ? (
                <div className="text-center py-32 text-zinc-500 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin mb-6 text-neon-pink drop-shadow-[0_0_10px_rgba(240,0,255,0.5)]" />
                  <span className="font-bold tracking-[0.3em] uppercase text-sm font-body">Fetching Database...</span>
                </div>
              ) : teams === 'error' ? (
                <div className="text-center py-32 text-red-500 flex flex-col items-center justify-center bg-red-950/10 border border-dashed border-red-500/20 rounded-md">
                   <AlertOctagon className="w-12 h-12 mb-6" />
                   <span className="font-heading text-2xl uppercase">CONNECTION FAILED</span>
                   <p className="text-xs font-body opacity-60 mt-2 uppercase tracking-widest">Could not stabilize link to the master raw data sheet.</p>
                </div>
              ) : teams.length === 0 ? (
                <div className="text-center py-32 text-zinc-600 flex flex-col items-center justify-center">
                   <Layers className="w-12 h-12 mb-6 opacity-20" />
                   <span className="font-heading text-2xl uppercase tracking-widest">SYSTEMS COLD</span>
                   <p className="text-xs font-body opacity-60 mt-2 uppercase tracking-widest">No teams have initialized registration for this event yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teams.map((team, idx) => (
                    <div key={`${team.name}-${idx}`} className="glass-panel p-0 overflow-hidden group/team hover:border-neon-cyan/50 transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                      <div className="flex items-stretch h-20 bg-black/40">
                        <div className="w-20 bg-zinc-900 flex-shrink-0 flex items-center justify-center border-r border-white/5 relative overflow-hidden">
                          <img 
                            src={team.logo} 
                            alt={team.name} 
                            className="w-12 h-12 object-contain relative z-10 group-hover/team:scale-110 transition-transform duration-500"
                            onError={(e) => { e.target.src = 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png'; e.target.className += ' opacity-20 grayscale'; }}
                          />
                        </div>
                        <div className="flex-grow p-4 flex flex-col justify-center min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] bg-neon-cyan/10 text-neon-cyan px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-neon-cyan/20">
                              {team.tag || 'TEAM'}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">
                              #{String(idx + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <h4 className="text-lg font-heading text-white truncate leading-none uppercase tracking-wider group-hover/team:text-neon-cyan transition-colors">
                            {team.name}
                          </h4>
                        </div>
                      </div>
                      <div className="bg-black/60 p-3 px-4 flex justify-between items-center border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] font-body">STATUS: {team.status || 'VERIFIED'}</span>
                        </div>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest font-body">ACCESS SECURED</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>


    </>
  );
};
