import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  RefreshCw, 
  ArrowLeft, 
  Users, 
  Clock, 
  Activity, 
  AlertTriangle, 
  Search, 
  Filter, 
  FileText, 
  BarChart2, 
  Info,
  ExternalLink,
  Lock,
  ChevronRight
} from 'lucide-react';
import { getAllDrafts, getMetrics } from '../../services/sheets';
import { getTournamentBySlug } from '../../config/tournaments';
import { SupabaseRepository } from '../../services/api/adapters/SupabaseRepository';

export default function DraftRegistrations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentSlug = searchParams.get('tournament') || 'community-cup-2';
  const tournament = getTournamentBySlug(tournamentSlug) || { id: 'community-cup-2', name: 'Community Cup 2' };

  // Auth & Roles
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState([]);
  
  // Evolved Computed Metrics state (fetched from Server /metrics endpoint)
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    idle: 0,
    abandoned: 0,
    submitted: 0,
    avgEditingTime: 0,
    funnel: {
      STAGE_TEAM_DETAILS: 0,
      STAGE_LOGO_UPLOAD: 0,
      STAGE_CAPTAIN_INFO: 0,
      STAGE_PLAYER_2: 0,
      STAGE_PLAYER_3: 0,
      STAGE_PLAYER_4: 0,
      STAGE_PLAYER_5: 0,
      STAGE_REVIEW: 0,
      STAGE_SUBMIT: 0
    },
    dropoffs: {},
    avgSaveLatency: 0,
    avgLookupLatency: 0,
    avgUploadLatency: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState(null);
  const [eventsCount, setEventsCount] = useState(0);
  const [diagnosticsCount, setDiagnosticsCount] = useState(0);

  // --- Auth Initialisation ---
  useEffect(() => {
    SupabaseRepository.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setIsAdmin(session.user?.app_metadata?.is_admin || false);
      }
      setAuthChecking(false);
    }).catch(() => {
      // Mock auth fallback if Supabase not configured in local testing
      setSession({ user: { email: "admin@pixelpalace.gg" } });
      setIsAdmin(true);
      setAuthChecking(false);
    });
  }, []);

  const handleLogin = async () => {
    try {
      await SupabaseRepository.loginViaDiscord();
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  };

  const fetchSessionDrafts = async () => {
    setLoading(true);
    try {
      const [mRes, dRes] = await Promise.all([
        getMetrics(tournament.id),
        getAllDrafts(tournament.id)
      ]);

      if (mRes && mRes.success) {
        setMetrics(mRes);
      }
      if (dRes && dRes.success) {
        setDrafts(dRes.drafts || []);
        setEventsCount(dRes.eventsCount || 0);
        setDiagnosticsCount(dRes.diagnosticsCount || 0);
      }
    } catch (e) {
      console.error("Failed to load draft registrations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSessionDrafts();
    }
  }, [tournament.id, isAdmin]);

  // Filter drafts based on search term and status
  const filteredDrafts = drafts.filter(d => {
    const matchesSearch = 
      (d.teamName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.captainName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.captainDiscord || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.sessionUuid || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'ACTIVE') return matchesSearch && (d.status === 'STATUS_ACTIVE' || d.status === 'ACTIVE');
    if (statusFilter === 'IDLE') return matchesSearch && (d.status === 'STATUS_IDLE' || d.status === 'IDLE');
    if (statusFilter === 'ABANDONED') return matchesSearch && (d.status === 'STATUS_ABANDONED' || d.status === 'ABANDONED');
    if (statusFilter === 'SUBMITTED') return matchesSearch && (d.status === 'STATUS_SUBMITTED' || d.status === 'SUBMITTED');
    return matchesSearch;
  });

  // Calculate dynamic friction health color bands (Dubai 2050 design)
  const getFrictionBandColor = (completed, total) => {
    if (!total) return 'text-zinc-500';
    const percent = (completed / total) * 100;
    if (percent >= 80) return 'text-green-400 border-green-500/20 bg-green-500/5';
    if (percent >= 60) return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5';
    if (percent >= 40) return 'text-orange-400 border-orange-500/20 bg-orange-500/5';
    return 'text-red-400 border-red-500/20 bg-red-500/5';
  };

  if (authChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#06080e] text-[#e2e8f0]">
        <RefreshCw className="w-8 h-8 animate-spin text-neon-cyan" />
        <span className="text-xs uppercase tracking-widest font-black font-body mt-4">Verifying Credentials...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#06080e] text-[#e2e8f0] p-6">
        <div className="glass-panel p-8 md:p-12 max-w-md w-full border border-white/5 bg-black/40 relative text-center">
          <div className="hud-crosshair tl" /><div className="hud-crosshair tr" /><div className="hud-crosshair bl" /><div className="hud-crosshair br" />
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse" />
          <h2 className="text-3xl font-heading font-black text-white italic uppercase tracking-tighter mb-2">ACCESS RESTRICTED</h2>
          <p className="text-zinc-400 text-xs font-body leading-relaxed mb-8">
            This workspace requires verified Pixel Palace Administrator credentials via Discord OAuth.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full bg-neon-cyan hover:bg-neon-cyan/80 text-black font-black uppercase text-xs tracking-widest font-body py-4 rounded-md shadow-lg shadow-neon-cyan/20 transition-all"
          >
            AUTHORIZE VIA DISCORD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#06080e] text-[#e2e8f0] font-sans selection:bg-neon-cyan selection:text-black">
      {/* Navbar */}
      <nav className="h-16 bg-[#0a0d16] border-b border-white/5 flex justify-between items-center px-6 shrink-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-8 w-[3px] bg-neon-cyan" />
          <h1 className="font-heading text-xl text-white tracking-wide uppercase italic">
            REGISTRATION <span className="text-neon-cyan">INTELLIGENCE</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-black bg-neon-cyan px-3 py-1 rounded uppercase tracking-widest font-body">
            PORTAL TELEMETRY
          </span>
          <button onClick={fetchSessionDrafts} className="text-zinc-400 hover:text-white">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-grow p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* Live Counters */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-panel p-5 border border-white/5 bg-black/40 relative">
            <div className="hud-crosshair tl opacity-30" /><div className="hud-crosshair br opacity-30" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-body">TOTAL SESSIONS</span>
            <span className="text-3xl font-black font-heading text-white italic">{metrics.total}</span>
          </div>
          <div className="glass-panel p-5 border border-white/5 bg-black/40 relative">
            <div className="hud-crosshair tl opacity-30" /><div className="hud-crosshair br opacity-30" />
            <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider block font-body">ACTIVE SESSIONS</span>
            <span className="text-3xl font-black font-heading text-green-400 italic">{metrics.active}</span>
          </div>
          <div className="glass-panel p-5 border border-white/5 bg-black/40 relative">
            <div className="hud-crosshair tl opacity-30" /><div className="hud-crosshair br opacity-30" />
            <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider block font-body">IDLE DRAFTS</span>
            <span className="text-3xl font-black font-heading text-yellow-400 italic">{metrics.idle}</span>
          </div>
          <div className="glass-panel p-5 border border-white/5 bg-black/40 relative">
            <div className="hud-crosshair tl opacity-30" /><div className="hud-crosshair br opacity-30" />
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider block font-body">ABANDONED</span>
            <span className="text-3xl font-black font-heading text-red-400 italic">{metrics.abandoned}</span>
          </div>
          <div className="glass-panel p-5 border border-white/5 bg-black/40 relative col-span-2 md:col-span-1">
            <div className="hud-crosshair tl opacity-30" /><div className="hud-crosshair br opacity-30" />
            <span className="text-[10px] text-neon-cyan font-bold uppercase tracking-wider block font-body">AVG EDIT TIME</span>
            <span className="text-3xl font-black font-heading text-neon-cyan italic">
              {metrics.avgEditingTime > 60 
                ? `${Math.round(metrics.avgEditingTime / 60)}m` 
                : `${metrics.avgEditingTime}s`}
            </span>
          </div>
        </div>

        {/* Diagnostic Latencies & Telemetry Band */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-4 border border-white/5 bg-[#0a0f1d] flex items-center justify-between">
            <div>
              <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-widest font-body">AVG SAVE LATENCY</span>
              <span className="text-lg font-heading font-black text-white italic">{metrics.avgSaveLatency || 0} ms</span>
            </div>
            <Activity className="w-8 h-8 text-neon-cyan/20" />
          </div>
          <div className="glass-panel p-4 border border-white/5 bg-[#0a0f1d] flex items-center justify-between">
            <div>
              <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-widest font-body">AVG LOOKUP LATENCY</span>
              <span className="text-lg font-heading font-black text-white italic">{metrics.avgLookupLatency || 0} ms</span>
            </div>
            <Activity className="w-8 h-8 text-fuchsia-500/20" />
          </div>
          <div className="glass-panel p-4 border border-white/5 bg-[#0a0f1d] flex items-center justify-between">
            <div>
              <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-widest font-body">AVG UPLOAD LATENCY</span>
              <span className="text-lg font-heading font-black text-white italic">{metrics.avgUploadLatency || 0} ms</span>
            </div>
            <Activity className="w-8 h-8 text-green-500/20" />
          </div>
        </div>

        {/* Funnel Graph */}
        <div className="glass-panel p-6 border border-white/5 bg-black/40 relative">
          <div className="hud-crosshair tl" /><div className="hud-crosshair tr" /><div className="hud-crosshair bl" /><div className="hud-crosshair br" />
          <h3 className="text-lg font-heading text-white uppercase tracking-wider italic mb-6 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-neon-cyan" /> REGISTRATION FUNNEL ANALYSIS (DYNAMICALLY COMPUTED)
          </h3>
          <div className="space-y-4">
            {Object.keys(metrics.funnel || {}).map(stage => {
              const count = metrics.funnel[stage];
              const maxCount = Math.max(...Object.values(metrics.funnel), 1);
              const percentage = Math.round((count / maxCount) * 100);
              const label = stage.replace("STAGE_", "").replace("_", " ");

              return (
                <div key={stage} className="flex items-center gap-4">
                  <span className="w-32 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right truncate font-body">
                    {label}
                  </span>
                  <div className="flex-grow bg-zinc-950 h-5 border border-white/5 overflow-hidden relative">
                    <div 
                      className="bg-neon-cyan/20 border-r border-neon-cyan h-full transition-all duration-700" 
                      style={{ width: `${percentage}%` }}
                    />
                    <span className="absolute inset-0 flex items-center pl-3 text-[10px] font-black text-white font-body uppercase">
                      {count} Sessions ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid Area: Sessions list vs Session Details Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* List Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  placeholder="Search drafts by team, captain, discord, or UUID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0d111b] border border-white/10 rounded-md focus:border-neon-cyan text-xs font-body tracking-wider focus:outline-none placeholder-zinc-600 transition-all text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-500" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-[#0d111b] border border-white/10 px-4 py-3 rounded-md text-xs font-body uppercase tracking-widest text-zinc-300 focus:outline-none"
                >
                  <option value="ALL">ALL STATUSES</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="IDLE">IDLE</option>
                  <option value="ABANDONED">ABANDONED</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="glass-panel overflow-hidden border border-white/5 bg-black/40 relative">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0d111b] text-zinc-500 text-[10px] font-bold uppercase tracking-wider font-body">
                    <th className="p-4">Team Details</th>
                    <th className="p-4">Current Step</th>
                    <th className="p-4">Last Activity</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-body tracking-wider divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-zinc-600 uppercase font-black tracking-widest animate-pulse font-body">
                        Fetching live telemetry...
                      </td>
                    </tr>
                  ) : filteredDrafts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-zinc-600 uppercase tracking-widest font-body">
                        No draft sessions matched query.
                      </td>
                    </tr>
                  ) : (
                    filteredDrafts.map(d => {
                      const isActive = selectedSession?.sessionUuid === d.sessionUuid;
                      return (
                        <tr 
                          key={d.sessionUuid}
                          onClick={() => setSelectedSession(d)}
                          className={`hover:bg-white/5 cursor-pointer transition-colors ${isActive ? 'bg-[#0f1524] border-l-2 border-neon-cyan' : ''}`}
                        >
                          <td className="p-4 flex flex-col gap-1">
                            <span className="font-bold text-white uppercase text-sm font-heading">{d.teamName || 'NO TEAM NAME'}</span>
                            <span className="text-[10px] text-zinc-500">{d.captainName || 'Anonymous'} ({d.captainDiscord || 'No Discord'})</span>
                          </td>
                          <td className="p-4 uppercase text-[10px] font-bold text-neon-cyan font-body">
                            {d.currentStep?.replace("STAGE_", "").replace("_", " ")}
                          </td>
                          <td className="p-4 text-zinc-400 font-body">
                            {new Date(d.lastActivityTime).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-body
                              ${(d.status === 'STATUS_ACTIVE' || d.status === 'ACTIVE') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : ''}
                              ${(d.status === 'STATUS_IDLE' || d.status === 'IDLE') ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : ''}
                              ${(d.status === 'STATUS_ABANDONED' || d.status === 'ABANDONED') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : ''}
                              ${(d.status === 'STATUS_SUBMITTED' || d.status === 'SUBMITTED') ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' : ''}
                            `}>
                              {d.status?.replace("STATUS_", "")}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Inspector Panel */}
          <div className="space-y-4">
            <div className="glass-panel p-6 border border-white/5 bg-black/40 relative min-h-[400px]">
              <div className="hud-crosshair tl" /><div className="hud-crosshair tr" /><div className="hud-crosshair bl" /><div className="hud-crosshair br" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                <Info className="w-4 h-4 text-neon-cyan" /> SESSION INSPECTOR
              </h3>

              {!selectedSession ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-700 text-xs text-center select-none font-body">
                  <Activity className="w-8 h-8 mb-2 opacity-30 animate-pulse text-neon-cyan" />
                  Select a session from the list to inspect detailed friction diagnostics.
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-widest font-body">Session UUID</span>
                    <code className="text-[10px] text-neon-cyan select-all break-all">{selectedSession.sessionUuid}</code>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-widest font-body">Friction Stage</span>
                      <span className="text-xs text-white uppercase font-bold font-heading">{selectedSession.frictionStage?.replace("STAGE_", "").replace("_", " ")}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-widest font-body">Completed Fields</span>
                      <span className="text-xs text-white font-body">{selectedSession.completedFieldsCount} / {selectedSession.totalRequiredFieldsCount}</span>
                    </div>
                  </div>

                  {selectedSession.missingFields && (
                    <div>
                      <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-widest font-body">Missing Required Fields</span>
                      <p className="text-[10px] text-yellow-400 font-body uppercase leading-normal mt-1 p-2 bg-yellow-500/5 border border-yellow-500/10 rounded">
                        {selectedSession.missingFields}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-wider font-heading">Friction Score Band</h4>
                    <div className={`p-3 border rounded font-body uppercase text-center font-bold text-xs ${getFrictionBandColor(selectedSession.completedFieldsCount, selectedSession.totalRequiredFieldsCount)}`}>
                      {selectedSession.completedFieldsCount} / {selectedSession.totalRequiredFieldsCount} FIELDS SET
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-wider font-heading">TIME & FRICTION METRICS</h4>
                    <div className="grid grid-cols-2 gap-y-3 text-[10px] font-body uppercase">
                      <div>
                        <span className="text-zinc-500 block">Session Duration</span>
                        <span className="text-white font-bold">{Math.round((parseInt(selectedSession.totalSessionDuration) || 0) / 60)} mins</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Active Typing Time</span>
                        <span className="text-white font-bold">{Math.round((parseInt(selectedSession.activeEditingTime) || 0) / 60)} mins</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Idle Inactivity</span>
                        <span className="text-white font-bold">{Math.round((parseInt(selectedSession.idleTime) || 0) / 60)} mins</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Offline Seconds</span>
                        <span className="text-white font-bold">{selectedSession.offlineTime || 0}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-wider font-heading">ACQUISITION & UTM</h4>
                    <div className="grid grid-cols-2 gap-y-3 text-[10px] font-body uppercase">
                      <div>
                        <span className="text-zinc-500 block">Referrer</span>
                        <span className="text-white font-bold truncate block max-w-[120px]">{selectedSession.referralSource?.replace("REF_", "")}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">UTM Source</span>
                        <span className="text-white font-bold truncate block max-w-[120px]">{selectedSession.utmSource || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">UTM Campaign</span>
                        <span className="text-white font-bold truncate block max-w-[120px]">{selectedSession.utmCampaign || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Status Logs</span>
                        <span className="text-neon-cyan font-bold">{selectedSession.status?.replace("STATUS_", "")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
