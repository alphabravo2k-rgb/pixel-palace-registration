import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { getTournamentBySlug } from '../config/tournaments';
import { fetchTournamentSlots, fetchTournamentTeams, fetchTournamentBracket } from '../services/sheets';
import { formatEsportsDate } from '../utils/dateHelper';
import { DiscordGate } from '../components/modals/DiscordGate';
import { MessageCircle, Tv, Trophy, ShieldCheck, ChevronLeft } from 'lucide-react';
import { TeamProfileModal } from '../components/modals/TeamProfileModal';
import { Terminal } from '../utils/logger';
import { useAudio } from '../hooks/useAudio';
import { formatLocalTime } from '../utils/timezone';

// Decomposed Tab Components
import { RegistrationTab } from '../components/registration/RegistrationTab';
import { TrackerTab } from '../components/registration/TrackerTab';
import { BracketsTab } from '../components/registration/BracketsTab';
import { ResultsTab } from '../components/registration/ResultsTab';

export const Register = () => {
  const { tournamentSlug } = useParams();
  const { playHover, playClick } = useAudio();
  const tournament = getTournamentBySlug(tournamentSlug);
  const isArchived = tournament?.status === 'ARCHIVED';
  const [activeTab, setActiveTab] = useState(() => {
    if (tournament?.status === 'ARCHIVED' && tournament?.tournamentComplete) return 'results';
    if (tournament?.status === 'ARCHIVED' && tournament?.bracketsEnabled) return 'brackets';
    if (tournament?.status === 'ARCHIVED') return 'teams';
    return 'register';
  });

  useEffect(() => {
    Terminal.log('UI', 'Register Layout Rendered', { activeTab });
  }, [activeTab]);

  const [slots, setSlots] = useState(null);
  const [teams, setTeams] = useState(null);
  const [bracketData, setBracketData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [failedMapImages, setFailedMapImages] = useState(new Set());

  const handleMapImgError = useCallback((mapName) => {
    setFailedMapImages(prev => new Set([...prev, mapName]));
  }, []);
  
  const [timeLeft, setTimeLeft] = useState('LOADING');
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!tournament || isArchived) return;
    
    const loadData = async () => {
      if (retryCount >= 4) {
        Terminal.error('SYNC', 'Uplink lost after multiple retries. Polling stopped.');
        return;
      }

      Terminal.network('Initiating uplink to Admin Ops Board...', { tournamentId: tournament.id });
      try {
        const [liveSlots, liveTeams, liveBracket] = await Promise.all([
          fetchTournamentSlots(tournament.id),
          fetchTournamentTeams(tournament.id),
          tournament.bracketsEnabled ? fetchTournamentBracket(tournament.id) : Promise.resolve(null)
        ]);
        
        setSlots(liveSlots);
        setTeams(liveTeams?.teams || []);
        if (liveBracket) setBracketData(liveBracket);
        setRetryCount(0);
        Terminal.success('Data synchronized successfully.');
      } catch (err) {
        Terminal.error('SYNC', 'Failed to retrieve live data from uplink.', err);
        setSlots('error');
        setTeams('error');
        setBracketData('error');
        setRetryCount(prev => prev + 1);
      }
    };

    loadData();
    const backoffTime = 45000 * Math.pow(2, Math.min(retryCount, 3));
    const interval = setInterval(loadData, backoffTime);
    
    return () => clearInterval(interval);
  }, [tournament, retryCount, isArchived]);

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

  return (
    <>
      <DiscordGate tournament={tournament} />
      {selectedTeam && <TeamProfileModal team={selectedTeam} isOpen={!!selectedTeam} onClose={() => setSelectedTeam(null)} />}
      
      <div className="min-h-screen bg-[#050507] text-white selection:bg-neon-cyan/30 flex flex-col relative overflow-x-hidden">
        <div className="app-bg-void"></div>
        <div className="app-bg-scanlines"></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 md:py-12 flex-grow">
          <nav className="absolute top-0 left-4 md:left-8 z-50 pt-6 animate-in fade-in duration-1000">
            <Link to="/" className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-neon-cyan/50 px-5 py-2.5 rounded-sm transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <div className="w-5 h-5 flex items-center justify-center bg-zinc-900 rounded-full border border-white/10 group-hover:border-neon-cyan/50 transition-colors"><ChevronLeft className="w-3 h-3 text-zinc-400 group-hover:text-neon-cyan transition-colors" /></div>
              <div className="flex flex-col"><span className="text-white font-heading text-xs tracking-[0.2em] font-bold group-hover:text-neon-cyan transition-colors">BACK TO HUB</span><span className="text-[7px] text-zinc-500 tracking-[0.4em] font-body uppercase opacity-60 group-hover:opacity-100 transition-all font-bold">EXIT PROTOCOL</span></div>
            </Link>
          </nav>

          <header className="text-center mb-12 flex flex-col items-center relative pt-12 md:pt-4">
            <span className="absolute top-0 left-5 font-body text-[0.5rem] text-white/20 uppercase tracking-widest pointer-events-none">INIT_SEQ // 0x4F9A</span>
            <span className="absolute top-0 right-5 font-body text-[0.5rem] text-white/20 uppercase tracking-widest pointer-events-none">SYS_STATUS // ONLINE</span>
            <Link to="/" className="relative group block cursor-pointer mb-2">
              <div className="absolute inset-0 bg-neon-pink/20 blur-[60px] rounded-full scale-150 opacity-40 group-hover:opacity-80 transition-opacity duration-700 animate-pulse-fast"></div>
              <img src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png" alt="Pixel Palace Logo" className="w-40 h-40 md:w-56 md:h-56 object-contain relative z-20 transition-all duration-500 hover:scale-105 animate-logo-breathe hover:drop-shadow-[0_0_30px_rgba(240,0,255,0.8)]" />
            </Link>
            <h1 className="text-5xl sm:text-[5rem] md:text-[6.5rem] font-black text-white italic tracking-tighter font-heading leading-none relative z-10 drop-shadow-2xl uppercase">
              PIXEL PALACE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-white to-neon-cyan inline-block tracking-tight">{tournament.name.replace('Pixel Palace ', '')}</span>
            </h1>

            <div className="flex items-center justify-center w-full max-w-2xl mx-auto mt-2 mb-8 relative z-20">
              {isArchived && tournament.champion ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="text-[10px] text-yellow-500/70 font-bold uppercase tracking-[0.4em] font-body">Winner Declared // {tournament.displayDate} {tournament.displayYear}</div>
                  <div className="flex items-center gap-4">
                    <Trophy className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)] shrink-0" />
                    <div className="text-4xl md:text-6xl font-heading uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 drop-shadow-[0_0_20px_rgba(234,179,8,0.5)] shimmer-effect">{tournament.champion.name}</div>
                    <Trophy className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)] shrink-0" />
                  </div>
                  <div className="text-zinc-500 font-body text-sm font-bold tracking-[0.3em] uppercase">Grand Champions — {tournament.gameMode}</div>
                </div>
              ) : tournament.displayTime ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="text-neon-cyan font-heading text-2xl tracking-[0.2em] font-black drop-shadow-[0_0_10px_rgba(0,240,255,0.4)] uppercase">{tournament.displayTime}</div>
                  <div className="flex items-center gap-4 w-full"><div className="h-[1px] bg-white/10 flex-grow"></div><div className="font-heading text-4xl text-white italic tracking-tighter uppercase whitespace-nowrap px-2">{tournament.displayDate}</div><div className="h-[1px] bg-white/10 flex-grow"></div></div>
                  <div className="text-zinc-500 font-body text-xl font-bold tracking-[0.5em] uppercase">{tournament.displayYear}</div>
                </div>
              ) : <div className="flex items-center gap-6 w-full opacity-80"><div className="h-[1px] bg-zinc-500 flex-grow"></div><div className="px-6 py-1 tracking-[0.3em] font-bold text-lg sm:text-xl text-white font-body uppercase">{formatEsportsDate(tournament.tournamentDate)}</div><div className="h-[1px] bg-zinc-500 flex-grow"></div></div>}
            </div>

            <div className="w-full max-w-4xl mx-auto mt-6 relative z-20">
              <div className="hud-crosshair tl"></div><div className="hud-crosshair tr"></div><div className="hud-crosshair bl"></div><div className="hud-crosshair br"></div>
              <div className="glass-panel p-2 grid grid-cols-2 md:grid-cols-4 gap-1">
                {isArchived ? (
                  <div className="bg-yellow-500/10 border-r border-yellow-500/20 p-4 text-center flex flex-col items-center justify-center">
                    <p className="text-[10px] text-yellow-500 uppercase tracking-[0.2em] font-bold mb-1">Season Status</p>
                    <p className="text-sm font-heading font-bold text-yellow-400 tracking-widest">CONCLUDED</p>
                  </div>
                ) : (
                  <div className="bg-black/40 p-4 text-center flex flex-col justify-center">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Slots (Filled / Total)</p>
                    {!slots ? (
                      <div className="text-neon-cyan font-heading text-xl animate-pulse">LOADING</div>
                    ) : slots === 'error' ? (
                      <div className="text-red-500 font-heading text-xl">OFFLINE</div>
                    ) : (
                      <div className="text-sm font-heading font-bold text-neon-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                        <div>INVITE: {slots.inviteConfirmed || 0} / {tournament.inviteSlots}</div>
                        <div>OPEN: {slots.openConfirmed || 0} / {tournament.openSlots}</div>
                      </div>
                    )}
                  </div>
                )}
                <div className="bg-black/40 p-4 text-center flex flex-col justify-center"><p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Prize Pool</p><p className="text-3xl text-white font-heading leading-none">{tournament.prizePool}</p></div>
                <div className="bg-black/40 p-4 text-center relative group cursor-help flex flex-col justify-center"><p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Format</p><p className="text-3xl text-neon-pink font-heading leading-none drop-shadow-[0_0_10px_rgba(240,0,255,0.5)]">{tournament.format}</p><div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-max px-4 py-2 bg-black border border-neon-pink text-white text-xs font-body font-bold tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-[0_0_15px_rgba(240,0,255,0.3)]">{tournament.gameMode.toUpperCase()} FORMAT | BO3 Finals</div></div>
                <div className="bg-black/40 p-4 text-center flex flex-col justify-center items-center"><p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Anti Cheat</p><p className="text-sm font-body text-green-400 font-bold tracking-widest mt-1 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> {tournament.antiCheat.toUpperCase()}</p></div>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-6 w-full sm:w-auto relative z-10">
              <a href="https://discord.gg/y6ZW8jHn2Q" target="_blank" rel="noreferrer" className="glass-panel px-8 py-3 flex items-center justify-center gap-3 group hover:bg-neon-purple/20 transition-all duration-300"><MessageCircle className="w-5 h-5 text-neon-cyan group-hover:text-white transition-colors" /><span className="font-bold text-lg uppercase tracking-widest text-white font-body">JOIN DISCORD SERVER</span></a>
              <a href="https://www.twitch.tv/pXpLgg" target="_blank" rel="noreferrer" className="glass-panel px-8 py-3 flex items-center justify-center gap-3 group hover:bg-[#6441a5]/20 transition-all duration-300"><Tv className="w-5 h-5 text-[#9146FF] group-hover:text-white transition-colors" /><span className="font-bold text-lg uppercase tracking-widest text-white font-body">WATCH TWITCH STREAM</span></a>
            </div>

            <div className="flex justify-center gap-6 sm:gap-12 w-full max-w-4xl mt-16 relative px-4 flex-wrap pb-4 sm:pb-0 sticky top-4 z-40 bg-[#050507]/90 backdrop-blur-md pt-4 rounded-t-xl border-t border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              <div className="hidden sm:block absolute bottom-0 w-full h-[1px] bg-white/10"></div>
              {tournament.tournamentComplete && (
                <button onClick={() => setActiveTab('results')} className={`font-heading text-xl sm:text-3xl uppercase tracking-[2px] pb-[5px] relative transition-all duration-300 flex items-center gap-3 ${activeTab === 'results' ? 'text-yellow-400' : 'text-white/40 hover:text-white/80'}`}>
                  Results<span className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-[10px] px-2 py-0.5 rounded-sm font-sans font-bold tracking-widest">FINAL</span>
                  <div className={`absolute bottom-[-1px] left-1/2 -translate-x-1/2 h-[3px] bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,1)] transition-all duration-300 ${activeTab === 'results' ? 'w-full' : 'w-0'}`}></div>
                </button>
              )}
              {!isArchived && <button onClick={() => setActiveTab('register')} className={`font-heading text-xl sm:text-3xl uppercase tracking-[2px] pb-[5px] relative transition-all duration-300 ${activeTab === 'register' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}>Register Team<div className={`absolute bottom-[-1px] left-1/2 -translate-x-1/2 h-[3px] bg-neon-cyan shadow-[0_0_15px_rgba(0,240,255,1)] transition-all duration-300 ${activeTab === 'register' ? 'w-full' : 'w-0'}`}></div></button>}
              <button onClick={() => setActiveTab('teams')} className={`font-heading text-xl sm:text-3xl uppercase tracking-[2px] pb-[5px] relative transition-all duration-300 flex items-center gap-3 ${activeTab === 'teams' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}>
                {isArchived ? 'All Teams' : 'Registered Teams'}
                {!isArchived && <span className="bg-neon-pink text-white text-[10px] px-2 py-0.5 rounded-sm font-sans font-bold tracking-widest animate-pulse">LIVE</span>}
                <div className={`absolute bottom-[-1px] left-1/2 -translate-x-1/2 h-[3px] bg-neon-cyan shadow-[0_0_15px_rgba(0,240,255,1)] transition-all duration-300 ${activeTab === 'teams' ? 'w-full' : 'w-0'}`}></div>
              </button>
              {tournament.bracketsEnabled && <button onClick={() => setActiveTab('brackets')} className={`font-heading text-xl sm:text-3xl uppercase tracking-[2px] pb-[5px] relative transition-all duration-300 ${activeTab === 'brackets' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}>Brackets<div className={`absolute bottom-[-1px] left-1/2 -translate-x-1/2 h-[3px] bg-neon-cyan shadow-[0_0_15px_rgba(0,240,255,1)] transition-all duration-300 ${activeTab === 'brackets' ? 'w-full' : 'w-0'}`}></div></button>}
            </div>
          </header>

          <div className="tab-content-wrapper mt-8">
            {activeTab === 'register' && (
              <RegistrationTab 
                tournament={tournament} 
                slots={slots} 
                timeLeft={timeLeft} 
                failedMapImages={failedMapImages} 
                handleMapImgError={handleMapImgError} 
              />
            )}

            {(activeTab === 'tracker' || activeTab === 'teams') && (
              <TrackerTab 
                isArchived={isArchived}
                handleManualRefresh={handleManualRefresh}
                isRefreshing={isRefreshing}
                teams={teams}
                playHover={playHover}
                playClick={playClick}
                setSelectedTeam={setSelectedTeam}
                tournament={tournament}
              />
            )}

            {activeTab === 'brackets' && (
              <BracketsTab 
                bracketData={bracketData}
                tournament={tournament}
                isArchived={isArchived}
                formatLocalTime={formatLocalTime}
              />
            )}
            
            {activeTab === 'results' && (
              <ResultsTab 
                tournament={tournament}
                handleShare={handleShare}
                copied={copied}
                teams={teams}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
