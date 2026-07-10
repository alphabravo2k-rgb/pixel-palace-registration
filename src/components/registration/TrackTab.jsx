import React, { useState, useEffect } from 'react';
import {
  Search, Lock, CheckCircle2, XCircle, AlertCircle, Calendar,
  ChevronDown, ChevronUp, RefreshCw, User, ShieldCheck,
  ExternalLink, AlertOctagon, HelpCircle, Trophy, MessageSquare, Clock
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
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Detect if the entered ID is sequential (e.g. PP-CC2-2026-000005) or a secure UUID
  const isIdSequential = searchId.trim() && !(searchId.trim().length === 36 && searchId.trim().includes('-'));

  // Check for pre-filled ID from localStorage (e.g. redirected from successful registration)
  useEffect(() => {
    const prefillKey = `pp_track_prefill_${tournament?.id}`;
    const storedId = localStorage.getItem(prefillKey);
    if (storedId) {
      setSearchId(storedId);
      localStorage.removeItem(prefillKey);
      handleTrack(storedId);
    }
  }, [tournament?.id]);

  const handleTrack = async (forcedId) => {
    const idToSearch = forcedId || searchId;
    if (!idToSearch.trim()) return;

    setLoading(true);
    setError(null);
    setTeamData(null);
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

  // Fixed State Machine configuration mapping database values to clear user-facing labels
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

  // Helper to format date with timezones cleanly
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

  // ─── DATA-DERIVED VERIFICATION COUNTERS ────────────────────────────────────
  const rosterSize = teamData?.roster?.length || 0;
  const discordJoinedCount = teamData?.roster?.filter(p =>
    p.discordJoined === '✔' || p.discordJoined === 'YES' || p.discordJoined === 'TRUE'
  ).length || 0;
  const roleIssuedCount = teamData?.roster?.filter(p =>
    p.roleIssued === '✔' || p.roleIssued === 'YES' || p.roleIssued === 'TRUE'
  ).length || 0;
  const vcAssignedCount = teamData?.roster?.filter(p =>
    p.privateVc === '✔' || p.privateVc === 'YES' || p.privateVc === 'TRUE'
  ).length || 0;
  const faceitEloCount = teamData?.roster?.filter(p =>
    p.faceitElo && p.faceitElo !== 'N/A' && p.faceitElo !== '⏳'
  ).length || 0;

  // Outstanding task lists
  const missingDiscordPlayers = teamData?.roster
    ?.filter(p => !(p.discordJoined === '✔' || p.discordJoined === 'YES' || p.discordJoined === 'TRUE'))
    .map(p => p.ign) || [];
  const missingVcPlayers = teamData?.roster
    ?.filter(p => !(p.privateVc === '✔' || p.privateVc === 'YES' || p.privateVc === 'TRUE'))
    .map(p => p.ign) || [];

  // Configurable Checklist items for verification statistics
  const verificationChecklist = [
    { label: 'Discord Server', count: discordJoinedCount, icon: 'Users' },
    { label: 'Private VC setup', count: vcAssignedCount, icon: 'MessageCircle' },
    { label: 'Staff Roles Issued', count: roleIssuedCount, icon: 'ShieldCheck' },
    { label: 'FACEIT Profiles', count: faceitEloCount, icon: 'Gamepad2' }
  ];

  // ─── DATA-DERIVED STATUS TIMELINE (REGISTRATION LIFECYCLE ONLY) ────────────
  const getDerivedSteps = (status) => {
    const s = (status || '').toUpperCase();
    const isApproved = s === 'APPROVED' || s === 'VERIFIED' || s === 'ROSTER_LOCKED';
    const isActionRequired = s === 'ACTION_REQUIRED' || s === 'OBJECTION';

    const steps = [
      { label: 'Submitted', desc: 'Roster details received', done: true, active: false },
      {
        label: 'Discord Joined',
        desc: `Server members (${discordJoinedCount}/${rosterSize})`,
        done: discordJoinedCount === rosterSize,
        active: discordJoinedCount < rosterSize && !isApproved
      },
      {
        label: 'FACEIT Checked',
        desc: `Accounts verified (${faceitEloCount}/${rosterSize})`,
        done: faceitEloCount === rosterSize,
        active: discordJoinedCount === rosterSize && faceitEloCount < rosterSize && !isApproved
      },
      {
        label: 'Under Review',
        desc: isApproved ? 'Checks completed' : 'Operations review active',
        done: isApproved,
        active: faceitEloCount === rosterSize && !isApproved,
        error: isActionRequired
      },
      {
        label: 'Approved',
        desc: isApproved ? 'Roster secured' : 'Pending final lock',
        done: isApproved,
        active: false
      }
    ];

    return steps;
  };

  const maskId = (id) => {
    if (!id || id.length < 12) return id;
    return id.substring(0, 8) + '...' + id.substring(id.length - 8);
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
              onClick={() => { playClick(); setTeamData(null); setError(null); setSecondaryId(''); }}
              className="text-zinc-500 hover:text-white flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors font-body"
            >
              ← Track Another
            </button>
          )}
        </div>

        {!teamData ? (
          /* SEARCH INPUT STATE */
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
                {/* PRIMARY ID INPUT */}
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
                      onClick={() => { playClick(); handleTrack(); }}
                      disabled={loading || !searchId.trim()}
                      className="bg-neon-cyan text-black px-6 py-3 font-heading font-black text-sm uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'ENTER'}
                    </button>
                  )}
                </div>

                {/* SECURE SECOND-FACTOR VERIFICATION FOR SEQUENTIAL REG IDs */}
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
                        onClick={() => { playClick(); handleTrack(); }}
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
          /* TEAM TRACKING DASHBOARD */
          <div className="space-y-8 animate-in zoom-in-95 duration-500 text-left">
            {/* HEADER HERO */}
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 bg-black/40 border border-white/5 p-6 rounded-lg relative overflow-hidden bg-gradient-to-b from-neon-cyan/5 to-transparent">
              <div className="flex items-center gap-5">
                {teamData.logo ? (
                  <img
                    src={teamData.logo}
                    alt={teamData.name}
                    className="w-16 h-16 object-contain bg-zinc-900 border border-white/10 rounded p-1"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-neon-cyan/5 rounded border border-neon-cyan/20 flex items-center justify-center font-heading text-neon-cyan font-black text-2xl">
                    {teamData.tag}
                  </div>
                )}
                <div>
                  <h3 className="text-3xl font-heading text-white uppercase tracking-widest leading-none mb-1">
                    {teamData.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-body">
                    <span>Reg ID: {teamData.registrationId}</span>
                    <span>•</span>
                    <span className="cursor-help" title={teamData.submissionId}>Sub ID: {maskId(teamData.submissionId)}</span>
                    <span>•</span>
                    <span>Last Updated: {formatDateTime(teamData.lastUpdated)} by {teamData.updatedBy || 'Tournament Operations'}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-center md:items-end font-heading">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-body mb-2">Live Status</span>
                <span className={`px-4 py-2 border rounded font-black text-xs tracking-widest leading-none ${getStatusConfig(teamData.status).color}`}>
                  {getStatusConfig(teamData.status).label}
                </span>
              </div>
            </div>

            {/* FUTURE-PROOF CONFIGURABLE CHECKLIST SUMMARY GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {verificationChecklist.map((item, idx) => (
                <div key={idx} className="bg-black/30 border border-white/5 p-4 rounded text-center">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-body">{item.label}</span>
                  <p className={`text-2xl font-heading tracking-widest mt-1 font-semibold ${item.count === rosterSize ? 'text-green-400' : 'text-yellow-400'}`}>
                    {item.count} / {rosterSize}
                  </p>
                </div>
              ))}
            </div>

            {/* DEDICATED CALL-TO-ACTION DESK (ACTION REQUIRED / OBJECTION) */}
            {((teamData.status || '').toUpperCase() === 'ACTION_REQUIRED' || (teamData.status || '').toUpperCase() === 'OBJECTION' || missingDiscordPlayers.length > 0 || missingVcPlayers.length > 0) && (
              <div className="bg-orange-500/5 border border-orange-500/20 p-6 rounded relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-4 font-body text-xs text-zinc-400 flex-grow">
                  <h4 className="text-[10px] text-orange-400 font-bold uppercase tracking-widest font-body flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-orange-400" /> Action Required
                  </h4>

                  {/* Unresolved Verification Items Summary */}
                  <div className="space-y-2">
                    {missingDiscordPlayers.length > 0 && (
                      <p>
                        <strong className="text-white uppercase tracking-wider text-[10px]">⚠️ Discord Server Sync: </strong>
                        The following players are not in the server: <span className="text-orange-400 font-semibold">{missingDiscordPlayers.join(', ')}</span>
                      </p>
                    )}
                    {missingVcPlayers.length > 0 && (
                      <p className="pt-1.5 border-t border-white/5">
                        <strong className="text-white uppercase tracking-wider text-[10px]">⚠️ Voice Channel Verification: </strong>
                        The following players have not completed voice checks: <span className="text-yellow-400 font-semibold">{missingVcPlayers.join(', ')}</span>
                      </p>
                    )}
                  </div>

                  {/* Explicit Next Steps Box */}
                  <div className="bg-black/40 border border-white/5 p-4 rounded space-y-2 text-zinc-300">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">NEXT STEPS FOR TEAM CAPTAIN</span>
                    <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-[11px]">
                      <li>Ask outstanding players to join the Discord server and link accounts.</li>
                      <li>For voice channels, request players join a verification channel for sound setup.</li>
                      <li>Wait for synchronization logs (verification logs sync automatically).</li>
                      <li>Refresh this portal page to confirm status.</li>
                    </ol>
                  </div>
                </div>

                {/* CALL-TO-ACTION BUTTONS FOR QUICK RESOLUTION */}
                <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
                  <a
                    href="https://discord.gg/pixelpalacee"
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-3 bg-orange-500 text-black text-xs font-black uppercase tracking-widest font-heading hover:bg-white transition-all text-center rounded flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> OPEN SUPPORT TICKET
                  </a>
                  <a
                    href="https://discord.gg/pixelpalacee"
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-3 bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-widest font-body hover:bg-white/10 transition-all text-center rounded flex items-center justify-center gap-2"
                  >
                    JOIN DISCORD SERVER
                  </a>
                </div>
              </div>
            )}

            {/* ADMIN REMARKS */}
            {teamData.remarks && (
              <div className="bg-zinc-900 border-l-4 border-l-neon-cyan border border-white/5 p-5 rounded-r">
                <h4 className="text-[10px] text-neon-cyan font-bold uppercase tracking-widest mb-3 font-body flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Operations Team Remarks
                </h4>
                <p className="text-zinc-300 font-body text-xs leading-relaxed whitespace-pre-line">
                  {teamData.remarks}
                </p>
              </div>
            )}

            {/* DYNAMIC DATA-DERIVED TIMELINE (REGISTRATION PHASES ONLY) */}
            <div className="bg-black/20 border border-white/5 p-6 rounded-lg">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-body mb-6">
                Roster Verification Steps (Data-Derived)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
                {getDerivedSteps(teamData.status).map((step, idx) => (
                  <div key={idx} className="relative flex flex-col pl-4 md:pl-0 border-l-2 md:border-l-0 md:border-t-2 border-zinc-800 pt-0 md:pt-4 last:border-0 pb-4 md:pb-0 font-body">
                    <div className={`absolute left-[-6px] md:left-auto md:top-[-6px] w-2.5 h-2.5 rounded-full ${step.done
                      ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                      : (step.active
                        ? (step.error ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-neon-cyan shadow-[0_0_8px_rgba(0,240,255,0.6)]')
                        : 'bg-zinc-800')
                      }`} />
                    <span className={`text-xs font-heading uppercase tracking-widest ${step.done ? 'text-green-400' : (step.active ? (step.error ? 'text-orange-400' : 'text-neon-cyan') : 'text-zinc-500')
                      }`}>
                      {step.label}
                    </span>
                    <span className="text-[9px] text-zinc-500 uppercase mt-1 tracking-wider font-body leading-tight">
                      {step.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SQUAD VERIFICATION STATUS */}
            <div className="bg-black/20 border border-white/5 p-6 rounded-lg">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-body mb-4 flex items-center justify-between">
                <span>Roster Verification Ledger</span>
                {teamData.seed && teamData.seed !== 'TBD' && (
                  <span className="text-[10px] text-yellow-500/70 border border-yellow-500/20 bg-yellow-500/5 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Seed Rank: {teamData.seed}
                  </span>
                )}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-500 uppercase tracking-widest text-[9px] font-bold font-heading">
                      <th className="pb-3">Player IGN</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3 text-center">Discord Joined</th>
                      <th className="pb-3 text-center">Staff Role</th>
                      <th className="pb-3 text-center">VC Assigned</th>
                      <th className="pb-3 text-right">FACEIT ELO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {teamData.roster.map((player, idx) => {
                      const isCaptain = player.role === 'CAPTAIN';
                      const isSub = player.role === 'SUBSTITUTE';

                      const hasDiscord = player.discordJoined === '✔' || player.discordJoined === 'YES' || player.discordJoined === 'TRUE';
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
                          <td className="py-3.5 text-center font-bold">
                            {player.discordJoined === '⏳' ? (
                              <span className="text-zinc-600 font-normal">⏳ Pending</span>
                            ) : hasDiscord ? (
                              <span className="text-green-400 font-bold">✔ Joined</span>
                            ) : (
                              <span className="text-red-400 font-bold">✘ Missing</span>
                            )}
                          </td>
                          <td className="py-3.5 text-center font-bold">
                            {player.roleIssued === '⏳' ? (
                              <span className="text-zinc-600 font-normal">⏳ Pending</span>
                            ) : player.roleIssued === '✔' || player.roleIssued === 'YES' || player.roleIssued === 'TRUE' ? (
                              <span className="text-green-400 font-bold">✔ Issued</span>
                            ) : (
                              <span className="text-zinc-500 font-normal">-</span>
                            )}
                          </td>
                          <td className="py-3.5 text-center font-bold">
                            {player.privateVc === '⏳' ? (
                              <span className="text-zinc-600 font-normal">⏳ Pending</span>
                            ) : hasVc ? (
                              <span className="text-green-400 font-bold">✔ Verified</span>
                            ) : (
                              <span className="text-red-400 font-bold">✘ Missing</span>
                            )}
                          </td>
                          <td className="py-3.5 text-right font-mono font-bold text-neon-pink drop-shadow-[0_0_5px_rgba(240,0,255,0.4)]">
                            {player.faceitElo}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* EVENT-DRIVEN NOTIFICATION HISTORY & AUDIT TIMELINE */}
            {teamData.activity && teamData.activity.length > 0 && (
              <div className="bg-black/20 border border-white/5 p-6 rounded-lg">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-body mb-6 flex items-center gap-2 font-heading">
                  <Clock className="w-4 h-4 text-neon-cyan" /> Notification History & Audit Log
                </h4>
                <div className="relative border-l border-white/10 pl-6 space-y-6">
                  {teamData.activity.map((log, idx) => (
                    <div key={idx} className="relative animate-in slide-in-from-left duration-300 text-left">
                      <div className="absolute left-[-31px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-800 border-2 border-white/10" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold font-mono">
                          {formatDateTime(log.time)}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-white/5 text-zinc-400 border border-white/5">
                          {log.actor}
                        </span>
                      </div>
                      <p className="text-zinc-300 text-xs mt-1 leading-relaxed">
                        {log.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EXPANDABLE RAW DETAILS */}
            <div className="bg-black/20 border border-white/5 rounded-lg overflow-hidden">
              <button
                onClick={() => { playClick(); setDetailsExpanded(!detailsExpanded); }}
                className="w-full p-5 flex items-center justify-between text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest font-body hover:bg-white/5"
              >
                <span>Review Submitted Details (Read-only)</span>
                {detailsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {detailsExpanded && (
                <div className="p-6 border-t border-white/5 bg-black/40 space-y-6 text-zinc-400 text-xs font-body animate-in slide-in-from-top duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest block mb-1">Team Tag</span>
                      <span className="text-white text-sm font-semibold">{teamData.tag}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest block mb-1">Registration Date</span>
                      <span className="text-white text-sm font-semibold flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-neon-cyan" />
                        {new Date(teamData.registeredAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest block mb-3">Declared Player Handles</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {teamData.roster.map((player, idx) => (
                        <div key={idx} className="bg-black/30 p-3 rounded border border-white/5">
                          <span className="text-[9px] text-neon-cyan font-bold uppercase tracking-wider block mb-1">{player.role}: {player.ign}</span>
                          <div className="space-y-1 mt-2 text-[11px]">
                            <div className="flex justify-between"><span className="text-zinc-600">Discord:</span> <span className="text-white font-mono">{player.discord}</span></div>
                            <div className="flex justify-between items-center"><span className="text-zinc-600">Steam:</span> <a href={player.steam} target="_blank" rel="noreferrer" className="text-neon-pink hover:underline flex items-center gap-1">Link <ExternalLink className="w-2.5 h-2.5" /></a></div>
                            <div className="flex justify-between items-center"><span className="text-zinc-600">FACEIT:</span> <a href={player.faceit} target="_blank" rel="noreferrer" className="text-neon-cyan hover:underline flex items-center gap-1">Link <ExternalLink className="w-2.5 h-2.5" /></a></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TOURNAMENT ANNOUNCEMENT AND CHECK-IN */}
            <div className="glass-panel p-6 border-l-4 border-l-yellow-500 bg-yellow-950/10">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest font-heading mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" /> Tournament Operations Brief
              </h4>
              <ul className="text-xs text-zinc-300 font-body space-y-2 list-disc pl-4 leading-relaxed font-body">
                <li><strong className="text-white">Seeding Complete:</strong> Bracket and match schedules will be populated on the "Brackets" tab once registrations conclude on {formatEsportsDate(tournament.registrationDeadline)}.</li>
                <li><strong className="text-white">Anti-Cheat Check:</strong> Ensure Akros Anti-Cheat is installed and active prior to match check-in.</li>
                <li><strong className="text-white">Match Day Comms:</strong> All players must configure their Discord sound channels. Check-in commences 45 minutes prior to match launch.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
