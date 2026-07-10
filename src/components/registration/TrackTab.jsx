import React, { useState, useEffect } from 'react';
import {
  Search, Lock, CheckCircle2, XCircle, AlertCircle, Calendar,
  ChevronDown, ChevronUp, RefreshCw, User, ShieldCheck,
  ExternalLink, AlertOctagon, HelpCircle, Trophy, MessageSquare, Clock,
  Copy, Check, BookOpen, Headphones, ShieldAlert, FileText, ArrowRight
} from 'lucide-react';
import { trackRegistration } from '../../services/sheets';
import { formatEsportsDate } from '../../utils/dateHelper';
import { Terminal } from '../../utils/logger';

export const TrackTab = ({ tournament, playHover, playClick }) => {
  const [searchId, setSearchId] = useState('');
  const [secondaryId, setSecondaryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(60);
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedAccordions, setExpandedAccordions] = useState({});

  // Detect if the entered ID is sequential or a secure UUID
  const isIdSequential = searchId.trim() && !(searchId.trim().length === 36 && searchId.trim().includes('-'));

  // Prefill check on mount
  useEffect(() => {
    const prefillKey = `pp_track_prefill_${tournament?.id}`;
    const storedId = localStorage.getItem(prefillKey);
    if (storedId) {
      setSearchId(storedId);
      localStorage.removeItem(prefillKey);
      handleTrack(storedId);
    }
  }, [tournament?.id]);

  // Live Auto-refresh hook (updates every 60s without screen flicker)
  useEffect(() => {
    if (!teamData || loading) return;
    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          handleTrack(teamData.submissionId || teamData.registrationId, true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [teamData, loading]);

  const handleTrack = async (forcedId, silent = false) => {
    const idToSearch = forcedId || searchId;
    if (!idToSearch.trim()) return;

    if (!silent) {
      setLoading(true);
      setError(null);
      setTeamData(null);
    }
    setLogoError(false);
    setRefreshCountdown(60);
    Terminal.log('API', 'Tracking team portal status...', { searchId: idToSearch, secondaryId });

    try {
      const res = await trackRegistration(tournament.id, idToSearch, isIdSequential ? secondaryId : '');
      if (res && res.success && res.team) {
        setTeamData(res.team);
        Terminal.success('Status retrieved successfully.');
      } else {
        if (res?.error === 'VERIFICATION_REQUIRED') {
          setError("Verification required. For security, lookups using sequential Registration IDs require the Captain's FACEIT Nickname.");
        } else {
          setError(res?.error || 'ID not recognized. Make sure you entered the correct Submission ID or Registration ID.');
        }
        Terminal.error('API', 'Lookup failed.');
      }
    } catch (err) {
      setError('Connection to tracking terminal failed. Please try again.');
      Terminal.error('API', 'Tracking API Error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!teamData) return;
    navigator.clipboard.writeText(teamData.registrationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (playClick) playClick();
  };

  const toggleAccordion = (idx) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
    if (playClick) playClick();
  };

  // Fixed Faceit Level thresholds map
  const getFaceitLevel = (elo) => {
    if (!elo || isNaN(elo)) return 'N/A';
    if (elo <= 500) return 'Level 1';
    if (elo <= 750) return 'Level 2';
    if (elo <= 900) return 'Level 3';
    if (elo <= 1050) return 'Level 4';
    if (elo <= 1200) return 'Level 5';
    if (elo <= 1350) return 'Level 6';
    if (elo <= 1530) return 'Level 7';
    if (elo <= 1750) return 'Level 8';
    if (elo <= 2000) return 'Level 9';
    return 'Level 10';
  };

  const getStatusConfig = (status) => {
    const s = (status || '').toUpperCase();
    const CFG = {
      'SUBMITTED': { color: 'text-zinc-400 border-zinc-500/30 bg-zinc-500/5', label: '⚪ Registration Received' },
      'PENDING': { color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5', label: '🟡 Under Review' },
      'VALIDATING': { color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5', label: '🟡 Under Review' },
      'UNDER_REVIEW': { color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5', label: '🟡 Under Review' },
      'ACTION_REQUIRED': { color: 'text-orange-400 border-orange-500/30 bg-orange-500/5', label: '🟠 Action Required' },
      'OBJECTION': { color: 'text-orange-400 border-orange-500/30 bg-orange-500/5', label: '🟠 Action Required' },
      'APPROVED': { color: 'text-green-400 border-green-500/30 bg-green-500/5', label: '🟢 Approved' },
      'VERIFIED': { color: 'text-green-400 border-green-500/30 bg-green-500/5', label: '🟢 Approved' },
      'ROSTER_LOCKED': { color: 'text-green-400 border-green-500/30 bg-green-500/5', label: '🟢 Registration Complete' },
      'REJECTED': { color: 'text-red-400 border-red-500/30 bg-red-500/5', label: '🔴 Rejected' }
    };
    return CFG[s] || { color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5', label: '🟡 Under Review' };
  };

  // Central Status Engine deriving states from data variables
  const getDerivedData = () => {
    if (!teamData) return null;

    const roster = teamData.roster || [];
    const rosterSize = roster.length;
    const corePlayers = roster.filter(p => !((p.role || '').toLowerCase().includes('sub') || (p.role || '').toLowerCase().includes('substitute')));
    const substitutes = roster.filter(p => (p.role || '').toLowerCase().includes('sub') || (p.role || '').toLowerCase().includes('substitute'));

    const discordJoinedCount = roster.filter(p =>
      p.discordJoined === '✔' || p.discordJoined === 'YES' || p.discordJoined === 'TRUE'
    ).length;
    const roleIssuedCount = roster.filter(p =>
      p.roleIssued === '✔' || p.roleIssued === 'YES' || p.roleIssued === 'TRUE'
    ).length;
    const vcAssignedCount = roster.filter(p =>
      p.privateVc === '✔' || p.privateVc === 'YES' || p.privateVc === 'TRUE'
    ).length;
    const faceitEloCount = roster.filter(p =>
      p.faceitElo && p.faceitElo !== 'N/A' && p.faceitElo !== '⏳'
    ).length;

    const eloValues = roster
      .map(p => parseInt(p.faceitElo))
      .filter(val => !isNaN(val) && val > 0);
    const averageElo = eloValues.length > 0 ? Math.round(eloValues.reduce((a, b) => a + b, 0) / eloValues.length) : 0;
    const averageLevel = averageElo > 0 ? getFaceitLevel(averageElo) : 'N/A';

    const missingDiscordNames = roster
      .filter(p => !(p.discordJoined === '✔' || p.discordJoined === 'YES' || p.discordJoined === 'TRUE'))
      .map(p => p.ign || p.name || 'Unknown');

    const captainPlayer = roster.find(p => (p.role || '').toLowerCase() === 'captain') || roster[0] || { ign: 'N/A' };

    // Checklist States
    const hasJoinedDiscord = discordJoinedCount === rosterSize;
    const hasVerifiedFaceit = faceitEloCount === rosterSize;
    const isApprovedState = ['APPROVED', 'VERIFIED', 'ROSTER_LOCKED'].includes((teamData.status || '').toUpperCase());
    const hasDiscordAccess = roleIssuedCount === rosterSize || isApprovedState;
    const hasVoiceChannel = vcAssignedCount > 0;

    // Readiness Score Calculation
    let score = 0;
    score += (discordJoinedCount / rosterSize) * 30;
    score += (faceitEloCount / rosterSize) * 30;
    score += hasDiscordAccess ? 20 : 0;
    score += hasVoiceChannel ? 20 : 0;
    score = Math.round(score);

    let readinessText = 'Checking Roster';
    if (score === 100) readinessText = 'Ready';
    else if (score >= 75) readinessText = 'Almost Ready';

    let itemsRemaining = 0;
    if (!hasJoinedDiscord) itemsRemaining++;
    if (!hasVerifiedFaceit) itemsRemaining++;
    if (!hasDiscordAccess) itemsRemaining++;
    if (!hasVoiceChannel) itemsRemaining++;

    return {
      rosterSize,
      coreCount: corePlayers.length,
      subCount: substitutes.length,
      discordJoinedCount,
      roleIssuedCount,
      vcAssignedCount,
      faceitEloCount,
      averageElo,
      averageLevel,
      missingDiscordNames,
      captainName: captainPlayer.ign,
      hasJoinedDiscord,
      hasVerifiedFaceit,
      hasDiscordAccess,
      hasVoiceChannel,
      score,
      readinessText,
      itemsRemaining
    };
  };

  const derived = getDerivedData();

  // Rule-based Action Desk alerting
  const getActionDeskState = (derived, status, remarks) => {
    const s = (status || '').toUpperCase();
    const isRejected = s === 'REJECTED';
    const isApproved = ['APPROVED', 'VERIFIED', 'ROSTER_LOCKED'].includes(s);

    if (isRejected || remarks?.toLowerCase().includes('blocked') || remarks?.toLowerCase().includes('ban')) {
      return {
        type: 'CRITICAL',
        color: 'bg-red-500/5 border-red-500/20 text-red-400',
        icon: <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />,
        title: 'Registration Blocked',
        message: remarks || 'Registration cannot proceed. Please resolve active roster bans or contact tournament support.',
        queueText: 'Blocked - Action Required'
      };
    }

    if (derived.missingDiscordNames.length > 0) {
      return {
        type: 'PLAYER_ACTION',
        color: 'bg-orange-500/5 border-orange-500/20 text-orange-400',
        icon: <ShieldAlert className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />,
        title: 'Action Required',
        message: `${derived.missingDiscordNames.length} player(s) still need to join the Discord server. Required Players: ${derived.missingDiscordNames.join(', ')}. Once they join, verification will continue automatically.`,
        queueText: 'Waiting for player actions'
      };
    }

    if (isApproved && !derived.hasVoiceChannel) {
      return {
        type: 'ADMIN_ACTION',
        color: 'bg-blue-500/5 border-blue-500/20 text-blue-400',
        icon: <Headphones className="w-5 h-5 text-blue-400 shrink-0 mt-0.5 animate-pulse" />,
        title: 'Almost Ready',
        message: 'Your registration has been approved. Tournament staff are currently preparing your private voice channel. No action is required from your team.',
        queueText: 'Waiting for staff review (Estimated within 24 hours)'
      };
    }

    return {
      type: 'READY',
      color: 'bg-green-500/5 border-green-500/20 text-green-400',
      icon: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />,
      title: 'Everything Looks Good',
      message: 'No further action is required. We\'ll notify you if anything changes.',
      queueText: 'No waiting'
    };
  };

  const actionDesk = derived ? getActionDeskState(derived, teamData.status, teamData.remarks) : null;

  // Onboarding milestones progress timeline config
  const getTimelineSteps = (derived, status, activity) => {
    const s = (status || '').toUpperCase();
    const isApproved = ['APPROVED', 'VERIFIED', 'ROSTER_LOCKED'].includes(s);

    const getLogTime = (keywords) => {
      if (!activity) return null;
      const log = activity.find(l => {
        const detailLower = (l.details || '').toLowerCase();
        const eventLower = (l.event || '').toLowerCase();
        return keywords.some(k => detailLower.includes(k) || eventLower.includes(k));
      });
      return log ? log.time : null;
    };

    const submittedTime = getLogTime(['submit', 'registration_submitted']);
    const discordTime = getLogTime(['discord', 'joined_discord']);
    const faceitTime = getLogTime(['faceit', 'checked_faceit']);
    const approvedTime = getLogTime(['approved', 'status_changed', 'roster_approved']);

    const formatMilestoneTime = (timeStr, prevTimeStr) => {
      if (!timeStr) return null;
      if (prevTimeStr && timeStr.substring(0, 16) === prevTimeStr.substring(0, 16)) {
        return 'Completed';
      }
      try {
        const d = new Date(timeStr);
        return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch {
        return 'Completed';
      }
    };

    return [
      { label: 'Registration Submitted', time: formatMilestoneTime(submittedTime), done: true },
      { label: 'Discord Verified', time: formatMilestoneTime(discordTime, submittedTime), done: derived.hasJoinedDiscord },
      { label: 'FACEIT Verified', time: formatMilestoneTime(faceitTime, discordTime), done: derived.hasVerifiedFaceit },
      { label: 'Roster Approved', time: formatMilestoneTime(approvedTime, faceitTime), done: isApproved },
      { label: 'Tournament Ready', time: isApproved && derived.score === 100 ? 'Ready' : null, done: isApproved && derived.score === 100 }
    ];
  };

  const timelineSteps = derived ? getTimelineSteps(derived, teamData.status, teamData.activity) : [];

  // Log categories filtering setup
  const getLogCategory = (log) => {
    const details = (log.details || '').toLowerCase();
    const event = (log.event || '').toLowerCase();

    if (details.includes('submit') || event.includes('submit')) return 'Registration';
    if (details.includes('steam') || details.includes('faceit') || event.includes('verification') || event.includes('scan')) return 'Verification';
    if (details.includes('status') || details.includes('remark') || details.includes('seed') || log.actor === 'Verification Team') return 'Staff';
    return 'System';
  };

  const getLogCategoryDetails = (log) => {
    const cat = getLogCategory(log);
    const MAP = {
      'Registration': { icon: '📥', color: 'text-neon-cyan bg-neon-cyan/5 border-neon-cyan/10' },
      'Verification': { icon: '🛡️', color: 'text-neon-pink bg-neon-pink/5 border-neon-pink/10' },
      'Staff': { icon: '👨‍💼', color: 'text-yellow-500 bg-yellow-500/5 border-yellow-500/10' },
      'System': { icon: '⚙️', color: 'text-zinc-400 bg-zinc-500/5 border-zinc-500/10' }
    };
    return MAP[cat] || MAP['System'];
  };

  const filteredLogs = teamData?.activity
    ? [...teamData.activity].reverse().filter(log => {
      if (activeFilter === 'All') return true;
      return getLogCategory(log) === activeFilter;
    })
    : [];

  // Initials logo builder fallback
  const getTeamInitials = (name) => {
    if (!name) return 'PXP';
    return name
      .split(/[\s-_]+/)
      .map(w => w[0])
      .join('')
      .substring(0, 3)
      .toUpperCase();
  };

  const getPlayerStatusBadge = (player) => {
    const hasDiscord = player.discordJoined === '✔' || player.discordJoined === 'YES' || player.discordJoined === 'TRUE';
    const hasFaceit = player.faceitElo && player.faceitElo !== 'N/A' && player.faceitElo !== '⏳';
    const hasRole = player.roleIssued === '✔' || player.roleIssued === 'YES' || player.roleIssued === 'TRUE';
    const hasVc = player.privateVc === '✔' || player.privateVc === 'YES' || player.privateVc === 'TRUE';

    if (hasDiscord && hasFaceit && hasRole && hasVc) {
      return <span className="text-[10px] text-green-400 border border-green-500/20 bg-green-500/5 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Ready</span>;
    }
    if (!hasDiscord || !hasFaceit) {
      return <span className="text-[10px] text-red-400 border border-red-500/20 bg-red-500/5 px-2 py-0.5 rounded font-bold uppercase">Needs Action</span>;
    }
    return <span className="text-[10px] text-yellow-400 border border-yellow-500/20 bg-yellow-500/5 px-2 py-0.5 rounded font-bold uppercase">Pending</span>;
  };

  const getPlayerMiniSummary = (player) => {
    const hasDiscord = player.discordJoined === '✔' || player.discordJoined === 'YES' || player.discordJoined === 'TRUE';
    const hasFaceit = player.faceitElo && player.faceitElo !== 'N/A' && player.faceitElo !== '⏳';
    const hasRole = player.roleIssued === '✔' || player.roleIssued === 'YES' || player.roleIssued === 'TRUE';
    const hasVc = player.privateVc === '✔' || player.privateVc === 'YES' || player.privateVc === 'TRUE';

    return (
      <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider mr-2">
        <span className={hasDiscord ? 'text-green-400' : 'text-zinc-600'}>DISCORD</span>
        <span className="text-zinc-800 font-normal">|</span>
        <span className={hasFaceit ? 'text-green-400' : 'text-zinc-600'}>FACEIT</span>
        <span className="text-zinc-800 font-normal">|</span>
        <span className={hasRole ? 'text-green-400' : 'text-zinc-600'}>ROLE</span>
        <span className="text-zinc-800 font-normal">|</span>
        <span className={hasVc ? 'text-green-400' : 'text-zinc-600'}>VC</span>
      </div>
    );
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) + ' PKT';
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto font-body">
      <div className="glass-panel p-8 min-h-[500px]">
        <div className="hud-crosshair tl" /><div className="hud-crosshair tr" />

        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
          <h2 className="text-4xl text-white font-heading tracking-wider leading-none uppercase flex items-center gap-3">
            <Lock className="w-8 h-8 text-neon-cyan" />
            Team Portal
          </h2>
          {teamData && (
            <button
              onClick={() => { playClick && playClick(); setTeamData(null); setError(null); setSearchId(''); setSecondaryId(''); }}
              className="text-zinc-500 hover:text-white flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors font-body"
            >
              ← Track Another
            </button>
          )}
        </div>

        {!teamData ? (
          /* SEARCH INPUT FORM */
          <div className="max-w-md mx-auto py-8 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-neon-cyan/5 blur-xl rounded-full" />
              <Search className="w-16 h-16 text-neon-cyan/40 mx-auto" />
            </div>

            <h3 className="text-xl font-heading text-white uppercase tracking-widest mb-3">
              Access Team Dashboard
            </h3>
            <p className="text-zinc-500 font-body text-xs leading-relaxed mb-8 uppercase tracking-wider">
              Enter your Submission ID or Registration ID below to log into your team's live verification portal, manage checklist operations, and review staff notes.
            </p>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center bg-black/40 border border-white/10 rounded overflow-hidden p-1 focus-within:border-neon-cyan transition-colors">
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="ENTER SUBMISSION ID OR REG ID"
                    className="bg-transparent border-none text-white font-body px-4 py-3 focus:outline-none flex-grow text-sm placeholder-white/20 tracking-wider uppercase font-semibold text-center md:text-left"
                    onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                  />
                  {!isIdSequential && (
                    <button
                      onClick={() => { playClick && playClick(); handleTrack(); }}
                      disabled={loading || !searchId.trim()}
                      className="bg-neon-cyan text-black px-6 py-3 font-heading font-black text-sm uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'ENTER'}
                    </button>
                  )}
                </div>

                {isIdSequential && (
                  <div className="space-y-2 text-left animate-in slide-in-from-top duration-300">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-body block mb-1">
                      Captain's FACEIT Nickname (Required for verification)
                    </label>
                    <div className="flex items-center bg-black/40 border border-white/10 rounded overflow-hidden p-1 focus-within:border-neon-cyan transition-colors">
                      <input
                        type="text"
                        value={secondaryId}
                        onChange={(e) => setSecondaryId(e.target.value)}
                        placeholder="e.g. SultaaN-"
                        className="bg-transparent border-none text-white font-body px-4 py-3 focus:outline-none flex-grow text-sm placeholder-white/20 tracking-wider font-semibold"
                        onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                      />
                      <button
                        onClick={() => { playClick && playClick(); handleTrack(); }}
                        disabled={loading || !secondaryId.trim()}
                        className="bg-neon-cyan text-black px-6 py-3 font-heading font-black text-sm uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'VERIFY & ENTER'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex gap-3 items-start bg-red-950/20 border border-red-500/20 p-4 rounded text-left animate-in fade-in duration-300">
                  <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-red-400 font-bold text-xs uppercase tracking-widest font-body">Access Denied</span>
                    <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 text-left bg-white/5 p-5 rounded border border-white/5">
              <h4 className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-2 font-body flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-neon-pink" /> Security Notice
              </h4>
              <ul className="text-xs text-zinc-500 font-body space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Using your secure, 36-character Submission ID allows instant lookup (it is a unique cryptographical key).</li>
                <li>Using a sequential Registration ID requires matching it with the Captain's FACEIT Nickname submitted during registration to prevent enumeration.</li>
              </ul>
            </div>
          </div>
        ) : (
          /* PORTAL DASHBOARD V1.0 */
          <div className="space-y-8 animate-in zoom-in-95 duration-500 text-left">
            
            {/* 1. Team Profile Card (Hero Identity Banner) */}
            <div className="bg-black/40 border border-white/5 p-6 rounded-lg relative overflow-hidden bg-gradient-to-b from-neon-cyan/5 to-transparent flex flex-col gap-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  {teamData.logo && !logoError ? (
                    <img
                      src={teamData.logo}
                      alt={teamData.name}
                      className="w-20 h-20 object-contain bg-zinc-950 border border-white/10 rounded-full p-1"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-neon-cyan/20 to-neon-pink/20 border border-neon-cyan/30 rounded-full flex items-center justify-center font-heading text-white font-black text-2xl uppercase tracking-wider">
                      {getTeamInitials(teamData.name)}
                    </div>
                  )}
                  <div className="space-y-2">
                    <h3 className="text-4xl font-heading text-white uppercase tracking-widest leading-none">
                      {teamData.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase font-body">Registration ID:</span>
                      <span className="text-xs text-white font-mono bg-white/5 border border-white/10 px-2.5 py-0.5 rounded flex items-center gap-1.5 select-all">
                        {teamData.registrationId}
                        <button
                          onClick={handleCopy}
                          className="text-zinc-500 hover:text-white transition-colors"
                          title="Copy Registration ID"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end font-heading">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-body mb-1.5">Live Status</span>
                  <span className={`px-4 py-2 border rounded font-black text-xs tracking-widest leading-none ${getStatusConfig(teamData.status).color}`}>
                    {getStatusConfig(teamData.status).label}
                  </span>
                </div>
              </div>

              {/* Grid Metadata details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/5 pt-5 text-xs font-body">
                <div>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">Current Tournament</span>
                  <span className="text-white font-semibold block mt-0.5">{tournament.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">Average FACEIT</span>
                  <span className="text-white font-semibold block mt-0.5">{derived.averageElo} ({derived.averageLevel})</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">Roster Breakdown</span>
                  <span className="text-white font-semibold block mt-0.5">{derived.coreCount} Core • {derived.subCount} Subs</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">Team Captain</span>
                  <span className="text-white font-semibold block mt-0.5">{derived.captainName}</span>
                </div>
              </div>

              {/* System refresh Status Footer */}
              <div className="border-t border-white/5 pt-4 flex flex-wrap items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-body gap-3">
                <span>Registered: {new Date(teamData.registeredAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                <div className="flex items-center gap-4">
                  <span>Last Updated: {formatDateTime(teamData.lastUpdated)}</span>
                  <span className="text-neon-cyan flex items-center gap-1.5">
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    Refreshing in {refreshCountdown}s
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Team Summary (Quick Dashboard) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-black/30 border border-white/5 p-4 rounded text-center">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-body">Average FACEIT</span>
                <p className="text-2xl font-heading tracking-wider mt-1 text-white font-black">
                  {derived.averageElo > 0 ? derived.averageElo : 'N/A'}
                </p>
              </div>
              <div className="bg-black/30 border border-white/5 p-4 rounded text-center">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-body">Players Verified</span>
                <p className="text-2xl font-heading tracking-widest mt-1 text-green-400 font-black">
                  {derived.score === 100 ? '5 / 5' : `${derived.rosterSize - derived.itemsRemaining} / ${derived.rosterSize}`}
                </p>
              </div>
              <div className="bg-black/30 border border-white/5 p-4 rounded text-center">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-body">Discord Connection</span>
                <p className={`text-2xl font-heading tracking-wider mt-1 font-black ${derived.hasJoinedDiscord ? 'text-green-400' : 'text-yellow-400'}`}>
                  {derived.hasJoinedDiscord ? 'Complete' : 'Pending'}
                </p>
              </div>
              <div className="bg-black/30 border border-white/5 p-4 rounded text-center">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-body">Registration Status</span>
                <p className={`text-2xl font-heading tracking-wider mt-1 font-black ${teamData.status.toUpperCase() === 'APPROVED' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {teamData.status}
                </p>
              </div>
            </div>

            {/* 3. Action Desk (Rule-Based Alert Box) */}
            {actionDesk && (
              <div className={`${actionDesk.color} border p-6 rounded-lg relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in slide-in-from-top duration-300`}>
                <div className="space-y-3 font-body text-xs text-zinc-400 flex-grow text-left">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest font-body flex items-center gap-2">
                    {actionDesk.icon}
                    {actionDesk.title}
                  </h4>
                  <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-line font-medium">
                    {actionDesk.message}
                  </p>
                  
                  {teamData.remarks && actionDesk.type !== 'CRITICAL' && (
                    <div className="border-t border-white/5 pt-2.5 mt-2.5">
                      <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider mb-1">Staff Note</span>
                      <p className="text-zinc-400 font-medium italic">"{teamData.remarks}"</p>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-body text-center md:text-right">
                    {actionDesk.queueText}
                  </span>
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2">
                    <a
                      href="https://discord.gg/pixelpalacee"
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-3 bg-neon-cyan text-black text-xs font-black uppercase tracking-widest font-heading hover:bg-white transition-all text-center rounded flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> OPEN SUPPORT TICKET
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Tournament Readiness Checklist Card */}
            <div className="bg-black/20 border border-white/5 p-6 rounded-lg text-left">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-body mb-6">
                Tournament Readiness Checklist
              </h4>

              {/* Dynamic Readiness score Bar */}
              <div className="space-y-2 mb-6 border-b border-white/5 pb-6">
                <div className="flex justify-between items-center text-xs font-heading font-black tracking-widest uppercase">
                  <span className="text-zinc-400 flex items-center gap-2">
                    Tournament Ready: 
                    <span className={derived.score === 100 ? 'text-green-400' : 'text-yellow-400'}>
                      {derived.readinessText}
                    </span>
                    {derived.itemsRemaining > 0 && (
                      <span className="text-[10px] text-zinc-500 font-normal">
                        ({derived.itemsRemaining} item{derived.itemsRemaining > 1 ? 's' : ''} remaining)
                      </span>
                    )}
                  </span>
                  <span className={derived.score === 100 ? 'text-green-400' : 'text-yellow-400'}>
                    {derived.score}%
                  </span>
                </div>
                <div className="w-full bg-zinc-950 border border-white/10 rounded-full h-3 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${derived.score === 100 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-neon-cyan shadow-[0_0_8px_rgba(0,240,255,0.6)]'}`}
                    style={{ width: `${derived.score}%` }}
                  />
                </div>
              </div>

              {/* Requirement Check details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/20 p-4 rounded border border-white/5">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Players Joined Discord</span>
                  <div className="flex items-center gap-2 mt-1">
                    {derived.hasJoinedDiscord ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />}
                    <span className={`text-sm font-heading font-black ${derived.hasJoinedDiscord ? 'text-green-400' : 'text-yellow-400'}`}>
                      {derived.hasJoinedDiscord ? 'Complete' : `${derived.discordJoinedCount}/${derived.rosterSize}`}
                    </span>
                  </div>
                </div>

                <div className="bg-black/20 p-4 rounded border border-white/5">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">FACEIT Accounts Verified</span>
                  <div className="flex items-center gap-2 mt-1">
                    {derived.hasVerifiedFaceit ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />}
                    <span className={`text-sm font-heading font-black ${derived.hasVerifiedFaceit ? 'text-green-400' : 'text-yellow-400'}`}>
                      {derived.hasVerifiedFaceit ? 'Complete' : `${derived.faceitEloCount}/${derived.rosterSize}`}
                    </span>
                  </div>
                </div>

                <div className="bg-black/20 p-4 rounded border border-white/5">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Tournament Discord Access</span>
                  <div className="flex items-center gap-2 mt-1">
                    {derived.hasDiscordAccess ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />}
                    <span className={`text-sm font-heading font-black ${derived.hasDiscordAccess ? 'text-green-400' : 'text-yellow-400'}`}>
                      {derived.hasDiscordAccess ? 'Granted' : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="bg-black/20 p-4 rounded border border-white/5">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Private Team Voice Channel</span>
                  <div className="flex items-center gap-2 mt-1">
                    {derived.hasVoiceChannel ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />}
                    <span className={`text-sm font-heading font-black ${derived.hasVoiceChannel ? 'text-green-400' : 'text-yellow-400'}`}>
                      {derived.hasVoiceChannel ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Registration Progress Timeline */}
            <div className="bg-black/20 border border-white/5 p-6 rounded-lg">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-body mb-6">
                Registration Progress
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
                {timelineSteps.map((step, idx) => (
                  <div key={idx} className="relative flex flex-col pl-4 md:pl-0 border-l-2 md:border-l-0 md:border-t-2 border-zinc-800 pt-0 md:pt-4 last:border-0 pb-4 md:pb-0 font-body">
                    <div className={`absolute left-[-6px] md:left-auto md:top-[-6px] w-2.5 h-2.5 rounded-full ${step.done
                      ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                      : 'bg-zinc-800'
                      }`} />
                    <span className={`text-xs font-heading uppercase tracking-widest ${step.done ? 'text-green-400' : 'text-zinc-500'}`}>
                      {step.label}
                    </span>
                    <span className="text-[9px] text-zinc-500 uppercase mt-1 tracking-wider font-body leading-tight">
                      {step.time || (step.done ? 'Completed' : 'Pending')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Team Roster Ledger Table */}
            <div className="bg-black/20 border border-white/5 p-6 rounded-lg">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-body mb-4 flex items-center justify-between">
                <span>Roster Verification Ledger</span>
                {teamData.seed && teamData.seed !== 'TBD' && (
                  <span className="text-[10px] text-yellow-500/70 border border-yellow-500/20 bg-yellow-500/5 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Seed: {teamData.seed}
                  </span>
                )}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-500 uppercase tracking-widest text-[9px] font-bold font-heading">
                      <th className="pb-3">Player</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3 text-center">Discord</th>
                      <th className="pb-3 text-center">FACEIT</th>
                      <th className="pb-3 text-center">Access</th>
                      <th className="pb-3 text-center">VC</th>
                      <th className="pb-3 text-center">Ready</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {teamData.roster.map((player, idx) => {
                      const isCaptain = (player.role || '').toLowerCase() === 'captain';
                      const isSub = (player.role || '').toLowerCase().includes('substitute') || (player.role || '').toLowerCase().includes('sub');

                      const hasDiscord = player.discordJoined === '✔' || player.discordJoined === 'YES' || player.discordJoined === 'TRUE';
                      const hasFaceit = player.faceitElo && player.faceitElo !== 'N/A' && player.faceitElo !== '⏳';
                      const hasRole = player.roleIssued === '✔' || player.roleIssued === 'YES' || player.roleIssued === 'TRUE';
                      const hasVc = player.privateVc === '✔' || player.privateVc === 'YES' || player.privateVc === 'TRUE';

                      return (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 font-bold text-white flex items-center gap-2">
                            <User className={`w-3.5 h-3.5 ${isCaptain ? 'text-yellow-500' : 'text-zinc-500'}`} />
                            {player.ign}
                          </td>
                          <td className="py-3.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wider ${isCaptain ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                              (isSub ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20')
                              }`}>
                              {player.role}
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            {hasDiscord ? '✅' : '❌'}
                          </td>
                          <td className="py-3.5 text-center">
                            {hasFaceit ? '✅' : '❌'}
                          </td>
                          <td className="py-3.5 text-center">
                            {hasRole ? '✅' : '❌'}
                          </td>
                          <td className="py-3.5 text-center">
                            {hasVc ? '✅' : '❌'}
                          </td>
                          <td className="py-3.5 text-center font-bold">
                            {getPlayerStatusBadge(player)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 7. Collapsible Player Accordions */}
            <div className="space-y-3">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block text-left">
                Submitted Registration Details
              </span>
              {teamData.roster.map((player, idx) => {
                const isExpanded = expandedAccordions[idx];
                const isCaptain = (player.role || '').toLowerCase() === 'captain';
                
                return (
                  <div key={idx} className="bg-black/20 border border-white/5 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleAccordion(idx)}
                      className="w-full p-4 flex items-center justify-between text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest font-body hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <User className={`w-4 h-4 ${isCaptain ? 'text-yellow-500' : 'text-zinc-500'}`} />
                        <span>{player.role}: {player.ign}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {getPlayerMiniSummary(player)}
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 border-t border-white/5 bg-black/40 space-y-4 text-zinc-400 text-xs font-body animate-in slide-in-from-top duration-300 text-left">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest block mb-1">Discord Identifier</span>
                            <span className="text-white font-mono text-xs">{player.discord || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest block mb-1">Steam Account</span>
                            <a href={player.steam} target="_blank" rel="noreferrer" className="text-neon-pink hover:underline inline-flex items-center gap-1 mt-0.5">
                              View Profile <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest block mb-1">FACEIT Connection</span>
                            <a href={player.faceit} target="_blank" rel="noreferrer" className="text-neon-cyan hover:underline inline-flex items-center gap-1 mt-0.5">
                              View Profile <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                          <div>
                            <span className="text-zinc-600">Discord Verification:</span>
                            <span className={`ml-1 font-bold ${player.discordJoined === '✔' ? 'text-green-400' : 'text-red-400'}`}>
                              {player.discordJoined === '✔' ? 'Joined' : 'Missing'}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-600">Discord Role:</span>
                            <span className={`ml-1 font-bold ${player.roleIssued === '✔' ? 'text-green-400' : 'text-zinc-500'}`}>
                              {player.roleIssued === '✔' ? 'Assigned' : 'Pending'}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-600">Private VC:</span>
                            <span className={`ml-1 font-bold ${player.privateVc === '✔' ? 'text-green-400' : 'text-yellow-400'}`}>
                              {player.privateVc === '✔' ? 'Ready' : 'Pending'}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-600">FACEIT Rating:</span>
                            <span className="ml-1 font-bold text-neon-pink">
                              {player.faceitElo !== 'N/A' && player.faceitElo !== '⏳' ? `${getFaceitLevel(parseInt(player.faceitElo))} (${player.faceitElo} ELO)` : '⏳ Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 8. Notification History (Filterable, Newest-First) */}
            {teamData.activity && teamData.activity.length > 0 && (
              <div className="bg-black/20 border border-white/5 p-6 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-body flex items-center gap-2 font-heading">
                    <Clock className="w-4 h-4 text-neon-cyan" /> Notification History
                  </h4>
                  
                  {/* Category Filter tabs */}
                  <div className="flex flex-wrap gap-1 bg-black/40 p-1 border border-white/10 rounded text-[10px] font-bold uppercase font-body">
                    {['All', 'Registration', 'Verification', 'Staff', 'System'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => { playClick && playClick(); setActiveFilter(filter); }}
                        className={`px-3 py-1.5 rounded transition-colors ${activeFilter === filter ? 'bg-neon-cyan text-black' : 'text-zinc-500 hover:text-white'}`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative border-l border-white/10 pl-6 space-y-6 max-h-[300px] overflow-y-auto pr-2">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log, idx) => {
                      const details = getLogCategoryDetails(log);
                      return (
                        <div key={idx} className="relative animate-in slide-in-from-left duration-300 text-left">
                          <div className="absolute left-[-31px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-800 border-2 border-white/10" />
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-body leading-none border ${details.color}`}>
                                {details.icon} {getLogCategory(log)}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-bold font-mono">
                                {formatDateTime(log.time)}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-white/5 text-zinc-400 border border-white/5">
                              {log.actor}
                            </span>
                          </div>
                          <p className="text-zinc-300 text-xs mt-1.5 leading-relaxed">
                            {log.details || log.message}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-zinc-500 text-xs py-4 text-center">No logs matching this category filter.</p>
                  )}
                </div>
              </div>
            )}

            {/* 9. Dynamic Tournament Information Card Grid */}
            <div className="bg-black/20 border border-white/5 p-6 rounded-lg text-left">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-body mb-6">
                Tournament Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 font-body text-xs">
                <div className="border-b sm:border-b-0 sm:border-r border-white/5 pb-4 sm:pb-0 sm:pr-6">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Registration Closes</span>
                  <span className="text-white font-semibold text-sm block">
                    {new Date(tournament.registrationDeadline).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="border-b sm:border-b-0 md:border-r border-white/5 pb-4 sm:pb-0 sm:pr-6">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Check-in Schedule</span>
                  <span className="text-white font-semibold text-sm block">
                    45 minutes prior to match launch
                  </span>
                </div>

                <div className="border-b sm:border-b-0 sm:border-r md:border-r-0 border-white/5 pb-4 sm:pb-0 sm:pr-6">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Anti-Cheat System</span>
                  <span className="text-white font-semibold text-sm block">
                    {tournament.antiCheat || 'Akros'} Required
                  </span>
                </div>

                <div className="border-b sm:border-b-0 md:border-r border-white/5 pb-4 sm:pb-0 sm:pr-6 md:pt-4">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Match Format</span>
                  <span className="text-white font-semibold text-sm block">
                    {tournament.format || '5v5'} Swiss Bracket
                  </span>
                </div>

                <div className="border-b sm:border-b-0 sm:border-r border-white/5 pb-4 sm:pb-0 sm:pr-6 md:pt-4">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Prize Pool Distribution</span>
                  <span className="text-white font-semibold text-sm block">
                    {tournament.prizePool || '$2,750 USD'}
                  </span>
                </div>

                <div className="md:pt-4">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-1">Official Map Pool</span>
                  <span className="text-white font-semibold text-xs block leading-normal mt-0.5 truncate" title={tournament.maps ? tournament.maps.join(', ') : ''}>
                    {tournament.maps ? tournament.maps.join(', ') : 'TBD'}
                  </span>
                </div>
              </div>
            </div>

            {/* 10. Need Help? Card */}
            <div className="glass-panel p-6 border-l-4 border-l-yellow-500 bg-yellow-950/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="text-left">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest font-heading mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" /> Need Help with Registration?
                </h4>
                <p className="text-zinc-300 font-body text-xs leading-relaxed max-w-xl">
                  Having trouble verifying steam accounts, discord roles, or configuring private voice checks? Open a support ticket on our server and our staff will respond within 24 hours.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full md:w-auto text-[10px] font-heading font-black tracking-wider font-body">
                <a
                  href="https://discord.gg/pixelpalacee"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-yellow-500 hover:bg-white text-black rounded text-center transition-colors"
                >
                  DISCORD
                </a>
                <a
                  href="https://discord.gg/pixelpalacee"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded text-center transition-colors"
                >
                  TICKET
                </a>
                <a
                  href="https://discord.gg/pixelpalacee"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded text-center transition-colors"
                >
                  RULEBOOK
                </a>
                <a
                  href="https://discord.gg/pixelpalacee"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded text-center transition-colors"
                >
                  FAQ
                </a>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};
