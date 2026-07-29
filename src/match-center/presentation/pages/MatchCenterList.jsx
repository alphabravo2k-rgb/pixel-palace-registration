/**
 * Match Center Index / Listing Page (Grouped by Stage and Tournament Rounds)
 * Lists active, upcoming, and completed matches in the local operations registry.
 * Guarantees that the complete 31-match standard playoff bracket structure is always visible.
 * Features secure operator override mapping panel guarded by 4-digit security PIN access.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { platformProjectionRegistry } from '../../application/ProjectionManager.js';
import { useMatchCenter } from '../hooks/useMatchCenter.js';
import { Logger } from '../../shared/kernel/Logger.js';
import { fetchTeams } from '../../../services/api/client.js';
import { matchCenter } from '../../../utils/navigation.js';
import { tournamentService } from '../../../services/TournamentService.js';
import { PPCC2_PERMANENT_SLOTS } from '../../../config/bracketLayout.js';
import { resolveDisplayMatches } from '../../../utils/bracketSelector.js';
import { getTeamTag, getTeamLogoUrl } from '../../../utils/teamResolver.js';
import { getMatchSchedule, formatVisitorLocalTime, getLiveCountdown } from '../../../utils/matchSchedule.js';
import { getGoogleCalendarUrl } from '../../../utils/calendarHelper.js';
import { StreamModal } from '../../../components/match-center/StreamModal.jsx';
import { exportElementAsImage } from '../../../utils/bracketExporter.js';

// Dynamic SE round name resolver
function getRoundLabel(stageName, roundNum, maxRound) {
  const isPlayoffs = 
    stageName?.toLowerCase().includes('elimination') || 
    stageName?.toLowerCase().includes('playoff') ||
    stageName?.toLowerCase().includes('bracket');

  if (isPlayoffs) {
    const diff = maxRound - roundNum;
    if (diff === 0) return 'Grand Final';
    if (diff === 1) return 'Semifinals';
    if (diff === 2) return 'Quarterfinals';
    if (diff === 3) return 'Round of 16';
    return `Round of 32`;
  }
  
  return `Round ${roundNum}`;
}

// Generates the standard 31 match slots for a 32-team single elimination playoffs
function generateBracketTemplate() {
  const template = [];
  
  // Round of 32 (16 matches)
  for (let i = 1; i <= 16; i++) {
    template.push({
      id: `PP-CC2-R32-M${String(i).padStart(2, '0')}`,
      slotKey: `R32-M${i}`,
      stage: 'Single Elimination',
      round: 1,
      matchIndex: i,
      status: 'Scheduled',
      game: 'Counter-Strike 2',
      format: 'BO1',
      teamA: { name: 'TBD', tag: 'TBD' },
      teamB: { name: 'TBD', tag: 'TBD' },
      score: { teamAScore: 0, teamBScore: 0 },
      isSynced: false
    });
  }
  
  // Round of 16 (8 matches)
  for (let i = 1; i <= 8; i++) {
    template.push({
      id: `PP-CC2-R16-M${String(i).padStart(2, '0')}`,
      slotKey: `R16-M${i}`,
      stage: 'Single Elimination',
      round: 2,
      matchIndex: i,
      status: 'Scheduled',
      game: 'Counter-Strike 2',
      format: 'BO1',
      teamA: { name: 'TBD', tag: 'TBD' },
      teamB: { name: 'TBD', tag: 'TBD' },
      score: { teamAScore: 0, teamBScore: 0 },
      isSynced: false
    });
  }
  
  // Quarterfinals (4 matches)
  for (let i = 1; i <= 4; i++) {
    template.push({
      id: `PP-CC2-QF-M${String(i).padStart(2, '0')}`,
      slotKey: `QF-M${i}`,
      stage: 'Single Elimination',
      round: 3,
      matchIndex: i,
      status: 'Scheduled',
      game: 'Counter-Strike 2',
      format: 'BO1',
      teamA: { name: 'TBD', tag: 'TBD' },
      teamB: { name: 'TBD', tag: 'TBD' },
      score: { teamAScore: 0, teamBScore: 0 },
      isSynced: false
    });
  }
  
  // Semifinals (2 matches)
  for (let i = 1; i <= 2; i++) {
    template.push({
      id: `PP-CC2-SF-M${String(i).padStart(2, '0')}`,
      slotKey: `SF-M${i}`,
      stage: 'Single Elimination',
      round: 4,
      matchIndex: i,
      status: 'Scheduled',
      game: 'Counter-Strike 2',
      format: 'BO3',
      teamA: { name: 'TBD', tag: 'TBD' },
      teamB: { name: 'TBD', tag: 'TBD' },
      score: { teamAScore: 0, teamBScore: 0 },
      isSynced: false
    });
  }
  
  // Grand Final (1 match)
  template.push({
    id: `PP-CC2-GF-M01`,
    slotKey: `GF-M1`,
    stage: 'Single Elimination',
    round: 5,
    matchIndex: 1,
    status: 'Scheduled',
    game: 'Counter-Strike 2',
    format: 'BO3',
    teamA: { name: 'TBD', tag: 'TBD' },
    teamB: { name: 'TBD', tag: 'TBD' },
    score: { teamAScore: 0, teamBScore: 0 },
    isSynced: false
  });
  
  return template;
}

export function MatchCenterList({ isAdmin = false }) {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncInput, setSyncInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [layoutMode, setLayoutMode] = useState('GRID'); // 'GRID' | 'LIST'
  const [activeStageTab, setActiveStageTab] = useState('Single Elimination');
  const [isSeeding, setIsSeeding] = useState(false);
  const [activeStreamMatch, setActiveStreamMatch] = useState(null);
  const [isStreamOpen, setIsStreamOpen] = useState(false);

  // Security and admin states
  const [pinInput, setPinInput] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(() => localStorage.getItem('pp_admin_unlocked') === 'true');
  const [registeredTeams, setRegisteredTeams] = useState([]);

  // Admin mapping overrides states
  const [selectedSlot, setSelectedSlot] = useState('');
  const [apiLink, setApiLink] = useState('');
  const [teamAOverride, setTeamAOverride] = useState('');
  const [customTeamATag, setCustomTeamATag] = useState('');
  const [teamALogoUrl, setTeamALogoUrl] = useState('');
  const [teamBOverride, setTeamBOverride] = useState('');
  const [customTeamBTag, setCustomTeamBTag] = useState('');
  const [teamBLogoUrl, setTeamBLogoUrl] = useState('');
  const [mapListOverride, setMapListOverride] = useState('');
  const { syncLotMatch, loading, error, clearError } = useMatchCenter('736');

  // Fetch live matches directly from Flux API endpoint
  useEffect(() => {
    let active = true;
    const fetchMatches = async () => {
      try {
        const bracket = await tournamentService.fetchBracket();
        if (active && bracket && Array.isArray(bracket.matches)) {
          const liveList = bracket.matches.map(m => ({
            id: String(m.id),
            matchId: String(m.id),
            stage: 'Single Elimination',
            round: m.roundNumber || m.round_number || 1,
            round_number: m.round_number || m.roundNumber || 1,
            position: typeof m.position === 'number' ? m.position : 0,
            status: m.status || 'PENDING',
            game: 'Counter-Strike 2',
            format: m.format || `BO${m.best_of || 1}`,
            teamA: {
              name: m.team1Obj?.name || (typeof m.team1 === 'string' ? m.team1 : 'TBD'),
              tag: m.team1Obj?.tag || getTeamTag(m.team1Obj || m.team1),
              logo: m.team1Obj?.logo || m.team1Obj?.logo_url || getTeamLogoUrl(m.team1Obj || m.team1) || null
            },
            teamB: {
              name: m.team2Obj?.name || (typeof m.team2 === 'string' ? m.team2 : 'TBD'),
              tag: m.team2Obj?.tag || getTeamTag(m.team2Obj || m.team2),
              logo: m.team2Obj?.logo || m.team2Obj?.logo_url || getTeamLogoUrl(m.team2Obj || m.team2) || null
            },
            score: typeof m.score === 'string' ? { teamAScore: m.score.split('-')[0] || 0, teamBScore: m.score.split('-')[1] || 0 } : (m.score || { teamAScore: 0, teamBScore: 0 })
          }));
          setMatches(liveList);
        }
      } catch (err) {
        Logger.warn(`[MatchCenterList] Error fetching live Flux matches: ${err.message}`);
      }
    };
    
    fetchMatches();
    const interval = setInterval(fetchMatches, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch registrations/teams on mount if in Admin Mode
  useEffect(() => {
    if (isAdmin) {
      fetchTeams('community-cup-2')
        .then(res => {
          const list = Array.isArray(res) ? res : (res?.teams || []);
          setRegisteredTeams(list);
        })
        .catch(err => Logger.warn(`Failed to fetch verified registrations: ${err.message}`));
    }
  }, [isAdmin]);

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pinInput === '7777') {
      setAdminUnlocked(true);
      localStorage.setItem('pp_admin_unlocked', 'true');
      setPinInput('');
    } else {
      alert('SECURITY WARNING: INCORRECT OPERATOR PIN.');
    }
  };

  const handleLockAdmin = () => {
    setAdminUnlocked(false);
    localStorage.removeItem('pp_admin_unlocked');
  };

  const handleQuickSync = async (idOrUrl) => {
    if (!idOrUrl) return;
    const targetMatchId = idOrUrl.trim().match(/\/matches\/(\d+)/)?.[1] || idOrUrl.trim();
    
    try {
      Logger.info(`List: Ingesting match #${targetMatchId}...`);
      await syncLotMatch(idOrUrl);
      navigate(isAdmin ? `/admin/match-center/${targetMatchId}` : `/match-center/${targetMatchId}`);
    } catch (err) {
      Logger.error(`List: Failed to ingest: ${err.message}`);
    }
  };

  const handleSaveOverrides = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !apiLink || !teamAOverride || !teamBOverride) {
      alert('Please select a playoff slot, Team A, Team B, and input the match ID/URL.');
      return;
    }

    const targetMatchId = apiLink.trim().match(/\/matches\/(\d+)/)?.[1] || apiLink.trim();
    const normalizedId = `MC-2026-${targetMatchId.padStart(7, '0')}`;

    // Resolve team profile details strictly from the selected registrations dropdowns
    const selectedTeamA = registeredTeams.find(t => t.id === teamAOverride || t.team?.team_name === teamAOverride || t.team_name === teamAOverride);
    const selectedTeamB = registeredTeams.find(t => t.id === teamBOverride || t.team?.team_name === teamBOverride || t.team_name === teamBOverride);

    if (!selectedTeamA || !selectedTeamB) {
      alert('Selected teams must be from the verified registrations list.');
      return;
    }

    const teamAName = selectedTeamA.team?.team_name || selectedTeamA.team_name;
    const teamATag = selectedTeamA.team?.team_tag || selectedTeamA.team_tag;
    const teamALogo = selectedTeamA.team?.logo_url || selectedTeamA.logo_url;

    const teamBName = selectedTeamB.team?.team_name || selectedTeamB.team_name;
    const teamBTag = selectedTeamB.team?.team_tag || selectedTeamB.team_tag;
    const teamBLogo = selectedTeamB.team?.logo_url || selectedTeamB.logo_url;

    // Save override dictionary to localStorage
    const overridePayload = {
      teamAName,
      teamATag,
      teamALogo,
      teamBName,
      teamBTag,
      teamBLogo,
      mapList: null,
    };
    localStorage.setItem(`admin_override_${normalizedId}`, JSON.stringify(overridePayload));

    // Save mapping slot -> match ID
    localStorage.setItem(`slot_mapping_${selectedSlot}`, normalizedId);

    // Resolve round & match index from slot key
    let round = 1;
    let matchIndex = 1;
    if (selectedSlot.startsWith('R32-')) { round = 1; matchIndex = parseInt(selectedSlot.replace('R32-M', ''), 10); }
    else if (selectedSlot.startsWith('R16-')) { round = 2; matchIndex = parseInt(selectedSlot.replace('R16-M', ''), 10); }
    else if (selectedSlot.startsWith('QF-')) { round = 3; matchIndex = parseInt(selectedSlot.replace('QF-M', ''), 10); }
    else if (selectedSlot.startsWith('SF-')) { round = 4; matchIndex = parseInt(selectedSlot.replace('SF-M', ''), 10); }
    else if (selectedSlot.startsWith('GF-')) { round = 5; matchIndex = 1; }

    try {
      Logger.info(`Admin: Mapping slot ${selectedSlot} to ${normalizedId}`);
      await platformProjectionRegistry.updateSummary(normalizedId, { 
        stage: 'Single Elimination', 
        round, 
        matchIndex 
      });

      await syncLotMatch(targetMatchId);
      alert(`Overrides saved! Slot ${selectedSlot} mapped to match #${targetMatchId}.`);
      
      // Clean states
      setApiLink('');
      setTeamAOverride('');
      setTeamBOverride('');
    } catch (err) {
      alert(`Synchronize error: ${err.message}`);
    }
  };

  const handleSeedSample = async () => {
    await handleQuickSync('736');
  };

  const handleSeedFullPlayoffs = async () => {
    setIsSeeding(true);
    try {
      platformProjectionRegistry.summaries.clear();
      platformProjectionRegistry.scoreboards.clear();
      platformProjectionRegistry.timelines.clear();
      
      for (let i = 1; i <= 16; i++) {
        const matchId = `MC-2026-00001${String(i).padStart(2, '0')}`;
        const summaryDto = {
          id: matchId,
          stage: 'Single Elimination',
          round: 1,
          status: 'Scheduled',
          game: 'Counter-Strike 2',
          format: 'BO1',
          teamA: { teamId: `T-32A-${i}`, name: `Seed #${i}`, tag: `S${i}` },
          teamB: { teamId: `T-32B-${i}`, name: `Seed #${33-i}`, tag: `S${33-i}` },
          score: { teamAScore: 0, teamBScore: 0 }
        };
        await platformProjectionRegistry.updateSummary(matchId, summaryDto);
      }
      
      for (let i = 1; i <= 8; i++) {
        const matchId = `MC-2026-00002${String(i).padStart(2, '0')}`;
        const summaryDto = {
          id: matchId,
          stage: 'Single Elimination',
          round: 2,
          status: 'Scheduled',
          game: 'Counter-Strike 2',
          format: 'BO1',
          teamA: { teamId: `T-16A-${i}`, name: `Winner R32 M#${i*2-1}`, tag: `W${i*2-1}` },
          teamB: { teamId: `T-16B-${i}`, name: `Winner R32 M#${i*2}`, tag: `W${i*2}` },
          score: { teamAScore: 0, teamBScore: 0 }
        };
        await platformProjectionRegistry.updateSummary(matchId, summaryDto);
      }
      
      for (let i = 1; i <= 4; i++) {
        const matchId = `MC-2026-00003${String(i).padStart(2, '0')}`;
        const summaryDto = {
          id: matchId,
          stage: 'Single Elimination',
          round: 3,
          status: 'Scheduled',
          game: 'Counter-Strike 2',
          format: 'BO1',
          teamA: { teamId: `T-8A-${i}`, name: `Winner R16 M#${i*2-1}`, tag: `W${i*2-1}` },
          teamB: { teamId: `T-8B-${i}`, name: `Winner R16 M#${i*2}`, tag: `W${i*2}` },
          score: { teamAScore: 0, teamBScore: 0 }
        };
        await platformProjectionRegistry.updateSummary(matchId, summaryDto);
      }
      
      for (let i = 1; i <= 2; i++) {
        const matchId = `MC-2026-00004${String(i).padStart(2, '0')}`;
        const summaryDto = {
          id: matchId,
          stage: 'Single Elimination',
          round: 4,
          status: 'Scheduled',
          game: 'Counter-Strike 2',
          format: 'BO3',
          teamA: { teamId: `T-4A-${i}`, name: `Winner QF M#${i*2-1}`, tag: `W${i*2-1}` },
          teamB: { teamId: `T-4B-${i}`, name: `Winner QF M#${i*2}`, tag: `W${i*2}` },
          score: { teamAScore: 0, teamBScore: 0 }
        };
        await platformProjectionRegistry.updateSummary(matchId, summaryDto);
      }
      
      {
        const matchId = `MC-2026-0000501`;
        const summaryDto = {
          id: matchId,
          stage: 'Single Elimination',
          round: 5,
          status: 'Scheduled',
          game: 'Counter-Strike 2',
          format: 'BO3',
          teamA: { teamId: `T-2A`, name: `Winner SF M#1`, tag: `W1` },
          teamB: { teamId: `T-2B`, name: `Winner SF M#2`, tag: `W2` },
          score: { teamAScore: 0, teamBScore: 0 }
        };
        await platformProjectionRegistry.updateSummary(matchId, summaryDto);
      }
      
      platformProjectionRegistry._persistSummaries();
      window.location.reload();
    } catch (err) {
      Logger.error(`Failed to seed playoffs: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // Filter matches in the registry by search queries
  const filteredRegistryMatches = matches.filter(m => {
    return m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.teamA?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.teamB?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.mapName || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Construct final display list from the permanent 31-slot tournament skeleton
  let stageMatches = [];
  
  if (activeStageTab === 'Single Elimination') {
    const { matches: displayMatches } = resolveDisplayMatches(matches);
    const fluxMatchMap = new Map((displayMatches || []).map(m => [`${m.round_number ?? m.round}-${m.position}`, m]));

    stageMatches = PPCC2_PERMANENT_SLOTS.map(slot => {
      const live = fluxMatchMap.get(`${slot.round_number}-${slot.position}`);
      if (live) {
        return {
          id: String(live.id || live.slotKey || slot.slotKey),
          slotKey: slot.slotKey,
          round: slot.round_number,
          roundName: slot.roundName,
          visualLabel: slot.visualLabel,
          format: slot.format,
          status: live.status || 'PENDING',
          teamA: live.teamA || { name: 'TBD', tag: 'TBD' },
          teamB: live.teamB || { name: 'TBD', tag: 'TBD' },
          score: live.score || { teamAScore: 0, teamBScore: 0 },
          hasMatch: true
        };
      }
      return {
        id: slot.slotKey,
        slotKey: slot.slotKey,
        round: slot.round_number,
        roundName: slot.roundName,
        visualLabel: slot.visualLabel,
        format: slot.format,
        status: 'Pending Initialization',
        teamA: { name: 'TBD', tag: 'TBD' },
        teamB: { name: 'TBD', tag: 'TBD' },
        score: { teamAScore: 0, teamBScore: 0 },
        hasMatch: false
      };
    });
  } else {
    stageMatches = matches.filter(m => m.stage === activeStageTab);
  }

  // Group and filter by status and query for display
  const matchesByRound = {};
  stageMatches.forEach(m => {
    if (!m.isSynced) {
      const query = searchQuery.toLowerCase();
      if (query && !m.id.toLowerCase().includes(query) && !m.teamA.name.toLowerCase().includes(query) && !m.teamB.name.toLowerCase().includes(query)) {
        return;
      }
      if (statusFilter === 'Live' && m.status !== 'Live' && m.status !== 'Paused') return;
      if (statusFilter === 'Scheduled' && m.status !== 'Scheduled') return;
      if (statusFilter === 'Completed' && m.status !== 'Completed') return;
    } else {
      if (statusFilter === 'Live' && m.status !== 'Live' && m.status !== 'Paused') return;
      if (statusFilter === 'Scheduled' && m.status !== 'Scheduled') return;
      if (statusFilter === 'Completed' && m.status !== 'Completed') return;
    }
    
    const r = m.round;
    if (!matchesByRound[r]) {
      matchesByRound[r] = [];
    }
    matchesByRound[r].push(m);
  });

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  const maxRoundInActiveStage = rounds.length > 0 ? Math.max(...rounds) : 5;

  return (
    <div className="min-h-screen bg-[#07090e] bg-cyber-grid text-slate-100 font-body relative pb-16 pt-24 animate-in fade-in duration-500">
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[250px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-[400px] h-[200px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-violet-400 text-xs font-bold font-mono tracking-widest uppercase">
                Pixel Palace Esports
              </span>
              <span className="text-[9px] bg-violet-950/60 text-violet-300 border border-violet-800/40 px-1.5 py-0.5 rounded font-mono font-bold">
                TOC v6.0
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-300 tracking-tight font-display uppercase">
              {isAdmin ? 'Match Control Center' : 'Match Center'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              {isAdmin 
                ? 'Authorized Operator Portal: Map bracket slots to API endpoints, override team details, logos, and check live data feeds.' 
                : 'Official tournament bracket and match structure synchronized live from the official Flux tournament service.'}
            </p>
          </div>

          {isAdmin && (
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl max-w-md w-full shrink-0">
              <h3 className="text-xs font-bold text-slate-300 mb-2 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-ping" />
                INGEST EXTERNAL MATCH DATA
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={syncInput}
                  onChange={(e) => setSyncInput(e.target.value)}
                  placeholder="e.g. 736 or LOT Match URL"
                  className="bg-black/40 border border-slate-800 hover:border-slate-700 focus:border-violet-500 text-slate-200 text-xs px-3 py-2 rounded-lg w-full outline-none font-mono transition-colors"
                  disabled={loading}
                />
                <button
                  onClick={() => handleQuickSync(syncInput)}
                  disabled={loading || !syncInput}
                  className="bg-violet-600 hover:bg-violet-500 disabled:bg-slate-850 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors font-mono uppercase tracking-wider shrink-0"
                >
                  {loading ? 'Ingesting...' : 'Ingest'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 🔒 SECURITY PIN GATEWAY OVERLAY FOR ADMINS */}
        {isAdmin && !adminUnlocked && (
          <div className="max-w-md mx-auto bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md text-center space-y-6">
            <div className="text-3xl filter drop-shadow-md">🔐</div>
            <div className="space-y-1">
              <h2 className="text-sm font-black text-white font-mono tracking-widest uppercase">
                SECURITY ACCESS GATEWAY
              </h2>
              <p className="text-[10px] text-slate-500 font-mono">
                Enter 4-Digit Operator PIN to unlock override panels
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                placeholder="••••"
                className="bg-black/40 border border-slate-800 focus:border-violet-500 text-center text-xl font-bold tracking-widest text-white py-3 rounded-lg w-full outline-none transition-colors font-mono"
              />
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2.5 rounded-lg w-full font-mono uppercase tracking-wider transition-colors"
              >
                VERIFY SIGNATURE
              </button>
            </form>
          </div>
        )}

        {/* 🔓 UNLOCKED ADMIN OVERRIDE PANEL */}
        {isAdmin && adminUnlocked && (
          <div className="bg-[#0b0e17]/50 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
            <div className="flex justify-between items-center border-b border-slate-850 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <h2 className="text-xs font-black text-slate-300 font-mono uppercase tracking-wider">
                  OPERATOR CONTROL CONSOLE (UNLOCKED)
                </h2>
              </div>
              <button 
                onClick={handleLockAdmin}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-mono uppercase bg-slate-900 border border-slate-800 px-2.5 py-1 rounded"
              >
                Lock Panel 🔒
              </button>
            </div>

            <form onSubmit={handleSaveOverrides} className="grid grid-cols-1 sm:grid-cols-4 gap-6 font-mono text-[11px]">
              
              {/* Playoff Slot selection */}
              <div>
                <label className="text-slate-505 block mb-1.5 uppercase font-bold text-[9px]">Select Playoff Slot</label>
                <select
                  value={selectedSlot}
                  onChange={e => setSelectedSlot(e.target.value)}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 text-slate-200 px-3 py-2.5 rounded-lg w-full outline-none transition-colors"
                >
                  <option value="">-- Choose Slot --</option>
                  <optgroup label="Round of 32">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <option key={i+1} value={`R32-M${i+1}`}>R32 - Match {i+1}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Round of 16">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <option key={i+1} value={`R16-M${i+1}`}>R16 - Match {i+1}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Quarterfinals">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <option key={i+1} value={`QF-M${i+1}`}>Quarterfinal {i+1}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Semifinals">
                    <option value="SF-M1">Semifinal 1</option>
                    <option value="SF-M2">Semifinal 2</option>
                  </optgroup>
                  <optgroup label="Grand Final">
                    <option value="GF-M1">Grand Final</option>
                  </optgroup>
                </select>
              </div>

              {/* Team A dropdown */}
              <div>
                <label className="text-slate-505 block mb-1.5 uppercase font-bold text-[9px]">Team A</label>
                <select
                  value={teamAOverride}
                  onChange={e => setTeamAOverride(e.target.value)}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 text-slate-200 px-3 py-2.5 rounded-lg w-full outline-none transition-colors"
                >
                  <option value="">-- Select Team A --</option>
                  {registeredTeams.map(t => (
                    <option key={t.id} value={t.team?.team_name || t.team_name}>
                      {t.team?.team_name || t.team_name} [{t.team?.team_tag || t.team_tag}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Team B dropdown */}
              <div>
                <label className="text-slate-505 block mb-1.5 uppercase font-bold text-[9px]">Team B</label>
                <select
                  value={teamBOverride}
                  onChange={e => setTeamBOverride(e.target.value)}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 text-slate-200 px-3 py-2.5 rounded-lg w-full outline-none transition-colors"
                >
                  <option value="">-- Select Team B --</option>
                  {registeredTeams.map(t => (
                    <option key={t.id} value={t.team?.team_name || t.team_name}>
                      {t.team?.team_name || t.team_name} [{t.team?.team_tag || t.team_tag}]
                    </option>
                  ))}
                </select>
              </div>

              {/* LOT Match ID/URL */}
              <div>
                <label className="text-slate-505 block mb-1.5 uppercase font-bold text-[9px]">LOT MATCH ID / URL</label>
                <input
                  type="text"
                  value={apiLink}
                  onChange={e => setApiLink(e.target.value)}
                  placeholder="e.g. 749 or URL"
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 text-slate-200 px-3 py-2.5 rounded-lg w-full outline-none transition-colors"
                />
              </div>

              {/* Action row at bottom of form */}
              <div className="sm:col-span-4 border-t border-slate-900 pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-violet-650 hover:bg-violet-600 disabled:bg-slate-850 text-white text-xs font-black px-6 py-3 rounded-lg font-mono uppercase tracking-wider transition-colors shrink-0"
                >
                  {loading ? 'SYNCHRONIZING...' : 'SAVE & SYNCHRONIZE SLOT'}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Dynamic Bracket Schema Legend (Always visible on Playoff Tab) */}
        {activeStageTab === 'Single Elimination' && (
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xs font-black text-white font-mono tracking-widest uppercase mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                PLAYOFFS BRACKET STRUCTURE
              </h3>
              <p className="text-[11px] text-slate-400">
                Single Elimination layout calculated for a 32-team standard bracket.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full md:w-auto font-mono text-[10px]">
              <div className="bg-slate-950/60 border border-slate-800/60 px-3.5 py-2 rounded-lg text-center">
                <span className="text-slate-550 block mb-0.5">ROUND OF 32</span>
                <span className="text-white font-bold">16 MATCHES</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/60 px-3.5 py-2 rounded-lg text-center">
                <span className="text-slate-550 block mb-0.5">ROUND OF 16</span>
                <span className="text-white font-bold">8 MATCHES</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/60 px-3.5 py-2 rounded-lg text-center">
                <span className="text-slate-550 block mb-0.5">QUARTERFINALS</span>
                <span className="text-white font-bold">4 MATCHES</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/60 px-3.5 py-2 rounded-lg text-center">
                <span className="text-slate-550 block mb-0.5">SEMIFINALS</span>
                <span className="text-white font-bold">2 MATCHES</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/60 px-3.5 py-2 rounded-lg text-center">
                <span className="text-slate-550 block mb-0.5">GRAND FINAL</span>
                <span className="text-white font-bold">1 MATCH</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Stages tabs */}
        <div className="space-y-6">
          <div className="border-b border-slate-800/60 flex gap-4">
            {['Single Elimination', 'Swiss Stage'].map(stage => {
              const count = matches.filter(m => m.stage === stage).length;
              return (
                <button
                  key={stage}
                  onClick={() => setActiveStageTab(stage)}
                  className={`pb-3 text-sm font-bold transition-all relative ${
                    activeStageTab === stage
                      ? 'text-white border-b-2 border-violet-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {stage}
                  {count > 0 && (
                    <span className="ml-2 text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded-full border border-slate-800/80 font-mono">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Status Filters & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-1.5 bg-slate-900/50 border border-slate-800/60 p-1 rounded-lg w-full sm:w-auto font-mono text-[10px] uppercase font-bold">
              {['All', 'Live', 'Scheduled', 'Completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded transition-all ${
                    statusFilter === status 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Layout Mode Switcher */}
              <div className="flex gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-lg font-mono text-[10px] font-bold shrink-0">
                <button
                  onClick={() => setLayoutMode('GRID')}
                  className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 transition-all ${
                    layoutMode === 'GRID' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Grid View"
                >
                  <span>▦</span> Grid
                </button>
                <button
                  onClick={() => setLayoutMode('LIST')}
                  className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 transition-all ${
                    layoutMode === 'LIST' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="HLTV Compact List View"
                >
                  <span>☰</span> HLTV List
                </button>
              </div>

              <div className="relative w-full sm:max-w-xs font-mono">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search matches or teams..."
                  className="bg-slate-950/50 border border-slate-800 hover:border-slate-700/80 focus:border-slate-600 text-slate-200 text-[11px] pl-8 pr-4 py-2 rounded-lg w-full outline-none transition-colors"
                />
                <svg 
                  className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Seeding Utilities Bar for Development */}
        {matches.length === 0 && (
          <div className="bg-slate-950/40 border border-slate-900/60 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between font-mono">
            <div className="text-xs text-slate-400">
              ⚡ Operator Seeding Tool: Instantly load demo datasets.
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSeedSample}
                disabled={loading || isSeeding}
                className="bg-slate-900 hover:bg-slate-850 text-slate-350 text-[10px] font-bold px-3 py-1.5 rounded border border-slate-800 transition"
              >
                Seed Live Match #736
              </button>
              <button
                onClick={handleSeedFullPlayoffs}
                disabled={loading || isSeeding}
                className="bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-800/40 text-[10px] font-bold px-3 py-1.5 rounded transition"
              >
                Seed 32-Team Bracket Template (31 Matches)
              </button>
            </div>
          </div>
        )}

        {/* Match List Grouped by Round */}
        <div className="space-y-12">
          {rounds.map(roundNum => {
            const roundMatches = matchesByRound[roundNum] || [];
            if (roundMatches.length === 0) return null;
            
            return (
              <div key={roundNum} className="space-y-4">
                {/* Round Header */}
                <div className="flex items-center gap-3">
                  <h2 className="text-xs font-black tracking-widest text-indigo-400 uppercase font-mono bg-indigo-950/40 border border-indigo-900/30 px-3 py-1.5 rounded">
                    {getRoundLabel(activeStageTab, roundNum, maxRoundInActiveStage)}
                  </h2>
                  <div className="h-px bg-slate-800/80 flex-grow" />
                  <span className="text-[10px] font-mono text-slate-550 font-bold uppercase tracking-wider">
                    {roundMatches.length} Match{roundMatches.length > 1 ? 'es' : ''}
                  </span>
                </div>

                {/* HLTV COMPACT LIST VIEW */}
                {layoutMode === 'LIST' ? (
                  <div className="space-y-2 font-mono">
                    {roundMatches.map(m => {
                      const isLive = m.status === 'Live' || m.status === 'Paused';
                      const isFinished = m.status === 'Completed';
                      const schedInfo = getMatchSchedule(m.id, m.scheduled_date || m.scheduledDate);
                      const visitorTime = formatVisitorLocalTime(schedInfo.iso);
                      const liveCd = getLiveCountdown(schedInfo.iso);
                      const calUrl = getGoogleCalendarUrl(m);

                      return (
                        <div
                          key={m.id}
                          onClick={() => navigate(matchCenter(m.id, false))}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-violet-500/50 hover:bg-slate-900/60 transition-all cursor-pointer group text-xs"
                        >
                          {/* Left: Match ID + Round + BO */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                              #{m.id}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                              {m.format || 'BO1'}
                            </span>
                          </div>

                          {/* Center: Team A vs Team B */}
                          <div className="flex items-center justify-center gap-3 flex-1 px-4 min-w-0">
                            <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                              <span className="font-bold text-white truncate text-[11px] group-hover:text-violet-300 transition-colors">
                                {m.teamA?.name || 'TBD'}
                              </span>
                              <div className="w-6 h-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 p-0.5 overflow-hidden">
                                {m.teamA?.logo ? (
                                  <img src={m.teamA.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                ) : (
                                  <span className="text-[9px] font-black text-slate-500">{m.teamA?.tag?.[0] || 'A'}</span>
                                )}
                              </div>
                            </div>

                            <span className="font-black text-slate-400 text-[10px] shrink-0 px-2 py-0.5 bg-slate-900/90 rounded border border-slate-800">
                              {isLive || isFinished ? `${m.seriesScore?.teamAWins ?? 0}:${m.seriesScore?.teamBWins ?? 0}` : 'VS'}
                            </span>

                            <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
                              <div className="w-6 h-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 p-0.5 overflow-hidden">
                                {m.teamB?.logo ? (
                                  <img src={m.teamB.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                ) : (
                                  <span className="text-[9px] font-black text-slate-500">{m.teamB?.tag?.[0] || 'B'}</span>
                                )}
                              </div>
                              <span className="font-bold text-white truncate text-[11px] group-hover:text-violet-300 transition-colors">
                                {m.teamB?.name || 'TBD'}
                              </span>
                            </div>
                          </div>

                          {/* Right: Local Time + Countdown + Calendar Link */}
                          <div className="flex items-center gap-3 shrink-0 text-[10px]">
                            <span className="text-emerald-400 font-medium hidden md:inline">
                              🌐 {visitorTime.localTime}
                            </span>
                            {!isLive && !isFinished && liveCd && (
                              <span className="text-violet-300 font-bold hidden lg:inline">
                                STARTS IN: {liveCd.formatted}
                              </span>
                            )}
                            {!isLive && !isFinished && (
                              <a
                                href={calUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Add to Google Calendar"
                                className="text-[9px] px-2 py-0.5 rounded bg-violet-950/60 border border-violet-800/40 text-violet-300 hover:text-white hover:bg-violet-800/50 transition-colors font-bold flex items-center gap-1"
                              >
                                📅 <span className="hidden sm:inline">Remind</span>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* GRID MODE */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {roundMatches.map(m => {
                    const isLive = m.status === 'Live' || m.status === 'Paused';
                    const isFinished = m.status === 'Completed';

                    const schedInfo = getMatchSchedule(m.id, m.scheduled_date || m.scheduledDate);
                    const visitorTime = formatVisitorLocalTime(schedInfo.iso);
                    const liveCd = getLiveCountdown(schedInfo.iso);

                    // Parse maps list and mapsStats
                    const mapList = m.mapList ? (typeof m.mapList === 'string' ? JSON.parse(m.mapList) : m.mapList) : ['de_ancient'];
                    const mapsStats = m.mapsStats || [];
                    
                    return (
                      <div
                        key={m.id}
                        onClick={() => navigate(matchCenter(m.id, false))}
                        className="relative overflow-hidden cursor-pointer group rounded-xl p-3.5 transition-all duration-200"
                        style={{
                          background: 'linear-gradient(135deg, rgba(13, 17, 38, 0.95) 0%, rgba(8, 11, 23, 0.98) 100%)',
                          border: isLive
                            ? '1px solid rgba(16, 185, 129, 0.6)'
                            : '1px solid rgba(139, 92, 246, 0.25)',
                          boxShadow: isLive
                            ? '0 0 20px rgba(16, 185, 129, 0.15)'
                            : '0 4px 16px rgba(0, 0, 0, 0.5)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.borderColor = isLive ? 'rgba(16, 185, 129, 0.8)' : 'rgba(167, 139, 250, 0.5)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = isLive ? 'rgba(16, 185, 129, 0.6)' : 'rgba(139, 92, 246, 0.25)';
                        }}
                      >
                        {/* Top Bar: Match ID badge + Round Label + BO Format Pill + Status Badge */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                              MATCH #{m.id}
                            </span>
                            <span className="text-[10px] font-black font-mono tracking-widest text-violet-300 uppercase">
                              {getRoundLabel(activeStageTab, m.round_number || m.round, maxRoundInActiveStage)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-slate-400 font-bold px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">
                              {m.format || 'BO1'}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                isLive
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                                  : isFinished
                                  ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}
                            >
                              {isLive ? '● LIVE' : isFinished ? '✓ COMPLETED' : 'UPCOMING'}
                            </span>
                          </div>
                        </div>

                        {/* Main Versus Row (Horizontal Compact CS2 Esports Style) */}
                        <div className="grid grid-cols-7 items-center gap-2">
                          {/* Team A (3 cols: logo + name) */}
                          <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-md bg-slate-900/80 border border-slate-700/50 flex items-center justify-center shrink-0 overflow-hidden p-1">
                              {m.teamA?.logo ? (
                                <img src={m.teamA.logo} alt={m.teamA.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-xs font-black text-violet-300">{m.teamA?.tag?.[0] || 'A'}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xs truncate group-hover:text-violet-300 transition-colors">
                                {m.teamA?.name || 'TBD'}
                              </div>
                              <div className="text-[9px] font-mono text-slate-500 font-semibold truncate">
                                {m.teamA?.tag || 'TBD'}
                              </div>
                            </div>
                          </div>

                          {/* Center VS / Score (1 col) */}
                          <div className="col-span-1 flex flex-col items-center justify-center">
                            {isLive || isFinished ? (
                              <span className="font-black text-sm font-mono text-white tracking-tight">
                                {m.seriesScore?.teamAWins ?? 0} : {m.seriesScore?.teamBWins ?? 0}
                              </span>
                            ) : (
                              <span className="text-[10px] font-black font-mono text-violet-400 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-500/30">
                                VS
                              </span>
                            )}
                          </div>

                          {/* Team B (3 cols: name + logo right aligned) */}
                          <div className="col-span-3 flex items-center justify-end gap-2.5 min-w-0 text-right">
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xs truncate group-hover:text-violet-300 transition-colors">
                                {m.teamB?.name || 'TBD'}
                              </div>
                              <div className="text-[9px] font-mono text-slate-500 font-semibold truncate">
                                {m.teamB?.tag || 'TBD'}
                              </div>
                            </div>
                            <div className="w-10 h-10 rounded-md bg-slate-900/80 border border-slate-700/50 flex items-center justify-center shrink-0 overflow-hidden p-1">
                              {m.teamB?.logo ? (
                                <img src={m.teamB.logo} alt={m.teamB.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-xs font-black text-violet-300">{m.teamB?.tag?.[0] || 'B'}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Schedule & Live Countdown Strip */}
                        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[9.5px] font-mono text-slate-400">
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <span className="text-[10px]">🌐</span> {visitorTime.fullString}
                          </span>
                          <div className="flex items-center gap-2">
                            {!isLive && !isFinished && liveCd && (
                              <span className="text-violet-300 font-bold tracking-wider">
                                STARTS IN: {liveCd.formatted}
                              </span>
                            )}
                            {!isLive && !isFinished && (
                              <a
                                href={getGoogleCalendarUrl(m)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Add to Google Calendar"
                                className="text-[9px] px-2 py-0.5 rounded bg-violet-950/60 border border-violet-800/40 text-violet-300 hover:text-white hover:bg-violet-800/50 transition-colors font-bold flex items-center gap-1 ml-1"
                              >
                                📅 Remind
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {rounds.length === 0 && (
            <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-850 flex items-center justify-center text-xl mx-auto mb-4">
                🎮
              </div>
              <h3 className="text-sm font-bold text-slate-350 mb-1">No matches found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                No matches are registered or match the selected filters. Use the sync panel at the top to fetch an active match.
              </p>
            </div>
          )}
        </div>
      </div>

      <StreamModal
        isOpen={isStreamOpen}
        onClose={() => setIsStreamOpen(false)}
        match={activeStreamMatch}
      />
    </div>
  );
}

export default MatchCenterList;
