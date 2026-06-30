import { ChevronLeft, Copy, Instagram, MessageCircle, Shield, ShieldCheck, Sparkles, Trophy, Tv, Users } from 'lucide-react';
import React, { useCallback,useEffect, useState } from 'react';
import { Link,Navigate, useParams } from 'react-router-dom';

import { DiscordGate } from '../components/modals/DiscordGate';
import { TeamProfileModal } from '../components/modals/TeamProfileModal';
import { BracketsTab } from '../components/registration/BracketsTab';
// Decomposed Tab Components
import { RegistrationTab } from '../components/registration/RegistrationTab';
import { ResultsTab } from '../components/registration/ResultsTab';
import { TrackerTab } from '../components/registration/TrackerTab';
import { getTournamentBySlug } from '../config/tournaments';
import { useAudio } from '../hooks/useAudio';
import { fetchTournamentBracket,fetchTournamentSlots, fetchTournamentTeams } from '../services/sheets';
import { formatEsportsDate } from '../utils/dateHelper';
import { Terminal } from '../utils/logger';
import { formatLocalTime } from '../utils/timezone';

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
  
  const [activeTeam, setActiveTeam] = useState(() => {
    try {
      const stored = localStorage.getItem(`pp_active_team_${tournament?.id}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [showForm, setShowForm] = useState(!activeTeam);
  const [isRulesAccepted, setIsRulesAccepted] = useState(false);

  useEffect(() => {
    const handleSuccess = (e) => {
      setActiveTeam(e.detail);
      setShowForm(false);
    };
    window.addEventListener('pp-registration-success', handleSuccess);
    return () => window.removeEventListener('pp-registration-success', handleSuccess);
  }, [tournament]);

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

  useEffect(() => {
    if (!tournament?.id || isArchived) return;
    
    let active = true;
    let failCount = 0;

    const loadData = async () => {
      if (failCount >= 4) {
        Terminal.error('SYNC', 'Uplink lost after multiple retries. Polling suspended.');
        return;
      }

      Terminal.network('Initiating uplink to Admin Ops Board...', { tournamentId: tournament.id });
      try {
        const [liveSlots, liveTeams, liveBracket] = await Promise.all([
          fetchTournamentSlots(tournament.id),
          fetchTournamentTeams(tournament.id),
          tournament.bracketsEnabled ? fetchTournamentBracket(tournament.id) : Promise.resolve(null)
        ]);
        
        if (!active) return;
        setSlots(liveSlots);
        setTeams(liveTeams?.teams || []);
        if (liveBracket) setBracketData(liveBracket);
        failCount = 0;
        Terminal.success('Data synchronized successfully.');
      } catch (err) {
        if (!active) return;
        Terminal.error('SYNC', 'Failed to retrieve live data from uplink.', err);
        setSlots('error');
        setTeams('error');
        setBracketData('error');
        failCount++;
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000); // Check every 60 seconds
    
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [tournament?.id, isArchived]);

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

  const renderCommandDeck = () => {
    if (!activeTeam) return null;

    const liveTeam = Array.isArray(teams) ? teams.find(t => t.name.toUpperCase() === activeTeam.teamName.toUpperCase()) : null;
    const liveStatus = liveTeam ? liveTeam.status : 'PENDING';

    const statusSteps = [
      { label: "Submitted", active: true, desc: "Roster details serialized" },
      { label: "Under Review", active: liveStatus === "UNDER REVIEW" || liveStatus === "APPROVED" || liveStatus === "VERIFIED", desc: "Verification pending" },
      { label: "Approved", active: liveStatus === "APPROVED" || liveStatus === "VERIFIED", desc: "Roster secured" }
    ];

    const copyId = () => {
      navigator.clipboard.writeText(activeTeam.submissionId);
      Terminal.success("Submission ID copied to clipboard.");
    };

    return (
      <div className="max-w-4xl mx-auto animate-in zoom-in duration-500 relative z-10">
        <div className="glass-panel p-8 border-t-4 border-t-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.1)] relative overflow-hidden bg-gradient-to-b from-yellow-950/10 to-transparent">
          <div className="hud-crosshair tl opacity-50" />
          <div className="hud-crosshair tr opacity-50" />
          <div className="hud-crosshair bl opacity-50" />
          <div className="hud-crosshair br opacity-50" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)] shrink-0">
                <Shield className="w-10 h-10" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-[0.3em] font-body">Captain's Command Deck</div>
                <h2 className="text-4xl text-white font-heading tracking-wider leading-none uppercase mt-1">
                  {activeTeam.teamName} <span className="text-yellow-500">[{activeTeam.teamTag}]</span>
                </h2>
                <p className="text-zinc-500 font-body text-xs uppercase mt-2 tracking-widest font-bold">
                  WELCOME BACK COMMANDER // ACTIVE PROTOCOL CC2
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onMouseEnter={playHover}
                onClick={() => { playClick(); copyId(); }}
                className="flex-grow md:flex-grow-0 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500 hover:text-black text-yellow-500 text-xs font-bold uppercase tracking-widest py-3 px-6 transition-all duration-300 rounded font-body flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy Sub ID
              </button>
              <button 
                onMouseEnter={playHover}
                onClick={() => { playClick(); setIsRulesAccepted(false); setShowForm(true); }}
                className="flex-grow md:flex-grow-0 bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest py-3 px-6 transition-all duration-300 rounded font-body"
              >
                Reregister Team
              </button>
            </div>
          </div>

          <div className="mt-12 bg-black/40 border border-white/5 p-6 rounded-lg text-left">
            <h3 className="text-sm font-bold font-body uppercase text-zinc-400 mb-6 tracking-widest">REGISTRATION STATUS STATE</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {statusSteps.map((step, idx) => (
                <div key={idx} className="relative flex flex-col pl-4 border-l-2 border-l-zinc-800 last:border-0 pb-1 md:pb-0">
                  <div className={`absolute left-[-5px] top-1.5 w-2 h-2 rounded-full ${step.active ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'bg-zinc-800'}`} />
                  <span className={`text-base font-heading uppercase tracking-widest ${step.active ? 'text-yellow-400 font-bold' : 'text-zinc-500'}`}>
                    {step.label}
                  </span>
                  <span className="text-[10px] text-zinc-600 font-bold uppercase mt-1 tracking-widest">
                    {step.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex gap-3 items-start bg-yellow-500/5 border border-yellow-500/10 p-4 rounded text-zinc-400 font-body text-xs text-left leading-relaxed">
            <Sparkles className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <strong className="text-white uppercase tracking-wider font-bold">Write Your Legacy</strong>
              <p className="mt-1">
                Your squad is booked to compete on the Official CS2 Competitive Map Pool. Review your tactical strategies, coordinate voice channels, and ensure Akros Anti-Cheat is fully verified for all teammates. The community cup awaits.
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8 text-left">
            <h3 className="text-xl font-heading text-white uppercase mb-4 tracking-widest flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-500" /> Declared Squad Roster
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {activeTeam.roster.map((player, idx) => (
                <div key={idx} className="bg-black/30 border border-white/5 p-4 rounded flex items-center gap-3 relative hover:border-yellow-500/20 transition-all duration-300">
                  <div className="w-10 h-10 bg-yellow-500/5 rounded-full border border-yellow-500/10 flex items-center justify-center text-xs font-bold text-yellow-500">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-white font-bold font-body text-sm leading-none">{player.ign}</div>
                    <div className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider mt-1">{(player.role || 'MEMBER').toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!tournament) {
    return <Navigate to="/404" replace />;
  }

  return (
    <>
      {activeTab === 'register' && showForm && !isRulesAccepted && !isArchived && (
        <DiscordGate tournament={tournament} onAccept={() => setIsRulesAccepted(true)} />
      )}
      {selectedTeam && <TeamProfileModal team={selectedTeam} isOpen={!!selectedTeam} onClose={() => setSelectedTeam(null)} />}
      
      <div className="min-h-screen bg-[#050507] text-white selection:bg-neon-cyan/30 flex flex-col relative overflow-x-hidden">
        <div className="app-bg-void" />
        <div className="app-bg-scanlines" />

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
              <div className="absolute inset-0 bg-neon-pink/20 blur-[60px] rounded-full scale-150 opacity-40 group-hover:opacity-80 transition-opacity duration-700 animate-pulse-fast" />
              <img src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png" alt="Pixel Palace Logo" className="w-40 h-40 md:w-56 md:h-56 object-contain relative z-20 transition-all duration-500 hover:scale-105 animate-logo-breathe hover:drop-shadow-[0_0_30px_rgba(240,0,255,0.8)]" />
            </Link>
            <h1 className="text-5xl sm:text-[5rem] md:text-[6.5rem] font-black text-white italic tracking-tighter font-heading leading-none relative z-10 drop-shadow-2xl uppercase">
              PIXEL PALACE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-white to-neon-cyan inline-block tracking-tight">{tournament.name.replace('Pixel Palace ', '')}</span>
            </h1>

            <div className="flex items-center justify-center w-full max-w-2xl mx-auto mt-2 mb-8 relative z-20">
              {isArchived && tournament.champion ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="text-[10px] text-yellow-500/70 font-bold tracking-[0.4em] font-body">Winner Declared // {tournament.displayDate} {tournament.displayYear}</div>
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
                  <div className="flex items-center gap-4 w-full"><div className="h-[1px] bg-white/10 flex-grow" /><div className="font-heading text-4xl text-white italic tracking-tighter whitespace-nowrap px-2">{tournament.displayDate}</div><div className="h-[1px] bg-white/10 flex-grow" /></div>
                  <div className="text-zinc-500 font-body text-xl font-bold tracking-[0.5em] uppercase">{tournament.displayYear}</div>
                </div>
              ) : <div className="flex items-center gap-6 w-full opacity-80"><div className="h-[1px] bg-zinc-500 flex-grow" /><div className="px-6 py-1 tracking-[0.3em] font-bold text-lg sm:text-xl text-white font-body uppercase">{formatEsportsDate(tournament.tournamentDate)}</div><div className="h-[1px] bg-zinc-500 flex-grow" /></div>}
            </div>

            <div className="w-full max-w-4xl mx-auto mt-6 relative z-20">
              <div className="hud-crosshair tl" /><div className="hud-crosshair tr" /><div className="hud-crosshair bl" /><div className="hud-crosshair br" />
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
              <a 
                href="https://discord.com/invite/pixelpalacee" 
                target="_blank" 
                rel="noreferrer" 
                onMouseEnter={playHover}
                onClick={playClick}
                className="glass-panel px-8 py-3 flex items-center justify-center gap-3 group hover:bg-neon-purple/20 transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5 text-neon-cyan group-hover:text-white transition-colors" />
                <span className="font-bold text-lg uppercase tracking-widest text-white font-body">JOIN DISCORD SERVER</span>
              </a>
              <a 
                href="https://www.twitch.tv/pXpLgg" 
                target="_blank" 
                rel="noreferrer" 
                onMouseEnter={playHover}
                onClick={playClick}
                className="glass-panel px-8 py-3 flex items-center justify-center gap-3 group hover:bg-[#6441a5]/20 transition-all duration-300"
              >
                <Tv className="w-5 h-5 text-[#9146FF] group-hover:text-white transition-colors" />
                <span className="font-bold text-lg uppercase tracking-widest text-white font-body">WATCH TWITCH STREAM</span>
              </a>
              <a 
                href="https://www.instagram.com/pixelpalace.gg" 
                target="_blank" 
                rel="noreferrer" 
                onMouseEnter={playHover}
                onClick={playClick}
                className="glass-panel px-8 py-3 flex items-center justify-center gap-3 group hover:bg-neon-pink/20 transition-all duration-300"
              >
                <Instagram className="w-5 h-5 text-neon-pink group-hover:text-white transition-colors" />
                <span className="font-bold text-lg uppercase tracking-widest text-white font-body">FOLLOW INSTAGRAM</span>
              </a>
            </div>

            <div className="flex justify-center gap-6 sm:gap-12 w-full max-w-4xl mt-16 relative px-4 flex-wrap pb-4 sm:pb-0 sticky top-4 z-40 bg-[#050507]/90 backdrop-blur-md pt-4 rounded-t-xl border-t border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              <div className="hidden sm:block absolute bottom-0 w-full h-[1px] bg-white/10" />
              {tournament.tournamentComplete && (
                <button 
                  onMouseEnter={playHover}
                  onClick={() => { playClick(); setActiveTab('results'); }} 
                  className={`font-heading text-xl sm:text-3xl uppercase tracking-[2px] pb-[5px] relative transition-all duration-300 flex items-center gap-3 ${activeTab === 'results' ? 'text-yellow-400 font-black' : 'text-white/40 hover:text-white/80'}`}
                >
                  Results<span className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-[10px] px-2 py-0.5 rounded-sm font-sans font-bold tracking-widest">FINAL</span>
                  <div className={`absolute bottom-[-1px] left-1/2 -translate-x-1/2 h-[3px] bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,1)] transition-all duration-300 ${activeTab === 'results' ? 'w-full' : 'w-0'}`} />
                </button>
              )}
              {!isArchived && (
                <button 
                  onMouseEnter={playHover}
                  onClick={() => { playClick(); setActiveTab('register'); }} 
                  className={`font-heading text-xl sm:text-3xl uppercase tracking-[2px] pb-[5px] relative transition-all duration-300 ${activeTab === 'register' ? 'text-neon-cyan font-black drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]' : 'text-white/40 hover:text-white/80'}`}
                >
                  Register Team
                  <div className={`absolute bottom-[-1px] left-1/2 -translate-x-1/2 h-[3px] bg-neon-cyan shadow-[0_0_15px_rgba(0,240,255,1)] transition-all duration-300 ${activeTab === 'register' ? 'w-full' : 'w-0'}`} />
                </button>
              )}
              <button 
                onMouseEnter={playHover}
                onClick={() => { playClick(); setActiveTab('teams'); }} 
                className={`font-heading text-xl sm:text-3xl uppercase tracking-[2px] pb-[5px] relative transition-all duration-300 flex items-center gap-3 ${activeTab === 'teams' ? 'text-neon-cyan font-black drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]' : 'text-white/40 hover:text-white/80'}`}
              >
                {isArchived ? 'All Teams' : 'Registered Teams'}
                {!isArchived && <span className="bg-neon-pink text-white text-[10px] px-2 py-0.5 rounded-sm font-sans font-bold tracking-widest animate-pulse">LIVE</span>}
                <div className={`absolute bottom-[-1px] left-1/2 -translate-x-1/2 h-[3px] bg-neon-cyan shadow-[0_0_15px_rgba(0,240,255,1)] transition-all duration-300 ${activeTab === 'teams' ? 'w-full' : 'w-0'}`} />
              </button>
              {tournament.bracketsEnabled && (
                <button 
                  onMouseEnter={playHover}
                  onClick={() => { playClick(); setActiveTab('brackets'); }} 
                  className={`font-heading text-xl sm:text-3xl uppercase tracking-[2px] pb-[5px] relative transition-all duration-300 ${activeTab === 'brackets' ? 'text-neon-cyan font-black drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]' : 'text-white/40 hover:text-white/80'}`}
                >
                  Brackets
                  <div className={`absolute bottom-[-1px] left-1/2 -translate-x-1/2 h-[3px] bg-neon-cyan shadow-[0_0_15px_rgba(0,240,255,1)] transition-all duration-300 ${activeTab === 'brackets' ? 'w-full' : 'w-0'}`} />
                </button>
              )}
            </div>
          </header>

          <div className="tab-content-wrapper mt-8">
            {activeTab === 'register' && (
              activeTeam && !showForm ? (
                renderCommandDeck()
              ) : (
                <RegistrationTab 
                  tournament={tournament} 
                  slots={slots} 
                  timeLeft={timeLeft} 
                  failedMapImages={failedMapImages} 
                  handleMapImgError={handleMapImgError} 
                />
              )
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
