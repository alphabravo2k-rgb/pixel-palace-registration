import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trophy, Users, Swords, Calendar, X, ExternalLink, User, BookOpen, Shield } from 'lucide-react';
import { fetchTournamentBracket, fetchTournamentTeams } from '../../services/sheets';

export function EsportsCommandPalette({ isOpen, onClose, onSelectTeam, onSelectPlayer }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Load registered teams and matches for instant search index
  useEffect(() => {
    if (!isOpen) return;

    fetchTournamentBracket(1).then(data => {
      if (data?.matches) setMatches(data.matches);
    }).catch(() => {});

    fetchTournamentTeams(1).then(data => {
      if (Array.isArray(data)) setTeams(data);
    }).catch(() => {});
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Search Results Engine
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();
    const res = [];

    // Search Teams
    teams.forEach(t => {
      if ((t.name || '').toLowerCase().includes(q) || (t.tag || '').toLowerCase().includes(q)) {
        res.push({
          type: 'TEAM',
          id: `team-${t.name}`,
          title: t.name,
          subtitle: `[${t.tag || 'TEAM'}] • Seed #${t.seed || '01'} • ${t.averageElo || '2000'} ELO`,
          icon: Users,
          color: 'text-neon-cyan',
          action: () => {
            if (onSelectTeam) onSelectTeam(t);
            onClose();
          }
        });
      }

      // Search Players inside teams
      if (Array.isArray(t.roster)) {
        t.roster.forEach(p => {
          if ((p.ign || '').toLowerCase().includes(q) || (p.discord || '').toLowerCase().includes(q)) {
            res.push({
              type: 'PLAYER',
              id: `player-${p.ign}-${t.name}`,
              title: p.ign || 'PLAYER',
              subtitle: `Team: ${t.name} • FACEIT Level ${p.faceitLevel || '10'} • ${p.role || 'Member'}`,
              icon: User,
              color: 'text-orange-400',
              action: () => {
                if (onSelectPlayer) onSelectPlayer(p, t);
                onClose();
              }
            });
          }
        });
      }
    });

    // Search Matches
    matches.forEach(m => {
      const team1 = m.team1?.name || m.team1_name || 'TBD';
      const team2 = m.team2?.name || m.team2_name || 'TBD';
      const title = `${team1} vs ${team2}`;
      
      if (
        title.toLowerCase().includes(q) ||
        `match #${m.id}`.includes(q) ||
        `round ${m.round_id || 1}`.includes(q)
      ) {
        res.push({
          type: 'MATCH',
          id: `match-${m.id}`,
          title: `Match #${m.id}: ${title}`,
          subtitle: `${m.matchStage || 'Bracket Match'} • ${m.lotMatchStatus ? m.lotMatchStatus.toUpperCase() : 'SCHEDULED'}`,
          icon: Swords,
          color: 'text-neon-pink',
          action: () => {
            navigate('/match-center');
            onClose();
          }
        });
      }
    });

    // Navigation Shortcuts
    if ('rulebook'.includes(q) || 'rules'.includes(q) || 'anti-cheat'.includes(q)) {
      res.push({
        type: 'NAV',
        id: 'nav-rules',
        title: 'CS2 Official Rulebook & Akros Rules',
        subtitle: 'MR12, Overtime rules, and Veto protocols',
        icon: BookOpen,
        color: 'text-emerald-400',
        action: () => {
          navigate('/register/community-cup-2?tab=rules');
          onClose();
        }
      });
    }

    if ('brackets'.includes(q) || 'tournament'.includes(q)) {
      res.push({
        type: 'NAV',
        id: 'nav-brackets',
        title: 'Tournament Elimination Bracket',
        subtitle: 'View live 30-team playoffs draw',
        icon: Trophy,
        color: 'text-yellow-400',
        action: () => {
          navigate('/register/community-cup-2?tab=brackets');
          onClose();
        }
      });
    }

    return res.slice(0, 8); // Max 8 crisp results
  }, [query, teams, matches, navigate, onClose, onSelectTeam, onSelectPlayer]);

  // Keyboard Navigation (Arrow Keys + Enter + ESC)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]?.action) {
          results[selectedIndex].action();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, results, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150 font-mono">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Palette Card */}
      <div className="relative w-full max-w-xl bg-[#080b18] border border-neon-cyan/40 rounded-2xl shadow-[0_0_80px_rgba(0,240,255,0.25)] overflow-hidden z-10">
        
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-[#0c1024]">
          <Search className="w-5 h-5 text-neon-cyan shrink-0 animate-pulse" />
          <input
            type="text"
            autoFocus
            placeholder="Search teams, players, match IDs, or stages (ESC to exit)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none tracking-wider"
          />
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-96 overflow-y-auto custom-scrollbar">
          {!query.trim() ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-500 space-y-3">
              <p className="font-bold text-white uppercase tracking-widest font-heading">
                GLOBAL ESPORTS COMMAND PALETTE
              </p>
              <p className="text-[11px] text-zinc-400">
                Type <code className="text-neon-cyan font-bold">EAGLE</code>, <code className="text-orange-400 font-bold">v0v0--</code>, <code className="text-neon-pink font-bold">Match #1</code>, or <code className="text-emerald-400 font-bold">Rules</code> to search instantly.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-500">
              No matching teams, players, or matches found.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((res, idx) => {
                const IconComponent = res.icon;
                const isSelected = idx === selectedIndex;

                return (
                  <div
                    key={res.id || idx}
                    onClick={res.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-3 py-2.5 rounded-xl flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-neon-cyan/15 border border-neon-cyan/40 text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                        : 'bg-black/40 border border-transparent hover:border-white/10 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`p-2 rounded-lg bg-zinc-900 border border-white/10 ${res.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className={`text-xs font-bold block truncate uppercase font-heading ${isSelected ? 'text-neon-cyan' : 'text-white'}`}>
                          {res.title}
                        </span>
                        <span className="text-[10px] text-zinc-500 block truncate">
                          {res.subtitle}
                        </span>
                      </div>
                    </div>

                    <span className="text-[9px] text-zinc-500 font-bold uppercase shrink-0 border border-white/10 px-2 py-0.5 rounded">
                      SELECT ↵
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-white/10 bg-black/60 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="bg-zinc-800 text-white px-1.5 py-0.5 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="bg-zinc-800 text-white px-1.5 py-0.5 rounded">↵</kbd> Select</span>
            <span><kbd className="bg-zinc-800 text-white px-1.5 py-0.5 rounded">ESC</kbd> Exit</span>
          </div>
          <span className="text-neon-cyan font-bold">PIXEL PALACE OS</span>
        </div>

      </div>
    </div>
  );
}
