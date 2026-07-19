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
    if (diff === 4) return 'Round of 32';
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
  const [activeStageTab, setActiveStageTab] = useState('Single Elimination');
  const [isSeeding, setIsSeeding] = useState(false);

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
  
  // Use a temporary match ID hook to access the LOT Gaming API sync engine
  const { syncLotMatch, loading, error, clearError } = useMatchCenter('736');

  // Load matches from read-model registry on mount/polling
  useEffect(() => {
    const fetchMatches = () => {
      const allMatches = Array.from(platformProjectionRegistry.summaries.entries()).map(([id, data]) => ({
        id,
        ...data,
        stage: data.stage || 'Single Elimination',
        round: Number(data.round) || 1,
      }));
      setMatches(allMatches);
    };
    
    fetchMatches();
    const interval = setInterval(fetchMatches, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch registrations/teams on mount if in Admin Mode
  useEffect(() => {
    if (isAdmin) {
      fetchTeams('community-cup-2')
        .then(teams => {
          if (teams && Array.isArray(teams)) {
            setRegisteredTeams(teams);
          }
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
    if (!selectedSlot || !apiLink) {
      alert('Please select a playoff slot and input the match ID/URL.');
      return;
    }

    const targetMatchId = apiLink.trim().match(/\/matches\/(\d+)/)?.[1] || apiLink.trim();
    const normalizedId = `MC-2026-${targetMatchId.padStart(7, '0')}`;

    // Resolve team profile details (Name, Tag, Logo URL)
    let teamAName = teamAOverride;
    let teamATag = customTeamATag;
    let teamALogo = teamALogoUrl;

    let teamBName = teamBOverride;
    let teamBTag = customTeamBTag;
    let teamBLogo = teamBLogoUrl;

    const selectedTeamA = registeredTeams.find(t => t.id === teamAOverride || t.team?.team_name === teamAOverride);
    if (selectedTeamA) {
      teamAName = selectedTeamA.team?.team_name || selectedTeamA.team_name;
      teamATag = selectedTeamA.team?.team_tag || selectedTeamA.team_tag;
      teamALogo = selectedTeamA.team?.logo_url || selectedTeamA.logo_url;
    }

    const selectedTeamB = registeredTeams.find(t => t.id === teamBOverride || t.team?.team_name === teamBOverride);
    if (selectedTeamB) {
      teamBName = selectedTeamB.team?.team_name || selectedTeamB.team_name;
      teamBTag = selectedTeamB.team?.team_tag || selectedTeamB.team_tag;
      teamBLogo = selectedTeamB.team?.logo_url || selectedTeamB.logo_url;
    }

    // Save override dictionary to localStorage
    const overridePayload = {
      teamAName,
      teamATag,
      teamALogo,
      teamBName,
      teamBTag,
      teamBLogo,
      mapList: mapListOverride ? mapListOverride.split(',').map(m => m.trim()) : null,
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
      setTeamALogoUrl('');
      setTeamBOverride('');
      setTeamBLogoUrl('');
      setMapListOverride('');
      setCustomTeamATag('');
      setCustomTeamBTag('');
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

  // Construct final display list for active stage tab
  let stageMatches = [];
  
  if (activeStageTab === 'Single Elimination') {
    const template = generateBracketTemplate();
    const activeSEMatches = filteredRegistryMatches.filter(m => m.stage === 'Single Elimination');
    
    // First, map slots using local storage overrides mappings
    template.forEach(slot => {
      const mappedMatchId = localStorage.getItem(`slot_mapping_${slot.slotKey}`);
      if (mappedMatchId) {
        const activeMatch = filteredRegistryMatches.find(m => m.id === mappedMatchId);
        if (activeMatch) {
          slot.id = activeMatch.id;
          slot.status = activeMatch.status;
          slot.teamA = activeMatch.teamA || slot.teamA;
          slot.teamB = activeMatch.teamB || slot.teamB;
          slot.score = activeMatch.score || slot.score;
          slot.seriesScore = activeMatch.seriesScore || slot.seriesScore;
          slot.mapsStats = activeMatch.mapsStats || slot.mapsStats;
          slot.mapList = activeMatch.mapList || slot.mapList;
          slot.mapName = activeMatch.mapName || slot.mapName;
          slot.isSynced = true;
        }
      }
    });

    // For any unmapped matches, use default index resolution fallback
    activeSEMatches.forEach(activeMatch => {
      const alreadyMapped = template.some(t => t.id === activeMatch.id);
      if (alreadyMapped) return;

      let matchIdx = activeMatch.matchIndex;
      if (!matchIdx) {
        const lastDigits = activeMatch.id.match(/\d+$/)?.[0];
        matchIdx = lastDigits ? (parseInt(lastDigits.slice(-2), 10) || 1) : 1;
      }
      
      const targetSlot = template.find(t => t.round === activeMatch.round && t.matchIndex === matchIdx && !t.isSynced);
      if (targetSlot) {
        targetSlot.id = activeMatch.id;
        targetSlot.status = activeMatch.status;
        targetSlot.teamA = activeMatch.teamA || targetSlot.teamA;
        targetSlot.teamB = activeMatch.teamB || targetSlot.teamB;
        targetSlot.score = activeMatch.score || targetSlot.score;
        targetSlot.seriesScore = activeMatch.seriesScore || targetSlot.seriesScore;
        targetSlot.mapsStats = activeMatch.mapsStats || targetSlot.mapsStats;
        targetSlot.mapList = activeMatch.mapList || targetSlot.mapList;
        targetSlot.mapName = activeMatch.mapName || targetSlot.mapName;
        targetSlot.isSynced = true;
      } else {
        template.push(activeMatch);
      }
    });
    
    stageMatches = template;
  } else {
    stageMatches = filteredRegistryMatches.filter(m => m.stage === activeStageTab);
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
                : 'Real-time CS2 series statistics, map vetoes, player performance, and live scoreboard feeds.'}
            </p>
          </div>

          {!isAdmin && (
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

            <form onSubmit={handleSaveOverrides} className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[11px]">
              
              {/* Left Column: Match Slot and Endpoint mapping */}
              <div className="space-y-4">
                <div>
                  <label className="text-slate-500 block mb-1 uppercase font-bold text-[9px]">Select Playoff Slot</label>
                  <select
                    value={selectedSlot}
                    onChange={e => setSelectedSlot(e.target.value)}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 text-slate-200 px-3 py-2 rounded-lg w-full outline-none transition-colors"
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

                <div>
                  <label className="text-slate-500 block mb-1 uppercase font-bold text-[9px]">LOT MATCH ID / URL</label>
                  <input
                    type="text"
                    value={apiLink}
                    onChange={e => setApiLink(e.target.value)}
                    placeholder="e.g. 736 or endpoint URL"
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 text-slate-200 px-3 py-2 rounded-lg w-full outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Middle Column: Team A Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-slate-500 block mb-1 uppercase font-bold text-[9px]">Team A (From Registrations)</label>
                  <select
                    value={teamAOverride}
                    onChange={e => setTeamAOverride(e.target.value)}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 text-slate-200 px-3 py-2 rounded-lg w-full outline-none transition-colors"
                  >
                    <option value="">-- Custom (Enter below) --</option>
                    {registeredTeams.map(t => (
                      <option key={t.id} value={t.team?.team_name || t.team_name}>
                        {t.team?.team_name || t.team_name} [{t.team?.team_tag || t.team_tag}]
                      </option>
                    ))}
                  </select>
                </div>

                {!registeredTeams.some(t => t.team?.team_name === teamAOverride || t.team_name === teamAOverride) && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-slate-500 block mb-1 uppercase font-bold text-[9px]">Custom Name A</label>
                      <input
                        type="text"
                        value={teamAOverride}
                        onChange={e => setTeamAOverride(e.target.value)}
                        placeholder="Glitchtech"
                        className="bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1.5 rounded w-full outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1 uppercase font-bold text-[9px]">Tag A</label>
                      <input
                        type="text"
                        value={customTeamATag}
                        onChange={e => setCustomTeamATag(e.target.value)}
                        placeholder="G"
                        className="bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1.5 rounded w-full outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-slate-500 block mb-1 uppercase font-bold text-[9px]">Google Drive Logo URL (Team A)</label>
                  <input
                    type="text"
                    value={teamALogoUrl}
                    onChange={e => setTeamALogoUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 text-slate-200 px-3 py-2 rounded-lg w-full outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Right Column: Team B Details & Actions */}
              <div className="space-y-4">
                <div>
                  <label className="text-slate-500 block mb-1 uppercase font-bold text-[9px]">Team B (From Registrations)</label>
                  <select
                    value={teamBOverride}
                    onChange={e => setTeamBOverride(e.target.value)}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 text-slate-200 px-3 py-2 rounded-lg w-full outline-none transition-colors"
                  >
                    <option value="">-- Custom (Enter below) --</option>
                    {registeredTeams.map(t => (
                      <option key={t.id} value={t.team?.team_name || t.team_name}>
                        {t.team?.team_name || t.team_name} [{t.team?.team_tag || t.team_tag}]
                      </option>
                    ))}
                  </select>
                </div>

                {!registeredTeams.some(t => t.team?.team_name === teamBOverride || t.team_name === teamBOverride) && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-slate-500 block mb-1 uppercase font-bold text-[9px]">Custom Name B</label>
                      <input
                        type="text"
                        value={teamBOverride}
                        onChange={e => setTeamBOverride(e.target.value)}
                        placeholder="Strael-Bora"
                        className="bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1.5 rounded w-full outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1 uppercase font-bold text-[9px]">Tag B</label>
                      <input
                        type="text"
                        value={customTeamBTag}
                        onChange={e => setCustomTeamBTag(e.target.value)}
                        placeholder="S"
                        className="bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1.5 rounded w-full outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-slate-500 block mb-1 uppercase font-bold text-[9px]">Google Drive Logo URL (Team B)</label>
                  <input
                    type="text"
                    value={teamBLogoUrl}
                    onChange={e => setTeamBLogoUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 text-slate-200 px-3 py-2 rounded-lg w-full outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Action row at bottom of form */}
              <div className="md:col-span-3 border-t border-slate-900 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <label className="text-slate-500 block mb-1 uppercase font-bold text-[9px]">Map vetoes override (Comma separated)</label>
                  <input
                    type="text"
                    value={mapListOverride}
                    onChange={e => setMapListOverride(e.target.value)}
                    placeholder="de_ancient, de_mirage, de_dust2"
                    className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg w-80 outline-none"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-violet-650 hover:bg-violet-600 text-white text-xs font-black px-6 py-3 rounded-lg font-mono uppercase tracking-wider"
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

                {/* Match Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {roundMatches.map(m => {
                    const isLive = m.status === 'Live' || m.status === 'Paused';
                    const isFinished = m.status === 'Completed';

                    // Parse maps list and mapsStats
                    const mapList = m.mapList ? (typeof m.mapList === 'string' ? JSON.parse(m.mapList) : m.mapList) : ['de_ancient'];
                    const mapsStats = m.mapsStats || [];
                    
                    return (
                      <div 
                        key={m.id}
                        className="bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/60 rounded-xl p-5 relative overflow-hidden group transition-all"
                      >
                        {/* Glow border overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-violet-600/0 to-violet-600/0 group-hover:from-violet-600/5 group-hover:to-indigo-600/5 transition-all duration-300 pointer-events-none" />
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-mono text-slate-550 font-bold uppercase tracking-wider">
                            {m.id} · {m.stage}
                          </span>
                          
                          {/* Status Indicator */}
                          <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border ${
                            isLive 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
                              : isFinished
                              ? 'bg-slate-850 text-slate-400 border-slate-750'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          }`}>
                            {m.status}
                          </span>
                        </div>

                        {/* Team Vs Layout */}
                        <div className="flex items-center justify-between my-5">
                          {/* Team A */}
                          <div className="flex items-center gap-3 w-[42%]">
                            {m.teamA?.logo ? (
                              <img src={m.teamA.logo} alt={m.teamA.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-800 animate-in fade-in" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-450">
                                {m.teamA?.name?.[0]?.toUpperCase() || 'A'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-200 truncate">{m.teamA?.name || 'Team A'}</h4>
                              <p className="text-[9px] text-slate-555 font-mono tracking-widest">{m.teamA?.tag || 'TMA'}</p>
                            </div>
                          </div>

                          {/* Series maps score / VS */}
                          <div className="text-center shrink-0 px-2 flex flex-col items-center">
                            {isLive || isFinished ? (
                              <div className="text-lg font-black font-mono tracking-tight text-white bg-black/40 border border-slate-800/80 px-3 py-1 rounded-lg">
                                {m.seriesScore?.teamAWins ?? 0} <span className="text-slate-650 font-normal">:</span> {m.seriesScore?.teamBWins ?? 0}
                              </div>
                            ) : (
                              <div className="text-[10px] font-mono font-bold text-slate-550 border border-slate-800/60 px-2.5 py-1 rounded bg-slate-950/40">
                                VS
                              </div>
                            )}
                            {(isLive || isFinished) && (
                              <p className="text-[8px] text-slate-500 font-bold font-mono uppercase mt-1 tracking-widest">
                                MAPS SCORE
                              </p>
                            )}
                          </div>

                          {/* Team B */}
                          <div className="flex items-center justify-end gap-3 w-[42%] text-right">
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-200 truncate">{m.teamB?.name || 'Team B'}</h4>
                              <p className="text-[9px] text-slate-555 font-mono tracking-widest">{m.teamB?.tag || 'TMB'}</p>
                            </div>
                            {m.teamB?.logo ? (
                              <img src={m.teamB.logo} alt={m.teamB.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-800 animate-in fade-in" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-450">
                                {m.teamB?.name?.[0]?.toUpperCase() || 'B'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Active Map Detail Subbar */}
                        {isLive && m.activeMap && (
                          <div className="bg-emerald-950/15 border border-emerald-900/20 rounded-lg p-2.5 my-3 flex items-center justify-between text-[10px] font-mono">
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                              LIVE MAP: {m.activeMap.replace('de_', '').toUpperCase()}
                            </span>
                            <span className="text-slate-350 font-black">
                              {m.score?.teamAScore ?? 0} : {m.score?.teamBScore ?? 0}
                            </span>
                          </div>
                        )}

                        {/* 🗺️ MAPS VETO & SCORES BREAKDOWN ROW */}
                        {m.isSynced && (
                          <div className="mt-3 pt-3 border-t border-slate-850 flex flex-col gap-2 text-[10px] font-mono">
                            <div className="flex justify-between items-center text-slate-500 uppercase font-black tracking-wider text-[8px]">
                              <span>MAP VETOES & SCORES</span>
                              <span>{m.format} FORMAT</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {mapList.map((mapName, idx) => {
                                const mapStats = mapsStats.find(ms => ms.map_index === idx || ms.map_name === mapName);
                                const isPlayed = !!mapStats;
                                const cleanedName = mapName.replace('de_', '').toUpperCase();

                                return (
                                  <div 
                                    key={mapName}
                                    className={`px-2 py-1 rounded border text-[9px] flex items-center gap-1.5 ${
                                      isPlayed
                                        ? 'bg-indigo-950/20 border-indigo-900/40 text-slate-200'
                                        : 'bg-slate-950/30 border-slate-900 text-slate-550'
                                    }`}
                                  >
                                    <span>🗺️ {cleanedName}</span>
                                    {isPlayed ? (
                                      <strong className="text-indigo-400 font-mono">
                                        ({mapStats.score_team1} - {mapStats.score_team2})
                                      </strong>
                                    ) : (
                                      <span className="text-slate-650">(TBD)</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Footer Controls */}
                        <div className="flex justify-end gap-2 border-t border-slate-850 pt-4 mt-3">
                          <Link 
                            to={`/match-center/${m.id}`}
                            className="bg-slate-800 hover:bg-slate-700/80 text-xs font-bold text-slate-200 px-3.5 py-1.5 rounded-lg transition-colors font-mono"
                          >
                            PUBLIC VIEW
                          </Link>
                          {isAdmin && (
                            <Link 
                              to={`/admin/match-center/${m.id}`}
                              className="bg-violet-650/10 hover:bg-violet-650 text-violet-300 hover:text-white border border-violet-500/20 hover:border-violet-650 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all font-mono"
                            >
                              OPERATOR PANEL
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
    </div>
  );
}

export default MatchCenterList;
