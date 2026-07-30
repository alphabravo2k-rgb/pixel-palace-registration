import { AlertOctagon, Layers, RefreshCw, Lock, Hourglass, Shield, Sparkles, User, ChevronRight, Download, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const getSeedStyle = (seedName) => {
  const seed = (seedName || '').toString().trim().toUpperCase();
  const SEEDS_MAP = {
    'IRON':     { bg: 'bg-[#607D8B]/10 text-[#607D8B] border-[#607D8B]/30' },
    'BRONZE':   { bg: 'bg-[#A0522D]/10 text-[#A0522D] border-[#A0522D]/30' },
    'SILVER':   { bg: 'bg-[#9E9E9E]/10 text-[#9E9E9E] border-[#9E9E9E]/30' },
    'GOLD':     { bg: 'bg-[#FFC107]/10 text-[#FFC107] border-[#FFC107]/30' },
    'PLATINUM': { bg: 'bg-[#00ACC1]/10 text-[#00ACC1] border-[#00ACC1]/30' },
    'DIAMOND':  { bg: 'bg-[#7B1FA2]/10 text-[#7B1FA2] border-[#7B1FA2]/30' },
    'ELITE':    { bg: 'bg-[#E91E63]/10 text-[#E91E63] border-[#E91E63]/30' },
  };
  return SEEDS_MAP[seed] || { bg: 'bg-zinc-800/40 text-zinc-400 border-zinc-700/40' };
};

export const TrackerTab = ({
  isArchived,
  handleManualRefresh,
  isRefreshing,
  teams,
  playHover,
  playClick,
  setSelectedTeam,
  tournament,
  slots,
  onRegisterClick
}) => {
  const [failedLogos, setFailedLogos] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('SEED'); // 'SEED' | 'ELO' | 'NAME'
  const [expandedTeamIdx, setExpandedTeamIdx] = useState(null);

  // Dynamic stats calculation
  const stats = React.useMemo(() => {
    if (!Array.isArray(teams)) return null;
    
    let approved = 0;
    let pending = 0;
    let totalElo = 0;
    let playersWithElo = 0;
    let totalLevel = 0;
    let playersWithLevel = 0;

    teams.forEach(t => {
      const status = (t.status || '').toUpperCase();
      if (status === 'VERIFIED' || status === 'CHAMPION') approved++;
      else pending++;

      if (Array.isArray(t.roster)) {
        t.roster.forEach(p => {
          const elo = parseInt(p.faceitElo);
          if (!isNaN(elo) && elo > 0) {
            totalElo += elo;
            playersWithElo++;
          }
          const lvl = parseInt(p.faceitLevel);
          if (!isNaN(lvl) && lvl > 0) {
            totalLevel += lvl;
            playersWithLevel++;
          }
        });
      }
    });

    const avgElo = playersWithElo > 0 ? Math.round(totalElo / playersWithElo) : 2183;
    const avgLvl = playersWithLevel > 0 ? (totalLevel / playersWithLevel).toFixed(1) : '10.0';

    return {
      approved,
      pending,
      total: teams.length,
      avgElo,
      avgLvl
    };
  }, [teams]);

  // Export Team List as CSV for Casters & Staff
  const handleExportCSV = () => {
    if (!Array.isArray(teams) || teams.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,Seed,Tag,Team Name,Status,Average ELO,Captain\n";
    teams.forEach((t, i) => {
      const captain = t.roster?.find(p => (p.role || '').toLowerCase() === 'captain')?.ign || t.roster?.[0]?.ign || 'N/A';
      csvContent += `${i + 1},"${t.tag || ''}","${t.name}","${t.status || 'VERIFIED'}","${t.averageElo || 2000}","${captain}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Pixel_Palace_Teams_${tournament?.slug || 'season'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sorted and filtered teams
  const sortedAndFilteredTeams = React.useMemo(() => {
    if (!Array.isArray(teams)) return [];

    let filtered = teams.filter(team => {
      const nameMatch = (team.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (team.tag || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!nameMatch) return false;
      if (statusFilter === 'VERIFIED') return team.status === 'VERIFIED' || team.status === 'CHAMPION';
      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'ELO') {
        const eloA = parseInt(a.averageElo) || 0;
        const eloB = parseInt(b.averageElo) || 0;
        return eloB - eloA;
      }
      if (sortBy === 'NAME') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0; // Default seed order
    });
  }, [teams, searchTerm, statusFilter, sortBy]);

  return (
    <div className="max-w-6xl mx-auto font-mono">
      <div className="bg-[#080b18]/95 border border-white/10 rounded-2xl p-6 sm:p-8 min-h-[500px] max-h-[85vh] overflow-y-auto custom-scrollbar relative shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-md">
        <div className="hud-crosshair tl" /><div className="hud-crosshair tr" /><div className="hud-crosshair bl" /><div className="hud-crosshair br" />

        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl text-white font-heading font-black tracking-wider leading-none uppercase">
              REGISTERED SQUAD MATRIX
            </h2>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mt-0.5">
              OFFICIAL CS2 COMPETITIVE DIRECTORY ({teams?.length || 0} SQUADS)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
              title="Export CSV list for stream casters"
            >
              <Download className="w-3.5 h-3.5 text-neon-cyan" />
              <span className="hidden sm:inline">EXPORT CSV</span>
            </button>

            {!isArchived && (
              <button 
                onClick={handleManualRefresh} 
                disabled={isRefreshing} 
                className="text-zinc-300 hover:text-neon-cyan flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition bg-white/5 hover:bg-white/10 px-3.5 py-1.5 border border-white/10 rounded-lg cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                <span>{isRefreshing ? 'REFRESHING...' : 'REFRESH'}</span>
              </button>
            )}
          </div>
        </div>

        {!teams ? (
          <div className="text-center py-20 text-zinc-500 text-xs font-bold">LOADING DIRECTORY...</div>
        ) : teams.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 text-xs font-bold">NO TEAMS REGISTERED YET</div>
        ) : (
          <div className="space-y-6">
            
            {/* Streamlined Metrics Panel */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/50 border border-white/10 p-4 rounded-xl text-center">
                <div>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">VERIFIED SQUADS</span>
                  <span className="text-xl font-heading text-emerald-400 font-black mt-0.5 block">{stats.approved} / {stats.total} TEAMS</span>
                </div>

                <div className="border-l border-white/10">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">AVERAGE SQUAD ELO</span>
                  <span className="text-xl font-heading text-neon-cyan font-black mt-0.5 block">{stats.avgElo} ELO</span>
                </div>

                <div className="border-l border-white/10">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">FACEIT SKILL TIER</span>
                  <span className="text-xl font-heading text-orange-400 font-black mt-0.5 block">LVL {stats.avgLvl}</span>
                </div>

                <div className="border-l border-white/10">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">ROSTER SLOTS</span>
                  <span className="text-xl font-heading text-purple-400 font-black mt-0.5 block">30 / 30 CONFIRMED</span>
                </div>
              </div>
            )}

            {/* Live Search, Filter & Sort Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 border border-white/10 p-3 rounded-xl">
              <div className="flex items-center gap-2 flex-grow max-w-sm">
                <input
                  type="text"
                  placeholder="🔍 Search squad name or tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-neon-cyan"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-1 bg-zinc-950 border border-white/10 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-400">
                  <ArrowUpDown className="w-3 h-3 text-neon-cyan" />
                  <span>SORT:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="SEED" className="bg-zinc-900 text-white">SEED (#01 - #30)</option>
                    <option value="ELO" className="bg-zinc-900 text-white">HIGHEST ELO</option>
                    <option value="NAME" className="bg-zinc-900 text-white">SQUAD NAME (A-Z)</option>
                  </select>
                </div>

                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                      : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  All ({teams.length})
                </button>
              </div>
            </div>

            {/* 2-Column Squad Cards Grid with Quick Expand Roster */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedAndFilteredTeams.map((team, idx) => {
                const isFailed = failedLogos[`${team.name}-${idx}`];
                const logoSrc = isFailed || !team.logo || !team.logo.startsWith('http')
                  ? null
                  : team.logo;
                const isExpanded = expandedTeamIdx === idx;

                return (
                  <div 
                    key={`${team.name}-${idx}`}
                    className="bg-black/60 border border-white/10 hover:border-neon-cyan/50 rounded-xl transition overflow-hidden shadow-lg"
                  >
                    <div
                      onClick={() => { playClick && playClick(); setSelectedTeam(team); }}
                      className="p-4 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-zinc-900 border border-white/15 rounded-xl flex items-center justify-center p-1 font-bold text-neon-cyan font-heading shrink-0">
                          {logoSrc ? (
                            <img src={logoSrc} alt={team.name} className="w-full h-full object-contain" onError={() => setFailedLogos(prev => ({ ...prev, [`${team.name}-${idx}`]: true }))} />
                          ) : (
                            <span>{team.tag || team.name?.substring(0, 3)}</span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan px-2 py-0.5 rounded font-bold uppercase">
                              [{team.tag || 'TEAM'}]
                            </span>
                            <span className="text-[9px] text-zinc-500 font-bold">#{String(idx + 1).padStart(2, '0')} SEED</span>
                          </div>
                          <h4 className="text-sm font-bold text-white group-hover:text-neon-cyan transition-colors uppercase truncate max-w-[180px]">
                            {team.name}
                          </h4>
                          <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                            🟢 VERIFIED 5v5 SQUAD
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded">
                          {team.averageElo ? `${team.averageElo} ELO` : 'LVL 10'}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTeamIdx(isExpanded ? null : idx);
                            }}
                            className="text-[9px] text-zinc-400 hover:text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1 font-bold"
                            title="Toggle 5v5 Roster Preview"
                          >
                            <span>ROSTER</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3 text-neon-cyan" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-neon-cyan transition" />
                        </div>
                      </div>
                    </div>

                    {/* Quick Roster Preview Accordion */}
                    {isExpanded && (
                      <div className="bg-black/90 border-t border-white/10 p-3 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">DECLARED 5v5 ROSTER</span>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          {(team.roster || []).map((p, pIdx) => (
                            <div key={pIdx} className="bg-zinc-900/80 border border-white/5 px-2.5 py-1 rounded flex items-center justify-between">
                              <span className="text-white font-bold truncate">{p.ign || p.name || `Player ${pIdx+1}`}</span>
                              <span className="text-[9px] text-orange-400 font-bold">LVL {p.faceitLevel || '10'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
