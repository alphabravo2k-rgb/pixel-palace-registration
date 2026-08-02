import { ChevronLeft, Copy, Instagram, MessageCircle, Shield, ShieldCheck, Sparkles, Trophy, Tv, Users } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { DiscordGate } from '../components/modals/DiscordGate';
import { TeamProfileModal } from '../components/modals/TeamProfileModal';
import { PlayerProfileModal } from '../components/modals/PlayerProfileModal';
import { DiscordMatchSheetModal } from '../components/modals/DiscordMatchSheetModal';
import { BracketsTab } from '../components/registration/BracketsTab';
import { MatchCenterList } from '../match-center/presentation/pages/MatchCenterList';
import { MatchCenterSpectator } from '../match-center/presentation/pages/MatchCenterSpectator';
// Decomposed Tab Components
import { RegistrationTab } from '../components/registration/RegistrationTab';
import { ResultsTab } from '../components/registration/ResultsTab';
import { TrackerTab } from '../components/registration/TrackerTab';
import { TrackTab } from '../components/registration/TrackTab';
import { RulebookTab } from '../components/registration/RulebookTab';
import { OpsCenterTab } from '../components/registration/OpsCenterTab';
import { LeaderboardTab } from '../components/registration/LeaderboardTab';
import { getTournamentBySlug } from '../config/tournaments';
import { useAudio } from '../hooks/useAudio';
import { fetchTournamentBracket, fetchTournamentSlots, fetchTournamentTeams } from '../services/sheets';
import { formatEsportsDate } from '../utils/dateHelper';
import { Terminal } from '../utils/logger';
import { formatLocalTime } from '../utils/timezone';

export const Register = () => {
  const { tournamentSlug } = useParams();
  const { playHover, playClick } = useAudio();
  const tournament = getTournamentBySlug(tournamentSlug);
  const isArchived = tournament?.status === 'ARCHIVED';
  const timeOffsetRef = React.useRef(0);
  const [prevVersion, setPrevVersion] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedDiscordMatch, setSelectedDiscordMatch] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    const matchMatch = hash.match(/^match[-/](\d+)/i);
    return matchMatch ? matchMatch[1] : null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash.match(/^match[-/]\d+/i)) return 'match-center';
    const mainTab = hash.split('/')[0];
    if (['ops', 'leaderboard', 'register', 'tracker', 'teams', 'rules', 'brackets', 'match-center', 'results', 'track'].includes(mainTab)) {
      return mainTab === 'tracker' ? 'teams' : mainTab;
    }
    if (tournament?.status === 'ARCHIVED' && tournament?.tournamentComplete) return 'results';
    if (tournament?.status === 'ARCHIVED' && tournament?.bracketsEnabled) return 'brackets';
    if (tournament?.status === 'ARCHIVED') return 'teams';
    return 'ops';
  });

  useEffect(() => {
    // Only update hash if current hash doesn't already start with active tab or match ID to prevent blowing away sub-paths like /maps or /scoreboard
    const currentHash = window.location.hash.replace('#', '');
    if (selectedMatchId) {
      if (!currentHash.startsWith(`match-${selectedMatchId}`)) {
        window.location.hash = `match-${selectedMatchId}`;
      }
    } else if (activeTab) {
      if (!currentHash.startsWith(activeTab)) {
        window.location.hash = activeTab;
      }
    }
    Terminal.log('UI', 'Register Layout Rendered', { activeTab, selectedMatchId });
  }, [activeTab, selectedMatchId]);

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

  useEffect(() => {
    const handleSwitchTab = (e) => {
      setActiveTab(e.detail);
    };
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const matchMatch = hash.match(/^match[-/](\d+)/i);
      if (matchMatch) {
        setActiveTab('match-center');
        setSelectedMatchId(matchMatch[1]);
      } else {
        const mainTab = hash.split('/')[0];
        if (['ops', 'leaderboard', 'register', 'tracker', 'teams', 'rules', 'brackets', 'match-center', 'results', 'track'].includes(mainTab)) {
          setActiveTab(mainTab === 'tracker' ? 'teams' : mainTab);
          setSelectedMatchId(null);
        }
      }
    };
    window.addEventListener('pp-switch-tab', handleSwitchTab);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('pp-switch-tab', handleSwitchTab);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

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
        
        // Merge settings from slots backend DTO into local tournament object
        if (liveSlots?.settings) {
          tournament.name = liveSlots.settings.tournament_name || tournament.name;
          tournament.registrationDeadline = liveSlots.settings.registration_deadline || tournament.registrationDeadline;
          tournament.tournamentDate = liveSlots.settings.tournament_date || tournament.tournamentDate;
          tournament.maxTeams = parseInt(liveSlots.settings.max_teams) || tournament.maxTeams;
          tournament.inviteSlots = parseInt(liveSlots.settings.invite_slots) || tournament.inviteSlots;
          tournament.openSlots = parseInt(liveSlots.settings.open_slots) || tournament.openSlots;
          tournament.prizePool = liveSlots.settings.prize_pool || tournament.prizePool;
          if (liveSlots.settings.maps) {
            tournament.maps = liveSlots.settings.maps.split(',').map(m => m.trim());
          }
          tournament.rulesUrl = liveSlots.settings.rules_pdf || tournament.rulesUrl;
          tournament.discordUrl = liveSlots.settings.discord_url || tournament.discordUrl;
          tournament.twitchUrl = liveSlots.settings.twitch_url || tournament.twitchUrl;
          tournament.instagramUrl = liveSlots.settings.instagram_url || tournament.instagramUrl;
        }

        // Sync server time offset
        const serverTimeStr = liveSlots?.registration?.serverTime;
        if (serverTimeStr) {
          const serverTime = new Date(serverTimeStr).getTime();
          const clientTime = Date.now();
          timeOffsetRef.current = serverTime - clientTime;
        }

        setTeams(liveTeams?.teams || []);
        if (liveBracket) setBracketData(liveBracket);
        failCount = 0;
        Terminal.success('Data synchronized successfully.');
      } catch (err) {
        if (!active) return;
        Terminal.error('SYNC', 'Failed to retrieve live data from uplink.', err);
        setSlots('error');
        setTeams([]);
        setBracketData(null);
        failCount++;
      }
    };

    loadData();
    const hasLiveMatch = bracketData?.matches?.some(m => m.status === 'LIVE' || m.status === 'in_progress');
    const intervalMs = hasLiveMatch ? 1000 : 10000;
    const interval = setInterval(loadData, intervalMs); // 1-sec sync when match is live, 10s otherwise

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

    const deadlineStr = slots?.registration?.registrationDeadline || tournament.registrationDeadline;
    const deadline = deadlineStr && deadlineStr !== 'TBD' ? new Date(deadlineStr).getTime() : 0;
    const tournamentDate = tournament.tournamentDate ? new Date(tournament.tournamentDate).getTime() : 0;

    const timer = setInterval(() => {
      const calibratedNow = Date.now() + timeOffsetRef.current;
      
      const isRegistrationClosed = slots?.registration 
        ? !slots.registration.isAcceptingRegistrations 
        : (deadline ? calibratedNow >= deadline : false);

      let targetTime = deadline;
      if (isRegistrationClosed) {
        targetTime = tournamentDate;
      }

      if (!targetTime) {
        setTimeLeft('TBD');
        return;
      }

      const diff = targetTime - calibratedNow;

      if (diff < 0) {
        setTimeLeft('CLOSED');
        clearInterval(timer);
        return;
      }

      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(d).padStart(2, '0')}:${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [tournament, slots]);

  // Auto-switch unregistered users to 'teams' tab when registration is closed
  useEffect(() => {
    if (slots?.registration) {
      const isAccepting = slots.registration.isAcceptingRegistrations;
      if (!isAccepting && activeTab === 'register' && !activeTeam) {
        setActiveTab('teams');
      }
    }
  }, [slots, activeTab, activeTeam]);

  // Event Bus for registration lifecycle transitions
  useEffect(() => {
    if (slots?.registration) {
      const currentVer = slots.registration.version;
      const currentStatus = slots.registration.status;
      const closedReason = slots.registration.closedReason;

      if (prevVersion !== null && prevVersion !== currentVer) {
        // Emit State Changed Event
        const stateEvent = new CustomEvent('pp-registration-state-changed', {
          detail: {
            status: currentStatus,
            closedReason: closedReason,
            version: currentVer,
            phase: slots.phase
          }
        });
        window.dispatchEvent(stateEvent);

        if (currentStatus === 'CLOSED' || currentStatus === 'ARCHIVED') {
          // Emit Closed Event
          const closedEvent = new CustomEvent('pp-registration-closed', {
            detail: { status: currentStatus, closedReason: closedReason }
          });
          window.dispatchEvent(closedEvent);
        } else if (currentStatus === 'OPEN') {
          // Emit Opened Event
          const openedEvent = new CustomEvent('pp-registration-opened', {
            detail: { status: currentStatus }
          });
          window.dispatchEvent(openedEvent);
        }
      }
      setPrevVersion(currentVer);
    }
  }, [slots, prevVersion]);

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

  const isRegistrationAccepting = slots?.registration
    ? slots.registration.isAcceptingRegistrations
    : (tournament?.registrationDeadline ? Date.now() < new Date(tournament.registrationDeadline).getTime() : true);

  return (
    <>
      {activeTab === 'register' && showForm && !isRulesAccepted && !isArchived && (
        <DiscordGate tournament={tournament} onAccept={() => setIsRulesAccepted(true)} />
      )}
      {selectedTeam && <TeamProfileModal team={selectedTeam} isOpen={!!selectedTeam} onClose={() => setSelectedTeam(null)} onSelectPlayer={setSelectedPlayer} />}
      {selectedPlayer && <PlayerProfileModal player={selectedPlayer} team={selectedTeam} isOpen={!!selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
      {selectedDiscordMatch && <DiscordMatchSheetModal match={selectedDiscordMatch} tournament={tournament} isOpen={!!selectedDiscordMatch} onClose={() => setSelectedDiscordMatch(null)} />}

      <div className="min-h-screen bg-[#050507] text-white selection:bg-neon-cyan/30 flex flex-col relative overflow-x-hidden">
        <div className="app-bg-void" />
        <div className="app-bg-scanlines" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-6 md:py-8 flex-grow">
          
          {/* Top Bar Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-8 font-mono text-[10px] text-zinc-400">
            <Link to="/" className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-cyan/50 px-3.5 py-1.5 rounded transition-all duration-300">
              <ChevronLeft className="w-3.5 h-3.5 text-zinc-400 group-hover:text-neon-cyan transition-colors" />
              <span className="text-white font-bold tracking-widest group-hover:text-neon-cyan uppercase">BACK TO HUB</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              <span className="text-emerald-400 font-bold uppercase tracking-widest">OFFICIAL TOURNAMENT PORTAL // ONLINE</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
                }}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-cyan/50 text-zinc-300 hover:text-white px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Open Global Esports Command Search"
              >
                <span className="hidden sm:inline">SEARCH</span>
                <kbd className="bg-zinc-900 text-neon-cyan px-1.5 py-0.5 rounded text-[9px] border border-white/10 font-mono">CTRL + K</kbd>
              </button>
              <span className="text-zinc-500 hidden md:inline">REGION: SOUTH ASIA / MENA</span>
              <span className="bg-neon-pink/15 text-neon-pink border border-neon-pink/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                CS2 PRO DIVISION
              </span>
            </div>
          </div>

          <header className="text-center mb-10 flex flex-col items-center relative">
            {/* Brand Logo & Glow */}
            <Link to="/" className="relative group block cursor-pointer mb-3">
              <div className="absolute inset-0 bg-neon-pink/20 blur-[50px] rounded-full scale-125 opacity-50 group-hover:opacity-90 transition-opacity duration-700 animate-pulse-fast" />
              <img
                src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png"
                alt="Pixel Palace Official Emblem"
                className="w-24 h-24 md:w-32 md:h-32 object-contain relative z-20 transition-all duration-500 hover:scale-105"
              />
            </Link>

            {/* Official Tournament Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white italic tracking-tight font-heading leading-tight uppercase drop-shadow-2xl">
              PIXEL PALACE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-white to-neon-cyan inline-block tracking-tighter">
                {tournament.name.replace('Pixel Palace ', '')}
              </span>
            </h1>

            {/* Regional Timezones & Date Info */}
            <div className="flex flex-col items-center justify-center my-4 font-mono">
              <div className="text-neon-cyan font-heading text-sm sm:text-base md:text-lg tracking-[0.2em] font-black drop-shadow-[0_0_12px_rgba(0,240,255,0.6)] uppercase">
                8PM PAKISTAN &nbsp;|&nbsp; 8:30PM INDIA &nbsp;|&nbsp; 7PM UAE
              </div>
              <div className="flex items-center gap-4 w-full max-w-md my-1.5">
                <div className="h-[1px] bg-white/20 flex-grow" />
                <div className="font-heading text-lg sm:text-2xl text-white italic tracking-wider font-bold whitespace-nowrap px-3">
                  July 31 – August 03
                </div>
                <div className="h-[1px] bg-white/20 flex-grow" />
              </div>
              <div className="text-zinc-500 font-body text-[11px] font-bold tracking-[0.6em] uppercase">
                2 0 2 6
              </div>
            </div>

            {/* Enterprise HUD Stats Panel */}
            <div className="w-full max-w-4xl mx-auto mt-2 relative z-20">
              <div className="hud-crosshair tl" /><div className="hud-crosshair tr" /><div className="hud-crosshair bl" /><div className="hud-crosshair br" />
              <div className="glass-panel p-2.5 grid grid-cols-2 md:grid-cols-4 gap-2 font-mono">
                {isArchived ? (
                  <div className="bg-black/50 border border-white/10 p-3 rounded-xl text-center flex flex-col justify-between min-h-[76px]">
                    <p className="text-[9px] text-yellow-500 uppercase tracking-widest font-bold">SEASON STATUS</p>
                    <p className="text-xs font-heading font-bold text-yellow-400 tracking-widest">CONCLUDED</p>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase">ARCHIVED</span>
                  </div>
                ) : (
                  <div className="bg-black/50 border border-white/10 p-3 rounded-xl text-center flex flex-col justify-between min-h-[76px]">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">ROSTER SLOTS</p>
                    {!slots ? (
                      <div className="text-neon-cyan font-heading text-xs animate-pulse font-bold">SYNCING...</div>
                    ) : (
                      <p className="text-sm font-black text-white font-heading tracking-wider">
                        {(slots.openConfirmed || 26) + (slots.inviteConfirmed || 4)} / 32 SQUADS
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold">
                      <span className="text-emerald-400">OPEN: {slots?.openConfirmed || 26}/26</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-neon-cyan">INVITE: {slots?.inviteConfirmed || 4}/6</span>
                    </div>
                  </div>
                )}

                <div className="bg-black/50 border border-white/10 p-3 rounded-xl text-center flex flex-col justify-between min-h-[76px]">
                  <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">PRIZE POOL</p>
                  <p className="text-sm font-black text-white font-heading tracking-wider">
                    $2,750 USD
                  </p>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase">1ST: $2,000 | 2ND: $750</span>
                </div>

                <div className="bg-black/50 border border-white/10 p-3 rounded-xl text-center flex flex-col justify-between min-h-[76px]">
                  <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">MATCH FORMAT</p>
                  <p className="text-sm font-black text-neon-pink font-heading tracking-wider">
                    5v5 COMPETITIVE
                  </p>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">MR12 • BO1 & BO3</span>
                </div>

                <div className="bg-black/50 border border-white/10 p-3 rounded-xl text-center flex flex-col justify-between min-h-[76px]">
                  <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">ANTI-CHEAT</p>
                  <p className="text-xs text-emerald-400 font-bold tracking-wider flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> AKROS CLIENT
                  </p>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">VERIFIED v3.2</span>
                </div>
              </div>
            </div>

            {/* Social Action Strip */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 w-full max-w-2xl font-mono text-xs">
              <a
                href="https://discord.com/invite/pixelpalacee"
                target="_blank"
                rel="noreferrer"
                onMouseEnter={playHover}
                onClick={playClick}
                className="glass-panel px-4 py-2 flex items-center gap-2 hover:bg-neon-purple/20 transition-all text-white font-bold"
              >
                <MessageCircle className="w-3.5 h-3.5 text-neon-cyan" />
                <span>DISCORD</span>
              </a>
              <a
                href="https://www.twitch.tv/pXpLgg"
                target="_blank"
                rel="noreferrer"
                onMouseEnter={playHover}
                onClick={playClick}
                className="glass-panel px-4 py-2 flex items-center gap-2 hover:bg-[#6441a5]/20 transition-all text-white font-bold"
              >
                <Tv className="w-3.5 h-3.5 text-[#9146FF]" />
                <span>TWITCH</span>
              </a>
              <a
                href="https://www.instagram.com/pixelpalace.gg"
                target="_blank"
                rel="noreferrer"
                onMouseEnter={playHover}
                onClick={playClick}
                className="glass-panel px-4 py-2 flex items-center gap-2 hover:bg-neon-pink/20 transition-all text-white font-bold"
              >
                <Instagram className="w-3.5 h-3.5 text-neon-pink" />
                <span>INSTAGRAM</span>
              </a>
            </div>

            {/* Single-Row Horizontal Tab Navigation */}
            <div className="w-full max-w-5xl mt-8 sticky top-4 z-40 bg-[#050507]/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-white/10 shadow-[0_8px_25px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-around font-heading text-xs sm:text-sm uppercase tracking-wider overflow-x-auto no-scrollbar gap-1">
                <button
                  onMouseEnter={playHover}
                  onClick={() => { playClick(); setActiveTab('ops'); }}
                  className={`px-3 py-2 rounded transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'ops' 
                      ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>OPS CENTER</span>
                  <span className="bg-neon-pink text-white text-[8px] px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">LIVE</span>
                </button>

                <button
                  onMouseEnter={playHover}
                  onClick={() => { playClick(); setActiveTab('leaderboard'); }}
                  className={`px-3 py-2 rounded transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'leaderboard' 
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>Leaderboard</span>
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold">HLTV 2.0</span>
                </button>
                {!isArchived && (
                  <button
                    disabled={!isRegistrationAccepting && !activeTeam}
                    onMouseEnter={playHover}
                    onClick={() => {
                      if (isRegistrationAccepting || activeTeam) {
                        playClick();
                        setActiveTab('register');
                      }
                    }}
                    className={`px-3 py-2 rounded transition-all whitespace-nowrap ${
                      activeTab === 'register' 
                        ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]' 
                        : (!isRegistrationAccepting && !activeTeam) 
                          ? 'text-white/20 cursor-not-allowed line-through' 
                          : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {activeTeam ? 'Roster Portal' : isRegistrationAccepting ? 'Register Team' : 'Register (Closed)'}
                  </button>
                )}
                {!isArchived && (
                  <button
                    onMouseEnter={playHover}
                    onClick={() => { playClick(); setActiveTab('track'); }}
                    className={`px-3 py-2 rounded transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === 'track' 
                        ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>Team Tracker</span>
                  </button>
                )}
                <button
                  onMouseEnter={playHover}
                  onClick={() => { playClick(); setActiveTab('teams'); }}
                  className={`px-3 py-2 rounded transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'teams' 
                      ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>{isArchived ? 'All Teams' : 'Registered Teams'}</span>
                </button>
                <button
                  onMouseEnter={playHover}
                  onClick={() => { playClick(); setActiveTab('rules'); }}
                  className={`px-3 py-2 rounded transition-all whitespace-nowrap ${
                    activeTab === 'rules' 
                      ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Rulebook
                </button>
                {tournament.bracketsEnabled && (
                  <button
                    onMouseEnter={playHover}
                    onClick={() => { playClick(); setActiveTab('brackets'); }}
                    className={`px-3 py-2 rounded transition-all whitespace-nowrap ${
                      activeTab === 'brackets' 
                        ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Brackets
                  </button>
                )}
                <button
                  onMouseEnter={playHover}
                  onClick={() => { playClick(); setActiveTab('match-center'); }}
                  className={`px-3 py-2 rounded transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'match-center' 
                      ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>Match Center</span>
                  <span className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold font-mono">STATS</span>
                </button>
              </div>
            </div>
          </header>

          <div className="tab-content-wrapper mt-8">
            {activeTab === 'ops' && (
              <OpsCenterTab
                tournament={tournament}
                teams={teams || []}
                bracketData={bracketData}
                slots={slots}
                playHover={playHover}
                playClick={playClick}
                onSelectTeam={setSelectedTeam}
                onGenerateDiscordSheet={setSelectedDiscordMatch}
              />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardTab />
            )}

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

             {activeTab === 'track' && (
               <TrackTab
                 tournament={tournament}
                 playHover={playHover}
                 playClick={playClick}
                 onSelectPlayer={setSelectedPlayer}
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
                 slots={slots}
                 onRegisterClick={slots?.registration?.isAcceptingRegistrations ? () => setActiveTab('register') : null}
               />
             )}

             {activeTab === 'rules' && (
               <RulebookTab tournament={tournament} />
             )}

             {activeTab === 'brackets' && (
              <BracketsTab
                bracketData={bracketData}
                tournament={tournament}
                isArchived={isArchived}
                formatLocalTime={formatLocalTime}
                teams={teams}
              />
            )}

            {activeTab === 'match-center' && (
              <div className="max-w-7xl mx-auto bg-[#080b18]/95 border border-white/10 p-6 rounded-2xl max-h-[85vh] overflow-y-auto custom-scrollbar shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-md animate-in fade-in duration-300">
                <MatchCenterList onSelectMatch={(id) => {
                  setSelectedMatchId(id);
                  window.location.hash = `match-${id}`;
                }} />
              </div>
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

      {/* ── IN-PAGE MATCH SPECTATOR MODAL OVERLAY ── */}
      {selectedMatchId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-[#080b18] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(0,240,255,0.15)] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <MatchCenterSpectator
              matchIdProp={selectedMatchId}
              onClose={() => setSelectedMatchId(null)}
            />
          </div>
        </div>
      )}
    </>
  );
};
