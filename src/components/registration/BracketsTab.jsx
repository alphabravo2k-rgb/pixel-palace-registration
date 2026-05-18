import React from 'react';
import { Target, Loader2, AlertOctagon } from 'lucide-react';

export const BracketsTab = ({
  bracketData,
  tournament,
  isArchived,
  formatLocalTime
}) => {
  return (
    <div className="max-w-6xl mx-auto xl:max-w-7xl">
      <div className="glass-panel p-8 min-h-[600px]">
        <div className="hud-crosshair tl"></div><div className="hud-crosshair tr"></div>
        <h2 className="text-4xl text-white font-heading tracking-wider leading-none uppercase mb-8 border-b border-white/10 pb-6 shadow-[0_1px_0_rgba(255,255,255,0.05)] flex items-center gap-3">
          <Target className="w-8 h-8 text-neon-cyan" /> Tournament Bracket
        </h2>

        {!bracketData && !tournament.bracketEmbedUrl ? (
          <div className="text-center py-32 text-zinc-500 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin mb-6 text-neon-pink drop-shadow-[0_0_10px_rgba(240,0,255,0.5)]" />
            <span className="font-bold tracking-[0.3em] uppercase text-sm font-body">Generating Bracket Link...</span>
          </div>
        ) : (bracketData === 'error' && !tournament.bracketEmbedUrl) ? (
          <div className="text-center py-32 text-red-500 flex flex-col items-center justify-center bg-red-950/10 border border-dashed border-red-500/20 rounded-md">
            <AlertOctagon className="w-12 h-12 mb-6" />
            <span className="font-heading text-2xl uppercase">BRACKETS OFFLINE</span>
            <p className="text-xs font-body opacity-60 mt-2 uppercase tracking-widest">Bracket generation failed. Seeding may still be in progress.</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow bg-black/50 border border-white/10 rounded overflow-hidden min-h-[400px] flex items-center justify-center relative p-1 md:p-8">
              <p className="absolute top-4 left-4 text-[10px] text-zinc-500 font-bold uppercase font-body tracking-[0.3em] hidden md:block">LIVE FEED // STANDINGS</p>
              {tournament.bracketEmbedUrl ? (
                <iframe 
                  src={`${tournament.bracketEmbedUrl}?theme=1&multiplier=1`} 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="auto" 
                  allowTransparency="true" 
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                  className="w-full min-h-[500px] md:min-h-[700px] rounded shadow-[0_0_50px_rgba(0,240,255,0.1)] border-none"
                ></iframe>
              ) : bracketData?.bracketUrl ? (
                <img 
                  src={bracketData.bracketUrl} 
                  alt="Tournament Bracket" 
                  className="max-w-full rounded shadow-[0_0_50px_rgba(0,240,255,0.1)] border border-neon-cyan/20" 
                />
              ) : (
                <div className="text-center text-zinc-600">
                  <Target className="w-16 h-16 mb-4 mx-auto opacity-20" />
                  <h3 className="font-heading text-xl uppercase tracking-widest">Seeding Phase</h3>
                  <p className="text-xs font-body tracking-widest opacity-60 mt-2 uppercase">The bracket will be visible once teams verify check-in.</p>
                </div>
              )}
            </div>

            <div className="lg:w-80 flex-shrink-0 flex flex-col gap-6">
              <div className="bg-black/50 border border-white/10 rounded p-6">
                <h3 className="text-xl font-heading text-neon-cyan uppercase mb-4 tracking-widest">{isArchived ? "Final Stage" : "Schedule"}</h3>
                <ul className="space-y-3 font-body text-sm font-bold text-zinc-300">
                  { (tournament.scheduleUtc && tournament.scheduleUtc.length > 0) ? (
                    tournament.scheduleUtc.map((iso, i) => {
                      const labels = ["Quarterfinals", "Semifinals", "Grand Finals", "Lower Bracket", "Consolation"];
                      const label = labels[i] || "Match Stage";
                      return (
                        <li key={i} className="flex flex-col gap-1 mb-4 last:mb-0 border-l border-white/5 pl-3 ml-0.5">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-none">{label}</span>
                          <span className={`text-sm font-bold tracking-widest leading-none mt-1 ${isArchived ? 'text-zinc-400' : 'text-neon-cyan'}`}>
                            {formatLocalTime(iso)}
                          </span>
                          {!isArchived && (
                            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1 opacity-50">
                              Broadcast: {new Date(iso).toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: false })} PKT
                            </span>
                          )}
                        </li>
                      );
                    })
                  ) : (bracketData && bracketData.schedule && bracketData.schedule.length > 0) ? (
                    bracketData.schedule.map((item, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <div className={`w-1.5 h-1.5 ${isArchived ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-neon-pink shadow-neon-pink/50'} rounded-full mt-1.5 shrink-0 shadow-[0_0_5px]`}></div>
                        <span className={isArchived ? 'text-zinc-400' : 'text-zinc-200'}>{item}</span>
                      </li>
                    ))
                  ) : isArchived ? (
                    <li className="flex gap-2 items-start">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 shrink-0 shadow-[0_0_5px_rgba(234,179,8,0.5)]"></div>
                      <span className="text-zinc-400">Grand Final: {tournament.champion?.name || "TBD"} vs {tournament.runnerUp?.name || "TBD"}</span>
                    </li>
                  ) : (
                    <p className="text-xs italic text-zinc-600 uppercase">TBD Post-Seeding</p>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
