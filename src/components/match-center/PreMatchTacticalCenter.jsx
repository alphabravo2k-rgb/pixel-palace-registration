import React from 'react';
import { Calendar, Shield, UserCheck, Flame } from 'lucide-react';
import { getGoogleCalendarUrl } from '../../utils/calendarHelper.js';

// Official CS2 Active Duty Map Pool
const CS2_MAP_POOL = [
  { id: 'de_dust2', name: 'Dust II' },
  { id: 'de_mirage', name: 'Mirage' },
  { id: 'de_anubis', name: 'Anubis' },
  { id: 'de_ancient', name: 'Ancient' },
  { id: 'de_nuke', name: 'Nuke' },
  { id: 'de_inferno', name: 'Inferno' },
];

export function PreMatchTacticalCenter({ match, teamA, teamB, visitorTime, team1Players = [], team2Players = [] }) {
  const teamAName = teamA?.name || 'Team A';
  const teamBName = teamB?.name || 'Team B';
  const calUrl = getGoogleCalendarUrl(match);

  // Extract actual players if passed from API, otherwise show clean notice
  const realPlayersA = team1Players.length > 0 ? team1Players : (teamA?.players || []);
  const realPlayersB = team2Players.length > 0 ? team2Players : (teamB?.players || []);

  return (
    <div className="space-y-8 font-mono">
      {/* Quick Action & Regional Timezone Toolbar */}
      <div className="bg-[#0b0f20] border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-md">
            🌐 {visitorTime?.localTime || 'Scheduled Time'} (Local Time)
          </span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">|</span>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">🇵🇰 8:00 PM PKT</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">🇦🇪 7:00 PM GST</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">🇸🇦 6:00 PM AST</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={calUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-800/40 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
          >
            <Calendar size={13} />
            <span>Google Calendar Sync</span>
          </a>
          <div className="bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
            <Shield size={12} className="text-amber-400" />
            <span>GOTV Demos Protected</span>
          </div>
        </div>
      </div>

      {/* Real Team Rosters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team A Roster */}
        <div className="bg-[#0c0f1f] border border-violet-900/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck size={16} className="text-violet-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                {teamAName} Active Roster
              </h3>
            </div>
            <span className="text-[10px] font-bold text-violet-400 bg-violet-950/60 border border-violet-800/40 px-2 py-0.5 rounded">
              VERIFIED REGISTRATION
            </span>
          </div>

          <div className="space-y-2">
            {realPlayersA.length > 0 ? (
              realPlayersA.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-850">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-violet-300">
                      {(p.name || p.steam_id || `P${i+1}`)[0]}
                    </div>
                    <div className="text-xs font-bold text-white">
                      {p.name || p.steam_id || `Player #${i+1}`}
                    </div>
                  </div>
                  {p.role && <span className="text-[9px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{p.role}</span>}
                </div>
              ))
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-800/80 rounded-xl bg-slate-950/30">
                <div className="text-xs text-slate-400 font-bold mb-1">Squad Roster Pending Confirmation</div>
                <div className="text-[10px] text-slate-500">Official starting line-up will be published 30 mins prior to match start.</div>
              </div>
            )}
          </div>
        </div>

        {/* Team B Roster */}
        <div className="bg-[#0c0f1f] border border-violet-900/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck size={16} className="text-indigo-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                {teamBName} Active Roster
              </h3>
            </div>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">
              VERIFIED REGISTRATION
            </span>
          </div>

          <div className="space-y-2">
            {realPlayersB.length > 0 ? (
              realPlayersB.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-850">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-indigo-300">
                      {(p.name || p.steam_id || `P${i+1}`)[0]}
                    </div>
                    <div className="text-xs font-bold text-white">
                      {p.name || p.steam_id || `Player #${i+1}`}
                    </div>
                  </div>
                  {p.role && <span className="text-[9px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{p.role}</span>}
                </div>
              ))
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-800/80 rounded-xl bg-slate-950/30">
                <div className="text-xs text-slate-400 font-bold mb-1">Squad Roster Pending Confirmation</div>
                <div className="text-[10px] text-slate-500">Official starting line-up will be published 30 mins prior to match start.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Honest CS2 Active Duty Map Pool & Veto Section */}
      <div className="bg-[#0c0f1f] border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              CS2 Active Duty Map Pool
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
            VETO IN PRE-MATCH (30 MINS PRIOR)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
          {CS2_MAP_POOL.map((m) => (
            <div key={m.id} className="rounded-xl border border-slate-800/80 bg-slate-950 p-2.5 text-center">
              <span className="text-[10px] font-black text-white uppercase tracking-wider block">{m.name}</span>
              <span className="text-[8.5px] font-bold text-slate-500 mt-0.5 block">Active Pool</span>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-slate-500 text-center pt-1 border-t border-slate-850">
          Official Map Pick/Ban (Veto) sequence will be conducted live by team captains 30 mins prior to match start on Kancha Portal.
        </div>
      </div>
    </div>
  );
}
