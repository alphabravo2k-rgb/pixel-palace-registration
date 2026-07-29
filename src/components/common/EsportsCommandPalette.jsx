import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trophy, Users, Swords, Calendar, X, ExternalLink } from 'lucide-react';
import { tournamentService } from '../../services/TournamentService';

export function EsportsCommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);

  // Load registered teams and matches for instant search index
  useEffect(() => {
    if (!isOpen) return;

    tournamentService.fetchBracket().then(data => {
      if (data?.matches) setMatches(data.matches);
      if (data?.teams) {
        const teamsList = Object.values(data.teams);
        setTeams(teamsList);
      }
    }).catch(() => {});
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search Results
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();
    const res = [];

    // Search Teams
    teams.forEach(t => {
      if ((t.name || '').toLowerCase().includes(q) || (t.tag || '').toLowerCase().includes(q)) {
        res.push({
          type: 'TEAM',
          id: t.name,
          title: t.name,
          subtitle: `[${t.tag || 'TEAM'}] · AVG ELO: ${t.averageElo || 'N/A'} · Status: ${t.status || 'VERIFIED'}`,
          icon: Users,
          action: () => {
            navigate('/register/community-cup-2');
            onClose();
          }
        });
      }
    });

    // Search Matches
    matches.forEach(m => {
      const team1 = m.team1_name || m.team1Obj?.name || 'TBD';
      const team2 = m.team2_name || m.team2Obj?.name || 'TBD';
      const title = `${team1} vs ${team2}`;
      
      if (
        title.toLowerCase().includes(q) ||
        `match #${m.id}`.includes(q) ||
        `round ${m.round_number}`.includes(q)
      ) {
        res.push({
          type: 'MATCH',
          id: m.id,
          title: `Match #${m.id}: ${title}`,
          subtitle: `${m.round || 'Round'} · ${m.status || 'UPCOMING'}`,
          icon: Swords,
          action: () => {
            navigate(`/match-center/${m.id}`);
            onClose();
          }
        });
      }
    });

    // Navigation Shortcuts
    if ('brackets'.includes(q) || 'tournament'.includes(q)) {
      res.push({
        type: 'NAV',
        id: 'nav-brackets',
        title: 'Tournament Brackets',
        subtitle: 'View full 32-team elimination bracket',
        icon: Trophy,
        action: () => {
          navigate('/match-center');
          onClose();
        }
      });
    }

    if ('registered teams'.includes(q) || 'teams'.includes(q)) {
      res.push({
        type: 'NAV',
        id: 'nav-teams',
        title: 'Registered Teams Hub',
        subtitle: 'Browse all 30 verified squad rosters',
        icon: Users,
        action: () => {
          navigate('/register/community-cup-2');
          onClose();
        }
      });
    }

    return res.slice(0, 8); // Max 8 results for ultra-clean UI
  }, [query, teams, matches, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-[#090c19] border border-slate-700/80 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden font-mono z-10">
        
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-[#0c1024]">
          <Search className="w-5 h-5 text-violet-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search teams, players, match IDs, or stages (Press ESC to exit)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="p-2 max-h-96 overflow-y-auto custom-scrollbar">
          {!query.trim() ? (
            <div className="px-4 py-8 text-center text-xs text-slate-500 space-y-2">
              <p className="font-bold text-slate-400 uppercase tracking-widest">Global Esports Command Palette</p>
              <p>Type <span className="text-violet-400 font-bold">"EAGLE"</span>, <span className="text-violet-400 font-bold">"Match #1"</span>, or <span className="text-violet-400 font-bold">"Brackets"</span> to search.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-slate-500">
              No results found for <span className="text-white font-bold">"{query}"</span>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((res) => {
                const IconComponent = res.icon;
                return (
                  <div
                    key={`${res.type}-${res.id}`}
                    onClick={res.action}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-violet-600/20 border border-transparent hover:border-violet-500/30 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-violet-400 group-hover:text-violet-300 shrink-0">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white group-hover:text-violet-300 truncate">
                          {res.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {res.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-500 group-hover:text-violet-300 shrink-0 font-bold">
                      <span>Select</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#060812] border-t border-slate-850 text-[10px] text-slate-500">
          <div className="flex items-center gap-3">
            <span><strong className="text-slate-400">Ctrl + K</strong> to toggle</span>
            <span><strong className="text-slate-400">ESC</strong> to exit</span>
          </div>
          <span className="text-violet-400 font-bold uppercase tracking-wider">Pixel Palace OS</span>
        </div>

      </div>
    </div>
  );
}
