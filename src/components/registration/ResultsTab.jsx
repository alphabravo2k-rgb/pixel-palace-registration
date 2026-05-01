import React from 'react';
import { Trophy, Check, Share2, Medal, Layers, ShieldCheck } from 'lucide-react';

export const ResultsTab = ({
  tournament,
  handleShare,
  copied,
  teams
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Winner Banner */}
      <div className="glass-panel overflow-hidden relative border-t-4 border-t-yellow-500">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-black to-black pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-yellow-500/10 blur-[80px] pointer-events-none" />
        <div className="hud-crosshair tl"></div><div className="hud-crosshair tr"></div>
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={handleShare} 
            className="flex items-center gap-2 text-xs font-bold font-body uppercase tracking-widest text-zinc-400 hover:text-white bg-black/50 hover:bg-black/80 px-3 py-1.5 rounded border border-white/10 transition-all shadow-lg"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Share2 className="w-3 h-3" />}
            {copied ? <span className="text-green-400">COPIED!</span> : "SHARE RESULTS"}
          </button>
        </div>
        <div className="relative z-10 p-8 md:p-12">
          <div className="text-[10px] text-yellow-500/70 font-bold uppercase tracking-[0.4em] font-body mb-4 flex items-center gap-2">
            <Trophy className="w-3 h-3" /> Grand Final // {tournament.displayDate} {tournament.displayYear}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Champion Card */}
            <div className="lg:col-span-2 shimmer-effect bg-gradient-to-br from-yellow-900/40 to-black border border-yellow-500/40 rounded-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[40px]" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-[0.3em] font-body flex items-center gap-1"><Trophy className="w-3 h-3" /> Grand Champions</span>
                {tournament.champion?.score && <span className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold px-3 py-1 rounded font-body">Final {tournament.champion.score}</span>}
              </div>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-lg bg-black/50 border-2 border-yellow-500/50 flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={tournament.champion?.logo || "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_dust2.png"} alt="Champion" className="w-20 h-20 object-contain" />
                </div>
                <div>
                  <h2 className="text-4xl md:text-6xl font-heading uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 leading-none">{tournament.champion?.name || "TBD"}</h2>
                  {tournament.champion?.players && <p className="text-zinc-400 font-body text-sm mt-2 tracking-widest uppercase">{tournament.champion.players.join(" • ")}</p>}
                </div>
              </div>
              {/* BO3 Map Breakdown */}
              {tournament.champion?.matchHistory && (
                <div className="mt-6 pt-5 border-t border-yellow-500/20">
                  <div className="text-[9px] text-yellow-500/60 font-bold uppercase tracking-[0.25em] font-body mb-3">Grand Final — Map Breakdown</div>
                  <div className="flex gap-3">
                    {tournament.champion.matchHistory.map((match, i) => (
                      <div key={i} className={`flex-1 p-3 rounded-lg text-center border transition-all ${match.win ? 'bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'bg-red-900/10 border-red-500/20'}`}>
                        <div className="text-[9px] uppercase tracking-widest font-body text-zinc-400 mb-1">{match.map}</div>
                        <div className={`text-lg font-bold font-heading tracking-widest ${match.win ? 'text-yellow-400' : 'text-red-400/70'}`}>{match.score}</div>
                        <div className={`text-[10px] font-bold font-body tracking-widest mt-0.5 ${match.win ? 'text-yellow-500' : 'text-red-500/60'}`}>{match.win ? '✓ WIN' : '✗ LOSS'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Runner Up Card */}
            <div className="bg-gradient-to-br from-zinc-800/30 to-black border border-zinc-600/30 rounded-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-zinc-500/10 blur-[30px]" />
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.3em] font-body mb-4 flex items-center gap-1"><Medal className="w-3 h-3" /> Runner Up</div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded bg-black/50 border border-zinc-600 flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={tournament.runnerUp?.logo || "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_mirage.png"} alt="Runner Up" className="w-12 h-12 object-contain grayscale opacity-70" />
                </div>
                <div>
                  <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest border border-zinc-600 px-2 py-0.5 rounded-sm inline-block mb-1">2nd Place</div>
                  <h3 className="text-2xl text-zinc-200 font-heading uppercase tracking-widest leading-none">{tournament.runnerUp?.name || "TBD"}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Semifinalists + Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Semifinalists */}
        {(tournament.thirdPlace || tournament.fourthPlace) && (
          <div className="glass-panel p-6 border-l-4 border-l-amber-600">
            <div className="text-[10px] text-amber-600 font-bold uppercase tracking-[0.3em] font-body mb-5 flex items-center gap-2"><Medal className="w-3 h-3" /> Semifinalists — 3rd Place Tie</div>
            <div className="space-y-4">
              {[tournament.thirdPlace, tournament.fourthPlace].filter(Boolean).map((team, i) => (
                <div key={i} className="flex items-center gap-4 bg-black/30 border border-amber-700/20 rounded p-3">
                  <div className="w-10 h-10 rounded bg-black border border-amber-700/40 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src={team.logo || "https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_nuke.png"} alt={team.name} className="w-8 h-8 object-contain grayscale opacity-60" />
                  </div>
                  <div>
                    <div className="text-amber-600 text-[9px] font-bold uppercase tracking-widest mb-0.5">3RD PLACE TIE</div>
                    <h4 className="text-lg text-amber-400 font-heading uppercase tracking-widest leading-none">{team.name}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Tournament Stats */}
        <div className="glass-panel p-6">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] font-body mb-5">Tournament Summary</div>
          <div className="space-y-4">
            {[
              { label: "Game Mode", value: tournament.gameMode, color: "text-neon-cyan" },
              { label: "Format", value: `${tournament.format} // BO3 Finals`, color: "text-neon-pink" },
              { label: "Prize Pool Awarded", value: tournament.prizePool, color: "text-green-400" },
              { label: "Total Competitors", value: `${tournament.maxTeams} Teams`, color: "text-white" },
              { label: "Region", value: tournament.region, color: "text-zinc-300" },
              { label: "Anti-Cheat", value: tournament.antiCheat, color: "text-green-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.15em] font-body">{label}</span>
                <span className={`font-heading tracking-widest text-sm ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Pool Final Overlay */}
      {tournament.maps && tournament.maps.length > 0 && (
        <div className="glass-panel p-6">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] font-body mb-5 flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-400" /> Grand Final Map Veto
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
            {tournament.maps.map((mapName, i) => {
              const playedMatch = tournament.champion?.matchHistory?.find(m => m.map.toLowerCase() === mapName.toLowerCase());
              const isPlayed = !!playedMatch;
              
              return (
                <div key={mapName} className={`relative overflow-hidden rounded border transition-all ${isPlayed ? 'border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'border-white/5 opacity-40 grayscale hover:opacity-80 hover:grayscale-0'}`}>
                  <div className="absolute inset-0 bg-black/60 z-10" />
                  <img src={`https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_${mapName.toLowerCase()}.png`} alt={mapName} className="w-full h-16 object-cover" onError={(e) => { e.target.style.display='none'; }} />
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-2">
                    <span className="text-sm font-bold uppercase font-heading tracking-widest text-white drop-shadow-md">{mapName}</span>
                    {isPlayed ? (
                      <span className="text-[8px] bg-neon-cyan text-black px-2 py-0.5 mt-1 rounded font-bold tracking-widest">PLAYED</span>
                    ) : (
                      <span className="text-[8px] bg-red-500/80 text-white px-2 py-0.5 mt-1 rounded font-bold tracking-widest">VETOED</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full standings table */}
      <div className="glass-panel p-8">
        <div className="hud-crosshair tl"></div><div className="hud-crosshair tr"></div>
        <h2 className="text-3xl text-white font-heading tracking-wider leading-none uppercase mb-6 border-b border-white/10 pb-4 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-neon-cyan" /> Final Standings — All {tournament.maxTeams} Teams
        </h2>
        {!teams || teams === 'error' ? (
          <div className="text-center py-16 text-zinc-600 font-body uppercase tracking-widest text-sm">Loading final standings...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {teams.map((team, idx) => (
              <div key={idx} className="bg-black/40 border border-white/5 rounded p-3 flex items-center gap-3 hover:border-white/10 transition-colors">
                <div className="text-[10px] text-zinc-600 font-bold font-body w-6 text-center shrink-0">#{String(idx+1).padStart(2,'0')}</div>
                <div className="w-8 h-8 rounded bg-black border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={team.logo} alt={team.name} className="w-6 h-6 object-contain" onError={e => { e.target.style.display='none'; }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-heading text-white tracking-widest uppercase leading-none truncate">{team.name}</div>
                </div>
                {team.status && <div className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${team.status === 'PENDING REVIEW' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>{team.status === 'PENDING REVIEW' ? 'REVIEW' : 'OK'}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
