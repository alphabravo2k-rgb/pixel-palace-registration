import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { getTournamentBySlug } from '../config/tournaments';
import { fetchTournamentSlots, fetchTournamentTeams, fetchTournamentBracket } from '../services/sheets';
import { TournamentForm } from '../components/forms/TournamentForm';
import { TournamentInfo } from '../components/registration/TournamentInfo';
import { formatEsportsDate } from '../utils/dateHelper';
import { DiscordGate } from '../components/modals/DiscordGate';
import { MessageCircle, Tv, AlertOctagon, Target, ShieldAlert, Layers, Download, Loader2, ShieldCheck, RefreshCw, ChevronLeft, Trophy, Medal } from 'lucide-react';

export const Register = () => {
  const { tournamentSlug } = useParams();
  const tournament = getTournamentBySlug(tournamentSlug);
  const [activeTab, setActiveTab] = useState(() => {
    if (tournament?.status === 'ARCHIVED' && tournament?.bracketsEnabled) return 'brackets';
    if (tournament?.status === 'ARCHIVED') return 'teams';
    return 'register';
  });
  const [slots, setSlots] = useState(null);
  const [teams, setTeams] = useState(null);
  const [bracketData, setBracketData] = useState(null);
  const [expandedTeamIdx, setExpandedTeamIdx] = useState(null);
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
        const [liveSlots, liveTeams, liveBracket] = await Promise.all([
          fetchTournamentSlots(tournament.id),
          fetchTournamentTeams(tournament.id),
          tournament.bracketsEnabled ? fetchTournamentBracket(tournament.id) : Promise.resolve(null)
        ]);
        setSlots(liveSlots);
        setTeams(liveTeams?.teams || []);
        if (liveBracket) setBracketData(liveBracket);
      } catch(err) {
        setSlots('error');
        setTeams('error');
        setBracketData('error');
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

  const renderRegister = () => (
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
        <div className="glass-panel p-6 border-l-4 border-l-neon-pink group">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neon-pink mb-4 font-bold font-body">Registration Closes In</p>
          <div className="flex items-center gap-3">
            {timeLeft === 'OFFLINE' || timeLeft === 'TBD' ? (
              <p className={`text-5xl font-heading tracking-widest leading-none ${timeLeft === 'OFFLINE' ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-white'}`}>
                {timeLeft}
              </p>
            ) : (
              timeLeft.split(':').map((val, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl md:text-5xl font-heading tracking-widest leading-none text-white drop-shadow-[0_0_15px_rgba(240,0,255,0.4)]">
                      {val}
                    </span>
                    <span className="text-[8px] font-bold text-zinc-500 tracking-[0.2em] font-body uppercase mt-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      {['DAYS', 'HRS', 'MIN', 'SEC'][i]}
                    </span>
                  </div>
                  {i < 3 && <span className="text-2xl font-heading text-white/10 mb-5">:</span>}
                </React.Fragment>
              ))
            )}
          </div>
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
          <a href="https://akros.ac/#download" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black text-sm font-bold uppercase tracking-widest transition-all font-body rounded shadow-[0_0_15px_rgba(0,240,255,0.2)]">
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
                  {!failedMapImages.has(mapName) ? (
                    <div className="map-card-img" style={{ backgroundImage: `url('https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_${mapName.toLowerCase()}.png')` }} onError={() => handleMapImgError(mapName)} />
                  ) : <div className="absolute inset-0 bg-black/80 z-10" />}
                  <div className="map-card-overlay" /><div className="map-card-content justify-center w-full"><span className="text-sm font-bold uppercase font-heading tracking-widest">{mapName}</span></div>
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
            <AlertOctagon className="w-24 h-24 mb-6" /><h2 className="text-5xl font-heading font-black uppercase">REGISTRATION OFFLINE</h2><p className="mt-4 font-body uppercase text-sm tracking-widest text-zinc-400">The registration deadline has passed.</p>
          </div>
        ) : <TournamentForm tournament={tournament} />}
      </div>
    </div>
  );

  const renderTracker = () => (
    <div className="max-w-6xl mx-auto">
      <div className="glass-panel p-8 min-h-[600px]">
        <div className="hud-crosshair tl"></div><div className="hud-crosshair tr"></div>
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
          <h2 className="text-4xl text-white font-heading tracking-wider leading-none uppercase">Registered Teams</h2>
          <button onClick={handleManualRefresh} disabled={isRefreshing} className="text-zinc-400 hover:text-neon-cyan flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors bg-black/50 px-5 py-3 border border-white/10 hover:border-neon-cyan/50 font-body disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> {isRefreshing ? 'REFRESHING...' : 'REFRESH LIST'}
          </button>
        </div>
        {!teams ? (
          <div className="text-center py-32 text-zinc-500 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin mb-6 text-neon-pink drop-shadow-[0_0_10px_rgba(240,0,255,0.5)]" /><span className="font-bold tracking-[0.3em] uppercase text-sm font-body">Fetching Database...</span>
          </div>
        ) : teams === 'error' ? (
          <div className="text-center py-32 text-red-500 flex flex-col items-center justify-center bg-red-950/10 border border-dashed border-red-500/20 rounded-md">
            <AlertOctagon className="w-12 h-12 mb-6" /><span className="font-heading text-2xl uppercase">CONNECTION FAILED</span><p className="text-xs font-body opacity-60 mt-2 uppercase tracking-widest">Could not stabilize link to current data sheet.</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-32 text-zinc-600 flex flex-col items-center justify-center">
            <Layers className="w-12 h-12 mb-6 opacity-20" /><span className="font-heading text-2xl uppercase tracking-widest">SYSTEMS COLD</span><p className="text-xs font-body opacity-60 mt-2 uppercase tracking-widest">No teams have initialized registration yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teams.map((team, idx) => (
              <div key={`${team.name}-${idx}`} className={`glass-panel p-0 overflow-hidden group/team transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${expandedTeamIdx === idx ? 'border-neon-cyan/50' : 'hover:border-neon-cyan/20 cursor-pointer'}`} onClick={() => expandedTeamIdx !== idx && team.roster?.length > 0 && setExpandedTeamIdx(idx)}>
                <div className="flex items-stretch h-20 bg-black/40 relative">
                  {expandedTeamIdx === idx && (
                    <button type="button" className="absolute top-2 right-2 text-zinc-500 hover:text-white transition-colors z-20" onClick={(e) => { e.stopPropagation(); setExpandedTeamIdx(null); }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-black/50 px-2 py-1 border border-white/10 rounded">CLOSE</span>
                    </button>
                  )}
                  <div className="w-20 bg-zinc-900 flex-shrink-0 flex items-center justify-center border-r border-white/5 relative overflow-hidden">
                    <img src={team.logo} alt={team.name} className="w-12 h-12 object-contain relative z-10 group-hover/team:scale-110 transition-transform duration-500" onError={(e) => { e.target.src = 'https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png'; e.target.className += ' opacity-20 grayscale'; }} />
                  </div>
                  <div className="flex-grow p-4 flex flex-col justify-center min-w-0 pr-16">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] bg-neon-cyan/10 text-neon-cyan px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-neon-cyan/20">{team.tag || 'TEAM'}</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">#{String(idx + 1).padStart(2, '0')}</span>
                    </div>
                    <h4 className="text-lg font-heading text-white truncate leading-none uppercase tracking-wider group-hover/team:text-neon-cyan transition-colors">{team.name}</h4>
                  </div>
                </div>
                {expandedTeamIdx === idx && team.roster?.length > 0 && (
                  <div className="bg-black/80 border-t border-white/5 p-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                      {team.roster.map((p, i) => (
                        <div key={i} className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded">
                          <div className="flex items-center gap-3"><div className="w-1 h-1 bg-neon-cyan rounded-full" /><span className="text-xs font-bold text-white uppercase tracking-wider font-body">{p.ign || p.discord || 'PLAYER'}</span></div>
                          <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest font-body"><span className="bg-zinc-900 text-zinc-400 px-2 py-1 rounded border border-zinc-700">LVL {p.faceitLevel || '?'}</span><span className="bg-neon-cyan/10 text-neon-cyan px-2 py-1 rounded border border-neon-cyan/20">ELO {p.faceitElo || 'N/A'}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-black/60 p-3 px-4 flex justify-between items-center border-t border-white/5">
                  <div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full animate-pulse ${team.status === 'PENDING REVIEW' ? 'bg-yellow-500' : 'bg-green-500'}`} /><span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] font-body">STATUS: {team.status || 'VERIFIED'}</span></div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-body flex gap-2">{team.averageElo && <span className="text-neon-pink drop-shadow-[0_0_5px_rgba(240,0,255,0.5)]">AVG ELO: {team.averageElo}</span>}{team.roster?.length > 0 && expandedTeamIdx !== idx && <span className="text-zinc-600">| CLICK TO EXPAND</span>}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {tournament.tournamentComplete && (
          <div className="glass-panel p-8 mt-8 border-t-4 border-t-yellow-500 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full point-events-none" />
            <h2 className="text-3xl text-white font-heading tracking-wider leading-none uppercase mb-8 flex items-center gap-3"><Trophy className="w-8 h-8 text-yellow-500" /> TOURNAMENT RESULTS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              
              {/* Champion */}
              <div className="bg-gradient-to-br from-yellow-900/30 to-black border border-yellow-500/30 p-6 rounded relative lg:col-span-2 shimmer-effect flex flex-col justify-between">
                <div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/20 blur-[30px]" />
                  <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-[0.3em] font-body mb-4 flex items-center justify-between relative z-20">
                    <div className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Grand Champion</div>
                    {tournament.champion?.score && <span className="bg-yellow-500/20 border border-yellow-500/50 px-2 py-0.5 rounded text-yellow-400">Final Score: {tournament.champion.score}</span>}
                  </div>
                  <div className="flex items-center gap-4 relative z-20">
                    <div className="w-20 h-20 rounded bg-black flex items-center justify-center border border-yellow-500/50 overflow-hidden shrink-0"><img src={tournament.champion?.logo || "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png"} alt="Champion" className="w-16 h-16 object-contain relative z-20" /></div>
                    <div><div className="text-yellow-500 text-xs font-bold uppercase tracking-widest border border-yellow-500/30 px-2 py-0.5 rounded-sm inline-block mb-1 relative z-20">{tournament.champion?.tag || "1ST PLACE"}</div><h3 className="text-3xl md:text-4xl text-white font-heading uppercase tracking-widest leading-none drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] relative z-20">{tournament.champion?.name || "TBD"}</h3></div>
                  </div>
                </div>
                {/* Match History Breakdown */}
                {tournament.champion?.matchHistory && (
                  <div className="mt-6 pt-6 border-t border-yellow-500/20 relative z-20">
                    <div className="text-[9px] text-yellow-500/70 font-bold uppercase tracking-[0.2em] font-body mb-3">Grand Final - Map Breakdown</div>
                    <div className="flex gap-2">
                      {tournament.champion.matchHistory.map((match, i) => (
                        <div key={i} className={`flex-1 border p-2 rounded text-center ${match.win ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 'bg-red-500/5 border-red-500/20 text-red-400/80'}`}>
                          <div className="text-[9px] uppercase tracking-widest font-body opacity-80">{match.map}</div>
                          <div className="text-sm font-bold font-heading tracking-widest">{match.score} {match.win ? 'W' : 'L'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Runner Up */}
              <div className="bg-gradient-to-br from-zinc-800/30 to-black border border-zinc-500/30 p-6 rounded relative">
                <div className="absolute top-0 right-0 w-16 h-16 bg-zinc-500/20 blur-[30px]" />
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em] font-body mb-4 flex items-center gap-2"><Medal className="w-4 h-4" /> Runner Up</div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded bg-black flex items-center justify-center border border-zinc-600 overflow-hidden shrink-0"><img src={tournament.runnerUp?.logo || "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_mirage.png"} alt="Runner Up" className="w-12 h-12 object-contain grayscale opacity-80" /></div>
                  <div><div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest border border-zinc-600 px-2 py-0.5 rounded-sm inline-block mb-1">{tournament.runnerUp?.tag || "2ND PLACE"}</div><h3 className="text-xl md:text-2xl text-zinc-300 font-heading uppercase tracking-widest leading-none">{tournament.runnerUp?.name || "TBD"}</h3></div>
                </div>
              </div>

              {/* Semifinalists */}
              {(tournament.thirdPlace || tournament.fourthPlace) && (
                <div className="bg-gradient-to-br from-amber-900/20 to-black border border-amber-700/30 p-6 rounded relative lg:col-span-3">
                  <div className="absolute top-0 left-0 w-16 h-16 bg-amber-700/10 blur-[30px]" />
                  <div className="text-[10px] text-amber-600 font-bold uppercase tracking-[0.3em] font-body mb-4 flex items-center gap-2">Semifinalists</div>
                  <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                    {tournament.thirdPlace && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-black flex items-center justify-center border border-amber-700/50 overflow-hidden shrink-0"><img src={tournament.thirdPlace.logo || "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_nuke.png"} alt="3rd" className="w-8 h-8 object-contain grayscale opacity-70" /></div>
                        <div><div className="text-amber-600 text-[9px] font-bold uppercase tracking-widest mb-0.5">3RD PLACE TIE</div><h3 className="text-lg text-amber-500 font-heading uppercase tracking-widest leading-none">{tournament.thirdPlace.name}</h3></div>
                      </div>
                    )}
                    {tournament.fourthPlace && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-black flex items-center justify-center border border-amber-700/50 overflow-hidden shrink-0"><img src={tournament.fourthPlace.logo || "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_overpass.png"} alt="4th" className="w-8 h-8 object-contain grayscale opacity-70" /></div>
                        <div><div className="text-amber-600 text-[9px] font-bold uppercase tracking-widest mb-0.5">3RD PLACE TIE</div><h3 className="text-lg text-amber-500 font-heading uppercase tracking-widest leading-none">{tournament.fourthPlace.name}</h3></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Tournament Statistics Summary Bar */}
            <div className="mt-8 flex flex-col md:flex-row bg-black/40 border border-white/5 rounded divide-y md:divide-y-0 md:divide-x divide-white/10 relative z-10">
              <div className="flex-1 p-4 flex items-center justify-between md:justify-center gap-4">
                <div className="text-zinc-500 font-bold uppercase tracking-[0.2em] font-body text-[10px]">Format</div>
                <div className="text-neon-cyan font-heading tracking-widest text-xl">{tournament.format} {tournament.gameMode}</div>
              </div>
              <div className="flex-1 p-4 flex items-center justify-between md:justify-center gap-4">
                <div className="text-zinc-500 font-bold uppercase tracking-[0.2em] font-body text-[10px]">Prize Pool Awarded</div>
                <div className="text-green-400 font-heading tracking-widest text-xl drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]">{tournament.prizePool}</div>
              </div>
              <div className="flex-1 p-4 flex items-center justify-between md:justify-center gap-4">
                <div className="text-zinc-500 font-bold uppercase tracking-[0.2em] font-body text-[10px]">Total Competitors</div>
                <div className="text-white font-heading tracking-widest text-xl">{tournament.maxTeams} Teams</div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );

  const renderBrackets = () => (
    <div className="max-w-6xl mx-auto xl:max-w-7xl">
      <div className="glass-panel p-8 min-h-[600px]">
        <div className="hud-crosshair tl"></div><div className="hud-crosshair tr"></div>
        <h2 className="text-4xl text-white font-heading tracking-wider leading-none uppercase mb-8 border-b border-white/10 pb-6 shadow-[0_1px_0_rgba(255,255,255,0.05)] flex items-center gap-3"><Target className="w-8 h-8 text-neon-cyan" /> Tournament Bracket</h2>
        {!bracketData && !tournament.bracketEmbedUrl ? (
          <div className="text-center py-32 text-zinc-500 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin mb-6 text-neon-pink drop-shadow-[0_0_10px_rgba(240,0,255,0.5)]" /><span className="font-bold tracking-[0.3em] uppercase text-sm font-body">Generating Bracket Link...</span>
          </div>
        ) : (bracketData === 'error' && !tournament.bracketEmbedUrl) ? (
          <div className="text-center py-32 text-red-500 flex flex-col items-center justify-center bg-red-950/10 border border-dashed border-red-500/20 rounded-md">
            <AlertOctagon className="w-12 h-12 mb-6" /><span className="font-heading text-2xl uppercase">BRACKETS OFFLINE</span><p className="text-xs font-body opacity-60 mt-2 uppercase tracking-widest">Bracket generation failed. Seeding may still be in progress.</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow bg-black/50 border border-white/10 rounded overflow-hidden min-h-[400px] flex items-center justify-center relative p-1 md:p-8">
              <p className="absolute top-4 left-4 text-[10px] text-zinc-500 font-bold uppercase font-body tracking-[0.3em] hidden md:block">LIVE FEED // STANDINGS</p>
              {tournament.bracketEmbedUrl ? (
                 <iframe src={`${tournament.bracketEmbedUrl}?theme=1&multiplier=1`} width="100%" height="100%" frameBorder="0" scrolling="auto" allowTransparency="true" className="w-full min-h-[500px] md:min-h-[700px] rounded shadow-[0_0_50px_rgba(0,240,255,0.1)] border-none"></iframe>
              ) : bracketData?.bracketUrl ? (
                 <img src={bracketData.bracketUrl} alt="Tournament Bracket" className="max-w-full rounded shadow-[0_0_50px_rgba(0,240,255,0.1)] border border-neon-cyan/20" />
              ) : (
                <div className="text-center text-zinc-600">
                  <Target className="w-16 h-16 mb-4 mx-auto opacity-20" /><h3 className="font-heading text-xl uppercase tracking-widest">Seeding Phase</h3><p className="text-xs font-body tracking-widest opacity-60 mt-2 uppercase">The bracket will be visible once teams verify check-in.</p>
                </div>
              )}
            </div>
            <div className="lg:w-80 flex-shrink-0 flex flex-col gap-6">
              <div className="bg-black/50 border border-white/10 rounded p-6">
                <h3 className="text-xl font-heading text-neon-cyan uppercase mb-4 tracking-widest">Schedule</h3>
                <ul className="space-y-3 font-body text-sm font-bold text-zinc-300">
                  {(bracketData && bracketData.schedule) ? bracketData.schedule.map((item, i) => (<li key={i} className="flex gap-2 items-start"><div className="w-1.5 h-1.5 bg-neon-pink rounded-full mt-1.5 shrink-0 shadow-[0_0_5px_rgba(240,0,255,0.5)]"></div>{item}</li>)) : <li className="text-zinc-500 opacity-60 font-medium">TBA</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <DiscordGate tournament={tournament} />
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
          <Link to="/" className="relative group block cursor-pointer mb-2"><div className="absolute inset-0 bg-neon-pink/20 blur-[60px] rounded-full scale-150 opacity-40 group-hover:opacity-80 transition-opacity duration-700 animate-pulse-fast"></div><img src="https://raw.githubusercontent.com/alphabravo2k-rgb/pixel-palace-registration/1a7d90c43796fd037316bdaf4f3b4de9a485d615/image_4379f9.png" alt="Pixel Palace Logo" className="w-40 h-40 md:w-56 md:h-56 object-contain relative z-20 transition-all duration-500 hover:scale-105 animate-logo-breathe hover:drop-shadow-[0_0_30px_rgba(240,0,255,0.8)]" /></Link>
          <h1 className="text-5xl sm:text-[5rem] md:text-[6.5rem] font-black text-white italic tracking-tighter font-heading leading-none relative z-10 drop-shadow-2xl uppercase">PIXEL PALACE <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-white to-neon-cyan inline-block tracking-tight">{tournament.name.replace('Pixel Palace ', '')}</span></h1>

          <div className="flex items-center justify-center w-full max-w-2xl mx-auto mt-2 mb-8 relative z-20">
            {tournament.displayTime ? (
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
              <div className="bg-black/40 p-4 text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Live Slots</p>
                {!slots ? <div className="text-neon-cyan font-heading text-xl animate-pulse">LOADING</div> : slots === 'error' ? <div className="text-red-500 font-heading text-xl">ERROR</div> : <div className="text-sm font-heading font-bold text-neon-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]"><div>INVITE: {slots.inviteConfirmed || 0} / {tournament.inviteSlots}</div><div>OPEN: {slots.openConfirmed || 0} / {tournament.openSlots}</div></div>}
              </div>
              <div className="bg-black/40 p-4 text-center flex flex-col justify-center"><p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Prize Pool</p><p className="text-3xl text-white font-heading leading-none">{tournament.prizePool}</p></div>
              <div className="bg-black/40 p-4 text-center relative group cursor-help flex flex-col justify-center"><p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Format</p><p className="text-3xl text-neon-pink font-heading leading-none drop-shadow-[0_0_10px_rgba(240,0,255,0.5)]">{tournament.format}</p><div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-max px-4 py-2 bg-black border border-neon-pink text-white text-xs font-body font-bold tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-[0_0_15px_rgba(240,0,255,0.3)]">{tournament.gameMode.toUpperCase()} FORMAT | BO3 Finals</div></div>
              <div className="bg-black/40 p-4 text-center flex flex-col justify-center items-center"><p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Anti Cheat</p><p className="text-sm font-body text-green-400 font-bold tracking-widest mt-1 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> {tournament.antiCheat.toUpperCase()}</p></div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-6 w-full sm:w-auto relative z-10">
            <a href="https://discord.gg/y6ZW8jHn2Q" target="_blank" rel="noreferrer" className="glass-panel px-8 py-3 flex items-center justify-center gap-3 group hover:bg-neon-purple/20 transition-all duration-300"><MessageCircle className="w-5 h-5 text-neon-cyan group-hover:text-white transition-colors" /><span className="font-bold text-lg uppercase tracking-widest text-white font-body">JOIN DISCORD SERVER</span></a>
            <a href="https://www.twitch.tv/pXpLgg" target="_blank" rel="noreferrer" className="glass-panel px-8 py-3 flex items-center justify-center gap-3 group hover:bg-[#6441a5]/20 transition-all duration-300"><Tv className="w-5 h-5 text-[#9146FF] group-hover:text-white transition-colors" /><span className="font-bold text-lg uppercase tracking-widest text-white font-body">WATCH TWITCH STREAM</span></a>
          </div>

          <div className="flex justify-center gap-6 sm:gap-12 w-full max-w-3xl mt-16 relative px-4 flex-wrap pb-4 sm:pb-0">
            <div className="hidden sm:block absolute bottom-0 w-full h-[1px] bg-white/10"></div>
            <button onClick={() => setActiveTab('register')} className={`font-heading text-xl sm:text-3xl uppercase tracking-[2px] pb-[5px] relative transition-all duration-300 ${activeTab === 'register' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}>Register Team<div className={`absolute bottom-[-1px] left-1/2 -translate-x-1/2 h-[3px] bg-neon-cyan shadow-[0_0_15px_rgba(0,240,255,1)] transition-all duration-300 ${activeTab === 'register' ? 'w-full' : 'w-0'}`}></div></button>
            <button onClick={() => setActiveTab('tracker')} className={`font-heading text-xl sm:text-3xl uppercase tracking-[2px] pb-[5px] relative transition-all duration-300 flex items-center gap-3 ${activeTab === 'tracker' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}>Registered Teams<span className="bg-neon-pink text-white text-[10px] px-2 py-0.5 rounded-sm font-sans font-bold tracking-widest animate-pulse">LIVE</span><div className={`absolute bottom-[-1px] left-1/2 -translate-x-1/2 h-[3px] bg-neon-cyan shadow-[0_0_15px_rgba(0,240,255,1)] transition-all duration-300 ${activeTab === 'tracker' ? 'w-full' : 'w-0'}`}></div></button>
            {tournament.bracketsEnabled && <button onClick={() => setActiveTab('brackets')} className={`font-heading text-xl sm:text-3xl uppercase tracking-[2px] pb-[5px] relative transition-all duration-300 ${activeTab === 'brackets' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}>Brackets<div className={`absolute bottom-[-1px] left-1/2 -translate-x-1/2 h-[3px] bg-neon-cyan shadow-[0_0_15px_rgba(0,240,255,1)] transition-all duration-300 ${activeTab === 'brackets' ? 'w-full' : 'w-0'}`}></div></button>}
          </div>
        </header>

        <div className="tab-content-wrapper mt-8">
          {activeTab === 'register' && renderRegister()}
          {activeTab === 'tracker' && renderTracker()}
          {activeTab === 'brackets' && renderBrackets()}
        </div>
      </div>
    </>
  );
};


