import React from 'react';
import { AlertOctagon, MessageCircle, Target, ShieldAlert, ShieldCheck, Download, Layers } from 'lucide-react';
import { TournamentInfo } from './TournamentInfo';
import { TournamentForm } from '../forms/TournamentForm';

export const RegistrationTab = ({ 
  tournament, 
  slots, 
  timeLeft, 
  failedMapImages, 
  handleMapImgError 
}) => {
  const mapAccentClasses = ['mc-green', 'mc-orange', 'mc-yellow', 'mc-red', 'mc-amber', 'mc-cyan'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
      {/* LEFT SIDEBAR */}
      <div className="lg:col-span-4 space-y-8">
        <div className="glass-panel p-6 border-l-4 border-l-red-500 bg-red-950/20">
          <h3 className="text-2xl text-white font-heading mb-4 flex items-center gap-2 uppercase">
            <AlertOctagon className="w-6 h-6 text-red-500" /> CRITICAL REQUIREMENTS
          </h3>
          <ul className="space-y-4 font-body text-sm">
            <li className="flex gap-3 items-start bg-black/30 p-3 rounded border border-white/5">
              <MessageCircle className="w-5 h-5 text-[#5865F2] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white uppercase tracking-widest font-bold">Mandatory Discord</strong>
                <p className="text-zinc-400 leading-tight mt-1">
                  All players MUST be in the Pixel Palace Discord server. Failure to join results in disqualification.
                </p>
              </div>
            </li>
            <li className="flex gap-3 items-start bg-black/30 p-3 rounded border border-white/5">
              <Target className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white uppercase tracking-widest font-bold">Registration Status</strong>
                <p className="text-zinc-400 leading-tight mt-1">
                  Invite codes unlock priority slots ({tournament.inviteSlots} available). Open registration fills remaining {tournament.openSlots} slots. Limited to {tournament.maxTeams} total teams.
                </p>
              </div>
            </li>
          </ul>
        </div>
        
        <TournamentInfo tournament={tournament} />

        <div className="glass-panel p-6 border-l-4 border-l-neon-pink group relative overflow-hidden shadow-[0_0_20px_rgba(240,0,255,0.05)] hover:shadow-[0_0_30px_rgba(240,0,255,0.15)] transition-all duration-300">
          <div className="hud-crosshair tl opacity-30" />
          <div className="hud-crosshair tr opacity-30" />
          <div className="hud-crosshair bl opacity-30" />
          <div className="hud-crosshair br opacity-30" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-neon-pink mb-4 font-bold font-body">Registration Closes In</p>
          <div className="flex items-center gap-3">
            {timeLeft === 'OFFLINE' || timeLeft === 'TBD' ? (
              <p className={`text-5xl font-heading tracking-widest leading-none ${timeLeft === 'OFFLINE' ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-white'}`}>
                {timeLeft}
              </p>
            ) : (
              timeLeft.split(':').map((val, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl md:text-5xl font-heading tracking-widest leading-none text-white drop-shadow-[0_0_15px_rgba(240,0,255,0.4)]">
                      {val}
                    </span>
                    <span className="text-[8px] font-bold text-zinc-500 tracking-[0.2em] font-body uppercase mt-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      {['DAYS', 'HRS', 'MIN', 'SEC'][i]}
                    </span>
                  </div>
                  {i < 3 && <span className="text-2xl font-heading text-white/10 mb-5">:</span>}
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-2xl text-white font-heading mb-4 flex items-center gap-2 uppercase">
            <ShieldAlert className="w-5 h-5 text-red-500" /> Anti-Cheat Protocols
          </h3>
          <ul className="text-sm space-y-3 text-zinc-300 font-body mb-5">
            <li className="flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="leading-tight"><strong>Akros Anti-Cheat</strong> is 100% required. No exceptions.</span>
            </li>
          </ul>
          <a href="https://akros.ac/#download" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black text-sm font-bold uppercase tracking-widest transition-all font-body rounded shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Download className="w-4 h-4" /> Download Akros Client
          </a>
        </div>

        {tournament.maps && tournament.maps.length > 0 && (
          <div className="glass-panel p-6">
            <h3 className="text-2xl text-white font-heading mb-4 flex items-center gap-2 uppercase">
              <Layers className="w-5 h-5 text-zinc-400" /> {tournament.gameMode} Map Pool
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {tournament.maps.map((mapName, i) => {
                const mapNameLower = mapName.toLowerCase() === 'd2' ? 'dust2' : mapName.toLowerCase();
                return (
                  <div key={mapName} className={`map-card ${mapAccentClasses[i % mapAccentClasses.length]}`}>
                    {!failedMapImages.has(mapName) ? (
                      <div 
                        className="map-card-img" 
                        style={{ backgroundImage: `url('https://raw.githubusercontent.com/rpkaul/cs-map-images/main/de_${mapNameLower}.png')` }} 
                        onError={() => handleMapImgError(mapName)} 
                      />
                    ) : <div className="absolute inset-0 bg-black/80 z-10" />}
                    <div className="map-card-overlay" />
                    <div className="map-card-content justify-center w-full">
                      <span className="text-sm font-bold uppercase font-heading tracking-widest">{mapName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT FORM */}
      <div className="lg:col-span-8">
        {timeLeft === 'OFFLINE' ? (
          <div className="glass-panel p-16 text-center text-red-500 flex flex-col items-center">
            <AlertOctagon className="w-24 h-24 mb-6" />
            <h2 className="text-5xl font-heading font-black uppercase">REGISTRATION OFFLINE</h2>
            <p className="mt-4 font-body uppercase text-sm tracking-widest text-zinc-400">The registration deadline has passed.</p>
          </div>
        ) : (
          <TournamentForm tournament={tournament} slots={slots} />
        )}
      </div>
    </div>
  );
};
